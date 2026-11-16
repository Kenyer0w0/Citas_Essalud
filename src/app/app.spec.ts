import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { API_CONFIG } from './api.config';
import { App } from './app';

describe('App', () => {
  let app: App;
  let http: HttpTestingController;

  beforeEach(() => {
    sessionStorage.removeItem('citas.jwt');
    TestBed.configureTestingModule({
      imports: [App],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    const fixture = TestBed.createComponent(App);
    app = fixture.componentInstance;
    http = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    http.verify();
    sessionStorage.removeItem('citas.jwt');
  });

  it('starts on the public landing page and gates booking behind sign-in', () => {
    expect(app.view).toBe('publico');

    app.startBooking();

    expect(app.view).toBe('acceso');
    expect(app.isAuthenticated).toBeFalse();
    expect(app.notice).toContain('inicia sesión');
    http.expectNone(`${API_CONFIG.baseUrl}/auth/login`);
  });

  it('opens a read-only portal preview without creating a session', () => {
    app.openPreview();

    expect(app.view).toBe('preview');
    expect(app.isPublicView).toBeTrue();
    expect(app.isAuthenticated).toBeFalse();
    expect(sessionStorage.getItem('citas.jwt')).toBeNull();
    http.expectNone(`${API_CONFIG.baseUrl}/auth/login`);
  });

  it('rejects a malformed DNI before calling the API', () => {
    app.loginDni = '12345';
    app.loginPassword = 'long-password';

    app.login();

    expect(app.noticeType).toBe('error');
    http.expectNone(`${API_CONFIG.baseUrl}/auth/login`);
  });

  it('authenticates with DNI and uses the role returned by the backend', () => {
    app.startBooking();
    app.loginDni = '12345678';
    app.loginPassword = 'long-password';

    app.login();

    const request = http.expectOne(`${API_CONFIG.baseUrl}/auth/login`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ dni: '12345678', contrasena: 'long-password' });
    request.flush({ token: 'jwt-token', rol: 'PACIENTE', nombre: 'Ana Pérez' });
    http.expectOne(`${API_CONFIG.baseUrl}/citas/mias`).flush([]);
    http.expectOne(request => request.url === `${API_CONFIG.baseUrl}/especialidades`).flush([
      { id: 'esp-1', nombre: 'Medicina general' }
    ]);

    expect(app.isAuthenticated).toBeTrue();
    expect(app.role).toBe('PACIENTE');
    expect(app.view).toBe('reservar');
    expect(app.userName).toBe('Ana Pérez');
    expect(sessionStorage.getItem('citas.jwt')).toBe('jwt-token');
    expect(app.specialties.map(specialty => specialty.nombre)).toEqual(['Medicina general']);

    app.onSpecialtyChange('esp-1');
    http.expectOne(request =>
      request.url === `${API_CONFIG.baseUrl}/medicos` &&
      request.params.get('especialidadId') === 'esp-1'
    ).flush([{ id: 'med-1', nombre: 'Dra. Nombre Apellido' }]);
    app.onDoctorChange('med-1');
    app.date = '2026-11-17';
    app.loadSlots();
    http.expectOne(request =>
      request.url === `${API_CONFIG.baseUrl}/horarios/disponibles` &&
      request.params.get('medicoId') === 'med-1' &&
      request.params.get('fecha') === '2026-11-17'
    ).flush([{
      id: 'turno-1',
      fecha: '2026-11-17',
      hora: '09:00',
      profesional: 'Dra. Nombre Apellido',
      especialidad: 'Medicina general',
      establecimiento: 'Establecimiento asignado',
      disponible: true
    }]);

    app.selectSlot(app.filteredSlots[0]);
    app.nextStep();
    app.nextStep();
    app.confirmBooking();
    const bookingRequest = http.expectOne(`${API_CONFIG.baseUrl}/citas`);
    expect(bookingRequest.request.body).toEqual({ horarioId: 'turno-1' });
    bookingRequest.flush({});
    expect(app.step).toBe(4);
  });

  it('does not open protected views without an authenticated session', () => {
    app.role = 'ADMIN';
    app.navigate('admin');

    expect(app.view).toBe('acceso');
    expect(app.isAuthenticated).toBeFalse();
  });

  it('does not create a session when the backend returns an unsupported role', () => {
    app.view = 'acceso';
    app.loginDni = '12345678';
    app.loginPassword = 'long-password';
    app.login();

    http.expectOne(`${API_CONFIG.baseUrl}/auth/login`).flush({ token: 'jwt-token', rol: 'SUPERUSER' });

    expect(app.isAuthenticated).toBeFalse();
    expect(app.view).toBe('acceso');
    expect(sessionStorage.getItem('citas.jwt')).toBeNull();
    expect(app.noticeType).toBe('error');
  });

  it('surfaces backend connection errors instead of creating a local session', () => {
    app.view = 'acceso';
    app.loginDni = '12345678';
    app.loginPassword = 'long-password';
    app.login();

    http.expectOne(`${API_CONFIG.baseUrl}/auth/login`).error(new ProgressEvent('error'));

    expect(app.isAuthenticated).toBeFalse();
    expect(app.notice).toContain('No se pudo conectar con el backend');
  });

  it('validates registration fields and posts the DNI to the backend', () => {
    app.accessMode = 'register';
    app.registerNames = 'Ana Pérez';
    app.registerDni = '12345678';
    app.registerEmail = 'ana@example.com';
    app.registerPassword = 'strong-password';
    app.confirmPassword = 'different-password';

    app.register();

    expect(app.noticeType).toBe('error');
    http.expectNone(`${API_CONFIG.baseUrl}/auth/registro`);

    app.confirmPassword = 'strong-password';
    app.register();

    const request = http.expectOne(`${API_CONFIG.baseUrl}/auth/registro`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({
      dni: '12345678',
      nombres: 'Ana Pérez',
      correo: 'ana@example.com',
      contrasena: 'strong-password'
    });
    request.flush({ mensaje: 'Cuenta creada' });

    expect(app.accessMode).toBe('login');
    expect(app.loginDni).toBe('12345678');
    expect(app.notice).toBe('Cuenta creada');
  });

  it('filters official information categories by group and search text', () => {
    expect(app.filteredInstitutionalServices.length).toBe(13);

    app.selectServiceGroup('Atención y salud');
    expect(app.filteredInstitutionalServices.length).toBe(3);

    app.serviceSearch = 'telesalud';
    expect(app.filteredInstitutionalServices.map(service => service.title)).toEqual(['Telesalud']);

    app.selectServiceGroup('Todas');
    app.serviceSearch = 'oncologica';
    expect(app.filteredInstitutionalServices.map(service => service.title)).toEqual(['Atención al asegurado']);

    app.serviceSearch = 'incapacidad';
    expect(app.filteredInstitutionalServices.map(service => service.title)).toEqual(['Prestaciones económicas']);
  });

  it('opens service details inside the public information page', () => {
    app.navigate('servicios');
    app.openServiceByTitle('Tipos de seguros');

    expect(app.isPublicView).toBeTrue();
    expect(app.view).toBe('servicios');
    expect(app.selectedService?.details.some(detail => detail.title === 'Seguro Regular')).toBeTrue();

    app.showServiceList();
    expect(app.selectedService).toBeNull();
  });
});

import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';
import { ApiService, AppointmentDto, DoctorDto, LoginResponse, SlotDto, SpecialtyDto } from './api.service';

type Role = 'PACIENTE' | 'MEDICO' | 'ADMIN';
type View = 'publico' | 'acceso' | 'preview' | 'inicio' | 'reservar' | 'citas' | 'agenda' | 'admin' | 'integracion' | 'institucional' | 'servicios';
type AppointmentStatus = 'RESERVADA' | 'CANCELADA' | 'ATENDIDA';
type ServiceGroup = 'Atención y salud' | 'Coberturas y beneficios' | 'Información y gestión';

type Appointment = {
  id: string;
  doctor: string;
  specialty: string;
  date: string;
  time: string;
  status: AppointmentStatus;
  place: string;
};

type Slot = {
  id: string;
  doctorId: string;
  specialtyId: string;
  date: string;
  time: string;
  doctor: string;
  specialty: string;
  place: string;
  available: boolean;
};

type BookingValidation = {
  valid: boolean;
  code: string;
  message: string;
  severity: 'success' | 'error' | 'warning';
};

type InstitutionalService = {
  title: string;
  description: string;
  group: ServiceGroup;
  details: { title: string; description: string }[];
};

const INSTITUTIONAL_SERVICES: InstitutionalService[] = [
  {
    title: 'Atención al asegurado',
    description: 'Canales de orientación, atención de consultas, reclamos y derechos de las personas aseguradas.',
    group: 'Atención y salud',
    details: [
      { title: 'EsSalud en Línea', description: 'Orientación y canales de atención para Lima y Callao, y para las provincias.' },
      { title: 'Línea 107', description: 'Canal telefónico institucional para consultas y orientación.' },
      { title: 'Reclamos y derechos', description: 'Información para presentar consultas o reclamos y conocer los derechos y deberes de las personas aseguradas.' },
      { title: 'Atención especializada', description: 'Orientación sobre oficinas de atención, atención prioritaria oncológica y servicios interculturales.' }
    ]
  },
  {
    title: 'Atención médica',
    description: 'Información oficial relacionada con las citas y la atención médica de EsSalud.',
    group: 'Atención y salud',
    details: [
      { title: 'Gestión de citas', description: 'Información sobre cómo solicitar una cita para recibir atención en un establecimiento de EsSalud.' },
      { title: 'Atención referida', description: 'La orientación institucional también contempla atenciones en otras instituciones cuando EsSalud realiza una referencia.' },
      { title: 'Antes de acudir', description: 'Revisa la vigencia de tu cita, el establecimiento asignado y las indicaciones publicadas por el canal oficial.' }
    ]
  },
  {
    title: 'Telesalud',
    description: 'Orientación institucional sobre atención sanitaria a distancia y servicios relacionados.',
    group: 'Atención y salud',
    details: [
      { title: 'Atención a distancia', description: 'Servicios de salud prestados por profesionales competentes usando tecnologías de información y comunicación.' },
      { title: 'Acceso oportuno', description: 'La telesalud busca acercar servicios a las personas y facilitar su acceso cuando la modalidad a distancia es adecuada.' },
      { title: 'Orientación del servicio', description: 'La disponibilidad, los requisitos y el canal de atención deben confirmarse en la información institucional vigente.' }
    ]
  },
  {
    title: 'Tipos de seguros',
    description: 'Conoce las modalidades de seguro y consulta sus requisitos y alcances oficiales.',
    group: 'Coberturas y beneficios',
    details: [
      { title: 'Seguro Regular', description: 'Cobertura asociada principalmente a trabajadores formales y pensionistas que cumplen los requisitos.' },
      { title: 'Seguro Potestativo', description: 'Alternativa de aseguramiento para personas independientes, sujeta a afiliación y condiciones.' },
      { title: 'Seguro Complementario de Trabajo de Riesgo', description: 'Cobertura vinculada con actividades laborales consideradas de riesgo.' },
      { title: 'Seguro Agrario y EsSalud Vida', description: 'Modalidades relacionadas con actividades agrarias y con protección frente a accidentes, respectivamente.' }
    ]
  },
  {
    title: 'Prestaciones económicas',
    description: 'Información de subsidios y otras prestaciones económicas sujetas a requisitos.',
    group: 'Coberturas y beneficios',
    details: [
      { title: 'Subsidio por incapacidad temporal', description: 'Beneficio sujeto a evaluación de requisitos cuando una condición de salud impide temporalmente trabajar.' },
      { title: 'Subsidio por maternidad y lactancia', description: 'Prestaciones económicas relacionadas con maternidad y nacimiento, según las condiciones vigentes.' },
      { title: 'Prestación por sepelio', description: 'Apoyo económico sujeto a requisitos y documentación establecidos por EsSalud.' },
      { title: 'Requisitos y vigencia', description: 'Los plazos, documentos y condiciones dependen de cada prestación; esta plataforma solo ofrece orientación general.' }
    ]
  },
  {
    title: 'Prestaciones sociales',
    description: 'Servicios y medidas sociales para personas aseguradas y grupos priorizados.',
    group: 'Coberturas y beneficios',
    details: [
      { title: 'Personas adultas mayores', description: 'Acciones y servicios orientados a promover bienestar, participación y protección social.' },
      { title: 'Personas con discapacidad', description: 'Orientación sobre servicios sociales y de rehabilitación para personas aseguradas.' },
      { title: 'Población priorizada', description: 'Las prestaciones pueden incluir medidas para personas en situación de vulnerabilidad, según las políticas institucionales.' }
    ]
  },
  {
    title: 'Transparencia',
    description: 'Acceso a información sobre la gestión y los recursos de la institución.',
    group: 'Información y gestión',
    details: [
      { title: 'Gestión institucional', description: 'Información pública para conocer las acciones que realiza la entidad.' },
      { title: 'Uso de recursos', description: 'Documentos y datos relacionados con los recursos que administra la institución.' },
      { title: 'Acceso a información', description: 'Orientación general para ubicar publicaciones, reportes y mecanismos de transparencia.' }
    ]
  },
  {
    title: 'Integridad institucional',
    description: 'Canales y recursos institucionales relacionados con ética, integridad y denuncias.',
    group: 'Información y gestión',
    details: [
      { title: 'Ética y responsabilidad', description: 'Información institucional sobre conducta íntegra y responsabilidad en el servicio público.' },
      { title: 'Prevención de la corrupción', description: 'Herramientas para fortalecer controles y prevenir actos contrarios a la integridad.' },
      { title: 'Canales de denuncia', description: 'La entidad publica canales para comunicar presuntos hechos irregulares; verifica el canal y las instrucciones vigentes antes de enviar información.' }
    ]
  },
  {
    title: 'Estados financieros auditados',
    description: 'Publicaciones de estados financieros y documentos de auditoría institucional.',
    group: 'Información y gestión',
    details: [
      { title: 'Reportes por periodo', description: 'Documentos publicados para distintos ejercicios fiscales.' },
      { title: 'Estados contables', description: 'Los informes pueden incluir situación financiera, resultados, flujos de efectivo y cambios patrimoniales.' },
      { title: 'Opinión de auditoría', description: 'Las publicaciones incluyen documentos y opiniones de auditoría independiente cuando corresponda.' }
    ]
  },
  {
    title: 'Repositorio institucional',
    description: 'Producción académica y científica difundida por EsSalud en acceso abierto.',
    group: 'Información y gestión',
    details: [
      { title: 'Publicaciones académicas', description: 'Material académico y científico producido en el ámbito del Seguro Social de Salud.' },
      { title: 'Consulta y preservación', description: 'El repositorio organiza y preserva publicaciones para facilitar su búsqueda y consulta.' },
      { title: 'Acceso abierto', description: 'La plataforma institucional difunde recursos para apoyar la investigación y la generación de conocimiento.' }
    ]
  },
  {
    title: 'Biblioteca',
    description: 'Recursos documentales especializados en salud y seguridad social.',
    group: 'Información y gestión',
    details: [
      { title: 'Colecciones especializadas', description: 'Documentación y recursos sobre salud y seguridad social.' },
      { title: 'Búsqueda bibliográfica', description: 'La categoría incluye orientación hacia recursos documentales y bases de datos.' },
      { title: 'Uso académico', description: 'Material de apoyo para consulta, estudio e investigación.' }
    ]
  },
  {
    title: 'Cooperación internacional',
    description: 'Información institucional sobre convenios y cooperación técnica.',
    group: 'Información y gestión',
    details: [
      { title: 'Cooperación técnica', description: 'Información sobre iniciativas de colaboración que apoyan proyectos y objetivos institucionales.' },
      { title: 'Convenios y relaciones', description: 'Acciones para identificar, negociar y gestionar relaciones de cooperación interinstitucional e internacional.' },
      { title: 'Proyectos conjuntos', description: 'La cooperación puede comprender proyectos, consultorías y actividades coordinadas.' }
    ]
  },
  {
    title: 'CAS COVID',
    description: 'Archivo temático y publicaciones del proceso; revisa en Gob.pe si la información sigue vigente.',
    group: 'Información y gestión',
    details: [
      { title: 'Información del proceso', description: 'Categoría asociada a publicaciones de la tercera etapa del proceso CAS COVID.' },
      { title: 'Consulta documental', description: 'Reúne referencias del proceso y documentos que pueden ser de carácter histórico.' },
      { title: 'Estado de convocatorias', description: 'No asumas que existe una convocatoria vigente: confirma fechas y condiciones en la publicación oficial más reciente.' }
    ]
  }
];

const normalizeSearch = (value: string): string =>
  value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLocaleLowerCase('es');

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  private readonly api = inject(ApiService);
  role: Role = 'PACIENTE';
  userName = '';
  view: View = 'publico';
  isAuthenticated = false;
  private pendingView: View = 'inicio';
  step = 1;
  specialty = '';
  doctor = '';
  date = '';
  selectedSlot: Slot | null = null;
  specialtyCatalog: SpecialtyDto[] = [];
  doctorCatalog: DoctorDto[] = [];
  appointmentsLoading = false;
  catalogLoading = false;
  doctorLoading = false;
  slotsLoading = false;
  private doctorRequestId = 0;
  private slotsRequestId = 0;
  private appointmentsLoaded = false;
  private catalogLoaded = false;
  notice = '';
  noticeType: 'success' | 'error' | 'info' | 'warning' = 'info';
  busy = false;
  search = '';
  bookingValidation: BookingValidation | null = null;
  serviceSearch = '';
  selectedServiceGroup: 'Todas' | ServiceGroup = 'Todas';
  selectedService: InstitutionalService | null = null;
  readonly serviceGroups: ('Todas' | ServiceGroup)[] = ['Todas', 'Atención y salud', 'Coberturas y beneficios', 'Información y gestión'];
  readonly institutionalServices = INSTITUTIONAL_SERVICES;
  appointments: Appointment[] = [];
  slots: Slot[] = [];
  loginDni = '';
  loginPassword = '';
  registerDni = '';
  registerNames = '';
  registerEmail = '';
  registerPassword = '';
  confirmPassword = '';
  accessMode: 'login' | 'register' = 'login';

  get isPublicView(): boolean { return this.view === 'publico' || this.view === 'acceso' || this.view === 'preview' || this.view === 'servicios'; }
  get minBookingDate(): string { return this.currentDate(); }
  get specialties(): SpecialtyDto[] { return this.specialtyCatalog; }
  get doctors(): SpecialtyDto[] { return this.doctorCatalog; }
  get filteredSlots(): Slot[] {
    return this.slots.filter(
      s =>
        s.available &&
        (!this.specialty || s.specialtyId === this.specialty) &&
        (!this.doctor || s.doctorId === this.doctor) &&
        (!this.date || s.date === this.date)
    );
  }
  get filteredAppointments(): Appointment[] {
    const term = this.search.trim().toLowerCase();
    if (!term) return this.appointments;
    return this.appointments.filter(a =>
      `${a.id} ${a.doctor} ${a.specialty} ${a.date} ${a.time} ${a.status} ${a.place}`
        .toLowerCase()
        .includes(term)
    );
  }
  get filteredInstitutionalServices(): InstitutionalService[] {
    const term = normalizeSearch(this.serviceSearch.trim());
    return this.institutionalServices.filter(service =>
      (this.selectedServiceGroup === 'Todas' || service.group === this.selectedServiceGroup) &&
      (!term || normalizeSearch(`${service.title} ${service.description} ${service.group} ${service.details.map(detail => `${detail.title} ${detail.description}`).join(' ')}`).includes(term))
    );
  }
  get activeAppointments(): Appointment[] { return this.appointments.filter(a => a.status === 'RESERVADA'); }
  get nextAppointment(): Appointment | undefined {
    return this.activeAppointments
      .slice()
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`))[0];
  }
  get upcomingCount(): number { return this.appointments.filter(a => a.status === 'RESERVADA').length; }
  get availableSlotCount(): number { return this.slots.filter(s => s.available).length; }
  get patientMetrics(): { label: string; value: string; meta: string; tone: 'mint' | 'blue' | 'green' }[] {
    return [
      { label: 'Próximas citas', value: `${this.upcomingCount}`, meta: 'en tu historial', tone: 'mint' },
      { label: 'Establecimiento', value: 'Por consultar', meta: 'se obtiene de tu perfil', tone: 'blue' },
      { label: 'Disponibilidad', value: 'Agenda', meta: 'según horarios del backend', tone: 'green' },
    ];
  }
  get doctorMetrics(): { label: string; value: string; meta: string; tone: 'mint' | 'blue' | 'green' }[] {
    return [
      { label: 'Agenda del día', value: `${this.appointments.filter(a => a.status === 'RESERVADA').length}`, meta: 'según agenda del servidor', tone: 'mint' },
      { label: 'Atenciones cerradas', value: `${this.appointments.filter(a => a.status === 'ATENDIDA').length}`, meta: 'según historial', tone: 'green' },
      { label: 'Estado', value: 'Conectado', meta: 'sesión autenticada', tone: 'blue' },
    ];
  }
  get adminMetrics(): { label: string; value: string; meta: string; tone: 'mint' | 'blue' | 'green' }[] {
    return [
      { label: 'Citas consultadas', value: `${this.appointments.length}`, meta: 'registros devueltos por la API', tone: 'blue' },
      { label: 'Citas activas', value: `${this.activeAppointments.length}`, meta: 'según registros consultados', tone: 'green' },
      { label: 'Permisos', value: 'Protegidos', meta: 'validados en el servidor', tone: 'mint' },
    ];
  }

  navigate(view: View): void {
    if (view === 'publico' || view === 'servicios') {
      this.view = view;
      if (view === 'servicios') this.selectedService = null;
      this.clearNotice();
      return;
    }
    if (view === 'acceso') {
      this.accessMode = 'login';
      this.view = view;
      this.clearNotice();
      return;
    }
    if (!this.isAuthenticated) {
      this.pendingView = view;
      this.accessMode = 'login';
      this.view = 'acceso';
      this.flash('Inicia sesión para acceder a tu espacio personal.', 'info');
      return;
    }
    if (!this.canOpenView(view)) {
      this.view = this.homeForRole();
      this.flash('Tu cuenta no tiene permisos para acceder a esa sección.', 'error');
      return;
    }
    this.view = view;
    this.clearNotice();
    if (view === 'reservar') {
      this.resetBooking();
      if (!this.catalogLoaded) this.loadSpecialties();
    }
    if (view === 'citas' && !this.appointmentsLoaded && this.role === 'PACIENTE') this.loadPatientAppointments();
  }

  login(): void {
    if (this.busy) return;
    if (!/^\d{8}$/.test(this.loginDni) || this.loginPassword.length < 8) {
      this.flash('Ingresa un DNI de 8 dígitos y una contraseña de al menos 8 caracteres.', 'error');
      return;
    }

    this.busy = true;
    this.clearNotice();
    this.api.login(this.loginDni, this.loginPassword).subscribe({
      next: response => this.completeLogin(response),
      error: error => {
        this.busy = false;
        this.flash(this.apiErrorMessage(error, 'No se pudo iniciar sesión.'), 'error');
      }
    });
  }

  register(): void {
    if (this.busy) return;
    if (!this.registerNames.trim() || !/^\d{8}$/.test(this.registerDni) ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.registerEmail.trim()) ||
      this.registerPassword.length < 8 || this.registerPassword !== this.confirmPassword) {
      this.flash('Revisa tus nombres, DNI, correo y contraseña. La contraseña debe tener 8 caracteres como mínimo y ambas deben coincidir.', 'error');
      return;
    }

    this.busy = true;
    this.clearNotice();
    this.api.registrar(
      this.registerDni,
      this.registerNames.trim(),
      this.registerEmail.trim().toLowerCase(),
      this.registerPassword
    ).subscribe({
      next: response => {
        this.busy = false;
        this.loginDni = this.registerDni;
        this.loginPassword = '';
        this.registerNames = '';
        this.registerDni = '';
        this.registerEmail = '';
        this.registerPassword = '';
        this.confirmPassword = '';
        this.accessMode = 'login';
        this.flash(response.mensaje || 'Cuenta creada. Inicia sesión para continuar.', 'success');
      },
      error: error => {
        this.busy = false;
        this.flash(this.apiErrorMessage(error, 'No se pudo completar el registro.'), 'error');
      }
    });
  }

  private completeLogin(response: LoginResponse): void {
    const role = this.normalizeRole(response.rol || response.tipo);
    if (!response.token || !role) {
      this.busy = false;
      this.flash('El servidor devolvió una respuesta de acceso inválida. Verifica el contrato de autenticación.', 'error');
      return;
    }

    try {
      sessionStorage.setItem('citas.jwt', response.token);
    } catch {
      this.busy = false;
      this.flash('No se pudo guardar la sesión en este navegador. Revisa la configuración de privacidad.', 'error');
      return;
    }

    this.role = role;
    this.userName = response.nombre?.trim() || 'Mi cuenta';
    this.loginDni = '';
    this.loginPassword = '';
    this.isAuthenticated = true;
    this.busy = false;
    this.search = '';
    this.appointments = [];
    this.specialtyCatalog = [];
    this.doctorCatalog = [];
    this.slots = [];
    this.appointmentsLoaded = false;
    this.catalogLoaded = false;
    this.appointmentsLoading = false;
    this.catalogLoading = false;
    this.doctorLoading = false;
    this.slotsLoading = false;
    const destination = this.canOpenView(this.pendingView) ? this.pendingView : this.homeForRole();
    this.view = destination;
    this.pendingView = 'inicio';
    this.clearNotice();
    if (destination === 'reservar') this.resetBooking();
    this.loadRoleData();
  }

  private loadRoleData(): void {
    if (this.role === 'PACIENTE') {
      this.loadPatientAppointments();
      this.loadSpecialties();
    } else if (this.role === 'MEDICO') {
      this.loadAppointments(this.api.agendaMedica(this.currentDate()), 'No se pudo cargar la agenda médica.');
    } else {
      this.loadAppointments(this.api.agendaAdmin(this.currentDate()), 'No se pudo cargar la información administrativa.');
    }
  }

  private loadPatientAppointments(): void {
    this.loadAppointments(this.api.misCitas(), 'No se pudieron cargar tus citas.');
  }

  private loadAppointments(source: Observable<AppointmentDto[]>, fallback: string): void {
    this.appointmentsLoading = true;
    source.subscribe({
      next: response => {
        this.appointmentsLoading = false;
        const appointments = this.mapAppointments(response);
        if (!appointments) {
          this.appointmentsLoaded = false;
          this.appointments = [];
          this.flash('La API devolvió citas con un formato no válido. Verifica los DTO acordados.', 'error');
          return;
        }
        this.appointments = appointments;
        this.appointmentsLoaded = true;
      },
      error: error => {
        this.appointmentsLoading = false;
        this.appointmentsLoaded = false;
        this.flash(this.apiErrorMessage(error, fallback), 'error');
      }
    });
  }

  private mapAppointments(response: AppointmentDto[]): Appointment[] | null {
    const validStatuses: AppointmentStatus[] = ['RESERVADA', 'CANCELADA', 'ATENDIDA'];
    if (!Array.isArray(response) || response.some(item =>
      !item || typeof item.id !== 'string' || typeof item.profesional !== 'string' ||
      typeof item.especialidad !== 'string' || typeof item.fecha !== 'string' ||
      typeof item.hora !== 'string' || typeof item.establecimiento !== 'string' ||
      !validStatuses.includes(item.estado)
    )) return null;

    return response.map(item => ({
      id: item.id,
      doctor: item.profesional,
      specialty: item.especialidad,
      date: item.fecha,
      time: item.hora,
      status: item.estado,
      place: item.establecimiento
    }));
  }

  private loadSpecialties(): void {
    this.catalogLoading = true;
    this.api.especialidades().subscribe({
      next: response => {
        this.catalogLoading = false;
        if (!Array.isArray(response) || response.some(item =>
          !item || typeof item.id !== 'string' || typeof item.nombre !== 'string'
        )) {
          this.catalogLoaded = false;
          this.specialtyCatalog = [];
          this.flash('La API devolvió especialidades con un formato no válido. Verifica los DTO acordados.', 'error');
          return;
        }
        this.specialtyCatalog = response;
        this.catalogLoaded = true;
      },
      error: error => {
        this.catalogLoading = false;
        this.catalogLoaded = false;
        this.flash(this.apiErrorMessage(error, 'No se pudo cargar el catálogo de atenciones.'), 'error');
      }
    });
  }

  onSpecialtyChange(specialtyId: string): void {
    const requestId = ++this.doctorRequestId;
    this.specialty = specialtyId;
    this.doctor = '';
    this.date = '';
    this.selectedSlot = null;
    this.doctorCatalog = [];
    this.slots = [];
    this.doctorLoading = Boolean(specialtyId);
    if (!specialtyId) return;

    this.api.medicos(specialtyId).subscribe({
      next: response => {
        if (requestId !== this.doctorRequestId) return;
        this.doctorLoading = false;
        if (!Array.isArray(response) || response.some(item =>
          !item || typeof item.id !== 'string' || typeof item.nombre !== 'string'
        )) {
          this.flash('La API devolvió profesionales con un formato no válido. Verifica los DTO acordados.', 'error');
          return;
        }
        this.doctorCatalog = response;
      },
      error: error => {
        if (requestId !== this.doctorRequestId) return;
        this.doctorLoading = false;
        this.flash(this.apiErrorMessage(error, 'No se pudieron cargar los profesionales.'), 'error');
      }
    });
  }

  onDoctorChange(doctorId: string): void {
    this.slotsRequestId += 1;
    this.doctor = doctorId;
    this.date = '';
    this.slots = [];
    this.selectedSlot = null;
    this.slotsLoading = false;
  }

  loadSlots(): void {
    const requestId = ++this.slotsRequestId;
    this.selectedSlot = null;
    this.slots = [];
    if (!this.doctor || !this.date) {
      this.slotsLoading = false;
      return;
    }
    this.slotsLoading = true;
    this.api.horariosDisponibles(this.doctor, this.date).subscribe({
      next: response => {
        if (requestId !== this.slotsRequestId) return;
        this.slotsLoading = false;
        if (!Array.isArray(response) || response.some(item =>
          !item || typeof item.id !== 'string' || typeof item.fecha !== 'string' ||
          typeof item.hora !== 'string' || typeof item.profesional !== 'string' ||
          typeof item.especialidad !== 'string' || typeof item.establecimiento !== 'string' ||
          typeof item.disponible !== 'boolean'
        )) {
          this.flash('La API devolvió horarios con un formato no válido. Verifica los DTO acordados.', 'error');
          return;
        }
        this.slots = response.map(item => this.mapSlot(item));
      },
      error: error => {
        if (requestId !== this.slotsRequestId) return;
        this.slotsLoading = false;
        this.flash(this.apiErrorMessage(error, 'No se pudieron cargar los horarios.'), 'error');
      }
    });
  }

  private mapSlot(item: SlotDto): Slot {
    return {
      id: item.id,
      doctorId: this.doctor,
      specialtyId: this.specialty,
      date: item.fecha,
      time: item.hora,
      doctor: item.profesional,
      specialty: item.especialidad,
      place: item.establecimiento,
      available: item.disponible
    };
  }

  private currentDate(): string {
    const date = new Date();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${date.getFullYear()}-${month}-${day}`;
  }

  private normalizeRole(value?: string): Role | null {
    const normalized = value?.toUpperCase();
    return normalized === 'PACIENTE' || normalized === 'MEDICO' || normalized === 'ADMIN' ? normalized : null;
  }

  private canOpenView(view: View): boolean {
    if (view === 'inicio' || view === 'reservar' || view === 'citas') return this.role === 'PACIENTE';
    if (view === 'agenda') return this.role === 'MEDICO';
    if (view === 'admin' || view === 'integracion') return this.role === 'ADMIN';
    return view === 'institucional' || view === 'servicios';
  }

  private homeForRole(): View {
    return this.role === 'PACIENTE' ? 'inicio' : this.role === 'MEDICO' ? 'agenda' : 'admin';
  }

  private apiErrorMessage(error: unknown, fallback: string): string {
    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) return 'No se pudo conectar con el backend. Verifica que la API esté en ejecución y configurada.';
      if (error.error && typeof error.error === 'object') {
        const body = error.error as { mensaje?: unknown; message?: unknown };
        if (typeof body.mensaje === 'string') return body.mensaje;
        if (typeof body.message === 'string') return body.message;
      }
      if (error.status === 401) return 'DNI o contraseña incorrectos.';
      if (error.status === 409) return 'Ya existe una cuenta con ese DNI o correo.';
    }
    return fallback;
  }

  selectServiceGroup(group: 'Todas' | ServiceGroup): void {
    this.selectedServiceGroup = group;
  }

  openService(service: InstitutionalService): void {
    this.selectedService = service;
    this.view = 'servicios';
    this.clearNotice();
  }

  openServiceByTitle(title: string): void {
    const service = this.institutionalServices.find(item => item.title === title);
    if (!service) {
      this.flash('No se encontró la información seleccionada.', 'error');
      return;
    }
    this.openService(service);
  }

  showServiceList(): void {
    this.selectedService = null;
  }

  openPreview(): void {
    this.view = 'preview';
    this.clearNotice();
  }

  logout(): void {
    sessionStorage.removeItem('citas.jwt');
    this.isAuthenticated = false;
    this.role = 'PACIENTE';
    this.userName = '';
    this.loginDni = '';
    this.loginPassword = '';
    this.registerDni = '';
    this.registerNames = '';
    this.registerEmail = '';
    this.registerPassword = '';
    this.confirmPassword = '';
    this.appointments = [];
    this.slots = [];
    this.specialtyCatalog = [];
    this.doctorCatalog = [];
    this.appointmentsLoaded = false;
    this.catalogLoaded = false;
    this.view = 'publico';
    this.accessMode = 'login';
    this.clearNotice();
  }

  startBooking(): void {
    if (!this.isAuthenticated) {
      this.pendingView = 'reservar';
      this.accessMode = 'login';
      this.view = 'acceso';
      this.flash('Para reservar una cita, primero inicia sesión con tu DNI.', 'info');
      return;
    }
    this.navigate('reservar');
  }

  selectSlot(slot: Slot): void { this.selectedSlot = slot; }

  nextStep(): void {
    if (this.step === 1) {
      const validation = this.validateBookingStep1();
      if (!validation.valid) {
        this.bookingValidation = validation;
        this.flash(validation.message, validation.severity);
        return;
      }
    }

    if (this.step === 2) {
      const validation = this.validateBookingStep2();
      if (!validation.valid) {
        this.bookingValidation = validation;
        this.flash(validation.message, validation.severity);
        return;
      }
    }

    this.clearNotice();
    this.bookingValidation = {
      valid: true,
      code: 'VALIDACION_OK',
      message: 'Validación correcta. Puedes continuar con la reserva.',
      severity: 'success'
    };
    this.step = Math.min(3, this.step + 1);
  }

  previousStep(): void {
    this.clearNotice();
    this.bookingValidation = null;
    this.step = Math.max(1, this.step - 1);
  }

  confirmBooking(): void {
    if (this.busy) return;
    if (!this.selectedSlot) {
      this.flash('Selecciona un horario antes de confirmar.', 'error');
      return;
    }

    const validation = this.validateBookingStep2();
    if (!validation.valid) {
      this.bookingValidation = validation;
      this.flash(validation.message, validation.severity);
      this.step = 2;
      return;
    }

    this.busy = true;
    this.clearNotice();
    this.bookingValidation = validation;
    this.api.reservar(this.selectedSlot.id).subscribe({
      next: () => {
        this.busy = false;
        this.appointmentsLoaded = false;
        this.step = 4;
        this.flash('El servidor confirmó tu solicitud de cita.', 'success');
      },
      error: error => {
        this.busy = false;
        this.bookingValidation = { valid: false, code: 'RESERVA_RECHAZADA', message: this.apiErrorMessage(error, 'No se pudo confirmar la cita.'), severity: 'error' };
        this.flash(this.bookingValidation.message, 'error');
        this.step = 2;
      }
    });
  }

  cancelAppointment(appointment: Appointment): void {
    if (this.busy) return;
    this.busy = true;
    this.busy = true;
    this.api.cancelar(appointment.id).subscribe({
      next: () => {
        appointment.status = 'CANCELADA';
        this.busy = false;
        this.flash(`La cita ${appointment.id} fue cancelada.`, 'success');
      },
      error: error => {
        this.busy = false;
        this.flash(this.apiErrorMessage(error, 'No se pudo cancelar la cita.'), 'error');
      }
    });
  }

  private validateBookingStep1(): BookingValidation {
    if (!this.specialty) {
      return { valid: false, code: 'SPECIALTY_REQUIRED', message: 'Debes seleccionar una especialidad.', severity: 'error' };
    }
    if (!this.doctor) {
      return { valid: false, code: 'DOCTOR_REQUIRED', message: 'Debes seleccionar un profesional para continuar.', severity: 'error' };
    }
    return { valid: true, code: 'STEP_1_OK', message: 'Especialidad y profesional validados.', severity: 'success' };
  }

  private validateBookingStep2(): BookingValidation {
    if (!this.selectedSlot) {
      return { valid: false, code: 'SLOT_REQUIRED', message: 'Debes elegir un horario para continuar.', severity: 'error' };
    }
    if (!this.selectedSlot.available) {
      return { valid: false, code: 'SLOT_UNAVAILABLE', message: 'El turno ya no está disponible. Elige otra opción.', severity: 'error' };
    }
    return { valid: true, code: 'STEP_2_OK', message: 'Horario validado correctamente.', severity: 'success' };
  }

  private resetBooking(): void {
    this.step = 1;
    this.specialty = '';
    this.doctor = '';
    this.date = '';
    this.selectedSlot = null;
    this.bookingValidation = null;
  }

  flash(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info'): void {
    this.notice = message;
    this.noticeType = type;
  }

  clearNotice(): void {
    this.notice = '';
    this.noticeType = 'info';
  }
}

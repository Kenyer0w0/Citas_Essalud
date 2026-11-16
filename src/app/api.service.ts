import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_CONFIG } from './api.config';

export interface ApiError {
  codigo?: string;
  mensaje?: string;
  message?: string;
  detalles?: Record<string, string>;
}

export interface LoginResponse {
  token: string;
  tipo?: string;
  rol?: string;
  nombre?: string;
}

export interface SpecialtyDto {
  id: string;
  nombre: string;
}

export interface DoctorDto {
  id: string;
  nombre: string;
}

export interface SlotDto {
  id: string;
  fecha: string;
  hora: string;
  profesional: string;
  especialidad: string;
  establecimiento: string;
  disponible: boolean;
}

export interface AppointmentDto {
  id: string;
  profesional: string;
  especialidad: string;
  fecha: string;
  hora: string;
  estado: 'RESERVADA' | 'CANCELADA' | 'ATENDIDA';
  establecimiento: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly root = API_CONFIG.baseUrl.replace(/\/$/, '');

  login(dni: string, contrasena: string): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.root}/auth/login`, { dni, contrasena });
  }
  registrar(dni: string, nombres: string, correo: string, contrasena: string): Observable<{ mensaje?: string }> {
    return this.http.post<{ mensaje?: string }>(`${this.root}/auth/registro`, { dni, nombres, correo, contrasena });
  }
  perfil(): Observable<unknown> { return this.http.get(`${this.root}/auth/me`); }
  especialidades(): Observable<SpecialtyDto[]> { return this.http.get<SpecialtyDto[]>(`${this.root}/especialidades`, { params: new HttpParams().set('reservaDirecta', 'true') }); }
  medicos(especialidadId: string): Observable<DoctorDto[]> { return this.http.get<DoctorDto[]>(`${this.root}/medicos`, { params: new HttpParams().set('especialidadId', especialidadId) }); }
  horariosDisponibles(medicoId: string, fecha: string): Observable<SlotDto[]> {
    return this.http.get<SlotDto[]>(`${this.root}/horarios/disponibles`, { params: new HttpParams().set('medicoId', medicoId).set('fecha', fecha) });
  }
  reservar(horarioId: string): Observable<unknown> { return this.http.post(`${this.root}/citas`, { horarioId }); }
  misCitas(): Observable<AppointmentDto[]> { return this.http.get<AppointmentDto[]>(`${this.root}/citas/mias`); }
  cancelar(citaId: string): Observable<unknown> { return this.http.patch(`${this.root}/citas/${encodeURIComponent(citaId)}/cancelar`, {}); }
  agendaMedica(fecha: string): Observable<AppointmentDto[]> { return this.http.get<AppointmentDto[]>(`${this.root}/medico/agenda`, { params: new HttpParams().set('fecha', fecha) }); }
  agendaAdmin(fecha: string, estado?: string): Observable<AppointmentDto[]> {
    let params = new HttpParams().set('fecha', fecha);
    if (estado) params = params.set('estado', estado);
    return this.http.get<AppointmentDto[]>(`${this.root}/admin/citas`, { params });
  }
}

# CitaSalud — orientación y citas

Aplicación Angular para el proyecto del Grupo 07. Incluye una portada pública, información de orientación basada en fuentes oficiales y un espacio personal con acceso por DNI. Es un proyecto independiente: no es un servicio oficial de EsSalud ni está afiliado a la institución.

## Requisitos

- Node.js 20.19+ o 22.12+
- npm

## Ejecutar

```bash
npm install
npm start
```

La aplicación se sirve en `http://localhost:4200`. La URL base de la API se configura en `src/app/api.config.ts` (por defecto, `http://localhost:8080/api`).

## Acceso y privacidad

El inicio de sesión y el registro envían sus datos a la API configurada. La interfaz valida el formato del DNI (8 dígitos), pero la autenticación, el registro y los permisos deben ser verificados por el backend.

Hasta revisar la protección de datos, configurar HTTPS y probar la API, utiliza únicamente datos de prueba. No introduzcas aquí claves de EsSalud ni de otros servicios. El token emitido por el servidor se conserva en `sessionStorage` y se envía en el encabezado Bearer para las peticiones protegidas.

## Contrato de autenticación propuesto

Confirma estas rutas y campos con el equipo Spring Boot antes de desplegar:

| Operación | Método y ruta propuesta | Acceso |
| --- | --- | --- |
| Iniciar sesión | `POST /api/auth/login` | Público |
| Crear cuenta | `POST /api/auth/registro` | Público |
| Consultar usuario autenticado | `GET /api/auth/me` | JWT |

Solicitud de inicio de sesión:

```json
{ "dni": "<DNI_DE_PRUEBA_DE_8_DIGITOS>", "contrasena": "<CLAVE_DE_PRUEBA>" }
```

La respuesta debe incluir un token y el rol autorizado del usuario, por ejemplo:

```json
{ "token": "<JWT>", "tipo": "Bearer", "rol": "PACIENTE", "nombre": "Nombre Apellido" }
```

Solicitud de registro:

```json
{ "dni": "<DNI_DE_PRUEBA_DE_8_DIGITOS>", "nombres": "Nombre Apellido", "correo": "persona@example.com", "contrasena": "<CLAVE_DE_PRUEBA>" }
```

La contraseña debe almacenarse con un algoritmo robusto de hash en el backend. El servidor debe validar la unicidad del DNI y correo, los datos de entrada y todos los permisos; la validación del navegador no es un control de seguridad.

## Servicios de citas

`src/app/api.service.ts` contiene las rutas propuestas para especialidades, profesionales, turnos, reservas, historial, cancelaciones y agendas por rol. Confirma los DTO con el backend. La interfaz no fabrica citas ni turnos; los catálogos y el historial aparecerán cuando se conecten sus servicios de lectura.

| Operación | Método y ruta propuesta |
| --- | --- |
| Listar especialidades con reserva directa | `GET /api/especialidades?reservaDirecta=true` |
| Listar profesionales | `GET /api/medicos?especialidadId={id}` |
| Consultar turnos disponibles | `GET /api/horarios/disponibles?medicoId={id}&fecha={yyyy-MM-dd}` |
| Reservar un turno | `POST /api/citas` |
| Consultar mis citas | `GET /api/citas/mias` |
| Cancelar cita propia | `PATCH /api/citas/{citaId}/cancelar` |
| Consultar agenda clínica | `GET /api/medico/agenda?fecha={yyyy-MM-dd}` |
| Consultar citas para administración | `GET /api/admin/citas?fecha={yyyy-MM-dd}` |

El servidor debe volver a comprobar cobertura, adscripción, autorización, disponibilidad y ventana de cancelación. Maneja códigos `401`, `403`, `409`, `422` y `503` de forma explícita; un error o una respuesta no disponible nunca debe presentarse como una reserva confirmada.

### Formatos de respuesta esperados por la interfaz

- Especialidad: `{ "id": "...", "nombre": "Medicina general" }`
- Profesional: `{ "id": "...", "nombre": "Nombre Apellido" }`
- Turno: `{ "id": "...", "fecha": "yyyy-MM-dd", "hora": "HH:mm", "profesional": "...", "especialidad": "...", "establecimiento": "...", "disponible": true }`
- Cita: `{ "id": "...", "profesional": "...", "especialidad": "...", "fecha": "yyyy-MM-dd", "hora": "HH:mm", "estado": "RESERVADA", "establecimiento": "..." }`

Las listas deben devolver arreglos JSON, incluidos arreglos vacíos cuando no haya resultados.

## Información institucional

La portada y las guías de categorías resumen en palabras propias información pública del Seguro Social de Salud. Las fuentes utilizadas para preparar esos resúmenes son:

- [Información institucional de EsSalud — Gob.pe](https://www.gob.pe/institucion/essalud/institucional)
- [Categorías y temas de EsSalud — Gob.pe](https://www.gob.pe/institucion/essalud/temas)

La sección **Servicios e información de EsSalud** muestra dentro del propio sitio resúmenes para las 13 categorías, con búsqueda, filtros y una página de detalle por categoría. El contenido está sintetizado en palabras propias; no reproduce íntegramente páginas oficiales. Los resúmenes orientan, pero no envían solicitudes ni gestionan trámites institucionales. Esta plataforma no representa a EsSalud.

## Validación

```bash
npm test
npm run build
```

# Alcance del frontend frente a los documentos del curso

## Solicitud del equipo

La solicitud de este trabajo es preparar el frontend para el proyecto de gestión de citas médicas. El backend será desarrollado por otros integrantes. El sitio ofrece una portada pública y orientación institucional; las operaciones privadas dependen de respuestas reales de la API. La vista previa del portal es únicamente visual, de solo lectura y no usa cuentas, citas ni horarios ficticios.

## Requisitos del profesor y del informe

Los documentos del curso establecen Angular con TypeScript y SCSS, perfiles de asegurado, médico y administrador, autenticación JWT, consumo de API REST, manejo de éxito y error, flujo de reserva en tres pasos, disponibilidad, citas, cancelación, agenda, control de roles, cobertura y adscripción, y mensajes que no inventen resultados. La rúbrica también pide evidencia de integración, publicación y pruebas.

## Qué entrega este frontend

| Requisito | Estado en este sitio |
|---|---|
| Angular, TypeScript, SCSS e interfaz adaptable | Implementado en el proyecto fuente |
| Portada pública y orientación institucional | Disponible sin iniciar sesión; el contenido es informativo |
| Pantalla de acceso y registro por DNI | Valida el formato en el navegador y envía solicitudes a la API; no crea sesiones locales |
| Vista previa del portal | Solo visual y de lectura; no muestra datos ficticios ni permite operaciones privadas |
| Reserva, disponibilidad, citas y cancelación | Dependen de la API; no se confirma una operación sin respuesta válida del servidor |
| Agenda médica y administración | Requieren sesión y permisos devueltos/verificados por el backend |
| API REST y JWT | Cliente HTTP e interceptor preparados para integrarse con el backend |
| Autorización, titularidad, conflictos de cupo y cobertura | Debe resolverlo y validarlo el backend |
| Despliegue y URL pública | Pendiente de configurar con el backend y el equipo |
| Evidencias de pruebas y resultados | Build y 10 pruebas unitarias aprobados localmente; integración backend pendiente |

## Reglas de integración y privacidad

- No se ingresan credenciales reales de EsSalud.
- La vista previa no representa una sesión autenticada ni una reserva real.
- La interfaz no decide por sí misma la elegibilidad ni autoriza acciones privadas.
- Antes de la entrega grupal, se deben alinear `api.service.ts` y los DTO con las rutas que implemente Spring Boot y validar la integración de extremo a extremo.
- Usa únicamente datos de prueba hasta verificar la protección de datos, configurar HTTPS y probar la API.

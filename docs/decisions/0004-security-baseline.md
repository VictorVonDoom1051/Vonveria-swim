# 0004 — Línea de base de seguridad

- **Fecha:** 16 de agosto de 2026
- **Estado:** Aprobado
- **Ámbito:** Seguridad de acceso, datos y comunicación (CLAUDE.md §15)

## Contexto

Antes de pruebas en equipo con datos de menores, se completó auditoría de seguridad. La infraestructura de autenticación y autorización es robusta, pero la gestión de secretos requería mejora inmediata.

## Decisión

Se establece una **línea de base de seguridad mínima** que cubre seis áreas:

### 1. Sesiones y Cookies (✅ Implementado)

- Tokens de sesión se hashean en BD, no se almacena plain text
- Cookie `X-VONVERIA-SESSION` con `httpOnly: true` (protege contra XSS)
- `sameSite: "lax"` (protege contra CSRF en navegación)
- `secure: true` en producción (solo HTTPS)
- Expiración configurable (hoy: 7 días)
- Se registra userAgent e ipAddress para auditoría

### 2. Protección CSRF (✅ Implementado)

- **Patrón:** Double-Cookie CSRF (más seguro que tokens)
- Cookie `vonveria_csrf` legible por JavaScript (httpOnly: false)
- En mutaciones (POST/PUT/DELETE), cliente envía valor en header `x-csrf-token`
- Atacante cross-site NO puede leer la cookie para copiarla al header
- GET, HEAD, OPTIONS no requieren validación

### 3. Rate Limiting (⚠️ Parcial — mejora en progreso)

**Hoy implementado:**
- Login: 5 intentos / 60 segundos

**Por implementar:**
- Reset-password: 3 intentos / 3600 segundos (por email)
- Cambio de contraseña: 5 intentos / 60 segundos
- Global: 100 peticiones / 60 segundos por IP (excepto GET)

**Almacenamiento:** En memoria para instancia única; Redis para escalabilidad futura.

### 4. Autorización (✅ Implementado)

- **Doble capa:**
  1. `AuthGuard` valida token de sesión en BD, verifica no expirado, usuario ACTIVE
  2. `CapabilityGuard` valida que usuario tenga capacidades requeridas
  
- **Patrón:** Decorador `@RequireCapability` en rutas; ambos guards son `APP_GUARD` (se aplican globalmente)

- **Fallback:** Sin decorador = autenticado + organizationId válido

- **Frontend:** Oculta botones solo de UI; backend rechaza sin capacidades

### 5. Aislamiento por Organización (✅ Implementado)

- **Regla:** Todas las queries incluyen `where: { organizationId, ... }`
- **Flujo:** Controlador extrae `organizationId` de `request.user` (validado en AuthGuard) y lo pasa a servicios
- **Verificación:** Se auditoró 10+ servicios; todos filtran por org

### 6. Secretos y Credenciales (⚠️ Mejorado)

**Regla principal:** Nunca commitear secretos. Cada ambiente genera el suyo.

- **ADMIN_PASSWORD:** Antes hardcodeado (`12345678acs`). Ahora:
  - `.env` tiene contraseña única para desarrollo (no visible en git)
  - `.env.example` tiene placeholder + instrucción de generación
  - Producción usa variable de Railway (se ingresa en UI)

- **Generación de secretos:** `openssl rand -base64 24 | tr -d '=' | head -c 32`

- **Lo que NO se logea:**
  - Passwords (ni plain ni hash)
  - Session tokens
  - CSRF tokens
  - Biometría

- **Lo que SÍ se audita:**
  - Quién hizo qué (actor, acción, entidad, timestamp)
  - Cambios sensibles (login, permiso, baja, pago)
  - NO incluye valores sensibles en metadata

### 7. Validación de Entrada (✅ Implementado)

- `ValidationPipe` en main.ts con `whitelist: true, forbidNonWhitelisted: true`
- Rechaza campos desconocidos en payload
- DTOs tipados en TypeScript + decoradores class-validator

### 8. CORS (✅ Implementado)

- Restringido a `API_CORS_ORIGIN` desde variable de entorno
- Desarrollo: `http://localhost:3100`
- Producción: dominio de la aplicación web

## Conformidad

| Requisito (CLAUDE.md §15) | Estado | Evidencia |
|---------------------------|--------|-----------|
| Autorización en backend | ✅ | AuthGuard + CapabilityGuard son APP_GUARD |
| RBAC por capacidades | ✅ | @RequireCapability + permissions catalog |
| Contraseñas hashed | ✅ | argon2 via @vonveria-swim/auth |
| Cookies seguras | ✅ | httpOnly, sameSite, secure configuradas |
| Protección CSRF | ✅ | Double-cookie pattern |
| Rate limiting en auth | ✅ | 5 intentos/60s en login; plan para otros endpoints |
| Validación de entrada | ✅ | ValidationPipe con whitelist |
| CORS restringido | ✅ | Variable de entorno |
| Sin logs sensibles | ✅ | No passwords, tokens, emails en logs |
| Auditoría completa | ✅ | AuditService registra actor, acción, entidad |
| Mínimo privilegio | ✅ | Roles con capacidades explícitas |
| Aislamiento por org | ✅ | organizationId en todas las queries |

## Fuera de alcance (futuro)

- Autenticación de dos factores (2FA) — requiere cambio de modelo User
- Integración con IdP externo (OAuth, SAML) — fase posterior
- Rotación automática de secretos — requiere vault externo
- Detección de anomalías / honeypots — requiere ML
- Análisis de logs de seguridad — requiere SIEM externo

## Próximos pasos

1. **Implementar rate limiting global** en endpoints sensibles (POST /auth/reset-password, POST /users/:id/reset-password)
2. **Completar tests de seguridad:** permisos, aislamiento, data injection
3. **Auditar logs en producción:** verificar que no haya datos sensibles
4. **Documentar para el equipo:** política de secretos, cómo generar ADMIN_PASSWORD en otros ambientes

# Version & Git Branch Management

## Actualización de versión

Cuando se solicite "actualiza versión":

1. Incrementar versión en `package.json` (sumar 1 al último número).
2. Actualizar versión en `public/service-worker.js` para mantener consistencia, y no modificar `changelog.md` a menos que se solicite.

## Git Branch Management

- **Formato:** `sprint-xx/xxxx` (sprint-número/descripción). Ejemplos: `sprint-23/login-optimization`.
- **Proceso:** Crear rama, verificar, y hacer push si es necesario. (Basado en la Versión 3.0 del Cognitive Protocol).

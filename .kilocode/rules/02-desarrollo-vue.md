# Development Patterns & File Structure

- **TypeScript First:** Usar siempre TypeScript con interfaces y tipado estricto.
- **Arrow Functions:** Preferir funciones flecha, excepto métodos de clase que necesitan `this`.
- **Convenciones de Nombres:** Las funciones Async deben terminar con "Async" (ej: `getUsersAsync`). Declarar dependencias antes de usarlas.
- **Estructura Vue:** Orden estricto: Variables → Métodos → Watchers → Template → Styles. Usar `multi_edit`, mantener imports al principio, y recordar que los componentes en `src/plugins/components/global/` NO requieren importación.
- **Archivos de Configuración:** Respetar la función de `package.json` (versión), `service-worker.js` (cache), y `changelog.md` (historial).

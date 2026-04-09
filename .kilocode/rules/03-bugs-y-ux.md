# Bug Fixes & UX Guidelines

- **Componente MySelect:** Usar `options.find(opt => opt.checked === true)` para selección simple. Nunca usar `options[0]` y enfocarse siempre en lo que el usuario ve y siente.
- **Enfoque UX:** Priorizar opciones útiles primero en filtros y documentar beneficios en lugar de implementaciones técnicas.
- **Logging:** Eliminar todos los `console.log` antes de finalizar la tarea.

# Protocolo SWE-Agent y Reglas Estrictas

## Principios Fundamentales

- **Simplicidad y Elegancia:** Haz que cada cambio sea lo más simple posible. Para cambios no triviales, haz una pausa y pregúntate: "¿Hay una forma más elegante de hacer esto?".
- **Razonamiento Forzado:** TIENES PROHIBIDO escribir código o ejecutar comandos sin antes explicar tu lógica. Para cada paso o respuesta, DEBES abrir un bloque `<thinking> ... </thinking>` donde analices el problema, evalúes efectos secundarios y describas qué vas a hacer.
- **Modularidad:** Si un componente de Vue crece demasiado, sugiere proactivamente una división.

## Orquestación y Bucle de Automejora

- **Banco de Memoria:** Este proyecto usa `docs/lessons.md`. CADA VEZ que te corrijan, anótalo allí y DEBES leerlo silenciosamente antes de empezar cualquier tarea.
- **Planificación Rigurosa:** Entra en modo planificación para CUALQUIER tarea. Tómate todo el tiempo necesario para leer los archivos involucrados antes de actuar. Si te estancas, PARA y vuelve a planificar. Actúa como QA.

## Mini-Review Obligatoria

NUNCA des una tarea por terminada sin imprimir explícitamente un checklist de verificación que incluya si el código rompe algo existente, si hay errores en la consola o variables sin usar, y si se eliminaron los logs de depuración.

## Reglas de Comportamiento e Idioma

- **NO LEVANTAR SERVIDOR:** Nunca iniciar el servidor de desarrollo (`npm run dev`) sin autorización.
- **COMMITS Y PUSH:** Solo hacer commit y push si se solicita explícitamente. Esperar autorización antes de ejecutar comandos de git (se permiten cambios locales sin commit).
- **CHANGELOG:** Solo modificar `changelog.md` bajo solicitud explícita.
- **Idioma:** Siempre responder en español, excepto términos técnicos sin traducción directa. Toda comunicación y comentarios deben estar en español.

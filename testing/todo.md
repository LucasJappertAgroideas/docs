# Todo — Testing E2E Prode Mundial 2026

## Leyenda
- `[ ]` Pendiente
- `[x]` Completado
- `[~]` En progreso
- `[!]` Bloqueado / error

---

## Fase 0: Setup e infraestructura

- [ ] Crear estructura de carpetas (backend y frontend)
- [ ] Crear `fixtures/minimal-fixture.json`
- [ ] Crear `playwright.config.ts`
- [ ] Crear `jest.e2e.config.js` (API)

## Fase 1: Backend — Helpers compartidos

- [ ] `e2e/helpers/auth.helper.ts` — login, api wrapper, status helpers
- [ ] `e2e/helpers/fixture.helper.ts` — carga de fixture, consulta matches
- [ ] `e2e/helpers/clock.helper.ts` — reloj simulado
- [ ] `e2e/helpers/types.helper.ts` — interfaces TypeScript

## Fase 2: Backend — Tests unitarios

- [ ] `unit/points-calculation.test.ts` — cálculo de puntos (12 casos)
- [ ] `unit/clear-result-policy.test.ts` — política de integridad al borrar
- [ ] `unit/champion-names.test.ts` — comparación de nombres
- [ ] `unit/champion-window.test.ts` — ventana de campeón

## Fase 3: Backend — Tests E2E de acceso y autorización

- [ ] `e2e/access.e2e.test.ts` — auth, roles, rutas admin

## Fase 4: Backend — Tests E2E de predicciones

- [ ] `e2e/predictions.e2e.test.ts` — CRUD, bloqueos, validaciones

## Fase 5: Backend — Tests E2E de campeón

- [ ] `e2e/champion.e2e.test.ts` — ventana, crear, modificar, liquidar

## Fase 6: Backend — Tests E2E de admin (resultados + fases)

- [ ] `e2e/admin-results.e2e.test.ts` — cargar/borrar resultados
- [ ] `e2e/admin-phases.e2e.test.ts` — cierre de fases, avance

## Fase 7: Backend — Tests E2E de ranking y scheduler

- [ ] `e2e/ranking.e2e.test.ts` — ranking ordenado, desglose

## Fase 8: Frontend — Helpers y page objects

- [ ] `helpers/auth.helper.ts` — login UI, getToken API
- [ ] `helpers/world-cup.po.ts` — page objects
- [ ] `helpers/api-bridge.helper.ts` — puente API para setup

## Fase 9: Frontend — Specs Playwright

- [ ] `world-cup-access.spec.ts` — acceso, autorización, modo admin
- [ ] `world-cup-predictions.spec.ts` — predicción, placeholders, bloqueos UI
- [ ] `world-cup-champion.spec.ts` — formulario campeón, ventana cerrada
- [ ] `world-cup-admin.spec.ts` — resultados, fases, auditoría
- [ ] `world-cup-ranking.spec.ts` — tabla, precisión, medallas

## Fase 10: Ejecución y reportes

- [ ] Ejecutar tests unitarios (Jest)
- [ ] Ejecutar tests E2E de API (Jest)
- [ ] Ejecutar tests E2E de frontend (Playwright)
- [ ] Generar `RESULTADOS-TESTS.md`

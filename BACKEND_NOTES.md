# Backend Notes (Refactor: mobile → web)

This file collects backend findings encountered during the mobile → web refactor. The constraint is **no backend changes** — bugs and friction points are logged here for later, not fixed now.

## Findings so far

_(none yet — backend audit during Phase 1 found `enableCors({ origin: '*' })` in `main.ts` and a `@WebSocketGateway({ cors: { origin: '*', credentials: true } })` in `game.gateway.ts`, which is exactly what the new web client needs. No friction.)_

# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

| Command | Purpose |
|---|---|
| `npm run dev` | Vite dev server on http://localhost:5173 (binds 0.0.0.0). |
| `npm run dev:https` | HTTPS dev server (required for WebXR/VR testing on headsets). Pre-flight checks port 5173 is free; certs must exist. |
| `npm run cert:https` | Generates self-signed certs into `certs/`. Run once before `dev:https`. |
| `npm run build` | Production bundle into `dist/`. |
| `npm run preview` | Serve the built bundle. |
| `npm run lint` | ESLint over the repo. There are no tests. |

There is no test runner configured. Verify behavior by running `npm run dev` and exercising the affected module in the browser.

## High-level architecture

NovaLab is a frontend-only educational MVP. Everything is local state and mock data — no backend, no auth, no DB.

**App shell (`src/App.jsx`).** A single component holds top-level UI state (current view, active module id, theme, VR toggle, feedback) and lazy-loads every module. Module dispatch is a `switch` on the lowercased module id inside `renderActiveModule()`. To add a new module: register it in `src/data/novalabModules.js` *and* add a case to that switch — both are required.

**Module catalog (`src/data/novalabModules.js` + `src/services/moduleService.js`).** Modules are described as plain data (id, title, instructions, status pill, etc.). The service wraps the array in a fake-async `getModules()` call so the loading/error UI in `App.jsx` is exercised. Treat `moduleService` as the seam where a real API would later plug in.

**Physics core (`src/physics/`).** Deliberately decoupled from React and Three.js. Public API is `src/physics/index.js` — import from there, not from internals. RK4 integrator (`integrators/rk4.js`) drives scenario modules (`modules/freeFallAirDrag.js`, `modules/burningStick.js`). Scenario *parameters* live as JSON under `src/scenarios/`. This decoupling is intentional per `AGENTS.md` — there is a roadmap to port to Unity, so keep simulation logic free of rendering concerns.

**3D / XR layer.** Built on `@react-three/fiber` + `@react-three/drei` + `@react-three/xr`. Each lab module owns its own R3F `<Canvas>`. Some modules (e.g. `AetherLab`) use Zustand for scene state — that's an exception, not the default. Per `AGENTS.md`, prefer plain React hooks unless the feature genuinely needs a store.

**Two car constructors coexist.** `Car3DConstructor/` is the desktop-3D path; `CarVRConstructor/` is the VR path. The App toggles between them based on `isVRMode`. **Do not edit `Car3DConstructor/Car3DConstructor.jsx` while implementing VR features** — it's frozen per project rules; put VR changes in `CarVRConstructor/`.

## Project rules from `AGENTS.md` (load-bearing)

- **Don't modify existing working features, routing, or main layout wrappers** while adding new UI/modules unless the change is genuinely required and the consequences are understood.
- **Keep core logic decoupled from the rendering layer** so the Unity port stays feasible. New simulation code belongs in `src/physics/` (or a parallel pure-JS module), not inside R3F components.
- **VR canvases:** no `document.getElementById` or direct DOM manipulation; use `react-xr` events/refs. Clean up XR/A-Frame components on toggle-off to avoid leaks.
- **Plan vs Code phases:** during planning, no code is written; during coding, code must be written.

## Conventions worth knowing

- React 19, function components only. ESLint warns on unused vars (uppercase-prefixed names are exempt) and on react-refresh boundary violations.
- Modules are code-split via `React.lazy` in `App.jsx`. New top-level modules should follow the same lazy pattern.
- Theme is persisted to `localStorage` under `novalab-theme`.
- HTTPS dev: `vite.config.js` reads certs from `certs/localhost-{cert,key}.pem` only when `NOVALAB_HTTPS=true`. The `dev:https` script first runs `scripts/ensure-dev-port-free.mjs` to fail fast if 5173 is occupied.
- The repo currently contains an in-progress refactor (Domain Driven layout per the latest commit). When touching `src/components/`, check `git status` before assuming a file's location is canonical.

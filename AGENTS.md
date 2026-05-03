## 1. Project Vision and Scope
NovaLab is an educational technology platform focusing on interactive digital laboratory experiences. This repository contains the Frontend MVP. This repository focuses more on selling the idea rather than making a fully functional product. The idea is to make a fun and engaging platform for kids to learn about physics and other sciences. It should be easy to use and understand, with a focus on visual learning and hands-on experimentation. We already have many modules included, such as a 2D constructor, 3D constructor, with a car, rocket, and water modules. We also added 7th grade physics program and a few other modules with fun physics experiments.
* **Primary Application:** Web-based digital laboratory.
* **Current Phase:** Frontend-only MVP. There is no active backend database; all state is managed locally or via mock data.

## 2. Technology Stack
* **Core Framework:** React (Functional components, Hooks).
* **3D Engine/Rendering:** Three.js (Handles the interactive laboratory environments). We also added XR/VR capabilities using A-Frame and React-xr.

## 3. Industry Standard Architectural Rules
To maintain code quality and ensure scalability, all code generated must adhere to strict industry standards:
* **Modular Component Design:** Keep components small, single-responsibility, and reusable. Strongly isolate Three.js canvas logic from standard React UI overlays.
* **Decoupled Logic:** Given the roadmap includes migrating the platform from Three.js to a standalone Unity application, keep the core business logic as decoupled from the current rendering layer as possible to ease the future port.
* **State Management:** Utilize standard React Hooks (`useState`, `useRef`, `useEffect`). Do not introduce complex state containers (like Redux or Zustand) unless absolutely necessary for the specific feature.

## 4. Agent & "Vibe-Coding" Guardrails
These rules are strict boundaries to prevent regressions when non-technical team members use AI to generate new features:
* **No Core Mutations:** Do NOT modify existing, working features, core routing, or main layout wrappers while generating new UI components or modules unless otherwise prompted or it is required for the feature itself, and you have full understanding of the consequences.

## 5. Coding Style & Formatting
* Use clear, descriptive variable names.
* Add standard comments explaining the "why" behind complex Three.js mathematics, camera movements, or object interactions.
* Ensure all components return semantic HTML elements where applicable.

## 6. VR Mode Rules
* **Strict Component Isolation:** NEVER modify the existing `src/components/Car3DConstructor/Car3DConstructor.jsx`. 
* **No Direct DOM Access:** Avoid using `document.getElementById` or direct DOM manipulation for the VR canvas. Use `react-xr` event handlers and refs.
* **Performance:** Ensure `aframe` components are properly cleaned up when the VR mode is toggled off to prevent memory leaks.

## 7. Workflow
* **During Plan phase** Never ever write lines of code. This phase is only for planning and high level architecture decisions. 
* **During Code phase** You MUST write lines of code.

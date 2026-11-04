# Rain on Glass — implementation instructions

- Read README.md before changing simulation or rendering.
- Keep Simulation (pure TypeScript), Rendering (Canvas 2D), and Controls separate.
- Preserve fixed-step determinism, volume/momentum conservation on merge, and stationary small drops.
- Rain amount controls nucleation/condensation, never a direct fall-speed multiplier.
- Use spatial partitioning for collisions, bound drops/trails/cache, and release removed drops' cached images.
- Preserve CPU-only rendering, procedural backgrounds, keyboard controls, pause, fullscreen, and responsive sizing.
- Write concise Japanese overview comments for models, functions, and methods.
- Run `npm test` and `npm run build`. Check temporal behavior in a browser when changing physics/rendering; report unverified platforms explicitly.
- Keep deploy configuration compatible with `/just-idea/rain-on-glass/` and existing apps.
- Do not merge or deploy without user authorization. Use sub-agents only on explicit user request.

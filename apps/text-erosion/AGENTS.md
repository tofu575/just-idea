# Text Erosion — implementation instructions

- Read README.md before changing the algorithm.
- Use TypeScript, Canvas 2D, CSS, and Vite. Do not add a UI framework or remote services.
- Keep rasterization, rendering, controls, and pure erosion calculations separate.
- Preserve seeded determinism, monotonic pixel loss, and erosion reachable from existing background boundaries.
- Keep computation resolution bounded and run precomputation in a Worker, never on every slider input.
- Keep Japanese/English text, Japanese IME, empty input, keyboard controls, and PNG export working.
- Run `npm test` and `npm run build` after changes. Include invariant tests for algorithm changes.
- Write concise Japanese overview comments before models, functions, and methods.

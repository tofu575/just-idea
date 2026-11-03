# chroma-jack — Codex instructions

## Project overview

`chroma-jack` is a game prototype in which players judge colors visually and try to
move the current color toward white. Players draw color cards and choose whether to
add or discard them; exceeding the limit of any RGB component causes a burst.

The prototype should validate whether color-only decisions are enjoyable, whether
approaching white feels rewarding, whether bursting creates tension, and whether
the game remains understandable without numeric values.

## Sources of truth

- Read `README.md` and relevant files under `docs/` before changing behavior.
- Treat the repository as an early prototype. Do not assume a framework, language,
  deployment target, or architecture until it is established by the codebase or the
  user.
- Preserve the color-first, intuition-driven experience. Avoid exposing RGB values
  or other numeric hints unless the user explicitly requests them.

## Working rules

- Learn implementation details from the repository before asking the user.
- Frame non-trivial work with its purpose, non-goals, done criteria, and likely
  impact area.
- Keep changes small and preserve existing behavior outside the requested scope.
- Name functions with verbs and types/components with nouns. Avoid vague names such
  as `data`, `info`, and `file` when a domain-specific name is available.
- Validate values that could cause an error before using them. Keep secrets and
  environment-specific endpoints out of source code.
- Follow the architecture and conventions already established by the project. When
  introducing a new convention, document the reason and avoid premature abstraction.
- Separate state transitions and side effects from rendering when the selected UI
  framework supports that separation.
- Split UI components by reason to change, not merely by appearance. Prefer
  component extraction when a unit has multiple responsibilities or independent
  interaction behavior.
- When a constructor needs three or more arguments, accept one object argument with
  descriptive property names so each value's meaning is clear at the call site.
- Treat comments as context for responsibility, constraints, and non-obvious intent,
  not as compensation for unclear code. Rename ambiguous identifiers and improve the
  structure when their meaning would otherwise require a clarifying comment.

## Domain modeling rules

- Represent validated domain values with value objects instead of passing raw
  primitives and repeating validation at call sites.
- Avoid project-specific `Error` classes and generic Rust-inspired `Result<T, E>`
  abstractions. Represent expected validation failures and business outcomes with
  small, domain-specific enums and discriminated unions.
- Reserve thrown built-in errors for violated programmer invariants or unexpected
  failures; do not use exceptions for expected game outcomes such as a burst.
- Put business logic on the domain model that owns the rule. Do not add standalone
  domain functions when the behavior naturally belongs to a model method.
- A hand owns card addition and burst decisions. Preserve the color produced by a
  bursting addition in the domain state so it can be inspected later, even when the
  current UI intentionally continues to show the pre-burst color.
- Organize domain models into cohesive folders as complexity grows. Prefer folders
  such as `color`, `hand`, `game`, and `shared`, while adjusting granularity to the
  actual responsibilities rather than enforcing a fixed depth.
- Write concise Japanese overview comments immediately before models, functions,
  and methods. Document what each enum represents and what every enum member means.
  Focus comments on responsibility, constraints, and non-obvious intent; do not add
  line-by-line narration for behavior that is already clear from the code. Prefer
  `//` line comments; use block comments only when a genuinely multi-line explanation
  is necessary.

## Verification and review

- Run the narrowest relevant checks after edits. If no automated checks exist,
  inspect the changed behavior and state what could not be verified.
- Use reviewer or other sub-agents only when the user explicitly requests an agent
  review or parallel work. Do not start `quality_reviewer`, `user_reviewer`,
  `security_reviewer`, or any other sub-agent automatically based on the change type.
- When the user explicitly requests multiple review viewpoints, select only those
  justified by the change and deduplicate overlapping findings.
- Report concrete regressions and user impact before stylistic observations.

## Safety

- Do not deploy, publish, apply infrastructure changes, or perform destructive
  operations without explicit user authorization.
- Gather related approval needs into one request when practical.

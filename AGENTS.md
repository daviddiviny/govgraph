# AGENTS.md

This file defines how coding agents should operate in this repository.

Follow these instructions unless the user explicitly overrides them.

## Purpose

This is a production web application built on a standard house stack.

Agents must optimise for:

1. Correctness
2. Clarity
3. Maintainability
4. Consistency with the house stack
5. Simplicity
6. Performance

Do not optimise for speed of implementation at the expense of code quality or architectural coherence.

---

## House Stack

Use this stack by default. Do not introduce alternatives unless the user explicitly approves them.

| Layer | Standard |
|---|---|
| Language | TypeScript |
| Frontend | Next.js (App Router) |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui-style shared components in `packages/ui` |
| API | Hono |
| Validation | Zod |
| Database | PostgreSQL |
| ORM | Drizzle ORM |
| Auth | Better Auth |
| Background Jobs | Trigger.dev |
| File Storage | S3-compatible object storage |
| AI SDK | Claude Agent SDK or OpenAI SDK behind service boundaries |
| Testing | Vitest, Testing Library, Playwright |
| Package Manager | pnpm |
| Monorepo | pnpm workspaces + Turborepo |

### Rules

- Do not introduce Prisma
- Do not introduce tRPC
- Do not introduce Redux
- Do not introduce React Query unless explicitly approved
- Do not introduce CSS-in-JS
- Do not introduce a second ORM or validation library
- Do not mix multiple UI component systems
- Do not bypass the monorepo structure with ad hoc local patterns

If the repository already uses this stack, stay within it.
If the repository diverges, do not “helpfully” add a second pattern.

---

## Standard Repository Shape

Use this structure unless the repo already has a deliberate equivalent:

```text
/
├── apps/
│   ├── web/                # Next.js frontend
│   ├── api/                # Hono API
│   └── worker/             # Trigger.dev jobs or background workers
├── packages/
│   ├── db/                 # Drizzle schema, migrations, repositories
│   ├── ui/                 # Shared UI components
│   ├── domain/             # Shared domain types and logic
│   ├── config/             # Shared tsconfig, lint, tooling config
│   └── lib/                # Shared utilities that are genuinely cross-app
├── docs/
├── AGENTS.md
├── pnpm-workspace.yaml
└── turbo.json
````

### Structure Rules

* Put frontend code in `apps/web`
* Put transport/API code in `apps/api`
* Put async/background code in `apps/worker`
* Put schema and persistence code in `packages/db`
* Put reusable components in `packages/ui`
* Put shared business types and domain helpers in `packages/domain`
* Do not put business logic in `packages/ui`
* Do not put database code in `apps/web`
* Do not create vague packages like `packages/shared` or `packages/common` without a precise reason

---

## Non-Negotiable Rules

* Do not invent requirements
* Do not introduce parallel patterns when one already exists
* Do not preserve dead code
* Do not add backward-compatibility layers unless explicitly requested
* Do not change public interfaces without explicit approval
* Do not bypass validation at system boundaries
* Do not put business logic in UI components, route handlers, or agent wrappers
* Do not use `any`, unchecked casts, or non-null assertions unless there is no reasonable alternative
* Do not add dependencies when existing house-stack tools solve the problem
* Do not create large temporary abstractions that are likely to become permanent

When in doubt, choose the more explicit, typed, and testable design.

---

## Architecture

Use this mental model:

* `UI` for presentation and interaction
* `API` for transport and request handling
* `Services` for application use cases
* `Domain` for business concepts and rules
* `Persistence` for database access
* `Infrastructure` for external systems

Keep these concerns separate.

### Route Handlers

Route handlers must be thin.

They may:

* parse requests
* validate inputs
* call services
* map results to HTTP responses

They must not:

* contain core business logic
* perform ad hoc database access
* embed complex transformation pipelines
* contain branching rules that belong in services

### Services

Services own use-case logic.

They should:

* orchestrate repositories and infrastructure
* enforce business rules
* manage transactions where needed
* return typed results

They should not:

* know about UI concerns
* depend on framework request objects unless unavoidable
* perform raw request parsing
* contain presentation logic

### Repositories

Data access must be centralised.

Rules:

* no direct database access from UI code
* no direct database access from route handlers
* no scattered raw queries across the codebase
* keep query logic in repository or query modules
* make transactional boundaries explicit

### Domain

Domain concepts must be explicit.

If the application has important states, permissions, lifecycle rules, or invariants, encode them directly in:

* types
* Zod schemas
* database constraints
* tests

Do not leave critical business rules implicit in comments.

---

## TypeScript Rules

TypeScript is mandatory. Use strict mode assumptions.

### Rules

* no `any`
* no non-null assertions
* no casual `as` casting
* prefer discriminated unions over loose optional objects
* derive types from Zod schemas where practical
* handle `null` and `undefined` explicitly
* prefer narrow domain types over broad objects
* prefer readonly inputs where useful
* prefer pure functions where possible

Prefer this pattern:

```ts
type Result<T, E = Error> =
  | { success: true; data: T }
  | { success: false; error: E }
```

Do not return ambiguous shapes like:

```ts
type BadResult<T> = {
  data?: T
  error?: string
}
```

---

## Validation Rules

Zod is the default validation layer.

Validate all external or untrusted data at the boundary, including:

* HTTP requests
* form submissions
* webhook payloads
* environment variables
* file contents
* external API responses
* LLM / agent outputs

Rules:

* define schemas once
* reuse schemas across validation and typing
* fail fast on invalid input
* never persist unvalidated structured output
* never trust external JSON without validation

---

## Database Rules

PostgreSQL + Drizzle is the standard.

### Rules

* define schema deliberately before implementation
* keep schema in `packages/db`
* use Drizzle schema files as the source of truth
* generate and review migrations
* keep migrations committed
* use constraints to protect invariants
* add indexes based on actual access patterns
* model lifecycle state explicitly
* prefer join tables over denormalised shortcuts when relationships matter

### Do Not

* do not query the database directly from UI code
* do not hide persistence logic inside random services
* do not mix Drizzle with another ORM
* do not skip migrations by relying on manual database edits
* do not leave important integrity rules only in application code if the database can enforce them

---

## API Rules

Hono is the standard API layer.

### Rules

* define request and response schemas first
* validate inputs with Zod
* keep handlers thin
* delegate business logic to services
* return predictable error shapes
* version APIs deliberately when needed
* keep transport concerns separate from domain concerns

Do not build business logic directly into route files.

---

## Frontend Rules

Next.js App Router is the standard frontend framework.

### Rules

* default to server-first data loading where appropriate
* use client components only when interactivity requires them
* keep page files thin
* move reusable UI into `packages/ui`
* move domain logic out of React components
* prefer composition over deeply nested prop plumbing
* keep forms explicit and typed

### State Management

Default rules:

* use React state for local UI state
* use server state through the app’s own API/services
* use Zustand only for genuine shared client-side interaction state
* do not introduce Redux
* do not introduce extra state libraries without approval

If plain React state is enough, use it.

---

## UI Rules

Tailwind is the default styling approach.
Reusable components belong in `packages/ui`.

### Rules

* prefer shared primitives over one-off component patterns
* keep components small and single-purpose
* make state visible without hover
* preserve accessibility and keyboard support
* use semantic HTML first
* use design tokens or standardised classes, not arbitrary styling chaos
* keep visual patterns consistent across apps

### Do Not

* do not mix Tailwind with CSS-in-JS
* do not add another component library unless explicitly approved
* do not create wrappers with no clear value
* do not bury business logic inside presentational components

---

## Auth Rules

Better Auth is the default authentication approach.

### Rules

* keep auth logic centralised
* apply authorisation checks at trust boundaries
* do not rely on UI-only permission checks
* keep session and identity handling explicit
* separate authentication from authorisation

If a route or action changes protected data, enforce permissions server-side.

---

## Background Jobs

Trigger.dev is the default background job system.

Use background jobs for:

* long-running processing
* retries
* scheduled tasks
* non-interactive async workflows
* expensive AI or file-processing work

Rules:

* make jobs idempotent where possible
* validate job payloads
* log enough context to debug failures
* keep retry semantics deliberate
* do not block request/response cycles with work that belongs in jobs

---

## AI and Agents

If the product uses LLMs or agents, treat them as bounded subsystems.

### Rules

* agents are stateless by default
* agents must not write directly to the database unless explicitly designed to do so
* agents must operate through controlled tools or service boundaries
* all structured outputs must be validated before use
* prompts must be auditable and versionable
* do not rely on implicit conversation memory unless intentionally passed in
* do not put core business rules only in prompts

### Recommended Pattern

* service prepares context
* agent is invoked with explicit inputs
* agent returns structured output
* result is validated with Zod
* service persists or rejects result

### Never Do This

* trust model output without validation
* let agents mutate arbitrary data directly
* hide business-critical rules inside prompts
* allow agent tools to bypass permission checks

If behaviour matters, encode it in code and schemas.

---

## Error Handling

Handle errors deliberately.

Rules:

* do not swallow errors
* distinguish validation, domain, auth, and infrastructure errors
* return useful structured errors
* log enough context to debug
* do not leak secrets or internals in user-facing responses

Prefer typed or structured errors over string matching.

---

## Testing Standard

Testing is mandatory for meaningful changes.

### Standard Stack

* Vitest for unit and integration tests
* Testing Library for component tests
* Playwright for end-to-end tests

### Minimum Expectations

Add or update tests when changing:

* business rules
* state transitions
* repositories or queries
* API contracts
* permissions
* parsing logic
* agent output schemas
* critical UI flows

### Test Rules

* test behaviour, not implementation trivia
* include unhappy paths
* keep tests readable
* use realistic fixtures
* mock only where isolation is necessary
* co-locate tests with the code where practical

---

## Security Defaults

Treat security as a baseline requirement.

Rules:

* never hardcode secrets
* never log secrets or credentials
* validate all external inputs
* treat uploads and webhooks as hostile until validated
* apply authorisation checks at trust boundaries
* use least privilege for integrations
* make destructive operations auditable where relevant

---

## Performance Defaults

Do not prematurely optimise, but do avoid obvious inefficiencies.

Watch for:

* N+1 queries
* repeated expensive parsing
* repeated model calls
* over-fetching
* redundant network round trips
* unbounded list rendering
* blocking work in request paths that belongs in jobs

Optimise where the bottleneck is real and material.

---

## File and Function Size

Use these defaults:

* prefer files under 300 lines
* prefer functions under 50 lines
* keep components focused on one job
* split files when responsibilities diverge
* avoid giant `utils` modules
* avoid giant route files
* avoid giant React components with mixed concerns

These are defaults, not laws. Break them only for a good reason.

---

## Naming

Use names that reflect the domain.

Rules:

* prefer descriptive names over short names
* avoid vague names like `data`, `helper`, `manager`, `stuff`, `misc`
* name by responsibility, not implementation detail
* use one term consistently for one concept across the repo

Good names reduce bugs.

---

## Comments and Documentation

Comment only where it adds value.

Good comments explain:

* why something exists
* why a trade-off was chosen
* why a constraint matters
* why an unusual implementation is correct

Do not write comments that restate obvious code.
Delete stale comments.
Keep docs aligned with the code.

---

## Preferred Change Process

When implementing a change:

1. Understand the use case and affected boundaries
2. Identify the domain model and invariants
3. Update schemas and types first
4. Implement service logic
5. Wire transport and UI
6. Add or update tests
7. Remove superseded code
8. Check observability and error handling

Do not start by patching the UI if the real change belongs in the domain or service layer.

---

## What To Do When the Codebase Is Messy

If the codebase contains multiple competing patterns:

* prefer the pattern that is more explicit, typed, and testable
* consolidate toward one approach
* do not introduce a third pattern
* do not preserve obsolete abstractions unless required for a staged migration

Improve the local area you touch, but do not perform broad unrelated rewrites unless requested.

---

## Definition of Done

A change is done only when it is:

* correct
* typed
* validated
* tested appropriately
* consistent with the house stack
* consistent with the repository architecture
* free of dead code introduced or revealed by the change
* understandable by the next maintainer

---

## Local Overrides

Nested `AGENTS.md` files may add tighter rules for a subdirectory.

Precedence order:

1. explicit user instruction
2. nested local `AGENTS.md`
3. this file

If rules conflict, follow the highest-precedence instruction.

---

## Project-Specific Section

Fill this in at project start and keep it current.

### Product Summary

[One short paragraph describing the app, users, and core job to be done.]

### Core Entities

* [Entity]
* [Entity]
* [Entity]

### Critical Constraints

* [Constraint]
* [Constraint]
* [Constraint]

### Required Integrations

* [Integration]
* [Integration]

### Forbidden Product-Specific Patterns

* [Pattern]
* [Pattern]

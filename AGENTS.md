# AGENTS

This repository is now the **Quality Works Light** product application, built on top of the shared Quality WorX platform foundation. It is no longer a neutral, product-agnostic template. AI agents and contributors should build real product features here.

## Core Rules

1. This repo is a real, shipping product (Quality Works Light) — product-specific pages, business workflows, and domain features are expected and encouraged.
2. Swedish-language UI is the primary/default locale for this product. Write user-facing copy in Swedish unless a feature explicitly requires another language.
3. Domain models and feature logic for Quality Works Light (e.g. Onboarding, Quality Plan, Work Environment Plan, Risk Assessment, Environmental Inspection, Self Inspection, Control Plan, Document Management, ISO Manual) belong here and should be implemented as real, working features.
4. Continue to reuse and extend the existing design token system, layout shells, and UI primitives rather than duplicating or forking them — shared architecture still matters, it just now serves this specific product.
5. Update documentation whenever product structure, features, or conventions change.

## Preferred Contribution Shape

- build product-specific pages and flows for Quality Works Light
- implement domain models and business workflows
- add Swedish UI copy and localization
- extend shared primitives and layouts when a product need arises
- refine design tokens as the product's visual needs evolve
- improve accessibility
- improve documentation
- improve developer experience for this product's team

## Guidance

- Product pages, forms, and domain-specific data models are allowed and expected — this is the application, not a starter kit.
- When adding new UI primitives or layout shells, prefer designing them so they remain reusable if practical, but do not block product delivery for the sake of theoretical reuse by other products.
- Keep additions aligned with the existing design token system and layout strategy unless a product requirement calls for a deliberate change.

## When Adding New Code

Ask:

- does this serve a real Quality Works Light product need?
- is Swedish UI copy used where appropriate?
- does this belong in `ui`, `common`, `layout`, or product-specific code?
- does the documentation still match the implementation?

Product value for Quality Works Light is now the primary bar — not neutrality for hypothetical future products.

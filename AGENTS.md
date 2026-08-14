# AGENTS

This repository is the Quality WorX Light product application, built on shared Quality WorX foundations. AI agents and contributors should preserve the product intent while keeping reusable patterns maintainable.

## Core Rules

1. Treat this repository as the Quality WorX Light product application, not only as a template.
2. Product pages, Swedish UI, domain models, business workflows, and product-specific feature logic are allowed when they support Quality WorX Light.
3. Prefer reusable architecture and composable UI where it does not conflict with clear product requirements.
4. Update documentation whenever product structure, shared conventions, or workflows change.
5. Keep additions aligned with the design token system, accessibility standards, and layout strategy.

## Preferred Contribution Shape

- build and improve Quality WorX Light product pages and workflows
- support the Swedish product UI and navigation
- improve shared primitives and layouts
- refine design tokens and accessibility
- document product structure and reusable conventions
- keep the codebase ready for future Quality WorX product evolution

## Avoid

- unrelated product concepts that do not support Quality WorX Light
- placeholder domain entities presented as completed functionality
- hardcoded decisions that make legitimate product evolution unnecessarily difficult
- removing product behavior merely to preserve template neutrality

## When Adding New Code

Ask:

- does this support a current or planned Quality WorX Light experience?
- can the implementation be reusable without obscuring the product domain?
- does the naming fit the Swedish UI and Quality WorX terminology?
- does the documentation still match the implementation?

Product-specific code belongs here when it is part of the Quality WorX Light application.

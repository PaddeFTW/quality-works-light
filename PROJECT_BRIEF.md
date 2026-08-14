# Project Brief

## Purpose

Build Quality WorX Light, a product application for guided quality work experiences.

This repository uses shared Quality WorX foundations while allowing product pages, Swedish UI, and domain-specific workflows and features.

This repository exists to provide the product with a strong baseline for:

- architecture
- user interface standards
- design tokens
- layout composition
- documentation practices
- developer onboarding

## What This Repository Is

- the Quality WorX Light product application
- a Swedish-language quality work experience
- a product with real pages, navigation, workflows, and domain features
- a design-system-aligned frontend using reusable shared foundations
- a documented reference for future Quality WorX product evolution

## What This Repository Is Not

- only a reusable starter template
- a neutral shell with product behavior intentionally removed
- a prohibition against product-specific pages, domain models, or process logic
- a collection of mock workflows presented as completed functionality

## Product Families That Will Build on Top

Examples include:

- Onboarding
- Quality Plan
- Work Environment Plan
- Risk Assessment
- Environmental Inspection
- Self Inspection
- Control Plan
- Document Management
- ISO Manual

## Platform Goals

1. Give every team the same high-quality starting point.
2. Reduce repeated setup work across future repositories.
3. Encourage visual consistency across the Quality WorX platform.
4. Keep foundational code clean, neutral, and scalable.
5. Separate platform concerns from product concerns early.

Future product decisions should follow `docs/QUALITY_WORX_PRODUCT_PRINCIPLES.md`, which defines Quality WorX Product Principles v2.0 and the platform direction toward guided work experiences.

## Success Criteria

The template is successful when a future team can clone it and immediately inherit:

- a premium SaaS-grade visual baseline
- a clean folder structure
- reusable layout shells
- reusable UI primitives
- a semantic theme and token system
- clear extension guidance

## Product Direction

- product pages and workflows are allowed and expected
- the primary UI is Swedish unless a feature explicitly requires another language
- domain-specific forms, models, and process logic are allowed when they support Quality WorX Light
- current product surfaces include `/login`, `/skapa-konto`, `/`, and `/manual`
- the Swedish sidebar and manual structure are part of the product experience
- avoid mock workflows presented as completed functionality

## Long-Term Role

This repository is the canonical Quality WorX Light product application and may continue to evolve with its domain. Shared foundations should remain reusable where practical, but product clarity and working Quality WorX experiences take precedence over template neutrality.

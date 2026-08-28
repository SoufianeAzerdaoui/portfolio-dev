# Projects Data Layer

This folder contains the local Project domain model and repository used before
the future Supabase migration.

## Where To Add Projects

Add only real, verified projects in:

`src/features/projects/data/projects.ts`

Keep `PROJECTS` as the single source of truth. UI components must read projects
through query functions instead of importing `PROJECTS` directly.

## Required Project Fields

Each project must include:

- `id`
- `slug` in lowercase kebab-case
- `status`
- `domain`
- `content.fr.title`
- `content.fr.shortDescription`
- `categories`
- `technologies`
- `coverImage` or `null`
- `gallery`
- `links`
- `featured`
- `featuredOrder`
- `publishedAt`

When provided, dates are ISO strings, not `Date` objects, so data stays
serializable across Server and Client Components. Do not invent `createdAt`,
`updatedAt`, or `publishedAt` when the real date is unknown.

Use optional `searchKeywords` only for real, documented project terms that
should be searchable but should not be displayed as UI metadata.

## Primary Domain vs Technical Categories

Each project has exactly one primary `domain`, used by the public `/projects`
filter navigation:

- `ai-ml`
- `data-analytics`
- `data-engineering`
- `software-engineering`

The `categories` array remains the technical tag list shown on project cards
and indexed by search. Do not derive `domain` automatically from categories:
choose the dominant project axis explicitly.

## Status

- `draft`: hidden from public pages.
- `published`: visible on Home and `/projects`.
- `archived`: hidden from public pages.

## Featured Projects

Home uses `getFeaturedProjects(3)`, which returns only published projects with:

- `featured: true`
- sorted by `featuredOrder` ascending

Use `featuredOrder: null` for non-featured projects.

## Localization

French content is required:

`content.fr`

English is optional:

`content.en`

`getProjectContent(project, locale)` falls back to French when the requested
locale is not available.

## Public Queries

Use these public query functions:

- `getPublishedProjects()`
- `getFeaturedProjects(limit)`

The current implementation uses `LocalProjectRepository`. A future
`SupabaseProjectRepository` can implement the same contract without changing UI
components.

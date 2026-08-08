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

## Status

- `draft`: hidden from public pages.
- `published`: visible on Home, `/projects`, and the future `/projects/[slug]`.
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
- `getProjectBySlug(slug)`

The current implementation uses `LocalProjectRepository`. A future
`SupabaseProjectRepository` can implement the same contract without changing UI
components.

# Implementation order – Quality Works Light

Smartest sequence for closing the remaining gaps.

## Status 2026-08-22

| Gap | Status |
|-----|--------|
| Backend/DB schema | Schema ready (`supabase/schema.sql`) |
| Domain types | Done (`types/domain.ts`) |
| Manual version history UI | Done (client-side) |
| Real file picker (bilagor) | Done (local File, ready for Storage) |
| Export PDF / print | Done (print + HTML download) |
| Export Word | Basic HTML download |
| Dela / granskning UI | Exists (mock) |
| Auth + multi-tenant runtime | Not wired – needs Supabase project |
| Supabase Storage bilagor | Not wired |
| E-postnotiser | Not started |
| Ritverktyg | Not started |

## Order

### 1. Supabase project (you)
1. Create project at supabase.com
2. Run `supabase/schema.sql` in SQL Editor
3. Copy URL + anon key to `.env.local` (see `.env.example`)
4. Enable Email auth in Supabase Auth settings

### 2. Auth + multi-tenant
- Install `@supabase/supabase-js` + `@supabase/ssr`
- Wire `/login` and `/skapa-konto` to Auth + `organizations` / `organization_members`
- First user = `admin`
- Middleware protects app routes

### 3. Persist Manual
- Save drafts, settings, publish → `document_versions`
- Load tree + versions from DB
- Kvittera → acknowledgement table (optional extension)

### 4. Attachments → Storage
- Bucket `manual-attachments`
- Upload/download via signed URLs
- Replace local File mock

### 5. Review + share
- Persist `review_requests`
- Optional: Resend/Supabase Edge Function for e-mail

### 6. Stronger export
- Server PDF (e.g. `@react-pdf/renderer` or Puppeteer) if print CSS is not enough
- Real `.docx` via `docx` library if needed

### 7. Drawing / process diagrams
- Last: e.g. Excalidraw or tldraw embed in Manual

## Why this order

Auth and DB first – everything else depends on organisation context and persistence.
Manual is the product heart: versions + files next.
Export and drawing do not block core workflows.

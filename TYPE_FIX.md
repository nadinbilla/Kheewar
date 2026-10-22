# TypeScript build fix

This revision explicitly types the `cookiesToSet` argument in both Supabase server cookie adapters. This addresses TypeScript's `noImplicitAny` error reported by Vercel at `lib/supabase/server.ts:16` and prevents the same issue in the middleware session helper.

Changed files:
- `lib/supabase/server.ts`
- `lib/supabase/update-session.ts`

After replacing these files in your repository, commit and redeploy. A full `next build` could not be run in this environment because dependency installation timed out, so the Vercel build still needs to be verified.

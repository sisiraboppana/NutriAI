# NutriAI

## Local development

Run the app with:

```bash
npm install
npm run dev
```

The Vite dev server should be available at `http://localhost:8080`.

## Google login on localhost

The app now uses Supabase's native Google OAuth flow for local sign-in. To make Google login work outside Lovable preview, you need both of these configured in your Supabase project:

1. In `Supabase Dashboard -> Authentication -> URL Configuration`, add:
   - `http://localhost:8080/auth`
2. In `Supabase Dashboard -> Authentication -> Providers -> Google`, make sure your Google OAuth app includes Supabase's callback URL:
   - `https://qagexcflwcuisqcamlpi.supabase.co/auth/v1/callback`

If your local dev server uses a different port, replace `8080` with that port in the allowed redirect URL.

# amayra-backend

Express + MongoDB (Mongoose) API with JWT auth (access token in response body, refresh token in httpOnly cookie).

## Setup

```bash
cd amayra-backend
npm install
cp .env.example .env   # fill in MONGO_URI and generate real JWT secrets
npm run dev
```

Runs on `http://localhost:5000` by default. Health check: `GET /api/health`.

## Endpoints

| Method | Path              | Auth       | Body                          |
|--------|-------------------|------------|--------------------------------|
| POST   | /api/auth/signup  | none       | `{ name, email, password }`    |
| POST   | /api/auth/login   | none       | `{ email, password }`          |
| POST   | /api/auth/refresh | cookie     | —                               |
| POST   | /api/auth/logout  | none       | —                               |
| GET    | /api/auth/me      | Bearer     | —                               |

## Frontend integration (amayra project)

1. Drop the contents of `amayra-frontend-additions/` into your `src/` folder:
   - `routes/login.tsx`, `routes/signup.tsx` → `src/routes/`
   - `lib/api.ts` → `src/lib/`
   - `hooks/useAuth.tsx` → `src/hooks/`
2. Wrap your root route component with `<AuthProvider>` (from `useAuth.tsx`).
3. Add `VITE_API_URL=http://localhost:5000/api` to your frontend `.env`.
4. Protect routes client-side by checking `useAuth().user` (redirect to `/login` if null once `isLoading` is false); protect API routes server-side with `requireAuth`.

## Notes / next steps

- CORS is locked to `CLIENT_URL` in `.env` — update it for your deployed frontend origin(s).
- Rate limiting is applied to `/signup` and `/login` (20 requests / 15 min per IP) — tune for your traffic.
- To invalidate all of a user's refresh tokens (e.g. on password change), bump `refreshTokenVersion` and check it in `refresh()` — not wired in yet, since it wasn't required for a base login/signup flow, but the field is already on the model.
- Add a `password reset` flow (email + reset token) whenever you're ready — same pattern as signup/login, new controller + routes.

# React Frontend

This folder contains the React, TypeScript, and Vite frontend. See the [project README](../README.md) for full-stack setup, environment variables, CORS, API details, and verified checks.

## Local commands

```powershell
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm ci
npm run dev -- --host 127.0.0.1 --port 5175 --strictPort
```

The browser API base is configured with `VITE_API_BASE_URL` in `.env`. Do not put an admin token or other secret in a `VITE_` variable; the admin key is entered at runtime.

Checks:

```powershell
npm run lint
npm run build
```

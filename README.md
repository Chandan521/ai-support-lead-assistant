<<<<<<< HEAD
﻿# DroneTV AI Support & Lead Assistant

A React and TypeScript web application for service/course information, a rule-based support chatbot, validated enquiries, and a protected admin dashboard. The browser communicates with a Laravel JSON API; it does not connect to the database directly.

> Service, course, and response-time descriptions in the interface are demonstration content. Verify them with an approved DroneTV source before presenting them as official information.

## Features

- Responsive landing page, services and training sections, enquiry form, and chatbot.
- Form validation in the browser and API; successful submissions are stored as enquiries.
- Rule-based chatbot with suggested prompts, fallback responses, and a clear-chat action. It is not an LLM.
- Admin enquiry listing, search/filter, pagination, details, status updates, and confirmed deletion.
- Server-side admin-token middleware for all admin endpoints; public enquiry submission remains unauthenticated.

## Technology

- React 19, TypeScript 6, Vite 8, custom CSS.
- PHP 8.3+, Laravel 13, Eloquent, and Laravel migrations.
- MySQL for the verified local runtime.
- PHPUnit/Laravel tests; ESLint and TypeScript/Vite production build.

## Project layout

```text
frontend/             React app, API helper, lockfile, and public assets
backend-laravel/      Laravel API, configuration, migrations, tests, Composer lockfile
docs/                 API/database setup, manual test plan, walkthrough, interview notes
scripts/              Safe source archive script
README.md             Project setup and usage
```

## Prerequisites

- PHP 8.3 or newer and Composer 2.
- PHP PDO MySQL driver (`pdo_mysql`) and Laravel-required PHP extensions.
- MySQL server and a database/application account with migration and runtime access.
- Node.js `^20.19.0 || >=22.12.0` and npm.

## Setup

### 1. Prepare MySQL

Create a local database and a dedicated application account. Example only; replace the password locally and do not commit it:

```sql
CREATE DATABASE dronetv_assistant
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'dronetv_app'@'127.0.0.1'
  IDENTIFIED BY 'REPLACE_WITH_A_RANDOM_LOCAL_PASSWORD';
GRANT ALL PRIVILEGES ON dronetv_assistant.* TO 'dronetv_app'@'127.0.0.1';
```

Use the MySQL administrator to apply least privilege appropriate to local migrations and normal application reads/writes. Host matching depends on your MySQL setup.

### 2. Configure and run the backend

In a PowerShell terminal:

```powershell
Set-Location .\backend-laravel
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
composer install
php artisan key:generate
```

Edit `backend-laravel\.env` locally. Set `DB_CONNECTION=mysql`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, and `DB_PASSWORD` to your own MySQL values. Set a strong private `ADMIN_API_TOKEN`. Do not share or commit `.env`.

Then check and apply migrations (do not run a destructive reset against data you need):

```powershell
php artisan config:clear
php artisan migrate:status
php artisan migrate
php artisan migrate:status
```

Start Laravel and leave this terminal running:

```powershell
php artisan serve --host 127.0.0.1 --port 8000
```

### 3. Configure and run the frontend

In a second PowerShell terminal:

```powershell
Set-Location .\frontend
if (-not (Test-Path .env)) { Copy-Item .env.example .env }
npm ci
npm run dev -- --host 127.0.0.1 --port 5175 --strictPort
```

Open `http://127.0.0.1:5175`. The frontend `.env.example` sets `VITE_API_BASE_URL=http://127.0.0.1:8000`. Keep both servers running. If you change the frontend port, add the exact origin to backend `CORS_ALLOWED_ORIGINS`, clear Laravel's config cache, and restart Laravel.

## Environment variables

| Variable | Location | Purpose |
|---|---|---|
| `APP_KEY` | Backend `.env` | Laravel application key (`php artisan key:generate`) |
| `APP_ENV`, `APP_DEBUG`, `APP_URL` | Backend `.env` | Runtime environment, debug mode, and backend URL; disable debug outside local development |
| `DB_CONNECTION`, `DB_HOST`, `DB_PORT`, `DB_DATABASE`, `DB_USERNAME`, `DB_PASSWORD` | Backend `.env` | Private MySQL connection settings |
| `ADMIN_API_TOKEN` | Backend `.env` | Private shared admin key; choose a strong random value |
| `CORS_ALLOWED_ORIGINS` | Backend `.env` | Comma-separated allowed browser origins |
| `VITE_API_BASE_URL` | Frontend `.env` | Public API base URL; never store secrets in `VITE_` values |

Both `.env.example` files contain setup values/placeholders, not working credentials. The frontend has no admin-token environment variable; the admin enters the key at runtime.

## Database and migrations

The checked local Laravel connection was read-only verified as MySQL, selecting database `dronetv_assistant`; migration status showed all migrations, including the enquiries table, as `Ran`. Local credentials remain private and are not documented here.

The enquiries migration is `backend-laravel/database/migrations/2026_10_10_063734_create_enquiries_table.php`. It defines identity/contact fields, `user_type`, interest, message, status, timestamps, and indexes. Do not run `migrate:fresh`, `db:wipe`, or delete local database files to troubleshoot.

## REST API

Base URL: `http://127.0.0.1:8000`. All endpoints return JSON except successful delete (`204 No Content`).

| Method | Endpoint | Access | Success | Other expected responses |
|---|---|---|---|---|
| `POST` | `/api/enquiries` | Public | `201 Created` | `422` invalid input |
| `GET` | `/api/enquiries` | Admin token | `200 OK` | `401` missing/invalid key |
| `GET` | `/api/enquiries/{id}` | Admin token | `200 OK` | `401`, `404` |
| `PUT` / `PATCH` | `/api/enquiries/{id}` | Admin token | `200 OK` | `401`, `404`, `422` |
| `DELETE` | `/api/enquiries/{id}` | Admin token | `204 No Content` | `401`, `404` |

Admin calls use the `X-Admin-Key` header. List parameters include `search`, `user_type`, `status`, `page`, and `per_page`. Create requires name, email, phone, user type, interest, and message. Full payload/validation details are in [API documentation](docs/API_DOCUMENTATION.md); the combined handoff is [API and database notes](docs/API_DATABASE.md).

## Testing

Run from `backend-laravel`:

```powershell
php artisan test
composer check-platform-reqs --no-dev
php artisan route:list --path=api
php artisan migrate:status
```

Run from `frontend`:

```powershell
npm run lint
npm run build
```

Latest local checks passed: Laravel tests (8 tests, 21 assertions), Composer platform requirements, `php artisan route:list --path=api`, `php artisan migrate:status`, frontend lint, and production build. Live API create/validation/auth/list/detail/update/delete statuses against MySQL were verified separately earlier. PHPUnit uses the test database configured separately in `phpunit.xml`; its results are not by themselves proof of MySQL runtime.

## Screenshots and evidence

No recruiter screenshots are included or claimed. `frontend/src/assets/hero.png` is an application asset, not evidence. Follow [the manual test plan](docs/MANUAL_TEST_PLAN.md) and capture genuine home/services/courses, chatbot, form validation/success, admin, and mobile views using synthetic data only. Do not show passwords, admin tokens, or real enquiry information.

## Troubleshooting

- **Browser says "Failed to fetch":** ensure Laravel is running at the configured API URL and Vite uses the expected host/port. The observed failure was reproduced while Laravel was not listening on port 8000.
- **CORS:** browser origin includes scheme, host, and port. Add the exact Vite origin to backend `CORS_ALLOWED_ORIGINS`, clear config cache, and restart Laravel.
- **Database connection or migration failure:** check MySQL service, database/user grants, and private backend `DB_*` values; run `php artisan config:clear` then `php artisan migrate:status`. Do not reset or wipe a database containing data.
- **Admin returns unauthorized:** use the current backend `ADMIN_API_TOKEN`; never configure it as a `VITE_` variable.

## Security and limitations

- Never publish backend/frontend `.env`, credentials, local database files/dumps, logs containing private data, or real enquiry records.
- Admin access uses a shared token and is demo-level authorization, not a full user/session system. Production requires HTTPS, robust authentication/authorization, managed secrets, and debug disabled.
- The chatbot is deterministic and has no LLM connection. Chat history is in page state and does not persist across reloads.
- DroneTV-specific copy remains unverified demonstration content.
- No Git repository metadata, public URL, hosted demo, screenshots, video, resume PDF, or Drive upload was present/verified in this workspace.

## Author and submission context

The supplied project materials identify this as Chandan Mondal's DroneTV AI Support & Lead Assistant assignment. This README does not claim authorship beyond actual contributions or claim that external submission tasks are complete..
=======
# ai-support-lead-assistant
>>>>>>> c33d3b9b855bcc9855a6187919b0aaa886c80954

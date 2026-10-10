# Submission Checklist

This checklist records only evidence present or checks actually run in this workspace. “Done” does not imply a hosted service or external upload.

## Project and technical verification

- [x] React/TypeScript frontend and Laravel API source are present.
- [x] Local Laravel runtime was verified against MySQL database `dronetv_assistant`; migrations reported `Ran`.
- [x] Live API behavior was previously verified: valid public create `201`, invalid create `422`, unauthorized admin requests `401`, authorized list/detail/update `200`, delete `204`, deleted record `404`.
- [x] Laravel tests currently pass: 8 tests, 21 assertions. PHPUnit uses the isolated SQLite test database configured in `phpunit.xml`, not MySQL.
- [x] `composer check-platform-reqs --no-dev` passed.
- [x] `php artisan route:list --path=api` and `php artisan migrate:status` passed.
- [x] `npm run lint` and `npm run build` passed.
- [x] Source archive was generated and inspected; `.env`, local databases, dependencies, build output, and logs were excluded. See [package-source.ps1](scripts/package-source.ps1).
- [x] `.env.example` files use placeholders; secrets are not documented.
- [ ] Git repository initialized and `git status` reviewed — **needs action**. This workspace has no `.git` metadata.

## Assignment deliverables

- [x] Setup and API/database documentation — [README](README.md), [API documentation](docs/API_DOCUMENTATION.md), [database setup](docs/DATABASE_SETUP.md), and [API/database handoff](docs/API_DATABASE.md).
- [x] Manual test plan, walkthrough outline, and interview preparation — see [docs/](docs/).
- [ ] Capture real application screenshots — **needs action**. No submission screenshots were found; `frontend/src/assets/hero.png` is an app asset, not evidence.
- [ ] Record a 5–10 minute walkthrough video — **needs action**.
- [ ] Publish the source repository and insert its real URL — **needs action**. Do not publish `.env`, local databases, dependency folders, or build output.
- [ ] Export an updated resume to PDF — **needs action**.
- [ ] Create Drive folders, upload deliverables, and verify viewer permissions — **needs action**. No Drive upload or permission state was verified.
- [ ] Reconcile required Drive folder names with the original assignment guide — **blocked**. The guide file is absent from this workspace, and the supplied instructions contain conflicting folder-name sets. Do not guess which is authoritative.
- [ ] Verify all evidence and links in the final submission — **needs action** after the external items above exist.

## Suggested final evidence

Capture the actual home page, services/courses, chatbot interaction, enquiry validation and success, admin login/list/detail/status update, and a mobile viewport. Use synthetic enquiry data and keep all credentials out of screenshots and recordings. Follow [the manual test plan](docs/MANUAL_TEST_PLAN.md) and [the walkthrough outline](docs/PROJECT_WALKTHROUGH.md).

## Safe source packaging

From the project root in PowerShell, create an archive outside the project directory:

```powershell
.\scripts\package-source.ps1
```

Review the ZIP before upload. The script excludes secrets, local database files (including SQLite files detected by file signature), dependencies, generated builds, logs, and caches. It does not publish or upload anything.

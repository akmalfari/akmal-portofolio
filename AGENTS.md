# AGENTS.md

Compact reference for AI agents working in `maildesk-app-v1`.

## 🚨 Core Operational Restrictions (CRITICAL)

- **FILE MODIFICATION PROTOCOL**: 
  - You are **strictly forbidden** from automatically creating, modifying, or deleting any files.
  - **Mandatory Workflow**: You must present the proposed code changes or solutions inside the terminal chat window first and ask the user for confirmation.
  - **ONLY** apply modifications to the codebase after the user explicitly types their approval (e.g., "ya", "setuju", "terapkan").
- **GIT RESTRICTIONS**: 
  - Do **NOT** touch Git under any circumstances.
  - You are prohibited from running commands like `git add`, `git commit`, `git push`, `git checkout`, or any other version control operations. Leave repository tracking entirely to the user.

## Quick Reference Commands

- **Build / Verification**:
  ```bash
  dotnet build MailDesk.API.sln
  ```
  *(Always run this before finishing a task. There is currently no dedicated test project; CI skips tests if no `*Tests.csproj` exists.)*

- **Run Dev Server**:
  ```bash
  dotnet run --project MailDesk.API/MailDesk.API.csproj
  ```
  Runs at `http://localhost:5175`. Swagger UI: `http://localhost:5175/swagger/index.html`.

- **Entity Framework Migrations**:
  ```bash
  dotnet ef migrations add <MigrationName> --project MailDesk.API --startup-project MailDesk.API
  dotnet ef database update --project MailDesk.API --startup-project MailDesk.API
  ```
  *Note:* `Program.cs` automatically invokes `dbContext.Database.Migrate()` on app startup.

## Environment & Database Quirks

- **Environment Loading**: `DotNetEnv.Env.Load()` loads `.env` from repo root at startup.
- **Connection String Fallback**: Checked in order: `appsettings.Development.json` (`ConnectionStrings:DefaultConnection`, default port 5433) -> `.env` (`POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`) via `ConnectionHelper.Build()`.
- **Npgsql Timestamp Legacy Mode**: `AppContext.SetSwitch("Npgsql.EnableLegacyTimestampBehavior", true)` is active. Use `DateTime.UtcNow` or `DateTime` without timezone offsets.
- **Auto-Seeding in Development**: When `ASPNETCORE_ENVIRONMENT=Development`, `DbInitializer.Seed(dbContext)` seeds base roles, permissions, admin user, and sample letters/workflows on every start.

## Controller & API Conventions

- **Base Controller**: All controllers inherit `ApiControllerBase` (which applies `[Authorize]`).
- **Response Wrapper**: Endpoints must return via `ExecuteAsync(...)`:
  ```csharp
  return await ExecuteAsync(
      () => _service.DoWorkAsync(...),
      "Pesan berhasil diperoleh.");
  ```
  `ExecuteAsync` automatically standardizes responses into `ApiResponse<T>` and maps exceptions:
  - `KeyNotFoundException` -> `404 NotFound`
  - `ArgumentException` -> `400 BadRequest`
  - `InvalidOperationException` -> `409 Conflict`
  - `UnauthorizedAccessException` -> `403 Forbidden`
- **User Identity**: Call `GetCurrentUserId()` from `ApiControllerBase` to get the authenticated user's `int` ID.
- **Enums**: Configured with `JsonStringEnumConverter`. Always return and accept enum strings (e.g. `"DIKIRIM"`, `"DITERIMA"`, `"SELESAI"`).
- **Audit Logging**: State mutations and critical reads must log via `IAuditLogService.LogAsync(...)`.

## Security & Authorization Model

- **DB-Backed Permissions**: JWT only validates identity (`userId`). Permission policies use `[RequiredPermission("permission.code")]` and query DB on every request (`Users` -> `UserRoles` -> `RolePermissions` -> `Permissions`). Revoked permissions take effect immediately without token re-issuance.
- **Dev Token Lifetime**: In Development mode, access token lifetime is set to 1440 minutes (24 hours) in `Program.cs` to prevent expiration during local testing.

## Workflow & Disposition Domain Gotchas

- **No `parent_id` column**: The `workflows` table does not have a `parent_id` foreign key. Hierarchy and chaining are modeled via:
  - `LetterId`: The associated letter.
  - `Order`: Step increment (`child.Order = parent.Order + 1`).
  - `DispositionChainId`: `Guid?` tracking a specific branch of disposition.
  - Alur handover: Sender of child workflow is recipient of parent workflow (`child.SenderUserId == parentRecipient.RecipientUserId`).
- **Workflow Types**: `WorkflowRecipientUser` handles recipients with `WorkflowType.INBOX` vs `WorkflowType.DISPOSISI`.
- **Workflow Templates**: Per-category routing rules (`AllowDisposal`, `IsBroadcastable`) live on `WorkflowTemplate` linked to `LetterCategory` (`letter_category_id`), not on `LetterCategory` directly.

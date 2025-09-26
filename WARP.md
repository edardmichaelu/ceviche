# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview
- Monorepo-style app with a Python/Flask backend and a React + TypeScript + Vite frontend.
- Backend entrypoint: app.py (Application Factory pattern in create_app). Configuration via config.py (Development/Production/Testing classes). SQLAlchemy models under models/. Business logic in services/. Routes grouped as Blueprints under routes/.
- Frontend lives in ceviche-frontend/ with Vite, TailwindCSS, Vitest, ESLint/Prettier configured via package.json and config files.

Prerequisites
- Python 3.12+ and Node.js 18+.
- Windows PowerShell examples are included; use equivalent commands for macOS/Linux.

Backend: setup, run, lint, test
- Create and activate a virtual environment, install dependencies, and run the API server:

```pwsh path=null start=null
# From repo root
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt

# Environment (copy example if present, then edit values as needed)
# Windows
if (Test-Path .env.example) { Copy-Item .env.example .env -Force }

# Start backend (http://localhost:5000)
python app.py
```

- Initialize database (destructive seed script — drops and recreates tables, then seeds sample data). This script prompts for confirmation:

```pwsh path=null start=null
# Run only if you intend to reset and seed the DB
python init_cevicheria.py
```

- Lint and format (tools declared in requirements.txt):

```pwsh path=null start=null
# From repo root (venv active)
flake8 .
black .
isort .
```

- Run all tests (pytest dependencies are present; note this repo may not include a tests/ folder yet):

```pwsh path=null start=null
# From repo root (venv active)
python -m pytest
python -m pytest --cov=.
```

- Run a single test / test node:

```pwsh path=null start=null
# Single file
python -m pytest tests/test_example.py

# Single test function in a file
python -m pytest tests/test_example.py::test_happy_path
```

Frontend: setup, dev, build, lint, test
- Install, run dev server, build, format/lint, and test:

```pwsh path=null start=null
# From repo root
Set-Location .\ceviche-frontend
npm install

# Dev server (default http://localhost:5173 or 5174 depending on Vite)
npm run dev

# Production build / preview
npm run build
npm run preview

# Lint / format
npm run lint
npm run lint:fix
npm run format
npm run format:check

# Tests (Vitest)
npm run test
npm run test:ui
npm run test:coverage

# Type checking
yarn run type-check  # or: npm run type-check
```

- Run a single frontend test (Vitest):

```bash path=null start=null
# From ceviche-frontend/
# Run a single test file
npm run test -- src/components/SomeComponent.test.tsx

# Filter by test name
npm run test -- -t "renders dashboard"
```

Common environment settings
- Backend uses config.py with three configs: development, production, testing. It reads from environment variables. Typical variables used across README and code:
  - FLASK_ENV (development|production|testing)
  - SECRET_KEY, JWT_SECRET_KEY
  - DEV_DATABASE_URI (default sqlite:///ceviche_db_dev.sqlite)
  - PROD_DATABASE_URI (e.g., mysql://user:pass@host/ceviche_db)
  - Optional JWT_* knobs as defined in Config (see config.py)

- Example quick-start (SQLite dev) works without extra DB setup; for MySQL production, set PROD_DATABASE_URI accordingly before running.

High-level architecture and structure
- Application factory and configuration
  - app.py defines create_app which:
    - Loads config from config_by_name in config.py (Development/Production/Testing).
    - Initializes extensions: SQLAlchemy via models.db and JWTManager.
    - Configures CORS broadly for development, handles OPTIONS preflight, and adds response headers post-request.
    - Registers Blueprints (grouped by domain): auth, admin, permissions, upload, caja, mesero, cocina, audit (+simple), local, reserva (+public), bloqueo (+public), categoria, ingrediente, producto, tipo_ingrediente, producto_ingrediente, orden. Most API routes are under /api/* and auth under /auth.
    - Serves uploaded files from /uploads/<path:filename> with CORS-aware headers.
    - Provides diagnostic endpoints (/api/test, /api/test-image, /api/test/mesero) and global JSON error handlers for HTTPException and generic Exception.

- Domain organization
  - routes/: Flask Blueprints per domain (e.g., admin_routes.py, orden_routes.py). Each file maps a cohesive set of endpoints to its blueprint and URL prefix (registered in app.py).
  - services/: Business logic layer, one service per domain (e.g., orden_service.py, cocina_service.py). Shared error shaping lives in services/error_handler.py (ErrorHandler provides standardized error and success responses to keep views thin and consistent).
  - models/: SQLAlchemy models grouped by domain (core.py, local.py, menu.py, order.py, reserva.py, bloqueo.py, user.py). models/__init__.py initializes db and imports all model classes so metadata is complete when creating tables.
  - config.py: Centralized configuration classes (Development/Production/Testing) including explicit JWT setup and SQLAlchemy engine options for dev.
  - init_cevicheria.py: Interactive seeding utility (drops all tables, creates schema from models, seeds core domain data: users, pisos/zonas/mesas, tipos/ingredientes/productos, relaciones, permisos, wishlists, reseñas, bloqueos, órdenes, pagos). Run only when you intend to reset the schema.
  - generate_qr.py: Optional utility to generate a QR image pointing to the frontend. Requires qrcode and Pillow if used.

- Frontend (ceviche-frontend/)
  - Vite + React 19 + TypeScript project with TailwindCSS and a Vitest test setup (vitest.config.ts). ESLint/Prettier are configured and exposed via package.json scripts. Primary scripts include dev, build, lint, format, test, preview, and type-check.

- Cross-cutting concerns
  - CORS: app.py configures permissive CORS in development and handles both preflight and response headers.
  - Auth: JWT via flask_jwt_extended with explicit header-based token configuration.
  - Error responses: Two global handlers ensure JSON payloads for both HTTPException and unexpected Exception cases.
  - Static/uploads: Dedicated /uploads handler returns files and sets CORS headers dynamically.

Frequently used commands (reference)
- Backend

```pwsh path=null start=null
# Setup and run
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python app.py

# Lint/format
autoflake  # if used; otherwise
flake8 .
black .
isort .

# Tests
python -m pytest
python -m pytest --cov=.
python -m pytest tests/test_example.py::test_happy_path
```

- Frontend

```pwsh path=null start=null
Set-Location .\ceviche-frontend
npm install
npm run dev
npm run build
npm run preview
npm run lint
npm run lint:fix
npm run format
npm run format:check
npm run test
npm run test -- -t "renders dashboard"
```

Notes for agents
- The repository’s README.md (and Importante/* docs) contain expanded descriptions, technology versions, example .env keys, and API surface areas. For deep dives into endpoints, read routes/* per domain and corresponding services/*.
- Real-time features are referenced in docs and dependencies (Flask-SocketIO). If needed, search for SocketIO usage across the codebase before making changes involving real-time flows.
- Seeding (init_cevicheria.py) is interactive and destructive (drops tables). Do not run it in an environment where you need to preserve data.

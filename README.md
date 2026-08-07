# Portfolio professionnel

Monorepo du portfolio professionnel, avec un frontend Next.js et un backend FastAPI.

## Structure

- `frontend/`: Next.js + TypeScript + Tailwind CSS
- `backend/`: FastAPI + uv

## Prérequis

- Node.js 20+
- npm
- Python 3.12
- uv

## Installation

### Frontend

```bash
cd frontend
npm install
cp .env.example .env.local
```

### Backend

```bash
cd backend
uv sync --group dev
cp .env.example .env
```

## Lancement

### Frontend

```bash
cd frontend
npm run dev
```

### Backend

```bash
cd backend
uv run uvicorn app.main:app --reload
```

## Qualité

### Frontend

```bash
cd frontend
npm run format
npm run lint
npm run typecheck
```

### Backend

```bash
cd backend
uv run ruff format --check .
uv run ruff check .
uv run python -m unittest discover -s tests
```

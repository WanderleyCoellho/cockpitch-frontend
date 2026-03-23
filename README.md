# Cockpitch - Plataforma de Proposta Comercial

Frontend React + Vite do Cockpitch, integrado ao backend dedicado via API HTTP.

## Requisitos

- Node.js 18+
- Backend rodando em `http://localhost:3001`

## Setup

1. Instale as dependências:
	- `npm install`
2. Configure `.env.local`:

```env
VITE_API_URL=http://localhost:3001/api
VITE_STRIPE_PUBLIC_KEY=pk_test_xxx
```

3. Rode em desenvolvimento:
	- `npm run dev`

## Scripts

- `npm run dev`
- `npm run build`
- `npm run typecheck`
- `npm run lint`

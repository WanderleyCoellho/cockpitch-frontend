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
```

3. Rode em desenvolvimento:
	- `npm run dev`

## Scripts

- `npm run dev`
- `npm run build`
- `npm run typecheck`
- `npm run lint`
- `npm test`

## Pagamentos

O checkout é criado no backend (`POST /api/stripe/create-checkout` com `{ planTier }`) e o
navegador é redirecionado para a `url` retornada. O frontend não precisa da chave pública do Stripe.
O plano exibido vem sempre do servidor (`/api/auth/me`).

## Especificações

Roadmap e decisões de arquitetura ficam no repositório `cockpitch-backend`, em `specs/`.

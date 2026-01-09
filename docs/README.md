# Sistema Gestao

## Visao geral
- Backend em Node.js + Express (Clean Architecture)
- Frontend em Next.js
- Banco MySQL
- Autenticacao com hash + JWT

## Banco de dados
1. Crie o banco `sistema_gestao`.
2. Rode o script `docs/schema.sql`.

## Backend
- Configure `backend/.env` (use `backend/.env.example` como base).
- Instale dependencias e rode `npm run dev`.

## Endpoints
- POST /api/auth/login
- POST /api/auth/refresh
- POST /api/auth/logout
- GET /api/auth/me
- POST /api/auth/mfa/setup
- POST /api/auth/mfa/verify
- POST /api/auth/mfa/disable
- POST /api/auth/credentials
- GET /api/users
- GET /api/users/:id
- POST /api/users
- PUT /api/users/:id
- DELETE /api/users/:id
- GET /api/events
- GET /api/events/:id
- POST /api/events
- PUT /api/events/:id
- DELETE /api/events/:id
- POST /api/events/:eventId/assignments
- GET /api/events/:eventId/attendance
- POST /api/events/:eventId/attendance
- POST /api/events/:eventId/observations
- POST /api/events/:eventId/observations/:operatorId
- GET /api/reports/events-attendance

## Observacoes
- A criacao de credenciais exige token com permissao ADMIN/COMANDO/ALTO-COMANDO.
- Endpoints de usuarios exigem autenticacao.
- Endpoints de eventos exigem autenticacao; criacao/edicao requer ADMIN/COMANDO/ALTO-COMANDO.
- Endpoints de presenca e relatorios exigem ADMIN/COMANDO/ALTO-COMANDO.
- Autenticacao usa cookies httpOnly + CSRF.
- Requisicoes POST/PUT/DELETE exigem header `x-csrf-token` igual ao cookie `csrf_token`.

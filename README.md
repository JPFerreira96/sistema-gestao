# Sistema Gestao

Estrutura inicial com Clean Architecture, login JWT e CRUD de usuarios.
Inclui modulo de Calendario de Eventos com CRUD e visualizacoes semana/mes/ano.

## Estrutura
- `backend/` Node.js + Express (Clean Architecture)
- `frontend/` Next.js
- `docs/` Script SQL e notas

## Passos rapidos (sem Docker)
1. Banco: crie o schema com `docs/schema.sql`.
2. Backend: copie `backend/.env.example` para `.env` e ajuste.
3. Frontend: copie `frontend/.env.example` para `.env`.

## Docker
- `docker-compose up --build`

## Seguranca
- JWT via cookies httpOnly + CSRF.
- Rate limit no login e no geral.
- Politica de senha e bloqueio por tentativas.
- Auditoria de acesso e eventos.

# Memória Digital Póstuma

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

Plataforma para armazenar memórias criptografadas (mensagens, cartas, vídeos e recomendações) com entrega programada por data ou evento, liberadas apenas após verificação de vida.

## Stack

- **Backend:** Node.js + Express + TypeScript
- **Frontend:** TypeScript + Vite
- **Criptografia:** libsodium (cofre), bcrypt (senha), JWT (sessão)
- **Banco:** MongoDB (Mongoose)

## Funcionalidades implementadas

- Cofre de memórias criptografado usando `crypto_secretbox` do libsodium.
- Autenticação com hash de senha em bcrypt e token JWT.
- Entrega programada:
  - por **data** (`deliveryMode: date` + `deliverAt`),
  - por **evento** (`deliveryMode: event` + `eventName`).
- Verificação de vida:
  - check-in manual (`/life/check-in`),
  - verificação externa opcional (`EXTERNAL_LIFE_API_URL`).
- Job periódico que marca usuário como `deceased` quando aplicável e libera memórias vencidas.

## Estrutura

- `backend/` API REST e regras de negócio
- `frontend/` interface web TypeScript

## Backend (porta 4000)

1. Copie `backend/.env.example` para `backend/.env`.
2. Ajuste `MONGODB_URI` e `JWT_SECRET`.
3. Instale dependências e rode em desenvolvimento.

Principais endpoints:

- `POST /auth/register`
- `POST /auth/login`
- `POST /memories` (auth)
- `GET /memories` (auth)
- `POST /memories/:id/reveal` (auth)
- `POST /memories/events/trigger` (auth)
- `POST /life/check-in` (auth)
- `POST /life/verify-now` (auth)
- `GET /health`

## Frontend

Interface simples para:

- registrar/login,
- criar memória criptografada,
- fazer check-in,
- forçar verificação de vida,
- listar memórias.

O frontend usa `http://localhost:4000` como base da API.

## Testes

Testes unitários incluídos no backend para:

- criptografia/descriptografia do cofre,
- regra de elegibilidade de entrega por data/evento.

## Observações

- Nesta versão MVP, a “entrega” é representada por marcação de `deliveredAt` e log no backend.
- Para produção, recomenda-se integrar canal real de entrega (email, webhook, mensageria) e trilha de auditoria.

# 📅 Almanac - Controlador de Hábitos

Um aplicativo simples para te ajudar a criar e manter hábitos saudáveis.

## O que o Almanac faz?

- ✅ **Criar hábitos** personalizados (beber água, exercitar-se, estudar...)
- 🎯 **Marcar como concluído** quando você fizer o hábito
- 📊 **Ver seu progresso** com estatísticas do dia
- 🏆 **Acompanhar conquistas** e dias seguidos

## Como é a interface?

- 🎨 **Design moderno** com gradientes e animações suaves
- 📱 **Funciona no celular** e computador
- 🌈 **Cores diferentes** para cada categoria de hábito (saúde, exercício, estudo...)
- 🔔 **Notificações** de feedback para suas ações

## 🛠️ Tecnologias utilizadas

### Backend (API)
- **Node.js** + **TypeScript**
- **NestJS** (framework)
- **PostgreSQL** (banco de dados)
- **Prisma** (ORM)

### Frontend (Interface)
- **HTML**, **CSS** e **TypeScript**
- **Vite** (build tool)
- **Animações CSS** para melhor experiência

## 🚀 Como rodar o projeto?

Aplicativo de hábitos com **NestJS + TypeORM + PostgreSQL** (API) e **Vite** (frontend).

## Estrutura do repositório

almanac/
  ├─ almanac-api/      # Backend (NestJS + TypeORM + PostgreSQL)
  └─ almanac-front/    # Frontend (Vite + TS/JS)

---

## 1) Pré-requisitos

### Windows
- Node.js 18+ (recomendado 20 LTS): https://nodejs.org  
- Git: https://git-scm.com  
- PostgreSQL 16+: https://www.postgresql.org/download/windows/  

Se o PowerShell bloquear scripts, abra o PowerShell como Administrador e rode:  
`Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`

### macOS / Linux
- Node.js 18+ / 20 LTS
- Git
- PostgreSQL 16+  
  - macOS: `brew install postgresql@16 && brew services start postgresql@16`  
  - Ubuntu/Debian: `sudo apt-get install postgresql postgresql-contrib`  

---

## 2) Clonar o repositório

git clone https://github.com/Wyllye/almanac.git
cd almanac

---

## 3) Banco de Dados (PostgreSQL)

### 3.1 Inicie o serviço
- Windows: services.msc → PostgreSQL → Start
- macOS/Linux: `sudo service postgresql start`

### 3.2 Criar usuário e banco

Abra o psql e rode:

CREATE USER almanac WITH ENCRYPTED PASSWORD 'almanac123';
CREATE DATABASE almanac_db OWNER almanac;

---

## 4) Backend (NestJS)

cd almanac-api

Crie o arquivo `.env`:

NODE_ENV=development
DB_SSL=false
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=almanac
DB_PASS=almanac123
DB_NAME=almanac_db

Instale dependências e rode:

npm ci
npm run start:dev

A API ficará em http://localhost:3000

---

## 5) Frontend (Vite)

cd almanac-front

Crie `.env.development`:

VITE_API_URL=http://localhost:3000

Instale dependências e rode:

npm ci
npm run dev

Acesse: http://localhost:5173

---

## 6) Fluxo de teste

1. API rodando (`npm run start:dev`) na porta 3000  
2. Front rodando (`npm run dev`) em 5173  
3. Acesse http://localhost:5173 e teste criar hábitos.

---

Desenvolvido com ❤️ por **Maria Isabel** (frontend) e **Vinicius Andrei** (backend)

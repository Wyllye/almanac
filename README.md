# 📅 Almanac – Controlador de Hábitos  

Um aplicativo simples para te ajudar a **criar e manter hábitos saudáveis**.  

---

## ✨ O que o Almanac faz?  

- ✅ **Criar hábitos** personalizados (beber água, exercitar-se, estudar...)  
- 🎯 **Marcar como concluído** quando você fizer o hábito  
- 📊 **Acompanhar seu progresso** com estatísticas do dia  
- 🏆 **Ver conquistas** e sequência de dias seguidos cumpridos  

---

## 🎨 Como é a interface?  

- 💻 **Design moderno** com gradientes e animações suaves  
- 📱 **Responsivo** – funciona no celular e computador  
- 🌈 **Categorias coloridas** (saúde, exercício, estudo...)  
- 🔔 **Notificações visuais** de feedback para ações  

---

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

---

## 🚀 Links do Projeto  

- 🎥 **Apresentação no YouTube**: [Clique aqui](https://youtu.be/GLO-UycWDYU)  
- 🌐 **Frontend (Vercel)**: [almanac-kappa.vercel.app](https://almanac-kappa.vercel.app/)  
- ⚙️ **Backend (Render)**: [almanac-7zhm.onrender.com](https://almanac-7zhm.onrender.com/)  
- 💻 **Repositório GitHub**: [Wyllye/almanac](https://github.com/Wyllye/almanac)  

---

## 📂 Estrutura do Repositório  
```
almanac/
├─ almanac-api/ # Backend (NestJS + Prisma + PostgreSQL)
└─ almanac-front/ # Frontend (Vite + TS/JS + CSS)

````
---

## ⚙️ Como rodar o projeto localmente  

### 1) Pré-requisitos  

- Node.js 18+ (recomendado 20 LTS) → [nodejs.org](https://nodejs.org)  
- Git → [git-scm.com](https://git-scm.com)  
- PostgreSQL 16+ → [postgresql.org](https://www.postgresql.org)
-----

### 2) CLonar o repositório
```
git clone https://github.com/Wyllye/almanac.git
cd almanac
````
-----

### 3) Configurar Banco de Dados (PostgreSQL)

- Inicie o serviço do PostgreSQL:

Windows:```` services.msc → PostgreSQL → Start````
Linux/Mac:````sudo service postgresql start````

- Crie usuário e banco:
````
CREATE USER almanac WITH ENCRYPTED PASSWORD 'almanac123';
CREATE DATABASE almanac_db OWNER almanac;
````
-----
### 4) Backend (NestJS + Prisma)
````
cd almanac-api
````
- Crie o arquivo .env:
````
NODE_ENV=development
PORT=3000
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=almanac
DB_PASS=almanac123
DB_NAME=almanac_db
````
- Instale dependências e rode:
````
npm ci
npm run start:dev
````
- A API ficará disponível em: http://localhost:3000

----
### 5) Frontend (Vite)

````cd almanac-front````
- Crie .env.development:

````VITE_API_URL=http://localhost:3000````

- Instale dependências e rode:

````
npm ci
npm run dev
````
- Acesse no navegador: http://localhost:5173

----
### 6) Fluxo de Teste

- Inicie o backend → npm run start:dev (porta 3000)
- Inicie o frontend → npm run dev (porta 5173)
- Abra http://localhost:5173 e cadastre seus hábitos 🚀

----
## 👩‍💻 Desenvolvido com ❤️ por Maria Isabel (frontend) e Vinicius Andrei (backend)

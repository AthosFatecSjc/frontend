# 🎨 Frontend - Ambiente de Desenvolvimento

Este projeto utiliza **Vue.js** para a interface do sistema.

O frontend pode ser executado manualmente ou através de um script que automatiza a inicialização.

---

# 📋 Pré-requisitos

Antes de rodar o projeto, instale:

- **Node.js 18+**
- **npm** ou **yarn**

Para verificar se estão instalados:

```bash
node -v
npm -v
```

---

# 📂 Estrutura do Projeto

```
.
├── src
├── public
├── package.json
├── start.sh
└── README.md
```

---

# 📦 Instalar dependências

Antes de iniciar o projeto, instale as dependências:

```bash
npm install
```

---

# ▶️ Rodar o Frontend manualmente

Para iniciar o servidor de desenvolvimento:

```bash
npm run dev
```

O frontend ficará disponível em:

```
http://localhost:3000
```

---

# ⚡ Rodar usando o script automático

O projeto possui um script para iniciar o frontend automaticamente.

Primeiro dê permissão de execução:

```bash
chmod +x start.sh
```

Depois execute:

```bash
./start.sh
```

Esse script irá iniciar o servidor Vue em modo desenvolvimento.

---

# 🌐 Acesso ao sistema

Após iniciar o projeto, acesse:

| Serviço | URL |
|------|------|
| Frontend Vue | http://localhost:3000 |

---

# 🛑 Parar o frontend

Para parar o servidor de desenvolvimento:

```
CTRL + C
```

---

# 💡 Observação

O script `start.sh` facilita a inicialização do ambiente de desenvolvimento do frontend, executando automaticamente o comando:

```bash
npm run dev
```







## Customize configuration

See [Vite Configuration Reference](https://vite.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Lint with [ESLint](https://eslint.org/)

```sh
npm run lint
```

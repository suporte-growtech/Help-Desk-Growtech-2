# 🖥️ Help Desk GrowTech

Sistema profissional de help desk para gerenciamento de chamados técnicos e equipamentos de TI.

## 🚀 Funcionalidades

### 👨‍💼 Painel Admin
- **Dashboard** com estatísticas de chamados e alertas de SLA
- **Gerenciar Chamados** - visualizar, filtrar, atualizar status e comentar
- **Cadastro de Notebooks** - controle de patrimônio com:
  - Nº Patrimônio, Marca, Modelo, Departamento
  - Processador, Memória RAM, Armazenamento
  - Responsável, Cidade
  - Termo de Responsabilidade
  - Histórico de Manutenções

### 👤 Painel Usuário
- **Abrir Chamados** com descrição detalhada e anexos (imagens/documentos)
- **Acompanhar Chamados** com visualização de status, SLA e comentários
- Sistema de **SLA** (8h, 24h, 48h, 72h conforme prioridade)

### 🎨 Design
- Tema **Claro/Escuro**
- **Zoom** em imagens (lupa)
- **Responsivo** para desktop, tablet e mobile
- Interface moderna com animações suaves

## 🛠️ Tecnologias

- **Frontend:** React 19 + TypeScript + Vite
- **Estilização:** Tailwind CSS 4
- **Ícones:** Lucide React
- **Backend:** Supabase (Auth, Database, Storage)
- **Build:** Vite 8

## 📋 Pré-requisitos

- Node.js 18+
- Conta no [Supabase](https://supabase.com)

## 🔧 Configuração

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/helpdesk-growtech.git
cd helpdesk-growtech
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure o Supabase

Crie um projeto no Supabase e execute o SQL em `supabase/schema.sql` no SQL Editor.

Crie um bucket de storage chamado `ticket-attachments` (público).

### 4. Configure as variáveis de ambiente

Copie `.env.example` para `.env` e preencha:
```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
```

### 5. Execute
```bash
npm run dev
```

### 6. Crie o admin

1. Acesse o sistema e cadastre-se
2. No SQL Editor do Supabase, execute:
```sql
UPDATE profiles SET role = 'admin' WHERE email = 'seu@email.com';
```

## 📦 Deploy

### Build de produção
```bash
npm run build
```

### Opções de hospedagem
- **Vercel:** Conecte o repositório e configure as env vars
- **Netlify:** Conecte o repositório e configure as env vars
- **GitHub Pages:** Use `gh-pages` para deploy

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── ui/          # Componentes reutilizáveis
│   └── Layout.tsx   # Layouts Admin e Usuário
├── contexts/        # Contextos (Theme, Auth)
├── lib/             # Configurações (Supabase)
├── pages/
│   ├── admin/       # Páginas do Admin
│   └── user/        # Páginas do Usuário
├── App.tsx          # Rotas
└── main.tsx         # Entry point
```

## 📄 Licença

MIT

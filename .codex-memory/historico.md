# Histórico

## 2026-05-27 — MVP inicial FlowImage

### Projeto

FLOWIMAGE

### Tipo

Historico / Funcionalidade / Backend / Frontend

### O que foi feito

Criado MVP com backend FastAPI, banco SQLite, CRUD de moldes, presets de cor, processamento individual, lote, debug e frontend React.

### Arquivos alterados

- backend/
- frontend/
- docs/
- README.md

### Aprendizado

FlowImage deve gerar somente a imagem final da foto para uso em crachá, sem montar layout de crachá ou dados variáveis.

### Proximos passos

- Validar processamento com fotos reais.
- Evoluir importação CSV/XLSX.

## 2026-05-29 - Deploy Cloudflare Render Supabase concluido

### Projeto

FLOWIMAGE

### Tipo

Deploy / Infra / Validacao

### O que foi feito

Backend publicado no Render em `https://flowimage-backend.onrender.com`, conectado ao Supabase e validado em `/health` e `/api/photo-templates`. Frontend publicado no Cloudflare Pages em `https://flowimage.pages.dev`. CORS ajustado no Render para aceitar o dominio Cloudflare e validado com Playwright sem erros de console.

### Arquivos alterados

- frontend/.env.production
- README.md

### Aprendizado

O deploy gratuito validado do FlowImage ficou Cloudflare Pages + Render Free + Supabase. Render precisou de `CORS_ORIGINS` com o dominio final do Cloudflare; sem isso o frontend abre mas nao carrega dados do backend.

### Proximos passos

- Revogar o access token Supabase exposto no chat e gerar outro quando necessario.
- Testar processamento real de imagem no Render para avaliar RAM/tempo do plano gratuito.

## 2026-05-29 - Auth publicado no Cloudflare

### Projeto

FLOWIMAGE

### Tipo

Historico / Auth / Deploy

### O que foi feito

Implementado login/cadastro com Supabase Auth, protecao de rotas internas e botao de sair no layout. O frontend foi recompilado e publicado no Cloudflare Pages com variaveis de backend e Supabase.

### Arquivos alterados

- frontend/src/auth/
- frontend/src/services/supabase.ts
- frontend/src/pages/Login/Login.tsx
- frontend/src/App.tsx
- scripts/deploy-cloudflare-pages.ps1

### Aprendizado

No FlowImage, Supabase Auth resolve o primeiro controle de acesso com menor atrito por ja existir Supabase no deploy. A API ainda precisa de validacao JWT se for necessario impedir chamadas diretas fora da interface.

### Proximos passos

- Validar cadastro com email real e configurar confirmacao/redirecionamento no painel Supabase se necessario.

# Decisões

## 2026-05-27 — MVP local com SQLite e storage em disco

### Projeto

FLOWIMAGE

### Tipo

Decisao / Backend / Banco

### O que foi feito

Definido SQLite no MVP e storage local em `input/`, `output/` e `debug/`, mantendo estrutura preparada para PostgreSQL e S3/MinIO depois.

### Arquivos alterados

- backend/app/core/database.py
- backend/app/core/config.py
- backend/app/storage/files.py

### Aprendizado

Para o primeiro fluxo funcional, o banco local reduz fricção e permite validar crop, debug e exportação antes de infraestrutura externa.

### Proximos passos

- Migrar para PostgreSQL quando houver usuários/dados reais concorrentes.

## 2026-05-27 — Processamento sem persistir imagens

### Projeto

FLOWIMAGE

### Tipo

Decisao / Backend / Storage

### O que foi feito

Os fluxos usados pela interface passaram a processar imagens em memória e devolver `Blob`/arquivo final diretamente ao navegador. O lote monta o ZIP no frontend com JSZip. Endpoints antigos de job que gravavam imagem foram desativados com HTTP 410.

### Arquivos alterados

- backend/app/api/process.py
- backend/app/api/jobs.py
- backend/app/services/photo_processing/memory_processor.py
- backend/app/services/face_detection/detector.py
- frontend/src/services/api.ts
- frontend/src/pages/ProcessPhoto/ProcessPhoto.tsx
- frontend/src/pages/Review/Review.tsx
- frontend/src/pages/BatchProcess/BatchProcess.tsx

### Aprendizado

FlowImage não deve persistir fotos originais nem imagens processadas no servidor; o backend deve receber, processar em memória e retornar o arquivo final.

### Proximos passos

- Remover arquivos antigos de `input/`, `output/` e `debug/` se o Victor confirmar limpeza do histórico local.

## 2026-05-29 - Deploy gratuito Cloudflare Render Supabase

### Projeto

FLOWIMAGE

### Tipo

Decisao / Deploy / Infra

### O que foi feito

Preparada a base de deploy gratuito com frontend no Cloudflare Pages, backend FastAPI no Render Free e banco Supabase Postgres. Adicionados `render.yaml`, `frontend/wrangler.toml`, exemplo de env de producao e documentacao operacional. O backend recebeu driver Postgres e OpenCV headless para ambiente de servidor.

### Arquivos alterados

- .gitignore
- backend/requirements.txt
- render.yaml
- frontend/wrangler.toml
- frontend/.env.production.example
- docs/deploy-gratuito.md

### Aprendizado

Para producao gratuita do FlowImage, SQLite local nao e adequado porque Render tem filesystem efemero. Supabase deve guardar moldes e presets, enquanto fotos continuam processadas em memoria e devolvidas ao navegador.

### Proximos passos

- Criar ou conectar repositorio GitHub para Render.
- Definir `DATABASE_URL` do Supabase no Render.
- Definir `VITE_API_BASE_URL` com a URL final do Render antes do deploy Cloudflare.

## 2026-05-29 - Scripts CLI para deploy gratuito

### Projeto

FLOWIMAGE

### Tipo

Deploy / Infra / Automacao

### O que foi feito

Criados scripts PowerShell para configurar Supabase via CLI, publicar frontend no Cloudflare Pages e checar prerequisitos locais. A estrutura Supabase foi inicializada com migration do schema e seed inicial de presets/moldes.

### Arquivos alterados

- supabase/config.toml
- supabase/migrations/20260529000100_flowimage_schema.sql
- supabase/seed.sql
- scripts/setup-supabase.ps1
- scripts/deploy-cloudflare-pages.ps1
- scripts/check-deploy-prereqs.ps1
- docs/deploy-gratuito.md
- .gitignore

### Aprendizado

Para evitar instrucoes vagas, o deploy do FlowImage deve ser guiado por scripts executaveis. Supabase pode ser configurado por `npx supabase login/link/db push`; Cloudflare Pages pode ser publicado por `wrangler pages deploy` apos definir `VITE_API_BASE_URL`.

### Proximos passos

- Receber Project Ref, senha do banco e access token do Supabase para aplicar migrations.
- Definir caminho do Render: GitHub com `render.yaml` ou API key.

## 2026-05-29 - Supabase remoto configurado via CLI

### Projeto

FLOWIMAGE

### Tipo

Deploy / Banco / Infra

### O que foi feito

Supabase remoto do FlowImage foi linkado via CLI, migration aplicada e seed inicial executado. Validado por consulta Postgres direta e por SQLAlchemy usando URL de pooler com SSL. O banco remoto ficou com 5 presets de cor e 3 moldes iniciais.

### Arquivos alterados

- supabase/seed.sql

### Aprendizado

O Supabase CLI no Windows consegue aplicar `link` e `db push` sem Docker, mas `db dump` depende de Docker Desktop. Para validacao sem Docker, usar conexao Postgres direta via `psycopg2`/SQLAlchemy e pooler URL.

### Proximos passos

- Configurar `DATABASE_URL` no Render usando pooler URL com `postgresql+psycopg2` e `sslmode=require`.
- Configurar `CORS_ORIGINS` no Render apos obter dominio do Cloudflare.

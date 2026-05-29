# Deploy gratuito do FlowImage

## Arquitetura recomendada

- Frontend: Cloudflare Pages
- Backend: Render Web Service Free
- Banco: Supabase Postgres Free

O FlowImage nao deve salvar fotos no servidor. Em producao, apenas moldes e presets devem ir para o banco Supabase.

## Supabase

1. Crie um projeto no Supabase.
2. Copie a connection string Postgres em `Project Settings > Database`.
3. Use a URL no formato SQLAlchemy:

```txt
postgresql+psycopg2://postgres:SENHA@HOST:5432/postgres
```

Essa URL entra no Render como `DATABASE_URL`.

### Configurar Supabase via CLI

No site do Supabase:

1. Abra `https://supabase.com/dashboard`.
2. Entre no projeto do FlowImage.
3. Copie o `Project Ref` em `Project Settings > General > Reference ID`.
4. Copie ou redefina a senha do banco em `Project Settings > Database`.
5. Crie um access token em `Account > Access Tokens`.

Depois rode:

```powershell
.\scripts\setup-supabase.ps1 `
  -ProjectRef "SEU_PROJECT_REF" `
  -DbPassword "SUA_SENHA_DO_BANCO" `
  -AccessToken "SEU_ACCESS_TOKEN"
```

O script faz:

- login no Supabase CLI;
- linka o projeto remoto;
- aplica migrations;
- aplica seed inicial de moldes e presets.

## Render

O arquivo `render.yaml` ja esta preparado.

Variaveis no Render:

```txt
DATABASE_URL=postgresql+psycopg2://postgres:SENHA@HOST:5432/postgres
CORS_ORIGINS=https://flowimage.pages.dev,http://localhost:5173,http://127.0.0.1:5173
```

O start command configurado e:

```txt
uvicorn app.main:app --host 0.0.0.0 --port $PORT
```

Depois do deploy, teste:

```txt
https://SEU-BACKEND.onrender.com/health
```

## Cloudflare Pages

Defina a variavel de build:

```txt
VITE_API_BASE_URL=https://SEU-BACKEND.onrender.com
```

Build:

```powershell
cd frontend
npm run build
wrangler pages deploy dist --project-name flowimage
```

Ou use o script:

```powershell
.\scripts\deploy-cloudflare-pages.ps1 `
  -BackendUrl "https://SEU-BACKEND.onrender.com" `
  -ProjectName "flowimage"
```

Se usar GitHub no Cloudflare:

- Root directory: `frontend`
- Build command: `npm run build`
- Build output: `dist`

## Ordem correta

1. Criar projeto Supabase e copiar `DATABASE_URL`.
2. Criar backend no Render com `DATABASE_URL` e `CORS_ORIGINS`.
3. Testar `/health` do Render.
4. Configurar `VITE_API_BASE_URL` no Cloudflare com a URL do Render.
5. Fazer deploy do frontend.
6. Atualizar `CORS_ORIGINS` no Render incluindo o dominio final do Cloudflare.

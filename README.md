# FlowImage

Sistema para gerar somente a foto final tratada e reenquadrada para uso em crachas.

O MVP entrega:

- CRUD de moldes de foto.
- Presets iniciais de cor.
- Processamento individual com MediaPipe/OpenCV.
- Debug de rosto detectado e crop calculado.
- Exportacao PNG/JPG no tamanho exato do molde.
- Revisao manual com zoom, posicao, rotacao e cor.
- Processamento em lote com ZIP.

## Stack

- Backend: Python, FastAPI, SQLAlchemy, SQLite/Postgres, MediaPipe, OpenCV, Pillow, NumPy.
- Frontend: React, TypeScript, Tailwind, Konva.
- Storage MVP: processamento em memoria para fotos enviadas.

## Rodar backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

API:

- `GET http://localhost:8000/health`
- `GET http://localhost:8000/docs`

## Rodar frontend

```bash
cd frontend
npm install
npm run dev
```

Interface:

- `http://localhost:5173`

## Fluxo principal

1. Abrir `Moldes`.
2. Criar ou editar um molde.
3. Abrir `Processar`.
4. Selecionar molde e foto.
5. Processar e baixar a imagem final.

## Deploy

Arquivos de deploy:

- `render.yaml` para Render.
- `frontend/wrangler.toml` para Cloudflare Pages.
- `supabase/migrations/` para Supabase Postgres.

## Limites do MVP

- Nao gera cracha completo.
- Nao adiciona nome, cargo, QR Code, codigo de barras ou dados de colaborador.
- CSV/XLSX ainda fica preparado como evolucao futura.
- Se MediaPipe nao estiver disponivel, a API usa OpenCV Haar Cascade como fallback explicito.

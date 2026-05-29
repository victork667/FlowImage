# FlowImage

Sistema para gerar somente a foto final tratada e reenquadrada para uso em crachás.

O MVP entrega:

- CRUD de moldes de foto.
- Presets iniciais de cor.
- Processamento individual com MediaPipe/OpenCV.
- Debug de rosto detectado e crop calculado.
- Exportação PNG/JPG no tamanho exato do molde.
- Revisão manual com zoom, posição, rotação e cor.
- Processamento em lote com ZIP.

## Stack

- Backend: Python, FastAPI, SQLAlchemy, SQLite, MediaPipe, OpenCV, Pillow, NumPy.
- Frontend: React, TypeScript, Tailwind, Konva.
- Storage MVP: pastas locais `input/`, `output/` e `debug/`.

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

## Limites do MVP

- Não gera crachá completo.
- Não adiciona nome, cargo, QR Code, código de barras ou dados de colaborador.
- CSV/XLSX ainda fica preparado como evolução futura.
- Se MediaPipe não estiver disponível, a API usa OpenCV Haar Cascade como fallback explícito.

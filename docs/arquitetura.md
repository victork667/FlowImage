# Arquitetura do FlowImage

## Backend

`backend/app/main.py` registra CORS, rotas e arquivos estáticos. O SQLite é criado no start e recebe presets/moldes iniciais.

Rotas principais:

- `/api/photo-templates`
- `/api/color-presets`
- `/api/process`
- `/api/jobs`

Serviços principais:

- `services/face_detection`: MediaPipe com fallback OpenCV.
- `services/framing`: cálculo do crop com base no rosto.
- `services/color_adjustment`: brilho, contraste, saturação, nitidez, temperatura e sombras.
- `services/photo_processing`: pipeline de entrada, debug, crop, máscara e exportação.

## Frontend

`frontend/src/App.tsx` concentra as rotas. As páginas chamam `frontend/src/services/api.ts`.

Páginas:

- Dashboard
- Templates
- TemplateEditor
- ProcessPhoto
- BatchProcess
- Review

## Regra central

A saída é sempre uma imagem final de foto. O sistema não monta crachá completo e não trabalha com dados variáveis de colaborador no MVP.

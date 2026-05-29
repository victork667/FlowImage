# API do FlowImage

## Templates

- `GET /api/photo-templates`
- `POST /api/photo-templates`
- `GET /api/photo-templates/{id}`
- `PUT /api/photo-templates/{id}`
- `DELETE /api/photo-templates/{id}`
- `POST /api/photo-templates/{id}/duplicate`

## Presets de cor

- `GET /api/color-presets`
- `POST /api/color-presets`
- `PUT /api/color-presets/{id}`
- `DELETE /api/color-presets/{id}`

## Processamento individual

- `POST /api/process/single`
- `POST /api/process/preview`
- `POST /api/process/reprocess`
- `POST /api/process/manual-adjust`

## Processamento em lote

- `POST /api/jobs`
- `POST /api/jobs/{id}/upload`
- `POST /api/jobs/{id}/process`
- `GET /api/jobs/{id}`
- `GET /api/jobs/{id}/items`
- `POST /api/jobs/{id}/export-zip`

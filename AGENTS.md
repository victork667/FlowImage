# AGENTS.md — FlowImage

## Contexto

FlowImage gera apenas a foto final tratada para uso posterior em crachás. Não deve montar o crachá completo.

## Regras do produto

- Não inserir nome.
- Não inserir cargo.
- Não inserir QR Code.
- Não inserir código de barras.
- Não criar frente/verso de crachá.
- Não trabalhar com dados de colaborador no MVP.

## Stack

- Backend: FastAPI, SQLAlchemy, SQLite no MVP, MediaPipe, OpenCV, Pillow e NumPy.
- Frontend: React, TypeScript, Tailwind e Konva.
- Storage: local em `input/`, `output/` e `debug/`.

## Memória

Antes de mudanças relevantes, consultar `.codex-memory/` e, se necessário, `C:\Users\bueno\Documents\CodexBrain\01 - Projetos\FLOWIMAGE`.

Ao final de prompts relevantes, atualizar:

- `.codex-memory/`
- `C:\Users\bueno\Documents\CodexBrain\01 - Projetos\FLOWIMAGE`

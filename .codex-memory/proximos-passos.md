# Próximos passos

## 2026-05-27 — Evolução do MVP

### Projeto

FLOWIMAGE

### Tipo

Proximos passos

### O que foi feito

Criada lista inicial de evolução após o MVP funcional.

### Arquivos alterados

- .codex-memory/proximos-passos.md

### Aprendizado

O próximo valor está em precisão visual do crop e revisão manual mais fluida, não em funcionalidades de crachá completo.

### Proximos passos

- Testar MediaPipe com fotos reais e ajustar defaults dos moldes.
- Criar importação CSV/XLSX para nomenclatura futura.
- Criar tela de presets de cor completa.
- Adicionar autenticação quando houver uso multiusuário.

## 2026-05-29 - Pos-auth

### Projeto

FLOWIMAGE

### Tipo

Proximos passos / Auth / Backend

### O que foi feito

Login e cadastro foram adicionados no frontend com Supabase Auth, mas os endpoints do backend ainda seguem acessiveis diretamente.

### Arquivos alterados

- frontend/src/auth/AuthProvider.tsx
- frontend/src/auth/ProtectedRoute.tsx
- frontend/src/pages/Login/Login.tsx

### Aprendizado

Proteger a interface melhora o fluxo de uso, mas nao substitui validacao de API quando houver dados sensiveis ou uso multiusuario real.

### Proximos passos

- Adicionar validacao de JWT Supabase no FastAPI para endpoints administrativos e de processamento, se o proximo foco for seguranca de API.

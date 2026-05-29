# Bugs

## 2026-05-27 — Fallback de detecção

### Projeto

FLOWIMAGE

### Tipo

Bug / Backend / Aprendizado

### O que foi feito

O detector tenta MediaPipe primeiro e usa OpenCV Haar Cascade como fallback quando MediaPipe não está disponível ou não detecta rosto.

### Arquivos alterados

- backend/app/services/face_detection/detector.py

### Aprendizado

O pipeline não deve falhar silenciosamente por dependência ausente; quando nenhum rosto é detectado, o item fica em revisão manual.

### Proximos passos

- Testar confiança e precisão com fotos reais de crachá.

## 2026-05-27 — Orientação EXIF e revisão manual

### Projeto

FLOWIMAGE

### Tipo

Bug / Backend / Frontend

### O que foi feito

Uploads agora são normalizados com `ImageOps.exif_transpose`, e detecção/debug/processamento leem a mesma orientação normalizada. A revisão manual passou a salvar claramente a imagem final no molde e exibir botão de download após o processamento.

### Arquivos alterados

- backend/app/storage/files.py
- backend/app/services/face_detection/detector.py
- backend/app/services/photo_processing/processor.py
- frontend/src/pages/Review/Review.tsx

### Aprendizado

Fotos de celular podem carregar orientação EXIF; se backend e detector leem a orientação de forma diferente, o crop pode parecer rotacionado em 90 graus.

### Proximos passos

- Validar com as fotos reais que antes rotacionavam ou não detectavam rosto.

## 2026-05-27 — Exportar ZIP por link

### Projeto

FLOWIMAGE

### Tipo

Bug / Backend

### O que foi feito

O endpoint de exportação ZIP do lote passou a aceitar `GET` além de `POST`, porque o frontend usa link de download direto.

### Arquivos alterados

- backend/app/api/jobs.py

### Aprendizado

Download por `<a href>` faz requisição GET; endpoints usados como link precisam aceitar GET ou o frontend precisa usar fetch/blob.

### Proximos passos

- Manter endpoints de download compatíveis com links diretos.

## 2026-05-27 - ZIP exportava uma imagem e download usava nome generico

### Projeto

FLOWIMAGE

### Tipo

Bug / Frontend / Backend / Exportacao

### O que foi feito

Corrigido o fluxo de nomes dos arquivos processados em memoria. O frontend agora deriva o nome final do arquivo enviado, o backend expoe `X-Filename` via CORS e o ZIP evita sobrescrever entradas com nomes repetidos.

### Arquivos alterados

- backend/app/main.py
- backend/app/api/process.py
- backend/app/services/photo_processing/memory_processor.py
- frontend/src/services/api.ts
- frontend/src/pages/ProcessPhoto/ProcessPhoto.tsx
- frontend/src/pages/BatchProcess/BatchProcess.tsx

### Aprendizado

Quando todos os blobs usam o mesmo fallback de nome, o JSZip sobrescreve os itens e o pacote parece baixar apenas uma imagem. Em processamento stateless, o nome final deve ser calculado no cliente a partir do arquivo original e validado antes de adicionar ao ZIP.

### Proximos passos

- Manter testes e2e de ZIP sempre que o fluxo de lote for alterado.

## 2026-05-27 - Real-ESRGAN deformava rosto em foto real

### Projeto

FLOWIMAGE

### Tipo

Bug / Imagem / IA

### O que foi feito

Corrigido o pipeline de melhoria de pixels para proteger a regiao facial. O Real-ESRGAN continua sendo usado na imagem, mas a area do rosto e recomposta com uma versao segura do pre-processamento, usando mascara de Face Mesh ou fallback por caixa facial.

### Arquivos alterados

- backend/app/services/quality_enhancement/realesrgan.py
- backend/app/services/photo_processing/memory_processor.py

### Aprendizado

Real-ESRGAN pode hallucinar ou deformar identidade facial em fotos pequenas/crops de cracha. Para documentos e crachas, a face deve ser preservada e receber apenas nitidez/contraste seguros.

### Proximos passos

- Testar com mais fotos reais e considerar deixar "Melhorar pixels" desligado por padrao se houver novos casos de alteracao facial.

## 2026-05-27 - Real-ESRGAN removido por deformar a imagem

### Projeto

FLOWIMAGE

### Tipo

Bug / Imagem / Decisao tecnica

### O que foi feito

Removido o Real-ESRGAN do pipeline e substituido por upscale seguro com OpenCV/Pillow: resize Lanczos, denoise leve, unsharp controlado e contraste minimo antes do ajuste final no molde.

### Arquivos alterados

- .env.example
- backend/app/core/config.py
- backend/app/api/process.py
- backend/app/services/photo_processing/memory_processor.py
- backend/app/services/quality_enhancement/safe_upscale.py
- frontend/src/pages/ProcessPhoto/ProcessPhoto.tsx
- frontend/src/pages/Review/Review.tsx
- frontend/src/pages/BatchProcess/BatchProcess.tsx

### Aprendizado

Para cracha/documento, ferramenta generativa de super-resolucao pode alterar identidade e deformar rosto. O modo padrao deve ser nao generativo e previsivel, mesmo que o ganho visual seja menor.

### Proximos passos

- Se precisar de outro upscaler IA no futuro, testar primeiro em conjunto real de fotos e bloquear qualquer modelo que altere Face Mesh/identidade.

## 2026-05-27 - Melhoria de pixels piorava foto original boa

### Projeto

FLOWIMAGE

### Tipo

Bug / Imagem / Qualidade

### O que foi feito

O modo "Melhorar pixels" foi desligado por padrao e limitado para nao aplicar denoise/nitidez em imagens que ja estao em tamanho suficiente ou que serao reduzidas para o molde.

### Arquivos alterados

- backend/app/services/quality_enhancement/safe_upscale.py
- frontend/src/pages/ProcessPhoto/ProcessPhoto.tsx
- frontend/src/pages/Review/Review.tsx
- frontend/src/pages/BatchProcess/BatchProcess.tsx

### Aprendizado

Quando a imagem original tem alta qualidade, o melhor resultado vem de crop e resize bem feitos, sem filtros adicionais. Upscale deve ser opcional e usado apenas em fotos pequenas.

### Proximos passos

- Avaliar desligar tambem Studio automatico por padrao se fotos de alta qualidade continuarem perdendo naturalidade.
## 2026-05-28 - Bordas no crop cabeca e ombros

### Projeto

FLOWIMAGE

### Tipo

Bug / Backend / Imagem

### O que foi feito

Corrigido o pipeline para que o modo `head_shoulders` nao use encaixe `contain` quando a foto original for menor que o molde. Tambem corrigido arredondamento do `crop_with_background`, que podia criar uma borda de 1 pixel com a cor de fundo do molde.

### Arquivos alterados

- backend/app/services/photo_processing/memory_processor.py
- backend/app/services/photo_processing/processor.py
- backend/tests/test_framing.py

### Aprendizado

No FlowImage, `contain` deve ser um modo explicito do molde. Para `head_shoulders`, a saida precisa preencher 100% do molde; quando o crop ja esta dentro da imagem, cortar direto da foto evita bordas geradas por canvas e arredondamento.

### Proximos passos

- Testar com fotos reais muito pequenas e rostos proximos das bordas.

## 2026-05-28 - Rolagem travada apos refinamento visual

### Projeto

FLOWIMAGE

### Tipo

Bug / UI / Responsividade

### O que foi feito

Corrigido travamento de rolagem causado pelo `overflow-hidden` aplicado globalmente em `.glass-panel`. O overflow foi removido da classe base e a rolagem vertical do `body` foi explicitada, mantendo cortes de conteudo apenas nos componentes que realmente declaram `overflow-hidden`.

### Arquivos alterados

- frontend/src/styles.css

### Aprendizado

Classes visuais reutilizaveis como `.glass-panel` nao devem impor `overflow-hidden` por padrao, porque paineis sticky com conteudo maior precisam de `overflow-auto` funcional. O corte visual deve ficar em cada componente especifico.

### Proximos passos

- Validar rolagem em revisao, lote e editor sempre que mexer no shell visual.

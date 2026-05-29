# Padrões aprendidos

## 2026-05-27 — Separação entre foto final e crachá

### Projeto

FLOWIMAGE

### Tipo

Aprendizado / Produto

### O que foi feito

Registrada a regra de produto: FlowImage exporta apenas a imagem tratada no molde de foto.

### Arquivos alterados

- AGENTS.md
- README.md
- docs/arquitetura.md

### Aprendizado

Qualquer funcionalidade de nome, cargo, QR Code, código de barras ou layout de crachá deve ser recusada ou movida para outro sistema.

### Proximos passos

- Manter essa regra nos próximos refinamentos de UI e API.

## 2026-05-27 — Não extrapolar imagem original no crop

### Projeto

FLOWIMAGE

### Tipo

Aprendizado / Processamento

### O que foi feito

Registrada a regra de processamento para respeitar os limites físicos da foto original.

### Arquivos alterados

- backend/app/services/framing/crop.py
- backend/app/services/photo_processing/processor.py

### Aprendizado

Ao adaptar fotos para moldes, o crop deve ficar dentro dos limites da imagem e imagens menores devem ser encaixadas no molde mantendo proporção.

### Proximos passos

- Criar opção futura para escolher entre preencher molde e conter imagem inteira.

## 2026-05-27 — Ajustes manuais precisam mostrar valor explícito

### Projeto

FLOWIMAGE

### Tipo

Aprendizado / UI

### O que foi feito

Registrado o padrão de UX da revisão manual: cada ajuste deve exibir valor numérico editável ao lado do slider.

### Arquivos alterados

- frontend/src/pages/Review/Review.tsx

### Aprendizado

Em ferramentas visuais, slider sem valor explícito gera insegurança; valor numérico visível facilita ajuste fino, auditoria e repetição do enquadramento.

### Proximos passos

- Salvar presets manuais por molde.

## 2026-05-27 — Detecção falhou não pode bloquear revisão manual

### Projeto

FLOWIMAGE

### Tipo

Aprendizado / Processamento / UX

### O que foi feito

Registrada a regra de que a automação deve marcar erro quando não detecta rosto, mas a revisão manual ainda deve gerar a foto final usando centro da imagem, zoom e offsets.

### Arquivos alterados

- backend/app/services/photo_processing/processor.py
- frontend/src/pages/Review/Review.tsx

### Aprendizado

Em ferramenta de tratamento de foto, falha de IA deve virar revisão manual editável, não bloqueio de exportação.

### Proximos passos

- Adicionar opção de desenhar caixa de rosto manualmente.

## 2026-05-27 — Fotos não devem ser persistidas no servidor

### Projeto

FLOWIMAGE

### Tipo

Aprendizado / Storage / Privacidade

### O que foi feito

Registrado que os fluxos de imagem do FlowImage devem ser stateless para arquivos: receber bytes, processar e devolver o resultado, sem salvar original, debug ou saída em diretórios do servidor.

### Arquivos alterados

- backend/app/api/process.py
- backend/app/services/photo_processing/memory_processor.py
- frontend/src/pages/BatchProcess/BatchProcess.tsx

### Aprendizado

Para este produto, privacidade e limpeza operacional são mais importantes que histórico de arquivos no servidor; histórico visual deve ficar no navegador ou em metadados sem imagem.

### Proximos passos

- Avaliar expiração/limpeza de blobs locais no frontend.

## 2026-05-27 - Tratamento adaptativo antes de presets

### Projeto

FLOWIMAGE

### Tipo

Aprendizado / Imagem / UX

### O que foi feito

Registrado o padrao de priorizar uma correcao automatica por analise da foto quando o objetivo e padronizar fotos de pessoas para cracha, deixando presets e sliders como ajuste fino.

### Arquivos alterados

- backend/app/services/color_adjustment/adaptive_studio.py
- frontend/src/pages/Review/Review.tsx

### Aprendizado

Para fotos heterogeneas, um preset unico tende a falhar; o caminho mais robusto e medir brilho, contraste, saturacao e dominante de cor da imagem final enquadrada, aplicar correcao leve e manter o usuario no controle com um toggle.

### Proximos passos

- Criar indicadores visuais simples do que o Studio automatico corrigiu em cada foto.

## 2026-05-27 - Upscale real sem persistir fotos

### Projeto

FLOWIMAGE

### Tipo

Aprendizado / Imagem / Privacidade

### O que foi feito

Registrado o padrao de integrar Real-ESRGAN com arquivos temporarios apenas durante a execucao, mantendo a regra de nao salvar fotos originais ou finais no servidor.

### Arquivos alterados

- backend/app/services/quality_enhancement/realesrgan.py
- backend/app/services/photo_processing/memory_processor.py

### Aprendizado

Ferramentas externas de super-resolucao normalmente exigem arquivo de entrada e saida; no FlowImage isso deve ser isolado com `TemporaryDirectory`, retornando `Image` em memoria e removendo os arquivos ao final.

### Proximos passos

- Medir tempo medio por imagem em lote para decidir limites por tamanho/resolucao.

## 2026-05-27 - Face Mesh para tratamento seletivo

### Projeto

FLOWIMAGE

### Tipo

Aprendizado / Imagem / IA

### O que foi feito

Registrado que MediaPipe Face Mesh deve ser usado como apoio para mascara facial e tratamento localizado, nao como ferramenta principal de super-resolucao.

### Arquivos alterados

- backend/app/services/face_detection/face_mesh.py
- backend/app/services/color_adjustment/adaptive_studio.py

### Aprendizado

Para fotos de cracha, o pipeline mais equilibrado e: enquadramento, Studio automatico com Face Mesh, ajustes manuais opcionais, Real-ESRGAN e redimensionamento final do molde.

### Proximos passos

- Medir ganho visual em fotos reais antes de aumentar a intensidade do tratamento localizado.

## 2026-05-27 - Preferir upscale nao generativo para crachas

### Projeto

FLOWIMAGE

### Tipo

Aprendizado / Imagem / Qualidade

### O que foi feito

Registrado que a melhoria de pixels do FlowImage deve priorizar resize deterministico e tratamento leve, evitando modelos generativos que alterem rosto.

### Arquivos alterados

- backend/app/services/quality_enhancement/safe_upscale.py

### Aprendizado

Em fotos para cracha, preservar identidade e geometria do rosto e mais importante que nitidez artificial. Upscale seguro com Lanczos/OpenCV e nitidez leve e preferivel a super-resolucao generativa sem controle.

### Proximos passos

- Criar comparacao lado a lado com fotos reais para ajustar intensidade do unsharp/denoise.

## 2026-05-28 - Score leve em vez de aprovacao operacional

### Projeto

FLOWIMAGE

### Tipo

Aprendizado / UX / Performance

### O que foi feito

Registrado o padrao de mostrar score de qualidade sem exigir aprovacao manual no fluxo de lote, reduzindo etapas e custo visual. A analise tambem deve evitar Face Mesh quando o objetivo for apenas score rapido.

### Arquivos alterados

- frontend/src/pages/BatchProcess/BatchProcess.tsx
- backend/app/services/photo_analysis/quality.py

### Aprendizado

Para processamento em lote, a melhor UX e uma fila objetiva com progresso, score, erro e acoes diretas. Aprovacao manual so deve voltar se houver uma etapa formal de auditoria, nao como requisito para exportar ZIP.

### Proximos passos

- Avaliar thresholds configuraveis de score para separar automaticamente itens que precisam de revisao.

## 2026-05-28 - Tratamento claro sem tom alaranjado

### Projeto

FLOWIMAGE

### Tipo

Aprendizado / Imagem / Cor

### O que foi feito

Criado acabamento de cor para clarear a imagem e neutralizar casts quentes/alaranjados depois do Studio automatico e dos presets.

### Arquivos alterados

- backend/app/services/color_adjustment/color_safety.py
- backend/app/services/color_adjustment/adaptive_studio.py
- backend/app/services/color_adjustment/adjust.py

### Aprendizado

Em foto para cracha, presets e Studio automatico nao devem aquecer a pele/fundo. Temperatura positiva de preset deve ser bloqueada ou neutralizada, e o acabamento final deve clarear sombras sem aumentar saturacao laranja.

### Proximos passos

- Comparar a intensidade do neutralizador em fotos reais com pele clara, media e escura.

## 2026-05-28 - Acabamento claro com contraste e nitidez

### Projeto

FLOWIMAGE

### Tipo

Aprendizado / Imagem / Qualidade

### O que foi feito

Refinado o acabamento final para aplicar contraste local e nitidez depois do clareamento e da neutralizacao de tom quente.

### Arquivos alterados

- backend/app/services/color_adjustment/color_safety.py
- backend/app/services/color_adjustment/adaptive_studio.py

### Aprendizado

Para fotos de cracha, o resultado desejado e claro, mas nao lavado. O acabamento deve preservar a media de luminancia alta e expandir contraste no canal de luz, com nitidez leve via unsharp, sem reaquecer a imagem.

### Proximos passos

- Ajustar a intensidade se fotos reais muito granuladas ficarem com ruido evidente.

## 2026-05-28 - Reducao de estouro no tratamento

### Projeto

FLOWIMAGE

### Tipo

Aprendizado / Imagem / Qualidade

### O que foi feito

Reduzida a intensidade do clareamento, contraste local e nitidez do acabamento final, adicionando protecao mais forte contra altas luzes estouradas.

### Arquivos alterados

- backend/app/services/color_adjustment/color_safety.py
- backend/app/services/color_adjustment/adaptive_studio.py

### Aprendizado

O acabamento do FlowImage deve manter luminancia clara, mas controlar qualquer pixel acima de altas luzes. Metrica util no smoke: percentual de pixels com luma acima de 235 e 245 deve ficar baixo ou zerado em fotos comuns.

### Proximos passos

- Criar controle de intensidade do Studio automatico se houver muitas preferencias diferentes entre clientes.

## 2026-05-28 - Contraste mais natural no Studio automatico

### Projeto

FLOWIMAGE

### Tipo

Aprendizado / Imagem / Qualidade

### O que foi feito

Reduzido o contraste local, o ganho global de contraste e a nitidez do acabamento final para evitar aspecto duro/estranho nas fotos.

### Arquivos alterados

- backend/app/services/color_adjustment/color_safety.py
- backend/app/services/color_adjustment/adaptive_studio.py

### Aprendizado

No FlowImage, contraste alto em fotos de cracha fica artificial rapidamente. O tratamento deve priorizar claridade, neutralidade de cor e nitidez leve, com contraste moderado.

### Proximos passos

- Adicionar seletor de intensidade do Studio automatico: suave, padrao e forte.

## 2026-05-28 - Clareamento adaptativo por luminancia

### Projeto

FLOWIMAGE

### Tipo

Aprendizado / Imagem / Qualidade

### O que foi feito

Ajustado o acabamento final para clarear um pouco mais de forma adaptativa: fotos escuras recebem limite maior de lift, fotos medias recebem lift moderado e fotos claras quase nao sao alteradas.

### Arquivos alterados

- backend/app/services/color_adjustment/color_safety.py

### Aprendizado

O clareamento do FlowImage deve depender da luminancia media da imagem, nao de um ganho fixo. Isso evita estourar fotos claras e melhora fotos escuras sem mudar o contraste suavizado.

### Proximos passos

- Expor intensidade do Studio automatico se o usuario quiser calibrar por cliente ou lote.

## 2026-05-28 - Aumento de clareamento adaptativo

### Projeto

FLOWIMAGE

### Tipo

Aprendizado / Imagem / Qualidade

### O que foi feito

Aumentada a meta de luminancia do acabamento adaptativo e os limites de lift por faixa, preservando protecao contra highlights.

### Arquivos alterados

- backend/app/services/color_adjustment/color_safety.py

### Aprendizado

Quando o usuario pedir imagem mais clara, ajustar a meta de luminancia e os limites por faixa e validar `high_pct` e `clip_pct`; nao aumentar contraste junto.

### Proximos passos

- Criar configuracao visual de intensidade de clareamento para evitar calibragens manuais no codigo.

## 2026-05-28 - Luminancia calibrada em 165

### Projeto

FLOWIMAGE

### Tipo

Aprendizado / Imagem / Qualidade

### O que foi feito

Calibrada a meta interna de luminancia e o limite de lift da faixa media para atingir luminancia real proxima de 165.12 no smoke de processamento, sem clipping.

### Arquivos alterados

- backend/app/services/color_adjustment/color_safety.py

### Aprendizado

O valor interno de `target_luma` nao corresponde exatamente a luminancia final, porque neutralizacao, contraste e protecao de highlights reduzem o ganho. Para calibrar, medir a saida final pelo endpoint e ajustar tambem `max_lift`.

### Proximos passos

- Transformar a meta de luminancia em configuracao do Studio automatico.

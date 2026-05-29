# Funcionalidades

## 2026-05-27 — Fluxo de molde, processamento e lote

### Projeto

FLOWIMAGE

### Tipo

Funcionalidade

### O que foi feito

Criadas telas de dashboard, lista/editor de moldes, processamento individual, processamento em lote e revisão manual.

### Arquivos alterados

- frontend/src/pages/
- frontend/src/services/api.ts
- backend/app/api/

### Aprendizado

O fluxo mínimo validável é cadastrar molde, selecionar molde, enviar foto, processar, revisar debug e baixar a imagem final.

### Proximos passos

- Melhorar revisão manual para reaproveitar item já enviado sem novo upload.

## 2026-05-27 — Crop respeitando limites da imagem

### Projeto

FLOWIMAGE

### Tipo

Funcionalidade / Backend / Processamento

### O que foi feito

O cálculo de crop passou a ser limitado ao tamanho real da imagem original. Quando a foto enviada é menor que o molde nos dois eixos, ela é encaixada inteira dentro do molde, mantendo proporção.

### Arquivos alterados

- backend/app/services/framing/crop.py
- backend/app/services/photo_processing/processor.py
- backend/tests/test_framing.py

### Aprendizado

O processamento não deve extrapolar área fora da imagem original; se a foto for menor que o molde, a saída mantém o tamanho do molde e ajusta a foto dentro dele sem distorção.

### Proximos passos

- Validar visualmente com fotos pequenas e moldes maiores.

## 2026-05-27 — Auditoria visual e refinamento das telas críticas

### Projeto

FLOWIMAGE

### Tipo

Funcionalidade / UI / Qualidade

### O que foi feito

As telas de processamento individual e revisão manual foram reorganizadas com painéis mais claros, preview do molde, status de imagem gerada/salva e download do resultado. Foi feita auditoria visual com Playwright em desktop e mobile.

### Arquivos alterados

- frontend/src/components/layout/AppLayout.tsx
- frontend/src/pages/ProcessPhoto/ProcessPhoto.tsx
- frontend/src/pages/Review/Review.tsx
- frontend/package.json

### Aprendizado

Previews com `aspect-ratio` e `min-height` podem causar overflow horizontal no mobile; para áreas de preview operacional, usar largura fixa ao container e altura controlada.

### Proximos passos

- Evoluir a tela de moldes para edição visual mais rica.

## 2026-05-27 — Interface moderna com gradiente e ajustes legíveis

### Projeto

FLOWIMAGE

### Tipo

Funcionalidade / UI / Qualidade

### O que foi feito

Criada uma nova linguagem visual com fundo em gradiente, sidebar escura em gradiente, painéis glass, cards mais modernos e botões com gradiente. A revisão manual foi refeita com preview responsivo sem canvas fixo e campos numéricos visíveis para cada ajuste.

### Arquivos alterados

- frontend/src/styles.css
- frontend/src/components/layout/AppLayout.tsx
- frontend/src/components/ui/Button.tsx
- frontend/src/components/ui/Field.tsx
- frontend/src/pages/Dashboard/Dashboard.tsx
- frontend/src/pages/Templates/Templates.tsx
- frontend/src/pages/TemplateEditor/TemplateEditor.tsx
- frontend/src/pages/ProcessPhoto/ProcessPhoto.tsx
- frontend/src/pages/BatchProcess/BatchProcess.tsx
- frontend/src/pages/Review/Review.tsx

### Aprendizado

Na revisão manual, controles de ajuste precisam ter valores numéricos editáveis e não depender apenas do slider; canvas fixo pode causar bugs visuais ao carregar imagens.

### Proximos passos

- Criar pré-visualização interativa real do crop antes de salvar.

## 2026-05-27 — Refinamentos operacionais sem deploy

### Projeto

FLOWIMAGE

### Tipo

Funcionalidade / Backend / Frontend / UI

### O que foi feito

Implementados refinamentos solicitados sem deploy: preview interativo na revisão com drag e zoom por scroll, presets manuais de ajuste em localStorage, tela completa de presets de cor, fallback manual quando rosto não é detectado, comparação antes/depois, histórico local de processamentos, reprocessamento de item no lote, CSV opcional para nome de saída e modo de crop conter/preencher no molde.

### Arquivos alterados

- backend/app/services/photo_processing/processor.py
- backend/app/api/jobs.py
- backend/app/schemas/job.py
- frontend/src/pages/Review/Review.tsx
- frontend/src/pages/ProcessPhoto/ProcessPhoto.tsx
- frontend/src/pages/BatchProcess/BatchProcess.tsx
- frontend/src/pages/ColorPresets/ColorPresets.tsx
- frontend/src/pages/Dashboard/Dashboard.tsx
- frontend/src/pages/TemplateEditor/TemplateEditor.tsx
- frontend/src/services/api.ts
- frontend/src/utils/

### Aprendizado

O fluxo operacional precisa permitir continuidade mesmo quando a detecção automática falha; a revisão manual deve conseguir gerar imagem centralizada/ajustada no molde.

### Proximos passos

- Validar preview interativo com fotos reais de baixa qualidade.

## 2026-05-27 — Remoção do arraste manual na revisão

### Projeto

FLOWIMAGE

### Tipo

Funcionalidade / UI

### O que foi feito

Removida a interação de arrastar imagem e zoom por scroll da revisão manual. A tela voltou a priorizar o enquadramento automático por detecção de rosto, mantendo apenas sliders e valores para ajuste fino.

### Arquivos alterados

- frontend/src/pages/Review/Review.tsx

### Aprendizado

Para este produto, o fluxo principal deve ser automático: localizar rosto e calcular crop; interação manual por arraste adicionou complexidade visual sem ganho prático.

### Proximos passos

- Melhorar a visualização do crop automático e do debug sem criar controle manual excessivo.

## 2026-05-27 — Progresso de upload e processamento no lote

### Projeto

FLOWIMAGE

### Tipo

Funcionalidade / Frontend / Backend

### O que foi feito

O processamento em lote passou a exibir fila com progresso individual de upload e processamento. As imagens são enviadas uma por vez com XMLHttpRequest, entram na lista conforme concluem o upload e são processadas item por item, atualizando o status em tempo real.

### Arquivos alterados

- backend/app/api/jobs.py
- frontend/src/services/api.ts
- frontend/src/pages/BatchProcess/BatchProcess.tsx

### Aprendizado

Para barra de progresso real de upload no navegador, `fetch` não é suficiente; usar `XMLHttpRequest.upload.onprogress` ou outro cliente com evento de progresso.

### Proximos passos

- Adicionar cancelamento de upload/processamento.

## 2026-05-27 - Studio automatico adaptativo

### Projeto

FLOWIMAGE

### Tipo

Funcionalidade / Backend / Frontend / Imagem

### O que foi feito

Implementado tratamento "Studio automatico" que analisa a propria imagem para ajustar balanco de branco, sombras, contraste, brilho, saturacao e nitidez de forma conservadora, sem depender exclusivamente de preset fixo.

### Arquivos alterados

- backend/app/services/color_adjustment/adaptive_studio.py
- backend/app/services/photo_processing/memory_processor.py
- backend/app/api/process.py
- backend/app/schemas/process.py
- frontend/src/services/api.ts
- frontend/src/pages/ProcessPhoto/ProcessPhoto.tsx
- frontend/src/pages/Review/Review.tsx
- frontend/src/pages/BatchProcess/BatchProcess.tsx
- frontend/src/utils/manualPresets.ts

### Aprendizado

O tratamento adaptativo deve rodar depois do crop/encaixe e antes da mascara do molde, mantendo o fluxo stateless em memoria e permitindo desligar a automacao quando o usuario quiser controle manual puro.

### Proximos passos

- Separar no futuro metricas especificas do rosto quando houver landmarks confiaveis.

## 2026-05-27 - Melhoria real de pixels com Real-ESRGAN

### Projeto

FLOWIMAGE

### Tipo

Funcionalidade / Imagem / Backend / Frontend

### O que foi feito

Integrado Real-ESRGAN ncnn Vulkan como modo "Melhorar pixels" para aplicar upscale 2x e restauracao perceptual antes do redimensionamento final do molde.

### Arquivos alterados

- .env.example
- backend/app/core/config.py
- backend/app/api/process.py
- backend/app/schemas/process.py
- backend/app/services/photo_processing/memory_processor.py
- backend/app/services/quality_enhancement/realesrgan.py
- frontend/src/services/api.ts
- frontend/src/pages/ProcessPhoto/ProcessPhoto.tsx
- frontend/src/pages/Review/Review.tsx
- frontend/src/pages/BatchProcess/BatchProcess.tsx
- frontend/src/utils/manualPresets.ts
- tools/realesrgan/realesrgan-ncnn-vulkan.exe

### Aprendizado

Para efeito proximo a Topaz no MVP local, o caminho pratico e Real-ESRGAN ncnn Vulkan rodando por subprocesso em diretorio temporario, sem persistir fotos no backend.

### Proximos passos

- Avaliar um modo rapido/desligado por padrao em lotes muito grandes se o tempo de processamento ficar alto.

## 2026-05-27 - MediaPipe Face Mesh no Studio automatico

### Projeto

FLOWIMAGE

### Tipo

Funcionalidade / Imagem / IA

### O que foi feito

Adicionado MediaPipe Face Mesh para criar mascara facial no resultado enquadrado e aplicar correcao localizada de brilho, contraste, saturacao e nitidez no rosto dentro do Studio automatico.

### Arquivos alterados

- backend/app/services/face_detection/face_mesh.py
- backend/app/services/color_adjustment/adaptive_studio.py
- backend/app/services/photo_processing/memory_processor.py

### Aprendizado

Face Mesh nao substitui Real-ESRGAN para melhorar pixels, mas melhora a qualidade perceptiva por permitir tratamento seletivo do rosto sem afetar tanto fundo, roupa e bordas do molde.

### Proximos passos

- Avaliar se vale expor um indicador "Face Mesh detectado" na revisao manual.

## 2026-05-28 - Melhorias de prioridade alta do fluxo de fotos

### Projeto

FLOWIMAGE

### Tipo

Funcionalidade / Frontend / Backend / Qualidade

### O que foi feito

Implementado endpoint de analise de qualidade, score de confianca, avisos de nitidez/luz/rosto, painel de qualidade no processamento individual, fila de lote com analise por item, aprovacao manual, reprocessamento, remocao e exportacao de aprovadas com fallback para todos os processados.

### Arquivos alterados

- backend/app/api/process.py
- backend/app/schemas/process.py
- backend/app/services/photo_analysis/quality.py
- backend/app/services/face_detection/face_mesh.py
- backend/app/services/photo_processing/memory_processor.py
- frontend/src/types/index.ts
- frontend/src/services/api.ts
- frontend/src/pages/ProcessPhoto/ProcessPhoto.tsx
- frontend/src/pages/BatchProcess/BatchProcess.tsx

### Aprendizado

Para o FlowImage, a prioridade antes do deploy e visibilidade de qualidade e controle operacional do lote; o usuario precisa saber quais fotos estao boas, revisar problemas e exportar sem depender de arquivos salvos no servidor.

### Proximos passos

- Aplicar o mesmo painel de qualidade na tela de revisao manual e criar presets de processamento.

## 2026-05-28 - Lote sem aprovacao e visual roxo/branco

### Projeto

FLOWIMAGE

### Tipo

Funcionalidade / UI / Qualidade

### O que foi feito

Removida a aprovacao manual no lote, mantendo apenas score de qualidade, reprocessamento, remocao e download. O ZIP passou a exportar todos os itens processados no navegador. O painel de molde/configuracoes do lote recebeu limite de altura com scroll interno, e a revisao manual foi ajustada para que foto original e resultado final nao estiquem junto com a barra lateral. A identidade visual foi refinada para roxo e branco.

### Arquivos alterados

- frontend/src/pages/BatchProcess/BatchProcess.tsx
- frontend/src/pages/Review/Review.tsx
- frontend/src/pages/ProcessPhoto/ProcessPhoto.tsx
- frontend/src/components/layout/AppLayout.tsx
- frontend/src/components/ui/Button.tsx
- frontend/src/styles.css
- frontend/tailwind.config.js
- backend/app/services/photo_analysis/quality.py

### Aprendizado

No FlowImage, o controle de aprovacao no lote adiciona atrito; para o fluxo atual basta score visivel e acoes de baixar, reprocessar ou remover. Analise de qualidade deve evitar etapas caras quando o usuario quer preservar tempo de processamento.

### Proximos passos

- Refinar ainda mais a tela de dashboard com a mesma linguagem roxo/branco.

## 2026-05-28 - Interface sem card primario e preview fixo

### Projeto

FLOWIMAGE

### Tipo

Funcionalidade / UI / Responsividade

### O que foi feito

Removidos os cards primarios com titulos grandes dos modulos principais. As telas passaram a usar uma toolbar compacta sem card. No modulo Processar, os controles e o painel de preview foram separados com comportamento sticky para a imagem nao descer junto com a rolagem do formulario. A navegacao mobile passou a exibir todos os modulos em barra horizontal.

### Arquivos alterados

- frontend/src/styles.css
- frontend/src/components/layout/AppLayout.tsx
- frontend/src/pages/Dashboard/Dashboard.tsx
- frontend/src/pages/Templates/Templates.tsx
- frontend/src/pages/TemplateEditor/TemplateEditor.tsx
- frontend/src/pages/ColorPresets/ColorPresets.tsx
- frontend/src/pages/ProcessPhoto/ProcessPhoto.tsx
- frontend/src/pages/BatchProcess/BatchProcess.tsx
- frontend/src/pages/Review/Review.tsx

### Aprendizado

Para o FlowImage, cards de titulo grandes ocupam espaco sem ajudar o fluxo operacional. Toolbars compactas deixam a interface mais objetiva, e previews de imagem devem ter altura e rolagem independentes dos paineis de controle.

### Proximos passos

- Compactar ainda mais a revisao manual em mobile com abas ou grupos recolhaveis.

## 2026-05-28 - Limpeza de textos auxiliares

### Projeto

FLOWIMAGE

### Tipo

UI / Conteudo / Responsividade

### O que foi feito

Removidos subtitulos e frases auxiliares sem necessidade operacional nas telas principais, incluindo descricoes como localizacao automatica de rosto, explicacoes de backend, textos de apoio dos toggles e fallbacks "sem descricao".

### Arquivos alterados

- frontend/src/styles.css
- frontend/src/pages/Dashboard/Dashboard.tsx
- frontend/src/pages/Templates/Templates.tsx
- frontend/src/pages/TemplateEditor/TemplateEditor.tsx
- frontend/src/pages/ColorPresets/ColorPresets.tsx
- frontend/src/pages/ProcessPhoto/ProcessPhoto.tsx
- frontend/src/pages/BatchProcess/BatchProcess.tsx
- frontend/src/pages/Review/Review.tsx

### Aprendizado

No FlowImage, a interface deve priorizar labels e acoes diretas. Textos explicativos repetidos ou internos ao sistema reduzem a sensacao profissional e devem sair das telas operacionais.

### Proximos passos

- Revisar se textos de estado vazio ainda devem ser reduzidos para icones ou contadores.

## 2026-05-28 - Salvar fixo, nome do lote e visual moderno

### Projeto

FLOWIMAGE

### Tipo

Funcionalidade / UI / Lote

### O que foi feito

Tornadas as toolbars sticky e reposicionados os botoes principais de salvar para o topo em revisao manual, editor de molde e presets de cor. Adicionado campo "Nome do lote" no processamento em lote para definir o nome do ZIP exportado. Refinado o visual com fundo em grid sutil, cards mais modernos, inputs arredondados, botoes com microinteracao e melhor separacao de paineis.

### Arquivos alterados

- frontend/src/styles.css
- frontend/src/components/ui/Button.tsx
- frontend/src/components/ui/Field.tsx
- frontend/src/pages/Review/Review.tsx
- frontend/src/pages/ColorPresets/ColorPresets.tsx
- frontend/src/pages/TemplateEditor/TemplateEditor.tsx
- frontend/src/pages/BatchProcess/BatchProcess.tsx
- frontend/src/pages/ProcessPhoto/ProcessPhoto.tsx

### Aprendizado

Em telas operacionais longas do FlowImage, a acao principal de salvar precisa ficar na toolbar fixa para reduzir rolagem. O nome do lote deve controlar diretamente o nome do ZIP no navegador, sem dependencia do backend.

### Proximos passos

- Avaliar modo compacto/mobile para a revisao manual, reduzindo altura do painel de ajustes.

## 2026-05-28 - Reestrutura visual completa

### Projeto

FLOWIMAGE

### Tipo

UI / Funcionalidade / Aprendizado

### O que foi feito

Alterada a estrutura visual principal do sistema: a sidebar fixa foi removida, a navegacao passou para um header superior com abas em formato de pilula, as barras de modulo ganharam gradiente roxo/branco e os paineis operacionais foram redesenhados com glass, sombras e espacamento mais moderno.

### Arquivos alterados

- frontend/src/components/layout/AppLayout.tsx
- frontend/src/styles.css
- frontend/src/components/ui/Button.tsx
- frontend/src/components/ui/Field.tsx
- frontend/src/pages/Review/Review.tsx
- frontend/src/pages/ColorPresets/ColorPresets.tsx
- frontend/src/pages/TemplateEditor/TemplateEditor.tsx
- frontend/src/pages/BatchProcess/BatchProcess.tsx
- frontend/src/pages/ProcessPhoto/ProcessPhoto.tsx

### Aprendizado

Quando o usuario pedir que o visual "mudou nada", a resposta correta no FlowImage e alterar a arquitetura perceptivel da interface, nao apenas cores. Header, navegacao, toolbar, cards e hierarquia precisam mudar juntos para a diferenca ficar clara.

### Proximos passos

- Evoluir a revisao manual para uma composicao mais compacta em mobile, mantendo preview e salvar sempre acessiveis.

## 2026-05-28 - Revisao com preview automatico e tratamento avancado

### Projeto

FLOWIMAGE

### Tipo

Funcionalidade / UI / Processamento

### O que foi feito

A tela de revisao passou a atualizar o resultado automaticamente apos mudancas nos ajustes finos, sem depender do clique em salvar. Foi adicionado botao claro de download na toolbar e os controles de tratamento foram ampliados com balanco automatico, temperatura, sombras, recuperacao de luz, gamma, clareza e vibrance, alem de brilho, contraste, saturacao e nitidez.

### Arquivos alterados

- backend/app/schemas/process.py
- backend/app/services/color_adjustment/adjust.py
- frontend/src/pages/Review/Review.tsx
- frontend/src/utils/manualPresets.ts

### Aprendizado

Na revisao manual do FlowImage, ajustes finos precisam ter resposta automatica com debounce para parecerem editor de imagem. Botoes dentro de toolbar roxa devem usar fundo claro ou alto contraste, nunca link escuro solto.

### Proximos passos

- Avaliar preview local com canvas para resposta visual imediata enquanto o backend conclui o processamento final.

## 2026-05-28 - Melhoramento de pixels nao generativo

### Projeto

FLOWIMAGE

### Tipo

Funcionalidade / Imagem / Backend

### O que foi feito

Refeito o modo "Melhorar pixels" para usar resize progressivo, reducao leve de ruido/croma e nitidez adaptativa em luminancia com mascara de borda e controle anti-halo. O fluxo continua nao generativo para evitar deformar rosto ou alterar identidade.

### Arquivos alterados

- backend/app/services/quality_enhancement/safe_upscale.py
- backend/tests/test_quality_enhancement.py

### Aprendizado

No FlowImage, melhoramento de pixel deve aumentar detalhe perceptivel sem inventar textura. A abordagem segura e trabalhar em luminancia, aplicar nitidez apenas onde ha borda/detalhe real e limitar deslocamento de luma para evitar halos.

### Proximos passos

- Testar o novo modo em mais fotos reais pequenas e fotos grandes reduzidas para o molde.

## 2026-05-28 - Ajustes finos com resposta perceptivel

### Projeto

FLOWIMAGE

### Tipo

Funcionalidade / Imagem / Backend

### O que foi feito

Recalibrados os controles manuais de tratamento para que a diferenca seja perceptivel. O pipeline manual passou a aplicar os sliders depois da normalizacao base, evitando que o acabamento claro/neutro apague o efeito. Foram reforcados temperatura, sombras, recuperacao de luz, gamma, clareza, vibrance e contraste em luminancia.

### Arquivos alterados

- backend/app/services/color_adjustment/adjust.py
- backend/tests/test_manual_adjustments.py

### Aprendizado

Em editor visual, sliders precisam ter efeito claramente perceptivel em toda a faixa util. No FlowImage, o acabamento anti-alaranjado deve ficar como trava final, mas nao pode sobrescrever brilho, contraste e detalhe escolhidos pelo usuario.

### Proximos passos

- Comparar a sensibilidade dos sliders com fotos reais claras, escuras e com baixa nitidez.

## 2026-05-28 - Refinamento visual premium

### Projeto

FLOWIMAGE

### Tipo

UI / Design / Responsividade

### O que foi feito

Refinado o design geral do FlowImage com header em container flutuante, navegacao em barra unificada, fundo angular roxo/branco, toolbars com textura sutil, paineis com linha de luz, botoes e campos mais robustos, cards de dashboard e moldes mais premium e areas de preview com palco visual para imagens e transparencias.

### Arquivos alterados

- frontend/src/components/layout/AppLayout.tsx
- frontend/src/components/ui/Button.tsx
- frontend/src/components/ui/Field.tsx
- frontend/src/styles.css
- frontend/src/pages/Dashboard/Dashboard.tsx
- frontend/src/pages/Templates/Templates.tsx
- frontend/src/pages/ProcessPhoto/ProcessPhoto.tsx
- frontend/src/pages/BatchProcess/BatchProcess.tsx
- frontend/src/pages/TemplateEditor/TemplateEditor.tsx
- frontend/src/pages/Review/Review.tsx

### Aprendizado

No FlowImage, a sensacao de sistema incompleto vinha mais do shell visual e das areas vazias do que dos componentes isolados. Header, fundo, cards, botoes, inputs, toolbars e previews precisam carregar a mesma identidade roxo/branco.

### Proximos passos

- Revisar estados com fotos reais carregadas para ajustar contraste do palco de preview quando houver imagem transparente ou fundo branco.

## 2026-05-29 - Login e cadastro com Supabase Auth

### Projeto

FLOWIMAGE

### Tipo

Funcionalidade / Auth / Frontend

### O que foi feito

Adicionada autenticacao no frontend com Supabase Auth. A tela de login passou a permitir entrada e cadastro por email/senha, as rotas internas ficaram protegidas e o layout ganhou botao de sair com exibicao do email do usuario.

### Arquivos alterados

- frontend/src/auth/AuthProvider.tsx
- frontend/src/auth/ProtectedRoute.tsx
- frontend/src/services/supabase.ts
- frontend/src/pages/Login/Login.tsx
- frontend/src/App.tsx
- frontend/src/main.tsx
- frontend/src/components/layout/AppLayout.tsx

### Aprendizado

Para o FlowImage hospedado em Cloudflare + Render + Supabase, Supabase Auth e o caminho mais simples para login/cadastro sem introduzir Firebase em paralelo. A protecao atual e do frontend; bloqueio de API por JWT deve ser uma etapa separada se o backend precisar recusar chamadas diretas.

### Proximos passos

- Implementar validacao JWT no backend quando o sistema precisar de seguranca de API alem da interface.

## 2026-05-29 - Interface baseada em gemini_ui

### Projeto

FLOWIMAGE

### Tipo

Funcionalidade / UI / Frontend

### O que foi feito

Refeito o shell visual seguindo a referencia `gemini_ui`: login em tela dividida, sidebar branca fixa, header branco com busca, usuario e alerta, fundo slate claro, botoes e campos mais simples e cards brancos com borda cinza.

### Arquivos alterados

- frontend/src/components/layout/AppLayout.tsx
- frontend/src/pages/Login/Login.tsx
- frontend/src/components/ui/Button.tsx
- frontend/src/components/ui/Field.tsx
- frontend/src/styles.css

### Aprendizado

A nova direcao visual do FlowImage e mais SaaS administrativo classico: sidebar + header fixos, fundo claro, menos glass/gradientes no app interno e gradiente concentrado no login.

### Proximos passos

- Refinar pagina por pagina para aproximar ainda mais cards e tabelas do layout de referencia.

## 2026-05-29 - Backend no Orange Pi

### Projeto

FLOWIMAGE

### Tipo

Funcionalidade / Infra / Deploy

### O que foi feito

Configurado Orange Pi em `192.168.2.109` para rodar o backend FlowImage via `systemd` em `/opt/flowimage/backend`. O serviço `flowimage-backend` ficou ativo na porta `8000`, conectado ao Supabase e validado com `/health`, listagem de moldes e processamento de imagem.

### Arquivos alterados

- backend/requirements-orangepi.txt
- docs/deploy-orangepi.md

### Aprendizado

No Orange Pi com Ubuntu 22.04 aarch64 e Python 3.10, `mediapipe==0.10.20` nao possui wheel disponivel; a versao validada foi `mediapipe==0.10.18`. Para esse hardware, manter backend em systemd e venv e mais previsivel que Docker com instalacao no start.

### Proximos passos

- Configurar Cloudflare Tunnel estavel para expor o backend do Orange Pi com HTTPS.

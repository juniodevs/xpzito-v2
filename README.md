# xpzito-v2

> **Nota:** Este é o repositório da nova versão do projeto (v2). A versão base / antiga do projeto pode ser encontrada no repositório originário: [XPzito (Antigo)](https://github.com/juniodevs/XPzito).

Aplicativo desktop desenvolvido com Electron, React, TypeScript e Vite. O projeto funciona como um gerenciador de cronômetros e mídia, oferecendo uma tela de configuração e uma tela de visualização dedicada.

## Recursos

- Cronômetro do bot com suporte a iniciar, pausar, retomar e cancelar
- Presets rápidos de tempo (15s, 30s, 5m, 20m)
- Modo de preview para testar a animação sem alterar o cronômetro
- Viewer para OBS com animações de entrada e saída configuráveis
- Animação de boca do bot sincronizada com o volume do áudio
- Sensibilidade da boca (threshold) ajustável pelo painel de controle
- Biblioteca de mídia: upload e remoção de sprites (Idle e Talking) e áudios (transições e falas aleatórias)
- Servidor local (Express + WebSocket) na porta 4005 para integração com OBS
- Link da Browser Source com botão de copiar direto no painel
- Content-Security-Policy configurada para bloquear recursos externos
- Arquitetura de múltiplas janelas (Configuração e Visualização)

## Tecnologias

- Electron
- React
- TypeScript
- Vite
- Tailwind CSS
- GSAP (animações)
- Howler.js (reprodução e análise de áudio)
- Express + ws (servidor local e WebSocket)

## Criador & Links
- **Autor**: [juniodevs](https://github.com/juniodevs)
- **Repositório do Projeto**: [xpzito-v2](https://github.com/juniodevs/xpzito-v2)

## Como executar

1. Instale as dependências:
   npm install

2. Inicie em modo de desenvolvimento:
   npm run dev

3. Gere a build de produção:
   npm run build

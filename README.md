# Assistente Blip Desk - Brayan

Extensão para Google Chrome/Edge criada por Brayan para auxiliar atendimentos no Blip Desk.

Ela unifica duas ferramentas em uma só:

- Apresentação Automática
- Gerador de Protocolo

## Recursos

### Apresentação Automática

- Detecta novos atendimentos no Blip Desk.
- Abre o atendimento automaticamente.
- Envia uma mensagem de apresentação configurável.
- Permite editar a mensagem pelo popup da extensão.
- Permite salvar uma mensagem como novo padrão.
- Permite restaurar o padrão salvo.
- Exibe histórico de tickets atendidos, com número do ticket e horário de envio.
- Mostra um indicador flutuante no Blip com status do monitor.
- Permite pausar e retomar o monitor.

### Gerador de Protocolo

- Exibe um painel flutuante dentro do Blip Desk.
- Captura cliente, ticket e telefone quando disponíveis.
- Permite copiar dados individualmente.
- Gera protocolo de abertura por motivo de atendimento.
- Exibe fechamento sugerido por motivo.
- Permite editar o fechamento antes de copiar.
- Ao copiar o fechamento editado, restaura automaticamente o texto original.
- Possui alternância entre tema escuro e tema claro.
- O tema claro foi ajustado para combinar melhor com o visual do Blip.

## Instalação

1. Baixe ou clone este repositório.
2. Abra o Chrome ou Edge.
3. Acesse:

   - Chrome: `chrome://extensions`
   - Edge: `edge://extensions`

4. Ative o **Modo do desenvolvedor**.
5. Clique em **Carregar sem compactação**.
6. Selecione a pasta da extensão.
7. Abra ou atualize o Blip Desk.

## Como Usar

### Popup da extensão

Clique no ícone da extensão no navegador.

Na aba **Apresentação**, você pode:

- editar a mensagem automática;
- salvar a mensagem;
- salvar a mensagem como padrão;
- restaurar o padrão;
- visualizar o histórico de tickets.

Na aba **Protocolo**, você vê um resumo das funções do painel de protocolo.

### Dentro do Blip Desk

Ao abrir o Blip Desk:

- o monitor de apresentação automática fica ativo;
- o painel de protocolo aparece como painel flutuante;
- o protocolo pode ser gerado e copiado conforme o motivo selecionado.

## Estrutura dos Arquivos

- `manifest.json`: configuração da extensão.
- `popup.html`: interface do popup.
- `popup.js`: lógica do popup.
- `apresentacao.js`: automação de novos atendimentos e histórico.
- `protocolo.js`: painel e geração de protocolos.
- `texts.js`: modelos de abertura e fechamento.
- `icon.png`: ícone da extensão.

## Autoria

Criado por Brayan.

Assinatura de autoria:

`BRYAN-ORIG-12de19360097a0ce`

## Observação

Esta extensão foi feita para uso no Blip Desk e pode precisar de ajustes caso a interface do Blip seja alterada futuramente.

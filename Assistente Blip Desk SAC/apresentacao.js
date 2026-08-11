/*
 * Arquivo comentado didaticamente em português.
 * Os comentários explicam o fluxo geral, DOM, eventos, armazenamento, cache e funções importantes.
 * A lógica original foi preservada: nomes, seletores, chaves, textos funcionais e URLs não foram alterados.
 */
// ============================================================
//  Apresentação Automática - Brayan | content.js
//  Autor: Brayan
//  Criado em: 2026
//  Assinatura de autoria (não remover): BRYAN-ORIG-12de19360097a0ce
// ============================================================

// Marca de autoria oculta — usada apenas para identificar a origem
// do código em caso de cópia/distribuição não autorizada.
const _ASSINATURA_AUTOR = "BRYAN-ORIG-12de19360097a0ce";
console.log("%c© Brayan — " + _ASSINATURA_AUTOR, "color:#22c55e;font-size:1px;");

const MENSAGEM_PADRAO = "Olá, Seja bem vindo ao Serviço de Atendimento ao Cliente, tudo bem? 🙂\nMe chamo Brayan, hoje estarei fazendo seu atendimento.";
const STORAGE_KEY_MENSAGEM = "brayan_mensagem_automatica";
const STORAGE_KEY_PADRAO = "brayan_mensagem_padrao_personalizada";
const STORAGE_KEY_HISTORICO = "brayan_historico_tickets";

let mensagemAutomatica = MENSAGEM_PADRAO;

// Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
function getExtStorage() {
  return globalThis.chrome?.storage?.sync || globalThis.browser?.storage?.sync || null;
}

// Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
function storageGet(defaults) {
  const storage = getExtStorage();
  // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
  if (!storage) return Promise.resolve(defaults);

  return new Promise((resolve) => {
    // Bloco protegido para capturar falhas sem quebrar todo o funcionamento da extensão.
    try {
      // Função em formato de seta usada para organizar uma ação reutilizável do script.
      const retorno = storage.get(defaults, (items) => {
        const erro = globalThis.chrome?.runtime?.lastError;
        resolve(erro ? defaults : (items || defaults));
      });
      // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
      if (retorno && typeof retorno.then === "function") {
        retorno.then((items) => resolve(items || defaults)).catch(() => resolve(defaults));
      }
    } catch (erro) {
      console.warn("⚠️ Erro ao acessar storage da extensão:", erro);
      resolve(defaults);
    }
  });
}

// Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
async function carregarMensagemAutomatica() {
  const items = await storageGet({ [STORAGE_KEY_MENSAGEM]: MENSAGEM_PADRAO });
  mensagemAutomatica = (items?.[STORAGE_KEY_MENSAGEM] || MENSAGEM_PADRAO).trim() || MENSAGEM_PADRAO;
  return mensagemAutomatica;
}

// Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
function storageSet(values) {
  const storage = getExtStorage();
  // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
  if (!storage) return Promise.resolve(false);

  return new Promise((resolve) => {
    // Bloco protegido para capturar falhas sem quebrar todo o funcionamento da extensão.
    try {
      // Função em formato de seta usada para organizar uma ação reutilizável do script.
      const retorno = storage.set(values, () => {
        const erro = globalThis.chrome?.runtime?.lastError;
        resolve(!erro);
      });
      // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
      if (retorno && typeof retorno.then === "function") {
        retorno.then(() => resolve(true)).catch(() => resolve(false));
      }
    } catch (erro) {
      console.warn("⚠️ Erro ao salvar no storage da extensão:", erro);
      resolve(false);
    }
  });
}

// Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
async function salvarTicketNoHistorico(ticket) {
  // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
  if (!ticket) return;
  const dados = await storageGet({ [STORAGE_KEY_HISTORICO]: [] });
  const historicoAtual = Array.isArray(dados[STORAGE_KEY_HISTORICO]) ? dados[STORAGE_KEY_HISTORICO] : [];
  const ticketLimpo = String(ticket).replace(/^#/, "");
  const novoHistorico = [
    { ticket: ticketLimpo, ts: Date.now() },
    ...historicoAtual.filter((item) => String(item.ticket).replace(/^#/, "") !== ticketLimpo)
  ].slice(0, 30);
  await storageSet({ [STORAGE_KEY_HISTORICO]: novoHistorico });
}

const storageChanges = globalThis.chrome?.storage?.onChanged || globalThis.browser?.storage?.onChanged;
// Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
if (storageChanges) {
  storageChanges.addListener((changes, areaName) => {
    // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
    if ((areaName === "sync" || areaName === "local") && changes[STORAGE_KEY_MENSAGEM]) {
      mensagemAutomatica = (changes[STORAGE_KEY_MENSAGEM].newValue || MENSAGEM_PADRAO).trim() || MENSAGEM_PADRAO;
      console.log("✅ Mensagem automática atualizada pela popup");
    }
  });
}

const STORAGE_KEY_VISTOS = "blip_envioauto_vistos_v1";

let ticketsVistos = new Set();
let enviando = false;
let monitorAtivo = true;
let observer = null;

// Fila de tickets novos detectados aguardando abertura/envio automático.
// Existe porque, quando dois (ou mais) cards chegam na mesma leva de
// mutações do DOM, não dá pra abrir os dois ao mesmo tempo — só um
// atendimento pode estar "sendo enviado" por vez.
let filaTicketsNovos = [];

// ── Persistência (localStorage) ──────────────────────────────
// Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
function marcarTicketVisto(ticket) {
  ticketsVistos.add(ticket);
  // Bloco protegido para capturar falhas sem quebrar todo o funcionamento da extensão.
  try {
    // Uso do armazenamento do navegador para manter ou recuperar informações entre execuções.
    const salvos = JSON.parse(localStorage.getItem(STORAGE_KEY_VISTOS) || "{}");
    salvos[ticket] = Date.now();
    // Uso do armazenamento do navegador para manter ou recuperar informações entre execuções.
    localStorage.setItem(STORAGE_KEY_VISTOS, JSON.stringify(salvos));
  } catch (erro) {
    console.warn("⚠️ Erro ao salvar ticketsVistos:", erro);
  }
}

// Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
function carregarTicketsVistos() {
  // Bloco protegido para capturar falhas sem quebrar todo o funcionamento da extensão.
  try {
    // Uso do armazenamento do navegador para manter ou recuperar informações entre execuções.
    const salvos = JSON.parse(localStorage.getItem(STORAGE_KEY_VISTOS) || "{}");
    const agora = Date.now();
    const UMA_HORA_MS = 3600000;
    let recuperados = 0;
    const limpo = {};
    // Laço de repetição usado para percorrer itens até encontrar ou montar os dados necessários.
    for (const [ticket, timestamp] of Object.entries(salvos)) {
      // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
      if (agora - timestamp < UMA_HORA_MS) {
        ticketsVistos.add(ticket);
        limpo[ticket] = timestamp;
        recuperados++;
      }
    }
    // Uso do armazenamento do navegador para manter ou recuperar informações entre execuções.
    localStorage.setItem(STORAGE_KEY_VISTOS, JSON.stringify(limpo));
    // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
    if (recuperados > 0) {
      console.log("🔄 " + recuperados + " ticketsVistos recuperados do localStorage");
    }
  } catch (erro) {
    console.warn("⚠️ Erro ao carregar ticketsVistos:", erro);
    // Uso do armazenamento do navegador para manter ou recuperar informações entre execuções.
    localStorage.removeItem(STORAGE_KEY_VISTOS);
  }
}

// ── Painel de status ──────────────────────────────────────────
// Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
function criarPainel() {
  // Busca no DOM para encontrar o elemento exato que será lido ou alterado.
  if (document.getElementById('brayan-painel')) return;

  const style = document.createElement('style');
  // Atualização visual ou textual de elementos da interface.
  style.textContent = `
    #brayan-painel {
      position: fixed; z-index: 999999;
      bottom: 170px; left: 20px; top: auto;
      display: flex; align-items: center;
      font-family: 'Segoe UI', sans-serif;
      font-size: 14px;
      opacity: 0.45; transition: opacity 0.2s;
    }
    #brayan-painel:hover { opacity: 1; }
    #bp-tooltip {
      background: #1e293b; border: 1px solid #334155;
      border-radius: 10px; padding: 10px 14px;
      font-size: 14px; color: #94a3b8;
      box-shadow: 0 4px 16px rgba(0,0,0,0.5);
      white-space: nowrap; pointer-events: none;
      opacity: 0; transform: translateX(8px);
      transition: opacity 0.2s, transform 0.2s;
      display: flex; flex-direction: column; gap: 4px;
      position: absolute; left: 42px; bottom: 0;
    }
    #bp-tooltip.visivel { opacity: 1; transform: translateX(0); }
    #bp-tooltip .bp-status { color: #e2e8f0; font-size: 14px; }
    #bp-tooltip .bp-counter { color: #64748b; font-size: 13px; }
    #bp-configurar {
      margin-top: 7px; padding: 8px 10px;
      border: 1px solid #334155; border-radius: 7px;
      background: #0f172a; color: #e2e8f0;
      font-size: 13px; font-weight: 700; cursor: pointer;
      pointer-events: auto;
    }
    #bp-configurar:hover { border-color: #22c55e; color: #22c55e; }
    #brayan-config-overlay {
      position: fixed; inset: 0; z-index: 1000000;
      display: flex; align-items: center; justify-content: center;
      background: rgba(2,6,23,0.55); font-family: 'Segoe UI', sans-serif;
    }
    #brayan-config-modal {
      width: min(470px, calc(100vw - 28px));
      background: #0f172a; color: #e2e8f0;
      border: 1px solid #334155; border-radius: 10px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.45); padding: 20px;
    }
    #brayan-config-modal h3 { font-size: 19px; margin: 0 0 7px; color: #f8fafc; }
    #brayan-config-modal p { font-size: 14px; margin: 0 0 13px; color: #94a3b8; line-height: 1.5; }
    #brayan-config-atual {
      white-space: pre-wrap; max-height: 105px; overflow: auto;
      background: #1e293b; border: 1px solid #334155; border-radius: 8px;
      padding: 12px; font-size: 14px; line-height: 1.5; margin-bottom: 13px;
    }
    #brayan-config-msg {
      width: 100%; min-height: 140px; resize: vertical;
      background: #020617; color: #e2e8f0; border: 1px solid #334155;
      border-radius: 8px; padding: 12px; font: 14px/1.5 'Segoe UI', sans-serif;
      outline: none; margin-bottom: 10px;
    }
    #brayan-config-msg:focus { border-color: #22c55e; box-shadow: 0 0 0 2px rgba(34,197,94,0.16); }
    #brayan-config-actions { display: flex; flex-wrap: wrap; gap: 8px; }
    #brayan-config-actions button {
      flex: 1 1 calc(50% - 8px); border: 0; border-radius: 8px; padding: 10px;
      color: #fff; font-size: 14px; font-weight: 700; cursor: pointer;
    }
    #brayan-config-salvar,
    #brayan-config-salvar-padrao {
      background: linear-gradient(135deg, #22c55e, #0ea5e9);
    }
    #brayan-config-padrao,
    #brayan-config-fechar {
      background: #334155;
    }
    #brayan-config-actions button:hover { opacity: 0.9; }
    #brayan-config-status { min-height: 18px; margin-top: 9px; font-size: 13px; color: #94a3b8; }
    #bp-icone {
      width: 34px; height: 34px; border-radius: 50%;
      background: rgba(30,41,59,0.7); border: 2px solid #22c55e;
      display: flex; align-items: center; justify-content: center;
      cursor: pointer; position: relative;
      transition: border-color 0.3s, transform 0.2s;
    }
    #bp-icone:hover { transform: scale(1.1); }
    #bp-icone.inativo { border-color: #ef4444; }
    #bp-icone.enviando { border-color: #f59e0b; }
    #bp-icone svg { width: 15px; height: 15px; }
    #bp-dot-led {
      position: absolute; top: -2px; right: -2px;
      width: 8px; height: 8px; border-radius: 50%;
      background: #22c55e; border: 2px solid #0f172a;
      animation: bpPulse 1.5s infinite;
    }
    #bp-dot-led.inativo { background: #ef4444; animation: none; }
    #bp-dot-led.enviando { background: #f59e0b; }
    @keyframes bpPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }
  `;
  document.head.appendChild(style);

  const painel = document.createElement('div');
  painel.id = 'brayan-painel';
  // Atualização visual ou textual de elementos da interface.
  painel.innerHTML = `
    <div id="bp-icone" title="Clique para pausar/retomar">
      <span id="bp-dot-led"></span>
      <svg viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/>
      </svg>
      <div id="bp-tooltip">
        <span class="bp-status" id="bp-status">Monitor ativo</span>
        <span class="bp-counter" id="bp-counter">Aguardando atendimentos…</span>
        <button id="bp-configurar" type="button">Configurar mensagem</button>
      </div>
    </div>
  `;
  document.body.appendChild(painel);

  // Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
  function posicionar() {
    const ajuda =
      // Busca no DOM para encontrar o elemento exato que será lido ou alterado.
      document.querySelector('[data-testid="help-menu"]') ||
      // Busca no DOM para encontrar o elemento exato que será lido ou alterado.
      document.querySelector('[aria-label="Ajuda"]') ||
      // Busca no DOM para encontrar o elemento exato que será lido ou alterado.
      document.querySelector('bds-tooltip[tooltip-text="Ajuda"]') ||
      // Busca no DOM para encontrar o elemento exato que será lido ou alterado.
      document.querySelector('[tooltip-text="Ajuda"]');
    // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
    if (ajuda) {
      const rect = ajuda.getBoundingClientRect();
      // Atualização visual ou textual de elementos da interface.
      painel.style.bottom = (window.innerHeight - rect.top + 10) + 'px';
      // Atualização visual ou textual de elementos da interface.
      painel.style.left = rect.left + (rect.width / 2 - 17) + 'px';
    }
  }
  // Controle de tempo usado para aguardar a página responder ou repetir uma verificação.
  setTimeout(posicionar, 500);
  // Controle de tempo usado para aguardar a página responder ou repetir uma verificação.
  setTimeout(posicionar, 2000);

  // Busca no DOM para encontrar o elemento exato que será lido ou alterado.
  document.getElementById('bp-icone').addEventListener('mouseenter', () =>
    // Busca no DOM para encontrar o elemento exato que será lido ou alterado.
    document.getElementById('bp-tooltip').classList.add('visivel'));
  // Busca no DOM para encontrar o elemento exato que será lido ou alterado.
  document.getElementById('bp-icone').addEventListener('mouseleave', () =>
    // Busca no DOM para encontrar o elemento exato que será lido ou alterado.
    document.getElementById('bp-tooltip').classList.remove('visivel'));
  // Evento de clique: executa esta ação quando o usuário pressiona o botão correspondente.
  document.getElementById('bp-icone').addEventListener('click', toggleMonitor);
  // Evento de clique: executa esta ação quando o usuário pressiona o botão correspondente.
  document.getElementById('bp-configurar').addEventListener('click', (event) => {
    event.stopPropagation();
    abrirConfiguracaoMensagem();
  });
}

// Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
function setStatus(txt, estado) {
  // Captura elementos da tela para poder ler valores, alterar conteúdo ou ligar eventos.
  const led = document.getElementById('bp-dot-led');
  // Captura elementos da tela para poder ler valores, alterar conteúdo ou ligar eventos.
  const status = document.getElementById('bp-status');
  // Captura elementos da tela para poder ler valores, alterar conteúdo ou ligar eventos.
  const icone = document.getElementById('bp-icone');
  // Atualização visual ou textual de elementos da interface.
  if (status) status.textContent = txt;
  // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
  if (led) led.className = estado || '';
  // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
  if (icone) icone.className = estado || '';
}

// Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
function setCounter(txt) {
  // Captura elementos da tela para poder ler valores, alterar conteúdo ou ligar eventos.
  const el = document.getElementById('bp-counter');
  // Atualização visual ou textual de elementos da interface.
  if (el) el.textContent = txt;
}

// Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
async function abrirConfiguracaoMensagem() {
  await carregarMensagemAutomatica();

  // Busca no DOM para encontrar o elemento exato que será lido ou alterado.
  document.getElementById('brayan-config-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'brayan-config-overlay';
  // Atualização visual ou textual de elementos da interface.
  overlay.innerHTML = `
    <div id="brayan-config-modal" role="dialog" aria-modal="true">
      <h3>Configurar mensagem automática</h3>
      <p>Mensagem configurada agora:</p>
      <div id="brayan-config-atual"></div>
      <textarea id="brayan-config-msg" spellcheck="true"></textarea>
      <div id="brayan-config-actions">
        <button id="brayan-config-salvar" type="button">Salvar</button>
        <button id="brayan-config-padrao" type="button">Padrão</button>
        <button id="brayan-config-salvar-padrao" type="button">Salvar como Padrão</button>
        <button id="brayan-config-fechar" type="button">Fechar</button>
      </div>
      <div id="brayan-config-status"></div>
    </div>
  `;
  document.body.appendChild(overlay);

  // Captura elementos da tela para poder ler valores, alterar conteúdo ou ligar eventos.
  const atual = document.getElementById('brayan-config-atual');
  // Captura elementos da tela para poder ler valores, alterar conteúdo ou ligar eventos.
  const campo = document.getElementById('brayan-config-msg');
  // Captura elementos da tela para poder ler valores, alterar conteúdo ou ligar eventos.
  const status = document.getElementById('brayan-config-status');

  // Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
  function atualizar(valor) {
    mensagemAutomatica = (valor || MENSAGEM_PADRAO).trim() || MENSAGEM_PADRAO;
    // Atualização visual ou textual de elementos da interface.
    atual.textContent = mensagemAutomatica;
    // Atualização visual ou textual de elementos da interface.
    campo.value = mensagemAutomatica;
  }

  // Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
  async function salvar(valor) {
    const novaMensagem = (valor || '').trim() || MENSAGEM_PADRAO;
    const salvo = await storageSet({ [STORAGE_KEY_MENSAGEM]: novaMensagem });
    // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
    if (!salvo) {
      // Atualização visual ou textual de elementos da interface.
      status.textContent = 'Não foi possível salvar a mensagem.';
      return;
    }
    atualizar(novaMensagem);
    // Atualização visual ou textual de elementos da interface.
    status.style.color = '#22c55e';
    // Atualização visual ou textual de elementos da interface.
    status.textContent = 'Mensagem salva.';
  }

  // Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
  async function restaurarPadrao() {
    const items = await storageGet({ [STORAGE_KEY_PADRAO]: MENSAGEM_PADRAO });
    salvar(items[STORAGE_KEY_PADRAO]);
  }

  // Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
  async function salvarComoPadrao() {
    const novaMensagem = (campo.value || '').trim() || MENSAGEM_PADRAO;
    const salvo = await storageSet({
      [STORAGE_KEY_PADRAO]: novaMensagem,
      [STORAGE_KEY_MENSAGEM]: novaMensagem
    });
    // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
    if (!salvo) {
      // Atualização visual ou textual de elementos da interface.
      status.textContent = 'Não foi possível salvar o padrão.';
      return;
    }
    atualizar(novaMensagem);
    // Atualização visual ou textual de elementos da interface.
    status.style.color = '#22c55e';
    // Atualização visual ou textual de elementos da interface.
    status.textContent = 'Novo padrão salvo.';
  }

  atualizar(mensagemAutomatica);
  campo.focus();

  // Evento de clique: executa esta ação quando o usuário pressiona o botão correspondente.
  document.getElementById('brayan-config-salvar').addEventListener('click', () => salvar(campo.value));
  // Evento de clique: executa esta ação quando o usuário pressiona o botão correspondente.
  document.getElementById('brayan-config-padrao').addEventListener('click', restaurarPadrao);
  // Evento de clique: executa esta ação quando o usuário pressiona o botão correspondente.
  document.getElementById('brayan-config-salvar-padrao').addEventListener('click', salvarComoPadrao);
  // Evento de clique: executa esta ação quando o usuário pressiona o botão correspondente.
  document.getElementById('brayan-config-fechar').addEventListener('click', () => overlay.remove());
  // Evento de clique: executa esta ação quando o usuário pressiona o botão correspondente.
  overlay.addEventListener('click', (event) => {
    // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
    if (event.target === overlay) overlay.remove();
  });
}

let totalEnviados = 0;

// Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
function toggleMonitor() {
  monitorAtivo = !monitorAtivo;
  // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
  if (monitorAtivo) {
    setStatus('Monitor ativo', '');
    iniciarObserver();
  } else {
    setStatus('Monitor pausado', 'inativo');
    // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
    if (observer) observer.disconnect();
    filaTicketsNovos = [];
  }
}

// ── Extrai número do ticket do card ──────────────────────────
// Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
function getTicket(el) {
  // Atualização visual ou textual de elementos da interface.
  const txt = el.innerText || el.textContent || '';
  const m = txt.match(/#(\d+)/);
  return m ? m[1] : null;
}

// ── Encontra o campo de mensagem ─────────────────────────────
// Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
function getCampo() {
  // Captura elementos da tela para poder ler valores, alterar conteúdo ou ligar eventos.
  const exato = document.querySelector('textarea[placeholder="Escreva uma mensagem..."]')
    // Busca no DOM para encontrar o elemento exato que será lido ou alterado.
    || document.querySelector('textarea[placeholder="Escreva uma mensagem"]')
    // Busca no DOM para encontrar o elemento exato que será lido ou alterado.
    || document.querySelector('textarea[placeholder*="mensagem"]')
    // Busca no DOM para encontrar o elemento exato que será lido ou alterado.
    || document.querySelector('textarea[placeholder*="Escreva"]');
  // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
  if (exato && campoInterativo(exato)) return exato;

  const selectors = [
    'div[contenteditable="true"][class*="input"]',
    'div[contenteditable="true"][class*="editor"]',
    'div[contenteditable="true"][class*="message"]',
    'div[contenteditable="true"]',
    'textarea',
    '[role="textbox"]'
  ];
  // Laço de repetição usado para percorrer itens até encontrar ou montar os dados necessários.
  for (const sel of selectors) {
    // Busca no DOM para encontrar o elemento exato que será lido ou alterado.
    for (const el of document.querySelectorAll(sel)) {
      const rect = el.getBoundingClientRect();
      // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
      if (rect.width > 50 && rect.height > 10 && rect.bottom > window.innerHeight * 0.4 && campoInterativo(el))
        return el;
    }
  }
  return null;
}

// Verifica se o campo está realmente pronto para receber input
// Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
function campoInterativo(el) {
  // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
  if (!el) return false;
  // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
  if (el.disabled || el.readOnly) return false;
  const rect = el.getBoundingClientRect();
  // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
  if (rect.width === 0 || rect.height === 0) return false;
  // Verifica se não está bloqueado por overlay/loading
  const topEl = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
  // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
  if (!topEl) return false;
  return el.contains(topEl) || topEl === el || el.contains(topEl);
}

// ── Pega o ticket visível no cabeçalho ───────────────────────
// Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
function getTicketAtivo() {
  // Captura elementos da tela para poder ler valores, alterar conteúdo ou ligar eventos.
  const el = document.querySelector('#ticket-sequential-id');
  // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
  if (el) {
    // Atualização visual ou textual de elementos da interface.
    const txt = el.shadowRoot?.textContent || el.textContent || el.innerText || '';
    const m = txt.match(/\d+/);
    // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
    if (m) return m[0];
  }
  // Captura elementos da tela para poder ler valores, alterar conteúdo ou ligar eventos.
  const header = document.querySelector('[class*="ticket-info"], [class*="chat-header"]');
  // Atualização visual ou textual de elementos da interface.
  const txt = (header || document.body).innerText || '';
  const m = txt.match(/#(\d+)/);
  return m ? m[1] : null;
}

// ── Digita e envia a apresentação ────────────────────────────
// Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
function enviarApresentacao(tentativas = 0) {
  // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
  if (tentativas > 30) {
    setStatus('⚠️ Campo não encontrado', 'inativo');
    enviando = false;
    processarProximoDaFila();
    return;
  }

  const el = getCampo();
  // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
  if (!el) {
    // Controle de tempo usado para aguardar a página responder ou repetir uma verificação.
    setTimeout(() => enviarApresentacao(tentativas + 1), 100);
    return;
  }

  el.focus();
  // Bloco protegido para capturar falhas sem quebrar todo o funcionamento da extensão.
  try {
    const tag = el.tagName.toLowerCase();
    // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
    if (tag === 'textarea' || tag === 'input') {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value');
      // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
      if (setter?.set) setter.set.call(el, mensagemAutomatica);
      // Atualização visual ou textual de elementos da interface.
      else el.value = mensagemAutomatica;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, mensagemAutomatica);
      // Atualização visual ou textual de elementos da interface.
      if (!el.textContent?.trim()) {
        // Atualização visual ou textual de elementos da interface.
        el.innerText = mensagemAutomatica;
        el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: mensagemAutomatica }));
      }
    }

    // Controle de tempo usado para aguardar a página responder ou repetir uma verificação.
    setTimeout(() => {
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
      el.dispatchEvent(new KeyboardEvent('keyup',   { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));

      // Busca no DOM para encontrar o elemento exato que será lido ou alterado.
      for (const btn of document.querySelectorAll('button[type="submit"], button[aria-label*="nviar"], [data-testid*="send"]')) {
        const r = btn.getBoundingClientRect();
        // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
        if (r.width > 0 && r.height > 0) { btn.click(); break; }
      }

      totalEnviados++;
      salvarTicketNoHistorico(getTicketAtivo());
      setStatus('✅ Enviado!', '');
      setCounter(`Total hoje: ${totalEnviados} atendimento${totalEnviados > 1 ? 's' : ''}`);

      enviando = false;
      processarProximoDaFila();

      // Controle de tempo usado para aguardar a página responder ou repetir uma verificação.
      setTimeout(() => { setStatus('Monitor ativo', ''); }, 3000);
    }, 300);

  } catch (e) {
    // Controle de tempo usado para aguardar a página responder ou repetir uma verificação.
    setTimeout(() => enviarApresentacao(tentativas + 1), 100);
  }
}

// ── Desativa animações do Blip ────────────────────────────────
// Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
function desativarAnimacoes() {
  // Busca no DOM para encontrar o elemento exato que será lido ou alterado.
  if (document.getElementById('brayan-no-anim')) return;
  const s = document.createElement('style');
  s.id = 'brayan-no-anim';
  // Atualização visual ou textual de elementos da interface.
  s.textContent = `
    *, *::before, *::after {
      animation-duration: 0ms !important;
      animation-delay: 0ms !important;
      transition-duration: 0ms !important;
      transition-delay: 0ms !important;
    }
    [class*="pane"],[class*="chat"],[class*="panel"],
    [class*="slide"],[class*="fade"],[class*="collapse"],
    [class*="drawer"],[class*="modal"],[class*="transition"] {
      animation: none !important;
      transition: none !important;
    }
  `;
  document.head.appendChild(s);
}

// ── Aguarda ticket correto aparecer no cabeçalho, depois envia
// Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
function aguardarTicketEEnviar(ticketEsperado) {
  // Verifica imediatamente — se já está na conversa certa, dispara na hora
  const ticketAtual = getTicketAtivo();
  const campo = getCampo();
  // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
  if (campo && (!ticketEsperado || ticketAtual === ticketEsperado)) {
    enviarApresentacao(0);
    return;
  }

  let enviado = false;

  // MutationObserver focado: detecta quando o textarea do Blip entra no DOM
  // Não usa characterData — só childList para ser leve
  // Função em formato de seta usada para organizar uma ação reutilizável do script.
  const obs = new MutationObserver(() => {
    // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
    if (enviado) return;
    const ticketAgora = getTicketAtivo();
    const campoAgora = getCampo();
    // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
    if (campoAgora && (!ticketEsperado || ticketAgora === ticketEsperado)) {
      enviado = true;
      obs.disconnect();
      clearTimeout(timeout);
      // Pequeno delay para garantir que o campo está totalmente montado
      // Controle de tempo usado para aguardar a página responder ou repetir uma verificação.
      setTimeout(() => enviarApresentacao(0), 200);
    }
  });

  obs.observe(document.body, { childList: true, subtree: true });

  // Segurança: desiste após 6s
  // Função em formato de seta usada para organizar uma ação reutilizável do script.
  const timeout = setTimeout(() => {
    // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
    if (!enviado) {
      obs.disconnect();
      setStatus('⚠️ Tempo esgotado', 'inativo');
      enviando = false;
      processarProximoDaFila();
    }
  }, 6000);
}

// ── Abre o atendimento e aguarda o chat correto carregar ──────
// Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
function abrirAtendimento(card, ticket) {
  setStatus('🔔 Novo atendimento!', 'enviando');
  desativarAnimacoes();
  card.click();
  aguardarTicketEEnviar(ticket);
}

// ── Registra tickets já visíveis para não reenviar ───────────
// Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
function registrarTicketsExistentes() {
  // Busca apenas nos cards da lista, não em todo o DOM (mais rápido)
  // Captura elementos da tela para poder ler valores, alterar conteúdo ou ligar eventos.
  const lista = document.querySelector('[class*="ss-content"], [class*="chat-list"], [class*="contacts"]') || document.body;
  // Atualização visual ou textual de elementos da interface.
  const txt = lista.innerText || '';
  const matches = txt.match(/#\d+/g) || [];
  matches.forEach(m => marcarTicketVisto(m.replace('#', '')));

  const ticketAberto = getTicketAtivo();
  // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
  if (ticketAberto) marcarTicketVisto(ticketAberto);
}

// ── Inicia o MutationObserver na lista de atendimentos ───────
// Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
function iniciarObserver() {
  // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
  if (observer) observer.disconnect();

  // Captura elementos da tela para poder ler valores, alterar conteúdo ou ligar eventos.
  const alvo = document.querySelector(
    '[class*="ss-content"], [class*="chat-list"], [class*="attendance"], [class*="contacts-list"]'
  ) || document.body;

  // Observador do DOM: acompanha mudanças na página para reagir quando novos elementos aparecem.
  observer = new MutationObserver((mutations) => {
    // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
    if (!monitorAtivo) return;

    // Laço de repetição usado para percorrer itens até encontrar ou montar os dados necessários.
    for (const m of mutations) {
      // Laço de repetição usado para percorrer itens até encontrar ou montar os dados necessários.
      for (const node of m.addedNodes) {
        // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
        if (node.nodeType !== 1) continue;

        let ticket = getTicket(node);
        // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
        if (ticket) {
          marcarTicketNaFila(ticket);
        } else {
          // Busca no DOM para encontrar o elemento exato que será lido ou alterado.
          const subs = node.querySelectorAll?.('[class*="ticket"], article, li, [class*="card"]') || [];
          // Laço de repetição usado para percorrer itens até encontrar ou montar os dados necessários.
          for (const sub of subs) {
            const t = getTicket(sub);
            // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
            if (t) marcarTicketNaFila(t);
          }
        }
      }
    }

    processarProximoDaFila();
  });

  // SEM characterData — era o maior culpado pela lentidão
  observer.observe(alvo, { childList: true, subtree: true });
}

// ── Fila de tickets novos ─────────────────────────────────────
// Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
function marcarTicketNaFila(ticket) {
  // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
  if (!ticket || ticketsVistos.has(ticket) || filaTicketsNovos.includes(ticket)) return;
  marcarTicketVisto(ticket);
  filaTicketsNovos.push(ticket);
}

// Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
function processarProximoDaFila() {
  // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
  if (!monitorAtivo || enviando) return;
  // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
  if (filaTicketsNovos.length === 0) return;

  const ticket = filaTicketsNovos.shift();
  const card = encontrarCardPorTicket(ticket);

  // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
  if (!card) {
    console.warn("⚠️ Card do ticket " + ticket + " não encontrado na lista - pulando");
    processarProximoDaFila();
    return;
  }

  enviando = true;
  // Controle de tempo usado para aguardar a página responder ou repetir uma verificação.
  setTimeout(() => abrirAtendimento(card, ticket), 200);
}

// Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
function encontrarCardPorTicket(ticket) {
  // Captura elementos da tela para poder ler valores, alterar conteúdo ou ligar eventos.
  const alvo = document.querySelector(
    '[class*="ss-content"], [class*="chat-list"], [class*="attendance"], [class*="contacts-list"]'
  ) || document.body;
  // Busca no DOM para encontrar o elemento exato que será lido ou alterado.
  for (const el of alvo.querySelectorAll('[class*="ticket"], article, li, [class*="card"]')) {
    // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
    if (getTicket(el) === ticket) return el;
  }
  return null;
}

// ── Inicialização ─────────────────────────────────────────────
// Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
async function init() {
  console.log("🔄 Carregando dados persistentes...");
  await carregarMensagemAutomatica();
  carregarTicketsVistos();

  desativarAnimacoes(); // Aplica desde o início, não só ao chegar atendimento
  criarPainel();
  registrarTicketsExistentes();
  iniciarObserver();
}

// Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  // Controle de tempo usado para aguardar a página responder ou repetir uma verificação.
  setTimeout(init, 1000);
} else {
  // Controle de tempo usado para aguardar a página responder ou repetir uma verificação.
  window.addEventListener('load', () => setTimeout(init, 1000));
}

// Reinicia se a rota SPA mudar
let lastUrl = location.href;
// Observador do DOM: acompanha mudanças na página para reagir quando novos elementos aparecem.
new MutationObserver(() => {
  // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    // Controle de tempo usado para aguardar a página responder ou repetir uma verificação.
    setTimeout(() => {
      registrarTicketsExistentes();
      // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
      if (monitorAtivo) iniciarObserver();
    }, 1500);
  }
}).observe(document, { subtree: true, childList: true });

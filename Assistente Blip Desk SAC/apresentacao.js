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

function getExtStorage() {
  return globalThis.chrome?.storage?.sync || globalThis.browser?.storage?.sync || null;
}

function storageGet(defaults) {
  const storage = getExtStorage();
  if (!storage) return Promise.resolve(defaults);

  return new Promise((resolve) => {
    try {
      const retorno = storage.get(defaults, (items) => {
        const erro = globalThis.chrome?.runtime?.lastError;
        resolve(erro ? defaults : (items || defaults));
      });
      if (retorno && typeof retorno.then === "function") {
        retorno.then((items) => resolve(items || defaults)).catch(() => resolve(defaults));
      }
    } catch (erro) {
      console.warn("⚠️ Erro ao acessar storage da extensão:", erro);
      resolve(defaults);
    }
  });
}

async function carregarMensagemAutomatica() {
  const items = await storageGet({ [STORAGE_KEY_MENSAGEM]: MENSAGEM_PADRAO });
  mensagemAutomatica = (items?.[STORAGE_KEY_MENSAGEM] || MENSAGEM_PADRAO).trim() || MENSAGEM_PADRAO;
  return mensagemAutomatica;
}

function storageSet(values) {
  const storage = getExtStorage();
  if (!storage) return Promise.resolve(false);

  return new Promise((resolve) => {
    try {
      const retorno = storage.set(values, () => {
        const erro = globalThis.chrome?.runtime?.lastError;
        resolve(!erro);
      });
      if (retorno && typeof retorno.then === "function") {
        retorno.then(() => resolve(true)).catch(() => resolve(false));
      }
    } catch (erro) {
      console.warn("⚠️ Erro ao salvar no storage da extensão:", erro);
      resolve(false);
    }
  });
}

async function salvarTicketNoHistorico(ticket) {
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
if (storageChanges) {
  storageChanges.addListener((changes, areaName) => {
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
function marcarTicketVisto(ticket) {
  ticketsVistos.add(ticket);
  try {
    const salvos = JSON.parse(localStorage.getItem(STORAGE_KEY_VISTOS) || "{}");
    salvos[ticket] = Date.now();
    localStorage.setItem(STORAGE_KEY_VISTOS, JSON.stringify(salvos));
  } catch (erro) {
    console.warn("⚠️ Erro ao salvar ticketsVistos:", erro);
  }
}

function carregarTicketsVistos() {
  try {
    const salvos = JSON.parse(localStorage.getItem(STORAGE_KEY_VISTOS) || "{}");
    const agora = Date.now();
    const UMA_HORA_MS = 3600000;
    let recuperados = 0;
    const limpo = {};
    for (const [ticket, timestamp] of Object.entries(salvos)) {
      if (agora - timestamp < UMA_HORA_MS) {
        ticketsVistos.add(ticket);
        limpo[ticket] = timestamp;
        recuperados++;
      }
    }
    localStorage.setItem(STORAGE_KEY_VISTOS, JSON.stringify(limpo));
    if (recuperados > 0) {
      console.log("🔄 " + recuperados + " ticketsVistos recuperados do localStorage");
    }
  } catch (erro) {
    console.warn("⚠️ Erro ao carregar ticketsVistos:", erro);
    localStorage.removeItem(STORAGE_KEY_VISTOS);
  }
}

// ── Painel de status ──────────────────────────────────────────
function criarPainel() {
  if (document.getElementById('brayan-painel')) return;

  const style = document.createElement('style');
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

  function posicionar() {
    const ajuda =
      document.querySelector('[data-testid="help-menu"]') ||
      document.querySelector('[aria-label="Ajuda"]') ||
      document.querySelector('bds-tooltip[tooltip-text="Ajuda"]') ||
      document.querySelector('[tooltip-text="Ajuda"]');
    if (ajuda) {
      const rect = ajuda.getBoundingClientRect();
      painel.style.bottom = (window.innerHeight - rect.top + 10) + 'px';
      painel.style.left = rect.left + (rect.width / 2 - 17) + 'px';
    }
  }
  setTimeout(posicionar, 500);
  setTimeout(posicionar, 2000);

  document.getElementById('bp-icone').addEventListener('mouseenter', () =>
    document.getElementById('bp-tooltip').classList.add('visivel'));
  document.getElementById('bp-icone').addEventListener('mouseleave', () =>
    document.getElementById('bp-tooltip').classList.remove('visivel'));
  document.getElementById('bp-icone').addEventListener('click', toggleMonitor);
  document.getElementById('bp-configurar').addEventListener('click', (event) => {
    event.stopPropagation();
    abrirConfiguracaoMensagem();
  });
}

function setStatus(txt, estado) {
  const led = document.getElementById('bp-dot-led');
  const status = document.getElementById('bp-status');
  const icone = document.getElementById('bp-icone');
  if (status) status.textContent = txt;
  if (led) led.className = estado || '';
  if (icone) icone.className = estado || '';
}

function setCounter(txt) {
  const el = document.getElementById('bp-counter');
  if (el) el.textContent = txt;
}

async function abrirConfiguracaoMensagem() {
  await carregarMensagemAutomatica();

  document.getElementById('brayan-config-overlay')?.remove();

  const overlay = document.createElement('div');
  overlay.id = 'brayan-config-overlay';
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

  const atual = document.getElementById('brayan-config-atual');
  const campo = document.getElementById('brayan-config-msg');
  const status = document.getElementById('brayan-config-status');

  function atualizar(valor) {
    mensagemAutomatica = (valor || MENSAGEM_PADRAO).trim() || MENSAGEM_PADRAO;
    atual.textContent = mensagemAutomatica;
    campo.value = mensagemAutomatica;
  }

  async function salvar(valor) {
    const novaMensagem = (valor || '').trim() || MENSAGEM_PADRAO;
    const salvo = await storageSet({ [STORAGE_KEY_MENSAGEM]: novaMensagem });
    if (!salvo) {
      status.textContent = 'Não foi possível salvar a mensagem.';
      return;
    }
    atualizar(novaMensagem);
    status.style.color = '#22c55e';
    status.textContent = 'Mensagem salva.';
  }

  async function restaurarPadrao() {
    const items = await storageGet({ [STORAGE_KEY_PADRAO]: MENSAGEM_PADRAO });
    salvar(items[STORAGE_KEY_PADRAO]);
  }

  async function salvarComoPadrao() {
    const novaMensagem = (campo.value || '').trim() || MENSAGEM_PADRAO;
    const salvo = await storageSet({
      [STORAGE_KEY_PADRAO]: novaMensagem,
      [STORAGE_KEY_MENSAGEM]: novaMensagem
    });
    if (!salvo) {
      status.textContent = 'Não foi possível salvar o padrão.';
      return;
    }
    atualizar(novaMensagem);
    status.style.color = '#22c55e';
    status.textContent = 'Novo padrão salvo.';
  }

  atualizar(mensagemAutomatica);
  campo.focus();

  document.getElementById('brayan-config-salvar').addEventListener('click', () => salvar(campo.value));
  document.getElementById('brayan-config-padrao').addEventListener('click', restaurarPadrao);
  document.getElementById('brayan-config-salvar-padrao').addEventListener('click', salvarComoPadrao);
  document.getElementById('brayan-config-fechar').addEventListener('click', () => overlay.remove());
  overlay.addEventListener('click', (event) => {
    if (event.target === overlay) overlay.remove();
  });
}

let totalEnviados = 0;

function toggleMonitor() {
  monitorAtivo = !monitorAtivo;
  if (monitorAtivo) {
    setStatus('Monitor ativo', '');
    iniciarObserver();
  } else {
    setStatus('Monitor pausado', 'inativo');
    if (observer) observer.disconnect();
    filaTicketsNovos = [];
  }
}

// ── Extrai número do ticket do card ──────────────────────────
function getTicket(el) {
  const txt = el.innerText || el.textContent || '';
  const m = txt.match(/#(\d+)/);
  return m ? m[1] : null;
}

// ── Encontra o campo de mensagem ─────────────────────────────
function getCampo() {
  const exato = document.querySelector('textarea[placeholder="Escreva uma mensagem..."]')
    || document.querySelector('textarea[placeholder="Escreva uma mensagem"]')
    || document.querySelector('textarea[placeholder*="mensagem"]')
    || document.querySelector('textarea[placeholder*="Escreva"]');
  if (exato && campoInterativo(exato)) return exato;

  const selectors = [
    'div[contenteditable="true"][class*="input"]',
    'div[contenteditable="true"][class*="editor"]',
    'div[contenteditable="true"][class*="message"]',
    'div[contenteditable="true"]',
    'textarea',
    '[role="textbox"]'
  ];
  for (const sel of selectors) {
    for (const el of document.querySelectorAll(sel)) {
      const rect = el.getBoundingClientRect();
      if (rect.width > 50 && rect.height > 10 && rect.bottom > window.innerHeight * 0.4 && campoInterativo(el))
        return el;
    }
  }
  return null;
}

// Verifica se o campo está realmente pronto para receber input
function campoInterativo(el) {
  if (!el) return false;
  if (el.disabled || el.readOnly) return false;
  const rect = el.getBoundingClientRect();
  if (rect.width === 0 || rect.height === 0) return false;
  // Verifica se não está bloqueado por overlay/loading
  const topEl = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
  if (!topEl) return false;
  return el.contains(topEl) || topEl === el || el.contains(topEl);
}

// ── Pega o ticket visível no cabeçalho ───────────────────────
function getTicketAtivo() {
  const el = document.querySelector('#ticket-sequential-id');
  if (el) {
    const txt = el.shadowRoot?.textContent || el.textContent || el.innerText || '';
    const m = txt.match(/\d+/);
    if (m) return m[0];
  }
  const header = document.querySelector('[class*="ticket-info"], [class*="chat-header"]');
  const txt = (header || document.body).innerText || '';
  const m = txt.match(/#(\d+)/);
  return m ? m[1] : null;
}

// ── Digita e envia a apresentação ────────────────────────────
function enviarApresentacao(tentativas = 0) {
  if (tentativas > 30) {
    setStatus('⚠️ Campo não encontrado', 'inativo');
    enviando = false;
    processarProximoDaFila();
    return;
  }

  const el = getCampo();
  if (!el) {
    setTimeout(() => enviarApresentacao(tentativas + 1), 100);
    return;
  }

  el.focus();
  try {
    const tag = el.tagName.toLowerCase();
    if (tag === 'textarea' || tag === 'input') {
      const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value');
      if (setter?.set) setter.set.call(el, mensagemAutomatica);
      else el.value = mensagemAutomatica;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      el.dispatchEvent(new Event('change', { bubbles: true }));
    } else {
      document.execCommand('selectAll', false, null);
      document.execCommand('insertText', false, mensagemAutomatica);
      if (!el.textContent?.trim()) {
        el.innerText = mensagemAutomatica;
        el.dispatchEvent(new InputEvent('input', { bubbles: true, inputType: 'insertText', data: mensagemAutomatica }));
      }
    }

    setTimeout(() => {
      el.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));
      el.dispatchEvent(new KeyboardEvent('keyup',   { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true }));

      for (const btn of document.querySelectorAll('button[type="submit"], button[aria-label*="nviar"], [data-testid*="send"]')) {
        const r = btn.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) { btn.click(); break; }
      }

      totalEnviados++;
      salvarTicketNoHistorico(getTicketAtivo());
      setStatus('✅ Enviado!', '');
      setCounter(`Total hoje: ${totalEnviados} atendimento${totalEnviados > 1 ? 's' : ''}`);

      enviando = false;
      processarProximoDaFila();

      setTimeout(() => { setStatus('Monitor ativo', ''); }, 3000);
    }, 300);

  } catch (e) {
    setTimeout(() => enviarApresentacao(tentativas + 1), 100);
  }
}

// ── Desativa animações do Blip ────────────────────────────────
function desativarAnimacoes() {
  if (document.getElementById('brayan-no-anim')) return;
  const s = document.createElement('style');
  s.id = 'brayan-no-anim';
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
function aguardarTicketEEnviar(ticketEsperado) {
  // Verifica imediatamente — se já está na conversa certa, dispara na hora
  const ticketAtual = getTicketAtivo();
  const campo = getCampo();
  if (campo && (!ticketEsperado || ticketAtual === ticketEsperado)) {
    enviarApresentacao(0);
    return;
  }

  let enviado = false;

  // MutationObserver focado: detecta quando o textarea do Blip entra no DOM
  // Não usa characterData — só childList para ser leve
  const obs = new MutationObserver(() => {
    if (enviado) return;
    const ticketAgora = getTicketAtivo();
    const campoAgora = getCampo();
    if (campoAgora && (!ticketEsperado || ticketAgora === ticketEsperado)) {
      enviado = true;
      obs.disconnect();
      clearTimeout(timeout);
      // Pequeno delay para garantir que o campo está totalmente montado
      setTimeout(() => enviarApresentacao(0), 200);
    }
  });

  obs.observe(document.body, { childList: true, subtree: true });

  // Segurança: desiste após 6s
  const timeout = setTimeout(() => {
    if (!enviado) {
      obs.disconnect();
      setStatus('⚠️ Tempo esgotado', 'inativo');
      enviando = false;
      processarProximoDaFila();
    }
  }, 6000);
}

// ── Abre o atendimento e aguarda o chat correto carregar ──────
function abrirAtendimento(card, ticket) {
  setStatus('🔔 Novo atendimento!', 'enviando');
  desativarAnimacoes();
  card.click();
  aguardarTicketEEnviar(ticket);
}

// ── Registra tickets já visíveis para não reenviar ───────────
function registrarTicketsExistentes() {
  // Busca apenas nos cards da lista, não em todo o DOM (mais rápido)
  const lista = document.querySelector('[class*="ss-content"], [class*="chat-list"], [class*="contacts"]') || document.body;
  const txt = lista.innerText || '';
  const matches = txt.match(/#\d+/g) || [];
  matches.forEach(m => marcarTicketVisto(m.replace('#', '')));

  const ticketAberto = getTicketAtivo();
  if (ticketAberto) marcarTicketVisto(ticketAberto);
}

// ── Inicia o MutationObserver na lista de atendimentos ───────
function iniciarObserver() {
  if (observer) observer.disconnect();

  const alvo = document.querySelector(
    '[class*="ss-content"], [class*="chat-list"], [class*="attendance"], [class*="contacts-list"]'
  ) || document.body;

  observer = new MutationObserver((mutations) => {
    if (!monitorAtivo) return;

    for (const m of mutations) {
      for (const node of m.addedNodes) {
        if (node.nodeType !== 1) continue;

        let ticket = getTicket(node);
        if (ticket) {
          marcarTicketNaFila(ticket);
        } else {
          const subs = node.querySelectorAll?.('[class*="ticket"], article, li, [class*="card"]') || [];
          for (const sub of subs) {
            const t = getTicket(sub);
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
function marcarTicketNaFila(ticket) {
  if (!ticket || ticketsVistos.has(ticket) || filaTicketsNovos.includes(ticket)) return;
  marcarTicketVisto(ticket);
  filaTicketsNovos.push(ticket);
}

function processarProximoDaFila() {
  if (!monitorAtivo || enviando) return;
  if (filaTicketsNovos.length === 0) return;

  const ticket = filaTicketsNovos.shift();
  const card = encontrarCardPorTicket(ticket);

  if (!card) {
    console.warn("⚠️ Card do ticket " + ticket + " não encontrado na lista - pulando");
    processarProximoDaFila();
    return;
  }

  enviando = true;
  setTimeout(() => abrirAtendimento(card, ticket), 200);
}

function encontrarCardPorTicket(ticket) {
  const alvo = document.querySelector(
    '[class*="ss-content"], [class*="chat-list"], [class*="attendance"], [class*="contacts-list"]'
  ) || document.body;
  for (const el of alvo.querySelectorAll('[class*="ticket"], article, li, [class*="card"]')) {
    if (getTicket(el) === ticket) return el;
  }
  return null;
}

// ── Inicialização ─────────────────────────────────────────────
async function init() {
  console.log("🔄 Carregando dados persistentes...");
  await carregarMensagemAutomatica();
  carregarTicketsVistos();

  desativarAnimacoes(); // Aplica desde o início, não só ao chegar atendimento
  criarPainel();
  registrarTicketsExistentes();
  iniciarObserver();
}

if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(init, 1000);
} else {
  window.addEventListener('load', () => setTimeout(init, 1000));
}

// Reinicia se a rota SPA mudar
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    setTimeout(() => {
      registrarTicketsExistentes();
      if (monitorAtivo) iniciarObserver();
    }, 1500);
  }
}).observe(document, { subtree: true, childList: true });

/* ── EXTRAÇÃO ROBUSTA DE DADOS DO ATENDIMENTO ─────────────────────────── */

function normalizarLinhas(texto) {
  return texto.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
}

function limparNome(nome) {
  return (nome || "").trim().replace(/^\(\d+\)\s*/, "").replace(/\s*\(\d+\)\s*$/, "").replace(/\s+/g, " ");
}

function formatarTelefoneBR(t) {
  let n = (t || "").replace(/\D/g, "");
  if (!n) return "";
  if (n.startsWith("55") && n.length > 11) n = n.slice(2);
  if (![10, 11].includes(n.length)) return (t || "").trim() || "";
  const ddd = n.slice(0, 2), r = n.slice(2);
  return r.length === 9
    ? `(${ddd}) ${r.slice(0,5)}-${r.slice(5)}`
    : `(${ddd}) ${r.slice(0,4)}-${r.slice(4)}`;
}

function extrairTicketAtivo() {
  const el = document.querySelector("#ticket-sequential-id");
  if (el) {
    const txt = el.shadowRoot?.textContent || el.textContent || el.innerText || "";
    const m = txt.match(/\d+/);
    if (m) return "#" + m[0];
  }
  return "";
}

function extrairCliente() {
  const el = document.querySelector("#customer-name");
  if (el) {
    const nome = limparNome(el.shadowRoot?.textContent || el.textContent || el.innerText || "");
    if (nome) return nome;
  }
  return "";
}

function extrairTelefone() {
  for (const item of document.querySelectorAll(".profile-info-item")) {
    if (item.textContent.includes("tunnel.originator:")) {
      const link = item.querySelector('a[href^="mailto:"]');
      if (link) {
        const v = (link.textContent || "").trim().split("@")[0];
        if (v) return formatarTelefoneBR(v);
      }
    }
  }
  for (const sel of ['[class*="contact-info"]','[class*="contact-details"]','[class*="identification"]','[class*="contact-data"]','[data-testid*="contact"]']) {
    for (const p of document.querySelectorAll(sel)) {
      const m = (p.innerText || p.textContent || "").match(/\+?55\s?\(?\d{2}\)?[\s.-]?9?\d{4}[\s.-]?\d{4}\b/);
      if (m) return formatarTelefoneBR(m[0]);
    }
  }
  const m = (document.body?.innerText || "").match(/\+?55\d{10,11}\b/);
  return m ? formatarTelefoneBR(m[0]) : "";
}

const CACHE_KEY_PREFIX = 'protocolo_ext_ticket_';
const CACHE_TTL = 60 * 60 * 1000; // 1 hora em ms
const TEMA_KEY = 'protocolo_ext_tema';

function salvarCache(ticket, dados) {
  if (!ticket) return;
  try {
    localStorage.setItem(CACHE_KEY_PREFIX + ticket, JSON.stringify({
      ...dados,
      ts: Date.now()
    }));
  } catch(e) {}
}

function lerCache(ticket) {
  if (!ticket) return null;
  try {
    const raw = localStorage.getItem(CACHE_KEY_PREFIX + ticket);
    if (!raw) return null;
    const obj = JSON.parse(raw);
    if (Date.now() - obj.ts > CACHE_TTL) {
      localStorage.removeItem(CACHE_KEY_PREFIX + ticket);
      return null;
    }
    return obj;
  } catch(e) { return null; }
}

function limparCacheExpirado() {
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith(CACHE_KEY_PREFIX))
      .forEach(k => {
        const obj = JSON.parse(localStorage.getItem(k) || '{}');
        if (!obj.ts || Date.now() - obj.ts > CACHE_TTL) localStorage.removeItem(k);
      });
  } catch(e) {}
}
limparCacheExpirado();

function capturarDados() {
  const ticket = extrairTicketAtivo();

  // tenta cache primeiro
  if (ticket) {
    const cached = lerCache(ticket);
    if (cached) {
      // mesmo com cache, tenta atualizar cliente/telefone em background se estiverem vazios
      const clienteAoVivo = extrairCliente();
      const telefoneAoVivo = extrairTelefone();
      if (clienteAoVivo || telefoneAoVivo) {
        const atualizado = {
          cliente: clienteAoVivo || cached.cliente,
          telefone: telefoneAoVivo || cached.telefone,
          ticket
        };
        salvarCache(ticket, atualizado);
        return atualizado;
      }
      return { cliente: cached.cliente, telefone: cached.telefone, ticket };
    }
  }

  const cliente = extrairCliente();
  const telefone = extrairTelefone();
  salvarCache(ticket, { cliente, telefone, ticket });
  return { cliente, telefone, ticket };
}

/* ── PAINEL ────────────────────────────────────────────────────────────── */

function iniciarPainel() {
  ['painel-protocolo-ext','painel-fechamento-ext'].forEach(id => document.getElementById(id)?.remove());

  /* ── CSS injetado ── */
  const style = document.createElement('style');
  style.textContent = `
    #painel-protocolo-ext {
      position: fixed;
      bottom: 24px; right: 24px;
      width: 252px;
      background: #151922;
      border: 1px solid rgba(218,226,242,0.22);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.62), 0 1px 0 rgba(255,255,255,0.08) inset;
      z-index: 99999;
      font-family: Inter, 'Segoe UI', Roboto, Arial, sans-serif;
      font-size: 14px;
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
      box-sizing: border-box;
      user-select: none;
    }
    #painel-protocolo-ext.tema-claro {
      background: #ffffff;
      border-color: #e1e5ee;
      box-shadow: 0 4px 14px rgba(17,24,39,0.12);
    }

    /* cabeçalho arrastável */
    #ext-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 9px 12px 8px;
      background: rgba(255,255,255,0.06);
      border-bottom: 1px solid rgba(218,226,242,0.16);
      cursor: grab;
    }
    #ext-header:active { cursor: grabbing; }
    #painel-protocolo-ext.tema-claro #ext-header {
      background: #3f5ff2;
      border-bottom-color: #3152df;
    }
    #ext-header-title {
      font-size: 12px;
      font-weight: 600;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      color: #8fb6ff;
    }
    #painel-protocolo-ext.tema-claro #ext-header-title { color: #ffffff; }
    #ext-header-drag {
      display: flex; gap: 3px; align-items: center;
    }
    #ext-header-drag span {
      width: 4px; height: 4px;
      background: rgba(255,255,255,0.42);
      border-radius: 50%;
    }
    #painel-protocolo-ext.tema-claro #ext-header-drag span { background: rgba(255,255,255,0.58); }

    /* bloco de dados */
    #ext-dados {
      padding: 12px 14px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .ext-dado-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .ext-dado-label {
      font-size: 11px;
      font-weight: 700;
      letter-spacing: 0.4px;
      text-transform: uppercase;
      color: #ffd36a;
      width: 44px;
      flex-shrink: 0;
    }
    #painel-protocolo-ext.tema-claro .ext-dado-label { color: #8a5a00; }
    .ext-dado-valor {
      font-size: 13.5px;
      color: #f1f5ff;
      flex: 1;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    #painel-protocolo-ext.tema-claro .ext-dado-valor {
      color: #111827;
      font-weight: 500;
    }
    .ext-dado-valor.ticket-val {
      color: #9fc1ff;
      font-weight: 700;
    }
    #painel-protocolo-ext.tema-claro .ext-dado-valor.ticket-val { color: #3156d4; }
    .ext-btn-mini {
      background: none;
      border: 1px solid transparent;
      color: #aeb8ca;
      font-size: 12px;
      cursor: pointer;
      padding: 2px 3px;
      border-radius: 4px;
      transition: color 0.15s, background 0.15s;
      flex-shrink: 0;
    }
    .ext-btn-mini:hover { color: #ffffff; background: rgba(91,141,239,0.18); border-color: rgba(143,182,255,0.26); }
    #painel-protocolo-ext.tema-claro .ext-btn-mini,
    #painel-protocolo-ext.tema-claro #ext-dados #btn-atualizar-dados,
    #painel-protocolo-ext.tema-claro #ext-dados #btn-alternar-tema {
      color: #4b5870;
    }
    #painel-protocolo-ext.tema-claro .ext-btn-mini:hover {
      color: #1d4ed8;
      background: #eef3ff;
      border-color: #cfd9fb;
    }
    #painel-protocolo-ext.tema-claro #btn-atualizar-dados,
    #painel-protocolo-ext.tema-claro #btn-alternar-tema {
      color: #ffffff;
    }
    #painel-protocolo-ext.tema-claro #btn-atualizar-dados:hover,
    #painel-protocolo-ext.tema-claro #btn-alternar-tema:hover {
      color: #ffffff;
      background: rgba(255,255,255,0.16);
      border-color: rgba(255,255,255,0.32);
    }

    /* botão atualizar */
    #btn-atualizar-dados {
      background: none;
      border: 1px solid transparent;
      color: #b7c2d6;
      font-size: 13px;
      cursor: pointer;
      padding: 2px 4px;
      border-radius: 4px;
      transition: color 0.15s;
      line-height: 1;
    }
    #btn-alternar-tema {
      background: none;
      border: 1px solid transparent;
      color: #b7c2d6;
      font-size: 13px;
      cursor: pointer;
      padding: 2px 4px;
      border-radius: 4px;
      transition: color 0.15s, background 0.15s, border-color 0.15s;
      line-height: 1;
    }
    #btn-atualizar-dados:hover { color: #ffffff; border-color: rgba(143,182,255,0.24); background: rgba(91,141,239,0.14); }
    #btn-alternar-tema:hover { color: #ffffff; border-color: rgba(143,182,255,0.24); background: rgba(91,141,239,0.14); }

    /* divisor */
    .ext-divider {
      height: 1px;
      background: rgba(218,226,242,0.16);
      margin: 0 12px;
    }
    #painel-protocolo-ext.tema-claro .ext-divider { background: #edf0f5; }

    /* seção motivo */
    #ext-motivo-section {
      padding: 12px 14px 0;
      position: relative;
    }

    /* lista flutua no body, posicionada via JS */
    #lista-motivos {
      display: none;
      position: fixed;
      max-height: 210px;
      overflow-y: auto;
      border-radius: 7px;
      background: #10151f;
      border: 1px solid rgba(218,226,242,0.22);
      box-shadow: 0 -6px 20px rgba(0,0,0,0.5);
      scrollbar-width: thin;
      scrollbar-color: #2a2f3e transparent;
      z-index: 2147483647;
    }
    #lista-motivos.aberta { display: block; }
    #lista-motivos.tema-claro {
      background: #fbfcff;
      border-color: #b8c2d4;
      box-shadow: 0 -6px 18px rgba(17,24,39,0.14);
      scrollbar-color: #c8d1df transparent;
    }

    .ext-motivo-item {
      padding: 8px 11px;
      font-size: 13.5px;
      color: #d7deea;
      cursor: pointer;
      border-bottom: 1px solid rgba(255,255,255,0.03);
      transition: background 0.12s, color 0.12s;
    }
    .ext-motivo-item:last-child { border-bottom: none; }
    .ext-motivo-item:hover { background: #22304a; color: #ffffff; }
    #lista-motivos.tema-claro .ext-motivo-item {
      color: #111827;
      border-bottom-color: #dfe4ee;
      font-weight: 500;
    }
    #lista-motivos.tema-claro .ext-motivo-item:hover {
      background: #e8efff;
      color: #163fb8;
      font-weight: 700;
    }
    #lista-motivos.tema-claro .ext-motivo-item.ativo {
      background: #e5ecff;
      color: #163fb8;
      font-weight: 700;
    }
    .ext-motivo-item.ativo {
      color: #ffffff;
      background: rgba(91,141,239,0.28);
      font-weight: 600;
    }

    /* input de motivo (substitui o botão toggle) */
    #campo-motivo-display {
      width: 100%;
      padding: 7px 28px 7px 10px;
      background: #0f1520;
      border: 1px solid rgba(218,226,242,0.26);
      border-radius: 7px;
      color: #f3f6fb;
      font-size: 13.5px;
      font-family: inherit;
      outline: none;
      box-sizing: border-box;
      cursor: pointer;
      transition: border-color 0.15s;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      appearance: none;
      -webkit-appearance: none;
      position: relative;
    }
    #painel-protocolo-ext.tema-claro #campo-motivo-display {
      background: #fbfcff;
      border-color: #aeb9cc;
      color: #111827;
      font-weight: 500;
    }
    #painel-protocolo-ext.tema-claro #campo-motivo-display:focus,
    #painel-protocolo-ext.tema-claro #campo-motivo-display.aberto {
      border-color: #3f5ff2;
      box-shadow: 0 0 0 2px rgba(63,95,242,0.22);
    }
    #campo-motivo-display:focus,
    #campo-motivo-display.aberto { border-color: #8fb6ff; box-shadow: 0 0 0 2px rgba(91,141,239,0.22); }

    #campo-busca {
      width: 100%;
      padding: 7px 10px;
      background: #151b27;
      border: none;
      border-bottom: 1px solid rgba(218,226,242,0.18);
      color: #f3f6fb;
      font-size: 13px;
      font-family: inherit;
      outline: none;
      box-sizing: border-box;
    }
    #campo-busca::placeholder { color: #9aa6b8; }
    #lista-motivos.tema-claro #campo-busca {
      background: #fbfcff;
      border-bottom-color: #cfd6e3;
      color: #111827;
      font-weight: 500;
    }
    #lista-motivos.tema-claro #campo-busca::placeholder { color: #5f6b7c; }

    /* wrapper do select customizado */
    #ext-select-wrap {
      position: relative;
      margin-bottom: 10px;
    }
    #ext-select-wrap::after {
      content: '▾';
      position: absolute;
      right: 9px;
      top: 50%;
      transform: translateY(-50%);
      color: #b7c2d6;
      font-size: 11px;
      pointer-events: none;
    }
    #painel-protocolo-ext.tema-claro #ext-select-wrap::after { color: #455266; }

    /* rodapé de ações — agora só o botão copiar */
    #ext-acoes {
      padding: 0 14px 12px;
    }
    #btn-copiar-protocolo {
      width: 100%;
      padding: 9px 10px;
      background: #2753b8;
      color: #fff;
      border: none;
      border-radius: 7px;
      font-weight: 600;
      font-size: 13.5px;
      cursor: pointer;
      transition: background 0.15s;
    }
    #btn-copiar-protocolo:hover { background: #3462cc; }
    #painel-protocolo-ext.tema-claro #btn-copiar-protocolo {
      background: #3f5ff2;
      color: #ffffff;
      box-shadow: none;
    }
    #painel-protocolo-ext.tema-claro #btn-copiar-protocolo:hover { background: #3152df; }

    /* painel fechamento */
    #painel-fechamento-ext {
      position: fixed;
      width: 268px;
      background: #122018;
      border: 1px solid rgba(126,211,141,0.38);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.55);
      z-index: 99999;
      padding: 12px;
      font-family: 'Segoe UI', system-ui, Arial, sans-serif;
      box-sizing: border-box;
      display: none;
    }
    #painel-fechamento-ext.tema-claro {
      background: #ffffff;
      border-color: #d7dce7;
      box-shadow: 0 4px 14px rgba(17,24,39,0.12);
    }
    #ext-fecha-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }
    #ext-fecha-label {
      font-size: 10px;
      font-weight: 700;
      letter-spacing: 0.6px;
      text-transform: uppercase;
      color: #8ee59d;
    }
    #painel-fechamento-ext.tema-claro #ext-fecha-label { color: #2f7d3c; }
    #btn-fechar-fecha {
      background: none;
      border: 1px solid transparent;
      color: #bad9c0;
      font-size: 14px;
      cursor: pointer;
      transition: color 0.15s;
    }
    #btn-fechar-fecha:hover { color: #ffffff; background: rgba(255,255,255,0.08); border-color: rgba(255,255,255,0.14); }
    #painel-fechamento-ext.tema-claro #btn-fechar-fecha { color: #436b4c; }
    #painel-fechamento-ext.tema-claro #btn-fechar-fecha:hover {
      color: #166534;
      background: rgba(22,101,52,0.08);
      border-color: rgba(22,101,52,0.16);
    }
    #texto-fechamento {
      width: 100%;
      height: 130px;
      background: #07130c;
      color: #ecfff0;
      border: 1px solid rgba(126,211,141,0.42);
      border-radius: 7px;
      padding: 8px 10px;
      font-size: 12px;
      line-height: 1.55;
      font-family: inherit;
      box-sizing: border-box;
      resize: none;
      outline: none;
    }
    #texto-fechamento:focus {
      border-color: #8ee59d;
      box-shadow: 0 0 0 2px rgba(76,175,80,0.24);
    }
    #texto-fechamento::placeholder { color: #a7c5ad; }
    #painel-fechamento-ext.tema-claro #texto-fechamento {
      background: #ffffff;
      color: #2f3747;
      border-color: #cfd6e3;
    }
    #painel-fechamento-ext.tema-claro #texto-fechamento::placeholder { color: #8a94a6; }
    #btn-copiar-fecha {
      width: 100%;
      margin-top: 8px;
      padding: 9px;
      background: #23802d;
      color: #fff;
      border: none;
      border-radius: 7px;
      font-weight: 600;
      font-size: 12.5px;
      cursor: pointer;
      transition: background 0.15s;
    }
    #btn-copiar-fecha:hover { background: #2c9438; }
  `;
  document.head.appendChild(style);

  /* ── HTML do painel ── */
  const painel = document.createElement('div');
  painel.id = 'painel-protocolo-ext';
  painel.innerHTML = `
    <div id="ext-header">
      <span id="ext-header-title">📋 Protocolo</span>
      <div style="display:flex;align-items:center;gap:6px;">
        <button id="btn-atualizar-dados" title="Atualizar dados">↻</button>
        <button id="btn-alternar-tema" title="Usar tema claro">☀</button>
        <div id="ext-header-drag">
          <span></span><span></span><span></span>
          <span></span><span></span><span></span>
        </div>
      </div>
    </div>

    <div id="ext-dados">
      <div class="ext-dado-row" id="row-cliente">
        <span class="ext-dado-label">Cliente</span>
        <span id="info-cliente" class="ext-dado-valor" title="">—</span>
        <button class="ext-btn-mini" data-campo="info-cliente" title="Copiar">⎘</button>
      </div>
      <div class="ext-dado-row" id="row-ticket">
        <span class="ext-dado-label">Ticket</span>
        <span id="info-ticket" class="ext-dado-valor ticket-val">—</span>
        <button class="ext-btn-mini" data-campo="info-ticket" title="Copiar">⎘</button>
      </div>
      <div class="ext-dado-row" id="row-telefone">
        <span class="ext-dado-label">Fone</span>
        <span id="info-telefone" class="ext-dado-valor">—</span>
        <button class="ext-btn-mini" data-campo="info-telefone" title="Copiar">⎘</button>
      </div>
    </div>

    <div class="ext-divider" id="ext-divider-dados" style="display:none;"></div>

    <div id="ext-motivo-section">
      <div id="ext-select-wrap">
        <div id="campo-motivo-display" tabindex="0">Selecione um motivo…</div>
      </div>
    </div>

    <div id="ext-acoes">
      <button id="btn-copiar-protocolo">Copiar Protocolo</button>
    </div>
  `;
  document.body.appendChild(painel);

  /* ── Painel de fechamento ── */
  const painelFecha = document.createElement('div');
  painelFecha.id = 'painel-fechamento-ext';
  painelFecha.innerHTML = `
    <div id="ext-fecha-header">
      <span id="ext-fecha-label">Fechamento</span>
      <button id="btn-fechar-fecha">✕</button>
    </div>
    <textarea id="texto-fechamento" placeholder="Edite o fechamento antes de copiar"></textarea>
    <button id="btn-copiar-fecha">Copiar Fechamento</button>
  `;
  document.body.appendChild(painelFecha);

  /* ── Lista de motivos flutuante (fora do painel para não ser cortada) ── */
  const listaContainer = document.createElement('div');
  listaContainer.id = 'lista-motivos';
  listaContainer.innerHTML = `<input type="text" id="campo-busca" placeholder="Buscar…">`;
  document.body.appendChild(listaContainer);

  /* ── DRAG ─────────────────────────────────────────────────── */
  (function ativarDrag(el, alca) {
    let ox = 0, oy = 0, mx = 0, my = 0;
    alca.addEventListener('mousedown', e => {
      e.preventDefault();
      mx = e.clientX; my = e.clientY;
      document.addEventListener('mousemove', mover);
      document.addEventListener('mouseup', soltar);
    });
    function mover(e) {
      ox = mx - e.clientX; oy = my - e.clientY;
      mx = e.clientX; my = e.clientY;
      let novoTop  = el.offsetTop  - oy;
      let novoLeft = el.offsetLeft - ox;
      // limita à viewport
      novoTop  = Math.max(0, Math.min(window.innerHeight - el.offsetHeight, novoTop));
      novoLeft = Math.max(0, Math.min(window.innerWidth  - el.offsetWidth,  novoLeft));
      el.style.top    = novoTop  + 'px';
      el.style.left   = novoLeft + 'px';
      el.style.bottom = 'auto';
      el.style.right  = 'auto';
    }
    function soltar() {
      document.removeEventListener('mousemove', mover);
      document.removeEventListener('mouseup', soltar);
    }
  })(painel, document.getElementById('ext-header'));

  /* ── ATUALIZAÇÃO DE DADOS ─────────────────────────────────── */
  function atualizarDados() {
    const { cliente, telefone, ticket } = capturarDados();

    const setLinha = (campoId, valor, extra) => {
      const campo = document.getElementById(campoId);
      if (!campo) return;
      campo.textContent = valor || '—';
      if (extra) extra(campo, valor);
    };

    setLinha('info-cliente',  cliente,  (el, v) => { el.title = v || ''; });
    setLinha('info-ticket',   ticket,   null);
    setLinha('info-telefone', telefone, null);

    // divisor e padding sempre visíveis
    const div = document.getElementById('ext-divider-dados');
    if (div) div.style.display = 'block';
    const extDados = document.getElementById('ext-dados');
    if (extDados) extDados.style.padding = '10px 12px';
  }
  atualizarDados();
  setInterval(atualizarDados, 5000);

  /* ── POSIÇÃO DO PAINEL DE FECHAMENTO ─────────────────────── */
  function posicionarFechamento() {
    const r = painel.getBoundingClientRect();
    const lf = painelFecha.offsetWidth || 268;
    let left = r.left - lf - 12;
    if (left < 8) left = Math.min(window.innerWidth - lf - 8, r.right + 12);
    painelFecha.style.top   = r.top + 'px';
    painelFecha.style.left  = left + 'px';
    painelFecha.style.bottom = 'auto';
    painelFecha.style.right  = 'auto';
  }

  /* ── SELECT CUSTOMIZADO (lista abre pra cima) ─────────────── */
  const opcoes = Object.keys(ModelosProtocolo.descricoesPorMotivo).sort();
  let motivoSelecionado = "";

  const campoBusca        = document.getElementById('campo-busca');
  const campoDisplay      = document.getElementById('campo-motivo-display');
  const btnCopiar         = document.getElementById('btn-copiar-protocolo');
  const btnAtualizar      = document.getElementById('btn-atualizar-dados');
  const btnAlternarTema   = document.getElementById('btn-alternar-tema');
  const btnFecharFecha    = document.getElementById('btn-fechar-fecha');
  const btnCopiarFecha    = document.getElementById('btn-copiar-fecha');
  const textoFechamento   = document.getElementById('texto-fechamento');
  let fechamentoOriginal = "";
  let fechamentoEditado = false;

  function aplicarTema(tema) {
    const temaClaro = tema === 'claro';
    const header = document.getElementById('ext-header');
    const titulo = document.getElementById('ext-header-title');
    painel.classList.toggle('tema-claro', temaClaro);
    painelFecha.classList.toggle('tema-claro', temaClaro);
    listaContainer.classList.toggle('tema-claro', temaClaro);
    btnAlternarTema.textContent = temaClaro ? '☾' : '☀';
    btnAlternarTema.title = temaClaro ? 'Usar tema escuro' : 'Usar tema claro';

    if (header) {
      header.style.background = temaClaro ? '#3f5ff2' : 'rgba(255,255,255,0.06)';
      header.style.borderBottomColor = temaClaro ? '#3152df' : 'rgba(218,226,242,0.16)';
    }
    if (titulo) titulo.style.color = temaClaro ? '#ffffff' : '#8fb6ff';
    btnAtualizar.style.color = temaClaro ? '#ffffff' : '#b7c2d6';
    btnAlternarTema.style.color = temaClaro ? '#ffffff' : '#b7c2d6';
  }

  aplicarTema(localStorage.getItem(TEMA_KEY) || 'escuro');

  function fecharLista() {
    listaContainer.classList.remove('aberta');
    campoDisplay.classList.remove('aberto');
  }

  function posicionarLista() {
    const r = campoDisplay.getBoundingClientRect();
    const largura = r.width;
    listaContainer.style.width = largura + 'px';
    listaContainer.style.left  = r.left + 'px';

    // decide se abre pra cima ou pra baixo
    const alturaLista = Math.min(210, listaContainer.scrollHeight || 210);
    const espacoAcima = r.top;
    const espacoAbaixo = window.innerHeight - r.bottom;

    if (espacoAcima > alturaLista || espacoAcima > espacoAbaixo) {
      // abre pra cima
      listaContainer.style.top    = (r.top - alturaLista - 4) + 'px';
      listaContainer.style.bottom = 'auto';
    } else {
      // abre pra baixo
      listaContainer.style.top    = (r.bottom + 4) + 'px';
      listaContainer.style.bottom = 'auto';
    }
  }

  function abrirLista() {
    campoBusca.value = '';
    renderizarItens('');
    listaContainer.classList.add('aberta');
    campoDisplay.classList.add('aberto');
    posicionarLista();
    setTimeout(() => campoBusca.focus(), 50);
    // scroll até o item ativo
    const ativo = listaContainer.querySelector('.ativo');
    if (ativo) ativo.scrollIntoView({ block: 'nearest' });
  }

  campoDisplay.addEventListener('click', () => {
    listaContainer.classList.contains('aberta') ? fecharLista() : abrirLista();
  });

  campoDisplay.addEventListener('keydown', e => {
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirLista(); }
    if (e.key === 'Escape') fecharLista();
  });

  // clique fora fecha a lista
  document.addEventListener('click', e => {
    if (!document.getElementById('ext-select-wrap')?.contains(e.target) &&
        !listaContainer.contains(e.target)) fecharLista();
  });

  function renderizarItens(filtro) {
    // remove itens anteriores mas mantém o input de busca
    Array.from(listaContainer.children).forEach(c => {
      if (c.id !== 'campo-busca') c.remove();
    });
    const filtrados = opcoes.filter(o => o.toLowerCase().includes(filtro.toLowerCase()));
    if (!filtrados.length) {
      const vazio = document.createElement('div');
      vazio.className = 'ext-motivo-item';
      vazio.style.color = '#3a3f50';
      vazio.style.cursor = 'default';
      vazio.textContent = 'Nenhum resultado';
      listaContainer.appendChild(vazio);
      return;
    }
    filtrados.forEach(opcao => {
      const item = document.createElement('div');
      item.className = 'ext-motivo-item' + (opcao === motivoSelecionado ? ' ativo' : '');
      item.textContent = opcao;
      item.addEventListener('mousedown', e => {
        e.preventDefault(); // evita blur no campo busca
        motivoSelecionado = opcao;
        campoDisplay.textContent = opcao;
        painelFecha.style.display = 'none';
        fecharLista();
      });
      listaContainer.appendChild(item);
    });
  }

  campoBusca.addEventListener('input', e => renderizarItens(e.target.value));
  campoBusca.addEventListener('click', e => e.stopPropagation());

  btnAtualizar.addEventListener('click', () => {
    atualizarDados();
    btnAtualizar.textContent = '✓';
    setTimeout(() => { btnAtualizar.textContent = '↻'; }, 1500);
  });

  btnAlternarTema.addEventListener('click', () => {
    const proximoTema = painel.classList.contains('tema-claro') ? 'escuro' : 'claro';
    localStorage.setItem(TEMA_KEY, proximoTema);
    aplicarTema(proximoTema);
  });

  document.querySelectorAll('.ext-btn-mini').forEach(btn => {
    btn.addEventListener('click', () => {
      const el = document.getElementById(btn.dataset.campo);
      const txt = el?.textContent?.trim();
      if (!txt || txt === '—') return;
      navigator.clipboard.writeText(txt).then(() => {
        const orig = btn.textContent;
        btn.textContent = '✓';
        setTimeout(() => { btn.textContent = orig; }, 1500);
      });
    });
  });

  btnFecharFecha.addEventListener('click', () => { painelFecha.style.display = 'none'; });

  btnCopiarFecha.addEventListener('click', () => {
    navigator.clipboard.writeText(textoFechamento.value).then(() => {
      btnCopiarFecha.textContent = "✓ Copiado";
      textoFechamento.value = fechamentoOriginal;
      fechamentoEditado = false;
      setTimeout(() => { btnCopiarFecha.textContent = "Copiar Fechamento"; }, 2000);
    });
  });

  textoFechamento.addEventListener('input', () => {
    fechamentoEditado = textoFechamento.value !== fechamentoOriginal;
    btnCopiarFecha.textContent = fechamentoEditado ? "Copiar Editado" : "Copiar Fechamento";
  });

  btnCopiar.addEventListener('click', () => {
    if (!motivoSelecionado) {
      abrirLista();
      alert("Selecione um Tipo de Atendimento antes de copiar!");
      return;
    }
    const { cliente, telefone, ticket } = capturarDados();
    const abertura = ModelosProtocolo.gerarAbertura(cliente, telefone, ticket, motivoSelecionado);
    navigator.clipboard.writeText(abertura).then(() => {
      btnCopiar.textContent = "✓ Copiado!";
      setTimeout(() => { btnCopiar.textContent = "Copiar Protocolo"; }, 2000);
      const fechamento = ModelosProtocolo.gerarFechamento(motivoSelecionado);
      if (fechamento?.trim()) {
        fechamentoOriginal = fechamento;
        fechamentoEditado = false;
        textoFechamento.value = fechamento;
        btnCopiarFecha.textContent = "Copiar Fechamento";
        painelFecha.style.display = 'block';
        posicionarFechamento();
      }
    });
  });

  renderizarItens('');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(iniciarPainel, 1500));
} else {
  setTimeout(iniciarPainel, 1500);
}

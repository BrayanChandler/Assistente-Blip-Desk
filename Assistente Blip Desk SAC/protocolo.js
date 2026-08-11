/*
 * Arquivo comentado didaticamente em português.
 * Os comentários explicam o fluxo geral, DOM, eventos, armazenamento, cache e funções importantes.
 * A lógica original foi preservada: nomes, seletores, chaves, textos funcionais e URLs não foram alterados.
 */
// Assistente Blip Desk - Protocolo
// Criado por Brayan · BRYAN-ORIG-12de19360097a0ce

/* ── EXTRAÇÃO ROBUSTA DE DADOS DO ATENDIMENTO ─────────────────────────── */

// Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
function normalizarLinhas(texto) {
  return texto.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
}

// Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
function limparNome(nome) {
  return (nome || "").trim().replace(/^\(\d+\)\s*/, "").replace(/\s*\(\d+\)\s*$/, "").replace(/\s+/g, " ");
}

// Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
function formatarTelefoneBR(t) {
  let n = (t || "").replace(/\D/g, "");
  // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
  if (!n) return "";
  // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
  if (n.startsWith("55") && n.length > 11) n = n.slice(2);
  // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
  if (![10, 11].includes(n.length)) return (t || "").trim() || "";
  const ddd = n.slice(0, 2), r = n.slice(2);
  return r.length === 9
    ? `(${ddd}) ${r.slice(0,5)}-${r.slice(5)}`
    : `(${ddd}) ${r.slice(0,4)}-${r.slice(4)}`;
}

// Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
function extrairTicketAtivo() {
  // Captura elementos da tela para poder ler valores, alterar conteúdo ou ligar eventos.
  const el = document.querySelector("#ticket-sequential-id");
  // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
  if (el) {
    // Atualização visual ou textual de elementos da interface.
    const txt = el.shadowRoot?.textContent || el.textContent || el.innerText || "";
    const m = txt.match(/\d+/);
    // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
    if (m) return "#" + m[0];
  }
  return "";
}

// Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
function extrairCliente() {
  // Captura elementos da tela para poder ler valores, alterar conteúdo ou ligar eventos.
  const el = document.querySelector("#customer-name");
  // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
  if (el) {
    // Atualização visual ou textual de elementos da interface.
    const nome = limparNome(el.shadowRoot?.textContent || el.textContent || el.innerText || "");
    // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
    if (nome) return nome;
  }
  return "";
}

// Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
function extrairTelefone() {
  // Busca no DOM para encontrar o elemento exato que será lido ou alterado.
  for (const item of document.querySelectorAll(".profile-info-item")) {
    // Atualização visual ou textual de elementos da interface.
    if (item.textContent.includes("tunnel.originator:")) {
      // Busca no DOM para encontrar o elemento exato que será lido ou alterado.
      const link = item.querySelector('a[href^="mailto:"]');
      // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
      if (link) {
        // Atualização visual ou textual de elementos da interface.
        const v = (link.textContent || "").trim().split("@")[0];
        // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
        if (v) return formatarTelefoneBR(v);
      }
    }
  }
  // Laço de repetição usado para percorrer itens até encontrar ou montar os dados necessários.
  for (const sel of ['[class*="contact-info"]','[class*="contact-details"]','[class*="identification"]','[class*="contact-data"]','[data-testid*="contact"]']) {
    // Busca no DOM para encontrar o elemento exato que será lido ou alterado.
    for (const p of document.querySelectorAll(sel)) {
      // Atualização visual ou textual de elementos da interface.
      const m = (p.innerText || p.textContent || "").match(/\+?55\s?\(?\d{2}\)?[\s.-]?9?\d{4}[\s.-]?\d{4}\b/);
      // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
      if (m) return formatarTelefoneBR(m[0]);
    }
  }
  // Atualização visual ou textual de elementos da interface.
  const m = (document.body?.innerText || "").match(/\+?55\d{10,11}\b/);
  return m ? formatarTelefoneBR(m[0]) : "";
}

// Ponto relacionado ao cache: evita refazer buscas ou cálculos quando a informação já foi obtida.
const CACHE_KEY_PREFIX = 'protocolo_ext_ticket_';
// Ponto relacionado ao cache: evita refazer buscas ou cálculos quando a informação já foi obtida.
const CACHE_TTL = 60 * 60 * 1000; // 1 hora em ms
const TEMA_KEY = 'protocolo_ext_tema';

// Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
function salvarCache(ticket, dados) {
  // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
  if (!ticket) return;
  // Bloco protegido para capturar falhas sem quebrar todo o funcionamento da extensão.
  try {
    // Uso do armazenamento do navegador para manter ou recuperar informações entre execuções.
    localStorage.setItem(CACHE_KEY_PREFIX + ticket, JSON.stringify({
      ...dados,
      ts: Date.now()
    }));
  } catch(e) {}
}

// Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
function lerCache(ticket) {
  // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
  if (!ticket) return null;
  // Bloco protegido para capturar falhas sem quebrar todo o funcionamento da extensão.
  try {
    // Uso do armazenamento do navegador para manter ou recuperar informações entre execuções.
    const raw = localStorage.getItem(CACHE_KEY_PREFIX + ticket);
    // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
    if (!raw) return null;
    const obj = JSON.parse(raw);
    // Ponto relacionado ao cache: evita refazer buscas ou cálculos quando a informação já foi obtida.
    if (Date.now() - obj.ts > CACHE_TTL) {
      // Uso do armazenamento do navegador para manter ou recuperar informações entre execuções.
      localStorage.removeItem(CACHE_KEY_PREFIX + ticket);
      return null;
    }
    return obj;
  } catch(e) { return null; }
}

// Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
function limparCacheExpirado() {
  // Bloco protegido para capturar falhas sem quebrar todo o funcionamento da extensão.
  try {
    Object.keys(localStorage)
      .filter(k => k.startsWith(CACHE_KEY_PREFIX))
      .forEach(k => {
        // Uso do armazenamento do navegador para manter ou recuperar informações entre execuções.
        const obj = JSON.parse(localStorage.getItem(k) || '{}');
        // Uso do armazenamento do navegador para manter ou recuperar informações entre execuções.
        if (!obj.ts || Date.now() - obj.ts > CACHE_TTL) localStorage.removeItem(k);
      });
  } catch(e) {}
}
limparCacheExpirado();

// Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
function capturarDados() {
  const ticket = extrairTicketAtivo();

  // tenta cache primeiro
  // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
  if (ticket) {
    // Ponto relacionado ao cache: evita refazer buscas ou cálculos quando a informação já foi obtida.
    const cached = lerCache(ticket);
    // Ponto relacionado ao cache: evita refazer buscas ou cálculos quando a informação já foi obtida.
    if (cached) {
      // mesmo com cache, tenta atualizar cliente/telefone em background se estiverem vazios
      const clienteAoVivo = extrairCliente();
      const telefoneAoVivo = extrairTelefone();
      // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
      if (clienteAoVivo || telefoneAoVivo) {
        const atualizado = {
          cliente: clienteAoVivo || cached.cliente,
          telefone: telefoneAoVivo || cached.telefone,
          ticket
        };
        salvarCache(ticket, atualizado);
        return atualizado;
      }
      // Ponto relacionado ao cache: evita refazer buscas ou cálculos quando a informação já foi obtida.
      return { cliente: cached.cliente, telefone: cached.telefone, ticket };
    }
  }

  const cliente = extrairCliente();
  const telefone = extrairTelefone();
  salvarCache(ticket, { cliente, telefone, ticket });
  return { cliente, telefone, ticket };
}

/* ── PAINEL ────────────────────────────────────────────────────────────── */

// Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
function iniciarPainel() {
  // Busca no DOM para encontrar o elemento exato que será lido ou alterado.
  ['painel-protocolo-ext','painel-fechamento-ext'].forEach(id => document.getElementById(id)?.remove());

  /* ── CSS injetado ── */
  const style = document.createElement('style');
  // Atualização visual ou textual de elementos da interface.
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
  // Atualização visual ou textual de elementos da interface.
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
  // Atualização visual ou textual de elementos da interface.
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
  // Atualização visual ou textual de elementos da interface.
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
    // Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
    function mover(e) {
      ox = mx - e.clientX; oy = my - e.clientY;
      mx = e.clientX; my = e.clientY;
      let novoTop  = el.offsetTop  - oy;
      let novoLeft = el.offsetLeft - ox;
      // limita à viewport
      novoTop  = Math.max(0, Math.min(window.innerHeight - el.offsetHeight, novoTop));
      novoLeft = Math.max(0, Math.min(window.innerWidth  - el.offsetWidth,  novoLeft));
      // Atualização visual ou textual de elementos da interface.
      el.style.top    = novoTop  + 'px';
      // Atualização visual ou textual de elementos da interface.
      el.style.left   = novoLeft + 'px';
      // Atualização visual ou textual de elementos da interface.
      el.style.bottom = 'auto';
      // Atualização visual ou textual de elementos da interface.
      el.style.right  = 'auto';
    }
    // Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
    function soltar() {
      document.removeEventListener('mousemove', mover);
      document.removeEventListener('mouseup', soltar);
    }
  // Busca no DOM para encontrar o elemento exato que será lido ou alterado.
  })(painel, document.getElementById('ext-header'));

  /* ── ATUALIZAÇÃO DE DADOS ─────────────────────────────────── */
  // Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
  function atualizarDados() {
    const { cliente, telefone, ticket } = capturarDados();

    // Função em formato de seta usada para organizar uma ação reutilizável do script.
    const setLinha = (campoId, valor, extra) => {
      // Captura elementos da tela para poder ler valores, alterar conteúdo ou ligar eventos.
      const campo = document.getElementById(campoId);
      // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
      if (!campo) return;
      // Atualização visual ou textual de elementos da interface.
      campo.textContent = valor || '—';
      // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
      if (extra) extra(campo, valor);
    };

    setLinha('info-cliente',  cliente,  (el, v) => { el.title = v || ''; });
    setLinha('info-ticket',   ticket,   null);
    setLinha('info-telefone', telefone, null);

    // divisor e padding sempre visíveis
    // Captura elementos da tela para poder ler valores, alterar conteúdo ou ligar eventos.
    const div = document.getElementById('ext-divider-dados');
    // Atualização visual ou textual de elementos da interface.
    if (div) div.style.display = 'block';
    // Captura elementos da tela para poder ler valores, alterar conteúdo ou ligar eventos.
    const extDados = document.getElementById('ext-dados');
    // Atualização visual ou textual de elementos da interface.
    if (extDados) extDados.style.padding = '10px 12px';
  }
  atualizarDados();
  // Controle de tempo usado para aguardar a página responder ou repetir uma verificação.
  setInterval(atualizarDados, 5000);

  /* ── POSIÇÃO DO PAINEL DE FECHAMENTO ─────────────────────── */
  // Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
  function posicionarFechamento() {
    const r = painel.getBoundingClientRect();
    const lf = painelFecha.offsetWidth || 268;
    let left = r.left - lf - 12;
    // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
    if (left < 8) left = Math.min(window.innerWidth - lf - 8, r.right + 12);
    // Atualização visual ou textual de elementos da interface.
    painelFecha.style.top   = r.top + 'px';
    // Atualização visual ou textual de elementos da interface.
    painelFecha.style.left  = left + 'px';
    // Atualização visual ou textual de elementos da interface.
    painelFecha.style.bottom = 'auto';
    // Atualização visual ou textual de elementos da interface.
    painelFecha.style.right  = 'auto';
  }

  /* ── SELECT CUSTOMIZADO (lista abre pra cima) ─────────────── */
  const opcoes = Object.keys(ModelosProtocolo.descricoesPorMotivo).sort();
  let motivoSelecionado = "";

  // Captura elementos da tela para poder ler valores, alterar conteúdo ou ligar eventos.
  const campoBusca        = document.getElementById('campo-busca');
  // Captura elementos da tela para poder ler valores, alterar conteúdo ou ligar eventos.
  const campoDisplay      = document.getElementById('campo-motivo-display');
  // Captura elementos da tela para poder ler valores, alterar conteúdo ou ligar eventos.
  const btnCopiar         = document.getElementById('btn-copiar-protocolo');
  // Captura elementos da tela para poder ler valores, alterar conteúdo ou ligar eventos.
  const btnAtualizar      = document.getElementById('btn-atualizar-dados');
  // Captura elementos da tela para poder ler valores, alterar conteúdo ou ligar eventos.
  const btnAlternarTema   = document.getElementById('btn-alternar-tema');
  // Captura elementos da tela para poder ler valores, alterar conteúdo ou ligar eventos.
  const btnFecharFecha    = document.getElementById('btn-fechar-fecha');
  // Captura elementos da tela para poder ler valores, alterar conteúdo ou ligar eventos.
  const btnCopiarFecha    = document.getElementById('btn-copiar-fecha');
  // Captura elementos da tela para poder ler valores, alterar conteúdo ou ligar eventos.
  const textoFechamento   = document.getElementById('texto-fechamento');
  let fechamentoOriginal = "";
  let fechamentoEditado = false;

  // Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
  function aplicarTema(tema) {
    const temaClaro = tema === 'claro';
    // Captura elementos da tela para poder ler valores, alterar conteúdo ou ligar eventos.
    const header = document.getElementById('ext-header');
    // Captura elementos da tela para poder ler valores, alterar conteúdo ou ligar eventos.
    const titulo = document.getElementById('ext-header-title');
    // Atualização visual ou textual de elementos da interface.
    painel.classList.toggle('tema-claro', temaClaro);
    // Atualização visual ou textual de elementos da interface.
    painelFecha.classList.toggle('tema-claro', temaClaro);
    // Atualização visual ou textual de elementos da interface.
    listaContainer.classList.toggle('tema-claro', temaClaro);
    // Atualização visual ou textual de elementos da interface.
    btnAlternarTema.textContent = temaClaro ? '☾' : '☀';
    btnAlternarTema.title = temaClaro ? 'Usar tema escuro' : 'Usar tema claro';

    // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
    if (header) {
      // Atualização visual ou textual de elementos da interface.
      header.style.background = temaClaro ? '#3f5ff2' : 'rgba(255,255,255,0.06)';
      // Atualização visual ou textual de elementos da interface.
      header.style.borderBottomColor = temaClaro ? '#3152df' : 'rgba(218,226,242,0.16)';
    }
    // Atualização visual ou textual de elementos da interface.
    if (titulo) titulo.style.color = temaClaro ? '#ffffff' : '#8fb6ff';
    // Atualização visual ou textual de elementos da interface.
    btnAtualizar.style.color = temaClaro ? '#ffffff' : '#b7c2d6';
    // Atualização visual ou textual de elementos da interface.
    btnAlternarTema.style.color = temaClaro ? '#ffffff' : '#b7c2d6';
  }

  // Uso do armazenamento do navegador para manter ou recuperar informações entre execuções.
  aplicarTema(localStorage.getItem(TEMA_KEY) || 'escuro');

  // Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
  function fecharLista() {
    // Atualização visual ou textual de elementos da interface.
    listaContainer.classList.remove('aberta');
    // Atualização visual ou textual de elementos da interface.
    campoDisplay.classList.remove('aberto');
  }

  // Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
  function posicionarLista() {
    const r = campoDisplay.getBoundingClientRect();
    const largura = r.width;
    // Atualização visual ou textual de elementos da interface.
    listaContainer.style.width = largura + 'px';
    // Atualização visual ou textual de elementos da interface.
    listaContainer.style.left  = r.left + 'px';

    // decide se abre pra cima ou pra baixo
    const alturaLista = Math.min(210, listaContainer.scrollHeight || 210);
    const espacoAcima = r.top;
    const espacoAbaixo = window.innerHeight - r.bottom;

    // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
    if (espacoAcima > alturaLista || espacoAcima > espacoAbaixo) {
      // abre pra cima
      // Atualização visual ou textual de elementos da interface.
      listaContainer.style.top    = (r.top - alturaLista - 4) + 'px';
      // Atualização visual ou textual de elementos da interface.
      listaContainer.style.bottom = 'auto';
    } else {
      // abre pra baixo
      // Atualização visual ou textual de elementos da interface.
      listaContainer.style.top    = (r.bottom + 4) + 'px';
      // Atualização visual ou textual de elementos da interface.
      listaContainer.style.bottom = 'auto';
    }
  }

  // Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
  function abrirLista() {
    // Atualização visual ou textual de elementos da interface.
    campoBusca.value = '';
    renderizarItens('');
    // Atualização visual ou textual de elementos da interface.
    listaContainer.classList.add('aberta');
    // Atualização visual ou textual de elementos da interface.
    campoDisplay.classList.add('aberto');
    posicionarLista();
    // Controle de tempo usado para aguardar a página responder ou repetir uma verificação.
    setTimeout(() => campoBusca.focus(), 50);
    // scroll até o item ativo
    // Busca no DOM para encontrar o elemento exato que será lido ou alterado.
    const ativo = listaContainer.querySelector('.ativo');
    // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
    if (ativo) ativo.scrollIntoView({ block: 'nearest' });
  }

  // Evento de clique: executa esta ação quando o usuário pressiona o botão correspondente.
  campoDisplay.addEventListener('click', () => {
    // Atualização visual ou textual de elementos da interface.
    listaContainer.classList.contains('aberta') ? fecharLista() : abrirLista();
  });

  // Evento da interface: reage à interação do usuário e mantém os dados sincronizados.
  campoDisplay.addEventListener('keydown', e => {
    // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
    if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); abrirLista(); }
    // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
    if (e.key === 'Escape') fecharLista();
  });

  // clique fora fecha a lista
  // Evento de clique: executa esta ação quando o usuário pressiona o botão correspondente.
  document.addEventListener('click', e => {
    // Busca no DOM para encontrar o elemento exato que será lido ou alterado.
    if (!document.getElementById('ext-select-wrap')?.contains(e.target) &&
        !listaContainer.contains(e.target)) fecharLista();
  });

  // Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
  function renderizarItens(filtro) {
    // remove itens anteriores mas mantém o input de busca
    Array.from(listaContainer.children).forEach(c => {
      // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
      if (c.id !== 'campo-busca') c.remove();
    });
    // Função em formato de seta usada para organizar uma ação reutilizável do script.
    const filtrados = opcoes.filter(o => o.toLowerCase().includes(filtro.toLowerCase()));
    // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
    if (!filtrados.length) {
      const vazio = document.createElement('div');
      vazio.className = 'ext-motivo-item';
      // Atualização visual ou textual de elementos da interface.
      vazio.style.color = '#3a3f50';
      // Atualização visual ou textual de elementos da interface.
      vazio.style.cursor = 'default';
      // Atualização visual ou textual de elementos da interface.
      vazio.textContent = 'Nenhum resultado';
      listaContainer.appendChild(vazio);
      return;
    }
    filtrados.forEach(opcao => {
      const item = document.createElement('div');
      item.className = 'ext-motivo-item' + (opcao === motivoSelecionado ? ' ativo' : '');
      // Atualização visual ou textual de elementos da interface.
      item.textContent = opcao;
      item.addEventListener('mousedown', e => {
        e.preventDefault(); // evita blur no campo busca
        motivoSelecionado = opcao;
        // Atualização visual ou textual de elementos da interface.
        campoDisplay.textContent = opcao;
        // Atualização visual ou textual de elementos da interface.
        painelFecha.style.display = 'none';
        fecharLista();
      });
      listaContainer.appendChild(item);
    });
  }

  // Evento da interface: reage à interação do usuário e mantém os dados sincronizados.
  campoBusca.addEventListener('input', e => renderizarItens(e.target.value));
  // Evento de clique: executa esta ação quando o usuário pressiona o botão correspondente.
  campoBusca.addEventListener('click', e => e.stopPropagation());

  // Evento de clique: executa esta ação quando o usuário pressiona o botão correspondente.
  btnAtualizar.addEventListener('click', () => {
    atualizarDados();
    // Atualização visual ou textual de elementos da interface.
    btnAtualizar.textContent = '✓';
    // Controle de tempo usado para aguardar a página responder ou repetir uma verificação.
    setTimeout(() => { btnAtualizar.textContent = '↻'; }, 1500);
  });

  // Evento de clique: executa esta ação quando o usuário pressiona o botão correspondente.
  btnAlternarTema.addEventListener('click', () => {
    // Atualização visual ou textual de elementos da interface.
    const proximoTema = painel.classList.contains('tema-claro') ? 'escuro' : 'claro';
    // Uso do armazenamento do navegador para manter ou recuperar informações entre execuções.
    localStorage.setItem(TEMA_KEY, proximoTema);
    aplicarTema(proximoTema);
  });

  // Busca no DOM para encontrar o elemento exato que será lido ou alterado.
  document.querySelectorAll('.ext-btn-mini').forEach(btn => {
    // Evento de clique: executa esta ação quando o usuário pressiona o botão correspondente.
    btn.addEventListener('click', () => {
      // Captura elementos da tela para poder ler valores, alterar conteúdo ou ligar eventos.
      const el = document.getElementById(btn.dataset.campo);
      // Atualização visual ou textual de elementos da interface.
      const txt = el?.textContent?.trim();
      // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
      if (!txt || txt === '—') return;
      navigator.clipboard.writeText(txt).then(() => {
        // Atualização visual ou textual de elementos da interface.
        const orig = btn.textContent;
        // Atualização visual ou textual de elementos da interface.
        btn.textContent = '✓';
        // Controle de tempo usado para aguardar a página responder ou repetir uma verificação.
        setTimeout(() => { btn.textContent = orig; }, 1500);
      });
    });
  });

  // Evento de clique: executa esta ação quando o usuário pressiona o botão correspondente.
  btnFecharFecha.addEventListener('click', () => { painelFecha.style.display = 'none'; });

  // Evento de clique: executa esta ação quando o usuário pressiona o botão correspondente.
  btnCopiarFecha.addEventListener('click', () => {
    navigator.clipboard.writeText(textoFechamento.value).then(() => {
      // Atualização visual ou textual de elementos da interface.
      btnCopiarFecha.textContent = "✓ Copiado";
      // Atualização visual ou textual de elementos da interface.
      textoFechamento.value = fechamentoOriginal;
      fechamentoEditado = false;
      // Controle de tempo usado para aguardar a página responder ou repetir uma verificação.
      setTimeout(() => { btnCopiarFecha.textContent = "Copiar Fechamento"; }, 2000);
    });
  });

  // Evento da interface: reage à interação do usuário e mantém os dados sincronizados.
  textoFechamento.addEventListener('input', () => {
    fechamentoEditado = textoFechamento.value !== fechamentoOriginal;
    // Atualização visual ou textual de elementos da interface.
    btnCopiarFecha.textContent = fechamentoEditado ? "Copiar Editado" : "Copiar Fechamento";
  });

  // Evento de clique: executa esta ação quando o usuário pressiona o botão correspondente.
  btnCopiar.addEventListener('click', () => {
    // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
    if (!motivoSelecionado) {
      abrirLista();
      alert("Selecione um Tipo de Atendimento antes de copiar!");
      return;
    }
    const { cliente, telefone, ticket } = capturarDados();
    const abertura = ModelosProtocolo.gerarAbertura(cliente, telefone, ticket, motivoSelecionado);
    navigator.clipboard.writeText(abertura).then(() => {
      // Atualização visual ou textual de elementos da interface.
      btnCopiar.textContent = "✓ Copiado!";
      // Controle de tempo usado para aguardar a página responder ou repetir uma verificação.
      setTimeout(() => { btnCopiar.textContent = "Copiar Protocolo"; }, 2000);
      const fechamento = ModelosProtocolo.gerarFechamento(motivoSelecionado);
      // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
      if (fechamento?.trim()) {
        fechamentoOriginal = fechamento;
        fechamentoEditado = false;
        // Atualização visual ou textual de elementos da interface.
        textoFechamento.value = fechamento;
        // Atualização visual ou textual de elementos da interface.
        btnCopiarFecha.textContent = "Copiar Fechamento";
        // Atualização visual ou textual de elementos da interface.
        painelFecha.style.display = 'block';
        posicionarFechamento();
      }
    });
  });

  renderizarItens('');
}

// Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
if (document.readyState === 'loading') {
  // Aguarda o HTML do popup carregar antes de acessar elementos da página.
  document.addEventListener('DOMContentLoaded', () => setTimeout(iniciarPainel, 1500));
} else {
  // Controle de tempo usado para aguardar a página responder ou repetir uma verificação.
  setTimeout(iniciarPainel, 1500);
}

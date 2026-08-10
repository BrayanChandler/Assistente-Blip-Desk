const MENSAGEM_PADRAO = "Olá, Seja bem vindo ao Serviço de Atendimento ao Cliente, tudo bem? 🙂\nMe chamo Brayan, hoje estarei fazendo seu atendimento.";
const STORAGE_KEY_MENSAGEM = "brayan_mensagem_automatica";
const STORAGE_KEY_PADRAO = "brayan_mensagem_padrao_personalizada";
const STORAGE_KEY_HISTORICO = "brayan_historico_tickets";

const campoMensagem = document.getElementById("mensagem");
const mensagemAtual = document.getElementById("mensagemAtual");
const statusEl = document.getElementById("status");
const salvarBtn = document.getElementById("salvar");
const restaurarBtn = document.getElementById("restaurar");
const salvarPadraoBtn = document.getElementById("salvarPadrao");
const historicoTickets = document.getElementById("historicoTickets");

function getExtStorage() {
  if (globalThis.browser?.storage?.sync) {
    return { area: globalThis.browser.storage.sync, mode: "promise" };
  }
  if (globalThis.chrome?.storage?.sync) {
    return { area: globalThis.chrome.storage.sync, mode: "callback" };
  }
  return null;
}

function getLastStorageError() {
  return globalThis.chrome?.runtime?.lastError || globalThis.browser?.runtime?.lastError || null;
}

async function storageGet(defaults) {
  const storage = getExtStorage();
  if (!storage) return defaults;

  try {
    if (storage.mode === "promise") {
      return (await storage.area.get(defaults)) || defaults;
    }

    return await new Promise((resolve) => {
      storage.area.get(defaults, (items) => {
        const erro = getLastStorageError();
        resolve(erro ? defaults : (items || defaults));
      });
    });
  } catch {
    return defaults;
  }
}

async function storageSet(values) {
  const storage = getExtStorage();
  if (!storage) return false;

  try {
    if (storage.mode === "promise") {
      await storage.area.set(values);
      return true;
    }

    return await new Promise((resolve) => {
      storage.area.set(values, () => {
        resolve(!getLastStorageError());
      });
    });
  } catch {
    return false;
  }
}
function mostrarStatus(texto, destaque = false) {
  statusEl.textContent = texto;
  statusEl.style.color = destaque ? "#22c55e" : "#9ca3af";
  if (texto) setTimeout(() => { statusEl.textContent = ""; }, 2500);
}
function atualizarTela(mensagem) {
  const valor = (mensagem || MENSAGEM_PADRAO).trim() || MENSAGEM_PADRAO;
  campoMensagem.value = valor;
  mensagemAtual.textContent = valor;
}
async function carregarMensagem() {
  const items = await storageGet({
    [STORAGE_KEY_MENSAGEM]: MENSAGEM_PADRAO,
    [STORAGE_KEY_PADRAO]: MENSAGEM_PADRAO,
    [STORAGE_KEY_HISTORICO]: []
  });
  atualizarTela(items[STORAGE_KEY_MENSAGEM]);
  atualizarHistorico(items[STORAGE_KEY_HISTORICO]);
}
async function salvarMensagem(mensagem) {
  const valor = (mensagem || "").trim() || MENSAGEM_PADRAO;
  const salvo = await storageSet({ [STORAGE_KEY_MENSAGEM]: valor });
  if (!salvo) { mostrarStatus("Não foi possível salvar a mensagem."); return; }
  atualizarTela(valor);
  mostrarStatus("Mensagem salva.", true);
}
async function restaurarPadrao() {
  const items = await storageGet({ [STORAGE_KEY_PADRAO]: MENSAGEM_PADRAO });
  salvarMensagem(items[STORAGE_KEY_PADRAO]);
}
async function salvarComoPadrao() {
  const valor = (campoMensagem.value || "").trim() || MENSAGEM_PADRAO;
  const salvo = await storageSet({
    [STORAGE_KEY_PADRAO]: valor,
    [STORAGE_KEY_MENSAGEM]: valor
  });
  if (!salvo) { mostrarStatus("Não foi possível salvar o padrão."); return; }
  atualizarTela(valor);
  mostrarStatus("Novo padrão salvo.", true);
}
function formatarHora(ts) {
  try {
    return new Date(ts).toLocaleString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      hour: "2-digit",
      minute: "2-digit"
    });
  } catch {
    return "";
  }
}
function atualizarHistorico(historico) {
  const lista = Array.isArray(historico) ? historico.slice(0, 12) : [];
  if (!lista.length) {
    historicoTickets.innerHTML = '<div class="history-empty">Nenhum ticket salvo ainda.</div>';
    return;
  }
  historicoTickets.innerHTML = lista.map((item) => {
    const ticket = String(item.ticket || "").replace(/^#/, "");
    return `<div class="history-item"><span class="history-ticket">#${ticket}</span><span class="history-time">${formatarHora(item.ts)}</span></div>`;
  }).join("");
}
function iniciarAbas() {
  document.querySelectorAll(".aba").forEach((aba) => {
    aba.addEventListener("click", () => {
      document.querySelectorAll(".aba").forEach((item) => item.classList.remove("ativa"));
      document.querySelectorAll(".painel-aba").forEach((item) => item.classList.remove("ativa"));
      aba.classList.add("ativa");
      document.getElementById(aba.dataset.alvo)?.classList.add("ativa");
    });
  });
}

salvarBtn.addEventListener("click", () => salvarMensagem(campoMensagem.value));
restaurarBtn.addEventListener("click", restaurarPadrao);
salvarPadraoBtn.addEventListener("click", salvarComoPadrao);
iniciarAbas();
carregarMensagem();

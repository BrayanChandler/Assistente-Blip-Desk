/*
 * Arquivo comentado didaticamente em português.
 * Os comentários explicam o fluxo geral, DOM, eventos, armazenamento, cache e funções importantes.
 * A lógica original foi preservada: nomes, seletores, chaves, textos funcionais e URLs não foram alterados.
 */
// Assistente Blip Desk - Brayan
// Assinatura de autoria: BRYAN-ORIG-12de19360097a0ce

const MENSAGEM_PADRAO = "Olá, Seja bem vindo ao Serviço de Atendimento ao Cliente, tudo bem? 🙂\nMe chamo Brayan, hoje estarei fazendo seu atendimento.";
const STORAGE_KEY_MENSAGEM = "brayan_mensagem_automatica";
const STORAGE_KEY_PADRAO = "brayan_mensagem_padrao_personalizada";
const STORAGE_KEY_HISTORICO = "brayan_historico_tickets";

// Captura elementos da tela para poder ler valores, alterar conteúdo ou ligar eventos.
const campoMensagem = document.getElementById("mensagem");
// Captura elementos da tela para poder ler valores, alterar conteúdo ou ligar eventos.
const mensagemAtual = document.getElementById("mensagemAtual");
// Captura elementos da tela para poder ler valores, alterar conteúdo ou ligar eventos.
const statusEl = document.getElementById("status");
// Captura elementos da tela para poder ler valores, alterar conteúdo ou ligar eventos.
const salvarBtn = document.getElementById("salvar");
// Captura elementos da tela para poder ler valores, alterar conteúdo ou ligar eventos.
const restaurarBtn = document.getElementById("restaurar");
// Captura elementos da tela para poder ler valores, alterar conteúdo ou ligar eventos.
const salvarPadraoBtn = document.getElementById("salvarPadrao");
// Captura elementos da tela para poder ler valores, alterar conteúdo ou ligar eventos.
const historicoTickets = document.getElementById("historicoTickets");

// Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
function getExtStorage() { return globalThis.chrome?.storage?.sync || globalThis.browser?.storage?.sync || null; }
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
      if (retorno && typeof retorno.then === "function") retorno.then((items) => resolve(items || defaults)).catch(() => resolve(defaults));
    } catch { resolve(defaults); }
  });
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
      if (retorno && typeof retorno.then === "function") retorno.then(() => resolve(true)).catch(() => resolve(false));
    } catch { resolve(false); }
  });
}
// Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
function mostrarStatus(texto, destaque = false) {
  // Atualização visual ou textual de elementos da interface.
  statusEl.textContent = texto;
  // Atualização visual ou textual de elementos da interface.
  statusEl.style.color = destaque ? "#22c55e" : "#9ca3af";
  // Controle de tempo usado para aguardar a página responder ou repetir uma verificação.
  if (texto) setTimeout(() => { statusEl.textContent = ""; }, 2500);
}
// Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
function atualizarTela(mensagem) {
  const valor = (mensagem || MENSAGEM_PADRAO).trim() || MENSAGEM_PADRAO;
  // Atualização visual ou textual de elementos da interface.
  campoMensagem.value = valor;
  // Atualização visual ou textual de elementos da interface.
  mensagemAtual.textContent = valor;
}
// Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
async function carregarMensagem() {
  const items = await storageGet({
    [STORAGE_KEY_MENSAGEM]: MENSAGEM_PADRAO,
    [STORAGE_KEY_PADRAO]: MENSAGEM_PADRAO,
    [STORAGE_KEY_HISTORICO]: []
  });
  atualizarTela(items[STORAGE_KEY_MENSAGEM]);
  atualizarHistorico(items[STORAGE_KEY_HISTORICO]);
}
// Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
async function salvarMensagem(mensagem) {
  const valor = (mensagem || "").trim() || MENSAGEM_PADRAO;
  const salvo = await storageSet({ [STORAGE_KEY_MENSAGEM]: valor });
  // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
  if (!salvo) { mostrarStatus("Não foi possível salvar a mensagem."); return; }
  atualizarTela(valor);
  mostrarStatus("Mensagem salva.", true);
}
// Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
async function restaurarPadrao() {
  const items = await storageGet({ [STORAGE_KEY_PADRAO]: MENSAGEM_PADRAO });
  salvarMensagem(items[STORAGE_KEY_PADRAO]);
}
// Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
async function salvarComoPadrao() {
  const valor = (campoMensagem.value || "").trim() || MENSAGEM_PADRAO;
  const salvo = await storageSet({
    [STORAGE_KEY_PADRAO]: valor,
    [STORAGE_KEY_MENSAGEM]: valor
  });
  // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
  if (!salvo) { mostrarStatus("Não foi possível salvar o padrão."); return; }
  atualizarTela(valor);
  mostrarStatus("Novo padrão salvo.", true);
}
// Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
function formatarHora(ts) {
  // Bloco protegido para capturar falhas sem quebrar todo o funcionamento da extensão.
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
// Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
function atualizarHistorico(historico) {
  const lista = Array.isArray(historico) ? historico.slice(0, 12) : [];
  // Validação/decisão do fluxo para tratar cenários diferentes sem interromper a extensão.
  if (!lista.length) {
    // Atualização visual ou textual de elementos da interface.
    historicoTickets.innerHTML = '<div class="history-empty">Nenhum ticket salvo ainda.</div>';
    return;
  }
  // Atualização visual ou textual de elementos da interface.
  historicoTickets.innerHTML = lista.map((item) => {
    const ticket = String(item.ticket || "").replace(/^#/, "");
    return `<div class="history-item"><span class="history-ticket">#${ticket}</span><span class="history-time">${formatarHora(item.ts)}</span></div>`;
  }).join("");
}
// Função responsável por uma etapa específica do fluxo; os comentários internos detalham as decisões principais.
function iniciarAbas() {
  // Busca no DOM para encontrar o elemento exato que será lido ou alterado.
  document.querySelectorAll(".aba").forEach((aba) => {
    // Evento de clique: executa esta ação quando o usuário pressiona o botão correspondente.
    aba.addEventListener("click", () => {
      // Busca no DOM para encontrar o elemento exato que será lido ou alterado.
      document.querySelectorAll(".aba").forEach((item) => item.classList.remove("ativa"));
      // Busca no DOM para encontrar o elemento exato que será lido ou alterado.
      document.querySelectorAll(".painel-aba").forEach((item) => item.classList.remove("ativa"));
      // Atualização visual ou textual de elementos da interface.
      aba.classList.add("ativa");
      // Busca no DOM para encontrar o elemento exato que será lido ou alterado.
      document.getElementById(aba.dataset.alvo)?.classList.add("ativa");
    });
  });
}

// Evento de clique: executa esta ação quando o usuário pressiona o botão correspondente.
salvarBtn.addEventListener("click", () => salvarMensagem(campoMensagem.value));
// Evento de clique: executa esta ação quando o usuário pressiona o botão correspondente.
restaurarBtn.addEventListener("click", restaurarPadrao);
// Evento de clique: executa esta ação quando o usuário pressiona o botão correspondente.
salvarPadraoBtn.addEventListener("click", salvarComoPadrao);
iniciarAbas();
carregarMensagem();

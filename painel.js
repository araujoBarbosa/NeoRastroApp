"use strict";

/* ===== Configuracao da API ===== */
const API_BASE = "https://api.neorastro.cloud";

/* ===== Controle de sessao ===== */
function pegarUsuario() {
  try {
    const userSession = sessionStorage.getItem("usuarioLogado");
    const userLocal = localStorage.getItem("usuarioLogado");

    const bruto = userSession || userLocal;
    if (!bruto) return null;

    const usuario = JSON.parse(bruto);
    if (!usuario || typeof usuario !== "object") return null;

    return usuario;
  } catch (e) {
    console.error("Erro ao ler usuarioLogado do storage:", e);
    // Se tiver dado corrompido, limpamos para nao ficar em loop
    sessionStorage.removeItem("usuarioLogado");
    localStorage.removeItem("usuarioLogado");
    return null;
  }
}

function pegarToken() {
  try {
    const tokenSession = sessionStorage.getItem("token");
    const tokenLocal = localStorage.getItem("token");
    const token = tokenSession || tokenLocal || null;
    return token || null;
  } catch (e) {
    console.error("Erro ao ler token do storage:", e);
    sessionStorage.removeItem("token");
    localStorage.removeItem("token");
    return null;
  }
}

function sairSistema() {
  sessionStorage.clear();
  localStorage.clear();
  location.href = "index.html";
}

/* ===== Exibir avisos ===== */
function mostrarAviso(mensagem, tipo = "info", tempo = 3000) {
  const msg = document.getElementById("mensagem-aviso");
  if (!msg) return;

  msg.textContent = mensagem;
  msg.className = `neo-toast neo-toast--${tipo}`;
  msg.style.display = "block";

  clearTimeout(window.__msgTimer);
  window.__msgTimer = setTimeout(() => {
    msg.style.display = "none";
  }, tempo);
}

/* ===== Funcao generica da API ===== */
async function api(caminho, opcoes = {}) {
  const url = caminho.startsWith("http")
    ? caminho
    : `${API_BASE}${caminho.startsWith("/") ? caminho : "/" + caminho}`;

  const token = pegarToken();

  try {
    const resposta = await fetch(url, {
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        ...(token && token !== "login_local" ? { Authorization: `Bearer ${token}` } : {}),
      },
      ...opcoes,
    });

    // Se vier 401, so derruba a sessao se REALMENTE existir token salvo
    if (resposta.status === 401) {
      const tokenAtual = pegarToken();
      if (tokenAtual && tokenAtual !== "login_local") {
        mostrarAviso("⚠️ Sessao expirada. Faca login novamente.", "error");
        sairSistema();
        throw new Error("Sessao expirada");
      }
    }

    const dados = await resposta.json().catch(() => ({}));

    if (!resposta.ok) {
      const erro = dados.erro || dados.mensagem || dados.message || "Erro ao acessar a API.";
      throw new Error(erro);
    }

    return dados;
  } catch (erro) {
    console.error("Erro na API:", erro);
    mostrarAviso(erro.message || "Falha ao conectar com a API.", "error");
    throw erro;
  }
}

/* ===== Enviar comando ===== */
async function enviarComando(id_veiculo, tipo, botao) {
  try {
    botao.classList.add("neo-btn--loading");
    botao.disabled = true;
    mostrarAviso(`Enviando comando "${tipo}"...`, "info");

    const resposta = await api("/comandos", {
      method: "POST",
      body: JSON.stringify({ tipo, id_veiculo }),
    });

    mostrarAviso(resposta.mensagem || "✅ Comando enviado!", "success");
    listarComandos();
  } catch (e) {
    console.error(e);
    mostrarAviso("❌ Erro ao enviar comando.", "error");
  } finally {
    botao.classList.remove("neo-btn--loading");
    botao.disabled = false;
  }
}

/* ===== Listar veiculos ===== */
async function listarVeiculos() {
  const container = document.getElementById("lista-veiculos");
  if (!container) return;
  container.innerHTML = `<div class="neo-historico__vazio">Carregando veiculos...</div>`;

  try {
    const veiculos = await api("/veiculos");

    if (!veiculos || veiculos.length === 0) {
      container.innerHTML = `<div class="neo-historico__vazio">Nenhum veiculo encontrado.</div>`;
      return;
    }

    container.innerHTML = "";

    veiculos.forEach((v) => {
      const statusClass =
        v.status === "ativo"
          ? "neo-veiculo__status--ativo"
          : v.status === "inativo"
          ? "neo-veiculo__status--inativo"
          : "neo-veiculo__status--desconhecido";

      const bloco = document.createElement("div");
      bloco.className = "neo-veiculo neo-fade-in";
      bloco.innerHTML = `
        <div class="neo-veiculo__info">
          <span class="neo-veiculo__modelo">${v.nome || v.modelo || "Sem modelo"}</span>
          <div class="neo-veiculo__detalhe"><i data-feather="hash"></i> IMEI: ${v.imei || "—"}</div>
          <div class="neo-veiculo__detalhe">
            <i data-feather="activity"></i> Status:
            <span class="neo-veiculo__status ${statusClass}">
              ${v.status || "desconhecido"}
            </span>
          </div>
        </div>
        <div class="neo-veiculo__acoes">
          <button class="neo-btn neo-btn--danger" data-id="${v.id}" data-tipo="bloquear">
            <i data-feather="lock"></i> Bloquear
          </button>
          <button class="neo-btn neo-btn--success" data-id="${v.id}" data-tipo="desbloquear">
            <i data-feather="unlock"></i> Desbloquear
          </button>
        </div>
      `;
      container.appendChild(bloco);
    });

    if (typeof feather !== "undefined") feather.replace();

    container.querySelectorAll("button[data-tipo]").forEach((botao) => {
      botao.addEventListener("click", async (e) => {
        const botaoReal = e.target.closest("button");
        const tipo = botaoReal.dataset.tipo;
        const id = botaoReal.dataset.id;
        await enviarComando(id, tipo, botaoReal);
      });
    });
  } catch (e) {
    console.error(e);
    container.innerHTML = `<div class="neo-historico__vazio">❌ Erro ao carregar veiculos.</div>`;
    mostrarAviso("❌ Falha ao conectar com a API.", "error");
  }
}

/* ===== Listar historico de comandos ===== */
async function listarComandos() {
  const lista = document.getElementById("lista-comandos");
  if (!lista) return;
  lista.innerHTML = `<li class="neo-loading">Carregando comandos...</li>`;

  try {
    const comandos = await api("/comandos");
    lista.innerHTML = "";

    if (!comandos.length) {
      lista.innerHTML = `<li class="neo-historico__vazio">Nenhum comando registrado.</li>`;
      return;
    }

    comandos.forEach((c) => {
      const li = document.createElement("li");
      li.className = "neo-historico__item";
      li.innerHTML = `
        <i data-feather="${c.tipo === "bloquear" ? "lock" : "unlock"}"></i>
        #${c.id} • ${c.tipo} • ${c.status}
      `;
      lista.appendChild(li);
    });

    if (typeof feather !== "undefined") feather.replace();
  } catch (e) {
    console.error(e);
    lista.innerHTML = `<li class="neo-historico__vazio">❌ Erro ao buscar comandos.</li>`;
    mostrarAviso("❌ Erro ao carregar historico.", "error");
  }
}

/* ===== Inicializar mapa Leaflet ===== */
let mapa;
function iniciarMapa() {
  mapa = L.map("mapa-rastreamento").setView([-14.235, -51.9253], 4);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution: '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
  }).addTo(mapa);
}

/* ===== Inicializacao da pagina ===== */
document.addEventListener("DOMContentLoaded", () => {
  const usuario = pegarUsuario();
  const token = pegarToken();

  // So bloqueia acesso se NAO tiver usuario E NAO tiver token
  if (!usuario && !token) {
    console.warn("Nenhum usuario logado encontrado, voltando ao login...");
    location.href = "index.html";
    return;
  }

  const spanBemVindo = document.getElementById("bem-vindo");
  if (spanBemVindo) {
    spanBemVindo.textContent = `Ola, ${usuario?.nome || "usuario"}!`;
  }

  const botaoSair = document.getElementById("botao-sair");
  if (botaoSair) botaoSair.addEventListener("click", sairSistema);

  const botaoHistorico = document.getElementById("botao-atualizar-comandos");
  if (botaoHistorico) {
    botaoHistorico.addEventListener("click", listarComandos);
  }

  iniciarMapa();
  listarVeiculos();
  listarComandos();

  if (typeof feather !== "undefined") feather.replace();
});








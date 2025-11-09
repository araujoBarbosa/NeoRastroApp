"use strict";

/* ===== Configuração da API ===== */
const API_BASE = "https://api.neorastro.cloud";

/* ===== Controle de sessão ===== */
function pegarUsuario() {
  try {
    const userSession = sessionStorage.getItem("usuarioLogado");
    const userLocal = localStorage.getItem("usuarioLogado");
    const bruto = userSession || userLocal;
    if (!bruto) return null;
    const usuario = JSON.parse(bruto);
    return usuario && typeof usuario === "object" ? usuario : null;
  } catch (e) {
    console.error("Erro ao ler usuarioLogado do storage:", e);
    sessionStorage.removeItem("usuarioLogado");
    localStorage.removeItem("usuarioLogado");
    return null;
  }
}

function pegarToken() {
  try {
    const tokenSession = sessionStorage.getItem("token");
    const tokenLocal = localStorage.getItem("token");
    return tokenSession || tokenLocal || null;
  } catch (e) {
    console.error("Erro ao ler token:", e);
    sessionStorage.clear();
    localStorage.clear();
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
  window.__msgTimer = setTimeout(() => (msg.style.display = "none"), tempo);
}

/* ===== Função genérica de API ===== */
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

    if (resposta.status === 401 && token && token !== "login_local") {
      mostrarAviso("⚠️ Sessão expirada. Faça login novamente.", "error");
      sairSistema();
      throw new Error("Sessão expirada");
    }

    const dados = await resposta.json().catch(() => ({}));
    if (!resposta.ok) throw new Error(dados.erro || "Erro ao acessar API.");
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

/* ===== Listar veículos ===== */
async function listarVeiculos() {
  const container = document.getElementById("lista-veiculos");
  if (!container) return;
  container.innerHTML = `<div class="neo-historico__vazio">Carregando veículos...</div>`;

  try {
    const veiculos = await api("/veiculos");

    if (!veiculos?.length) {
      container.innerHTML = `<div class="neo-historico__vazio">Nenhum veículo encontrado.</div>`;
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
          <span class="neo-veiculo__modelo">${v.nome || "Sem modelo"}</span>
          <div class="neo-veiculo__detalhe"><i data-feather="hash"></i> IMEI: ${v.imei || "—"}</div>
          <div class="neo-veiculo__detalhe">
            <i data-feather="activity"></i> Status:
            <span class="neo-veiculo__status ${statusClass}">
              ${v.status || "desconhecido"}
            </span>
          </div>
        </div>
        <div class="neo-veiculo__acoes">
          <button class="neo-btn neo-btn--danger" data-id="${v.id}" data-imei="${v.imei}" data-tipo="bloquear">
            <i data-feather="lock"></i> Bloquear
          </button>
          <button class="neo-btn neo-btn--success" data-id="${v.id}" data-imei="${v.imei}" data-tipo="desbloquear">
            <i data-feather="unlock"></i> Desbloquear
          </button>
        </div>
      `;
      container.appendChild(bloco);
    });

    if (typeof feather !== "undefined") feather.replace();

    // Atualiza o mapa com o primeiro veículo
    const primeiro = veiculos[0];
    if (primeiro?.imei) {
      iniciarRastreamento(primeiro.imei);
    }

    container.querySelectorAll("button[data-tipo]").forEach((botao) => {
      botao.addEventListener("click", async (e) => {
        const b = e.target.closest("button");
        const tipo = b.dataset.tipo;
        const id = b.dataset.id;
        await enviarComando(id, tipo, b);
      });
    });
  } catch (e) {
    console.error(e);
    container.innerHTML = `<div class="neo-historico__vazio">❌ Erro ao carregar veículos.</div>`;
  }
}

/* ===== Listar histórico de comandos ===== */
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
  } catch {
    lista.innerHTML = `<li class="neo-historico__vazio">❌ Erro ao buscar comandos.</li>`;
  }
}

/* ===== MAPA E RASTREAMENTO ===== */
let mapa, marcador;

function iniciarMapa() {
  mapa = L.map("mapa-rastreamento").setView([-14.235, -51.9253], 4);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap",
  }).addTo(mapa);
}

async function iniciarRastreamento(imei) {
  try {
    const url = `${API_BASE}/api/posicao/${imei}`;
    const resposta = await fetch(url);
    if (!resposta.ok) return;
    const dados = await resposta.json();

    const { latitude, longitude, data_hora } = dados;

    if (latitude === 0 && longitude === 0) {
      console.log("📡 Aguardando coordenadas reais...");
      return;
    }

    const pos = [latitude, longitude];

    if (marcador) {
      marcador.setLatLng(pos);
    } else {
      marcador = L.marker(pos).addTo(mapa);
    }

    mapa.setView(pos, 15);
    console.log(`📍 Atualização: ${data_hora}`);
  } catch (e) {
    console.error("Erro ao obter posição:", e);
  }
}

// Atualiza posição a cada 10 segundos
setInterval(() => {
  if (marcador?.getLatLng) {
    const imei = marcador.options.imei || "359633100065759";
    iniciarRastreamento(imei);
  }
}, 10000);

/* ===== Inicialização ===== */
document.addEventListener("DOMContentLoaded", () => {
  const usuario = pegarUsuario();
  if (!usuario && !pegarToken()) {
    location.href = "index.html";
    return;
  }

  const spanBemVindo = document.getElementById("bem-vindo");
  if (spanBemVindo) spanBemVindo.textContent = `Olá, ${usuario?.nome || "usuário"}!`;

  document.getElementById("botao-sair")?.addEventListener("click", sairSistema);
  document.getElementById("botao-atualizar-comandos")?.addEventListener("click", listarComandos);

  iniciarMapa();
  listarVeiculos();
  listarComandos();

  if (typeof feather !== "undefined") feather.replace();
});









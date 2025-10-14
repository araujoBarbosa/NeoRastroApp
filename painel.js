"use strict";

/* ===== Configuração geral da API ===== */
const API_BASE = "https://api.neorastro.cloud";

/* ===== Avisos rápidos (Toast) ===== */
function mostrarAviso(mensagem, tempo = 2500) {
  const elemento = document.getElementById("mensagem-aviso");
  if (!elemento) return;
  elemento.textContent = mensagem;
  elemento.style.display = "block";
  clearTimeout(window.__aviso);
  window.__aviso = setTimeout(() => (elemento.style.display = "none"), tempo);
}

/* ===== Sessão e saída ===== */
async function pegarSessao() {
  try {
    const resposta = await fetch(`${API_BASE}/me`, { credentials: "include" });
    if (!resposta.ok) throw 0;
    return await resposta.json().catch(() => null);
  } catch {
    return null;
  }
}

async function sairSistema() {
  try {
    await fetch(`${API_BASE}/logout`, { method: "POST", credentials: "include" });
  } catch {}
  sessionStorage.clear();
  localStorage.removeItem("usuarioNome");
  location.href = "login.html";
}

/* ===== Funções auxiliares de API ===== */
async function api(caminho, opcoes = {}) {
  const url = caminho.startsWith("http")
    ? caminho
    : `${API_BASE}${caminho.startsWith("/") ? caminho : "/" + caminho}`;

  const resposta = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    ...opcoes,
  });

  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok)
    throw new Error(dados.erro || dados.mensagem || "Erro desconhecido");
  return dados;
}

/* ===== Bloqueio / Desbloqueio de veículo ===== */
async function bloquearVeiculo(id) {
  if (!confirm("Tem certeza que deseja BLOQUEAR este veículo?")) return;
  try {
    await api(`/veiculos/${id}/comando`, {
      method: "POST",
      body: JSON.stringify({
        tipo: "BLOQUEIO",
        motivo: "Solicitação do usuário",
      }),
    });
    mostrarAviso("Comando de bloqueio enviado!");
    await listarComandos();
  } catch (e) {
    mostrarAviso(e.message);
  }
}

async function desbloquearVeiculo(id) {
  if (!confirm("Deseja DESBLOQUEAR este veículo?")) return;
  try {
    await api(`/veiculos/${id}/comando`, {
      method: "POST",
      body: JSON.stringify({
        tipo: "DESBLOQUEIO",
        motivo: "Solicitação do usuário",
      }),
    });
    mostrarAviso("Comando de desbloqueio enviado!");
    await listarComandos();
  } catch (e) {
    mostrarAviso(e.message);
  }
}

/* ===== Histórico de comandos ===== */
async function listarComandos() {
  try {
    const comandos = await api("/comandos");
    const lista = document.getElementById("lista-comandos");
    if (!lista) return;
    lista.innerHTML = "";
    if (!comandos.length) {
      lista.innerHTML = "<li>Nenhum comando ainda.</li>";
      return;
    }
    comandos.forEach((c) => {
      const item = document.createElement("li");
      item.textContent = `#${c.id} • ${c.tipo} • ${c.status} • ${c.criado_em} (${c.modelo || ""} ${c.placa || ""})`;
      lista.appendChild(item);
    });
  } catch (e) {
    mostrarAviso("Erro ao carregar histórico");
  }
}

/* ===== Lista de veículos ===== */
async function listarVeiculos() {
  try {
    const veiculos = await api("/veiculos");
    const container = document.getElementById("lista-veiculos");
    if (!container) return;
    container.innerHTML = "";
    if (!veiculos.length) {
      container.textContent = "Nenhum veículo cadastrado.";
      return;
    }
    veiculos.forEach((v) => {
      const caixa = document.createElement("div");
      caixa.className = "veiculo";
      caixa.innerHTML = `
        <div>
          <strong>${v.modelo || "Veículo"}</strong>
          <br/><small>Placa: ${v.placa || "—"}</small>
        </div>
      `;

      const botoes = document.createElement("div");
      botoes.className = "grupo-botoes";

      const botaoBloquear = document.createElement("button");
      botaoBloquear.className = "perigo";
      botaoBloquear.textContent = "Bloquear";
      botaoBloquear.onclick = () => bloquearVeiculo(v.id);

      const botaoDesbloquear = document.createElement("button");
      botaoDesbloquear.className = "primario";
      botaoDesbloquear.textContent = "Desbloquear";
      botaoDesbloquear.onclick = () => desbloquearVeiculo(v.id);

      botoes.appendChild(botaoBloquear);
      botoes.appendChild(botaoDesbloquear);
      caixa.appendChild(botoes);
      container.appendChild(caixa);
    });
  } catch (e) {
    mostrarAviso("Erro ao carregar veículos");
  }
}

/* ===== Mapa (Leaflet) ===== */
let mapa;
const marcadores = new Map();

function iconePorStatus(statuso) {
  return L.divIcon({
    className: "pino-veiculo",
    html:
      '<div style="width:12px;height:12px;border-radius:50%;' +
      "background:" +
      (statuso === "em_movimento"
        ? "#22c55e"
        : statuso === "offline"
        ? "#ef4444"
        : "#f59e0b") +
      ';border:2px solid white;box-shadow:0 0 0 2px rgba(0,0,0,.25)"></div>',
    iconSize: [12, 12],
    iconAnchor: [6, 6],
  });
}

function iniciarMapa() {
  mapa = L.map("mapa-rastreamento", { zoomControl: true });

  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
  }).addTo(mapa);

  mapa.setView([-14.2350, -51.9253], 4); // Brasil
  setTimeout(() => mapa.invalidateSize(), 100);
}

/* ===== Inicialização ===== */
document.addEventListener("DOMContentLoaded", async () => {
  // 🔓 LOGIN DESATIVADO: acesso direto ao painel
  // const usuario = await pegarSessao();
  // if (!usuario) {
  //   location.href = "login.html";
  //   return;
  // }

  const nome =
    sessionStorage.getItem("usuarioNome") || "usuário visitante";
  document.getElementById("bem-vindo").textContent = `Olá, ${nome}!`;

  // Botão de sair agora só limpa dados, sem redirecionar forçado
  document.getElementById("botao-sair").addEventListener("click", () => {
    sessionStorage.clear();
    localStorage.removeItem("usuarioNome");
    mostrarAviso("Sessão finalizada (modo visitante).");
  });

  iniciarMapa();
  listarVeiculos();
  listarComandos();

  document
    .getElementById("botao-atualizar-comandos")
    .addEventListener("click", listarComandos);
});


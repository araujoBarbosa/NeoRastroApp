"use strict";

/* ===== Configuração da API ===== */
const API_BASE = "https://api.neorastro.cloud";

/* ===== Função auxiliar de avisos ===== */
function mostrarAviso(mensagem, tempo = 3000) {
  const msg = document.getElementById("mensagem-aviso");
  if (!msg) return;
  msg.textContent = mensagem;
  msg.style.display = "block";
  clearTimeout(window.__msg);
  window.__msg = setTimeout(() => (msg.style.display = "none"), tempo);
}

/* ===== Comunicação com a API ===== */
async function api(caminho, opcoes = {}) {
  const url = caminho.startsWith("http")
    ? caminho
    : `${API_BASE}${caminho.startsWith("/") ? caminho : "/" + caminho}`;

  const resposta = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...opcoes,
  });

  if (!resposta.ok) throw new Error("Erro ao acessar a API");
  return await resposta.json();
}

/* ===== Listar veículos ===== */
async function listarVeiculos() {
  const container = document.getElementById("lista-veiculos");
  if (!container) return;
  container.innerHTML = "<p>Carregando veículos...</p>";

  try {
    const veiculos = await api("/veiculos");
    console.log("🔍 Veículos recebidos da API:", veiculos);

    if (!veiculos || veiculos.length === 0) {
      container.innerHTML = "<p>Nenhum veículo encontrado.</p>";
      return;
    }

    container.innerHTML = "";

    veiculos.forEach((v) => {
      const bloco = document.createElement("div");
      bloco.className = "veiculo";
      bloco.innerHTML = `
        <div>
          <strong>${v.modelo}</strong><br>
          <small>Placa: ${v.placa}</small><br>
          <small>Status: ${v.status}</small>
        </div>
      `;
      container.appendChild(bloco);
    });
  } catch (e) {
    console.error(e);
    container.innerHTML = "<p>Erro ao carregar veículos.</p>";
    mostrarAviso("Falha ao conectar com a API.");
  }
}

/* ===== Histórico de comandos ===== */
async function listarComandos() {
  const lista = document.getElementById("lista-comandos");
  if (!lista) return;
  lista.innerHTML = "<li>Carregando...</li>";

  try {
    const comandos = await api("/comandos");
    lista.innerHTML = "";

    if (!comandos.length) {
      lista.innerHTML = "<li>Nenhum comando registrado.</li>";
      return;
    }

    comandos.forEach((c) => {
      const li = document.createElement("li");
      li.textContent = `#${c.id} • ${c.tipo} • ${c.status}`;
      lista.appendChild(li);
    });
  } catch {
    lista.innerHTML = "<li>Erro ao buscar comandos.</li>";
  }
}

/* ===== Inicializar mapa ===== */
let mapa;
function iniciarMapa() {
  mapa = L.map("mapa-rastreamento").setView([-14.235, -51.9253], 4);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 18,
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>',
  }).addTo(mapa);
}

/* ===== Inicialização ===== */
document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("botao-atualizar-comandos")
    .addEventListener("click", listarComandos);

  iniciarMapa();
  listarVeiculos();
  listarComandos();

  document.getElementById("bem-vindo").textContent = "Olá, usuário visitante!";
});


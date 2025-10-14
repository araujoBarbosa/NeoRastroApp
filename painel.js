"use strict";

/* ===== Configuração da API ===== */
const API_BASE = "https://api.neorastro.cloud";

/* ===== Função auxiliar de avisos ===== */
function mostrarAviso(mensagem, tempo = 3000, tipo = "info") {
  const msg = document.getElementById("mensagem-aviso");
  if (!msg) return;

  msg.textContent = mensagem;
  msg.style.display = "block";
  msg.style.background =
    tipo === "erro" ? "#b91c1c" : tipo === "sucesso" ? "#16a34a" : "#1d4ed8";

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

/* ===== Enviar comando ===== */
async function enviarComando(id_veiculo, tipo) {
  try {
    mostrarAviso(`Enviando comando "${tipo}"...`);

    const resposta = await api("/comandos", {
      method: "POST",
      body: JSON.stringify({ tipo, id_veiculo }),
    });

    mostrarAviso(resposta.mensagem || "Comando enviado!", 3000, "sucesso");
    listarComandos(); // atualiza histórico
  } catch (e) {
    console.error(e);
    mostrarAviso("Erro ao enviar comando.", 4000, "erro");
  }
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
          <strong>${v.modelo || "Sem modelo"}</strong>
          <small>Placa: ${v.placa || "—"}</small><br>
          <small>Status: ${v.status || "desconhecido"}</small>
        </div>
        <div class="grupo-botoes">
          <button class="botao botao-bloquear" data-id="${v.id}" data-tipo="bloquear">Bloquear</button>
          <button class="botao botao-desbloquear" data-id="${v.id}" data-tipo="desbloquear">Desbloquear</button>
        </div>
      `;
      container.appendChild(bloco);
    });

    // Liga os botões
    container.querySelectorAll("button[data-tipo]").forEach((botao) => {
      botao.addEventListener("click", async (ev) => {
        const tipo = ev.target.dataset.tipo;
        const id = ev.target.dataset.id;
        await enviarComando(id, tipo);
      });
    });
  } catch (e) {
    console.error(e);
    container.innerHTML = "<p>Erro ao carregar veículos.</p>";
    mostrarAviso("Falha ao conectar com a API.", 4000, "erro");
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


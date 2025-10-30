"use strict";

/* ====== Config ====== */
const API_BASE = "https://api.neorastro.cloud";

/* ====== Sessão ====== */
function pegarToken() {
  return sessionStorage.getItem("token") || localStorage.getItem("token");
}

function sairAdmin() {
  sessionStorage.clear();
  localStorage.clear();
  location.href = "index.html";
}

/* Redireciona se não tiver token */
document.addEventListener("DOMContentLoaded", () => {
  if (!pegarToken()) {
    alert("Sessão expirada. Faça login novamente.");
    sairAdmin();
  }
});

/* ====== Chamada genérica com JWT ====== */
async function apiAdmin(endpoint, opcoes = {}) {
  const token = pegarToken();

  const resp = await fetch(
    `${API_BASE}${endpoint.startsWith("/") ? endpoint : "/" + endpoint}`,
    {
      method: "GET",
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      ...opcoes,
    }
  );

  if (resp.status === 401) {
    alert("Sessão expirada. Faça login novamente.");
    sairAdmin();
    throw new Error("Sessão expirada");
  }

  const dados = await resp.json().catch(() => ({}));
  if (!resp.ok) throw new Error(dados.mensagem || dados.erro || "Erro desconhecido.");
  return dados;
}

/* ====== Renderização ====== */
async function carregarUsuarios() {
  const corpo = document.getElementById("corpo-tabela");
  corpo.innerHTML = `<tr><td colspan="5" class="mensagem">Carregando...</td></tr>`;

  try {
    const usuarios = await apiAdmin("/admin/usuarios");

    if (!usuarios || usuarios.length === 0) {
      corpo.innerHTML = `<tr><td colspan="5" class="mensagem">Nenhum usuario cadastrado.</td></tr>`;
      return;
    }

    corpo.innerHTML = "";
    for (const u of usuarios) {
      const linha = document.createElement("tr");
      linha.innerHTML = `
        <td>${u.id}</td>
        <td>${u.nome}</td>
        <td>${u.email}</td>
        <td class="${u.aprovado ? "status-aprovado" : "status-pendente"}">
          ${u.aprovado ? "Aprovado" : "Pendente"}
        </td>
        <td>
          ${
            u.aprovado
              ? `<button class="btn-remover" data-acao="remover" data-id="${u.id}">Remover</button>`
              : `
                <button class="btn-aprovar" data-acao="aprovar" data-id="${u.id}">Aprovar</button>
                <button class="btn-remover" data-acao="remover" data-id="${u.id}">Remover</button>
              `
          }
        </td>
      `;
      corpo.appendChild(linha);
    }
  } catch (e) {
    corpo.innerHTML = `<tr><td colspan="5" class="mensagem">Falha ao carregar usuarios.</td></tr>`;
    console.error(e);
  }
}

/* Delegação de eventos (um listener só) */
document.addEventListener("click", async (ev) => {
  const btn = ev.target.closest("button[data-acao]");
  if (!btn) return;

  const acao = btn.dataset.acao;
  const id = Number(btn.dataset.id);

  try {
    if (acao === "aprovar") {
      if (!confirm("Deseja aprovar este usuario?")) return;
      const r = await apiAdmin(`/admin/aprovar/${id}`, { method: "POST" });
      alert(r.mensagem || "Usuario aprovado com sucesso!");
    }

    if (acao === "remover") {
      if (!confirm("Tem certeza que deseja remover este usuario?")) return;
      const r = await apiAdmin(`/admin/remover/${id}`, { method: "DELETE" });
      alert(r.mensagem || "Usuario removido com sucesso!");
    }

    await carregarUsuarios();
  } catch (e) {
    alert(e.message || "Erro na operação.");
  }
});

/* Inicialização e sair */
document.addEventListener("DOMContentLoaded", carregarUsuarios);
document.getElementById("botao-sair")?.addEventListener("click", sairAdmin);




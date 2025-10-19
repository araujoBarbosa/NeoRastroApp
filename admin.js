"use strict";

/* 🔗 URL base da API (backend hospedado na VPS) */
const API_BASE = "https://api.neorastro.cloud";

/* 🔑 Funções de sessão */
function pegarToken() {
  return sessionStorage.getItem("token");
}

function sairAdmin() {
  sessionStorage.clear();
  location.href = "index.html";
}

/* 🧠 Função genérica para chamadas da API com token */
async function apiAdmin(endpoint, opcoes = {}) {
  const token = pegarToken();

  try {
    const resposta = await fetch(
      `${API_BASE}${endpoint.startsWith("/") ? endpoint : "/" + endpoint}`,
      {
        mode: "cors",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        ...opcoes,
      }
    );

    if (resposta.status === 401) {
      alert("⚠️ Sessão expirada. Faça login novamente.");
      sairAdmin();
      throw new Error("Sessão expirada");
    }

    const dados = await resposta.json().catch(() => ({}));
    if (!resposta.ok) throw new Error(dados.mensagem || dados.erro || "Erro desconhecido.");

    return dados;
  } catch (erro) {
    console.error("Erro na API admin:", erro);
    throw erro;
  }
}

/* 📋 Carregar lista de usuários */
async function carregarUsuarios() {
  const corpo = document.getElementById("corpo-tabela");
  corpo.innerHTML = `<tr><td colspan="5" class="mensagem">Carregando...</td></tr>`;

  try {
    const usuarios = await apiAdmin("/admin/usuarios");

    if (!usuarios || usuarios.length === 0) {
      corpo.innerHTML = `<tr><td colspan="5" class="mensagem">Nenhum usuário cadastrado.</td></tr>`;
      return;
    }

    corpo.innerHTML = "";
    usuarios.forEach((u) => {
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
              ? `<button class="btn-remover" onclick="removerUsuario(${u.id})">Remover</button>`
              : `
                <button class="btn-aprovar" onclick="aprovarUsuario(${u.id})">Aprovar</button>
                <button class="btn-remover" onclick="removerUsuario(${u.id})">Remover</button>
              `
          }
        </td>
      `;
      corpo.appendChild(linha);
    });
  } catch (e) {
    corpo.innerHTML = `<tr><td colspan="5" class="mensagem">⚠️ Falha ao carregar usuários.</td></tr>`;
  }
}

/* ✅ Aprovar usuário */
async function aprovarUsuario(id) {
  if (!confirm("Deseja aprovar este usuário?")) return;

  try {
    const resultado = await apiAdmin(`/admin/aprovar/${id}`, { method: "POST" });
    alert(resultado.mensagem || "✅ Usuário aprovado com sucesso!");
    carregarUsuarios();
  } catch (e) {
    alert("❌ " + (e.message || "Erro ao aprovar usuário."));
  }
}

/* 🗑️ Remover usuário */
async function removerUsuario(id) {
  if (!confirm("Tem certeza que deseja remover este usuário?")) return;

  try {
    const resultado = await apiAdmin(`/admin/remover/${id}`, { method: "DELETE" });
    alert(resultado.mensagem || "🗑️ Usuário removido com sucesso!");
    carregarUsuarios();
  } catch (e) {
    alert("❌ " + (e.message || "Erro ao remover usuário."));
  }
}

/* 🚀 Inicialização */
document.addEventListener("DOMContentLoaded", carregarUsuarios);


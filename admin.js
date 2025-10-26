"use strict";

/* URL base da API (backend hospedado na VPS) */
const API_BASE = "https://api.neorastro.cloud";

/* Funcoes de sessao */
function pegarToken() {
  return sessionStorage.getItem("token");
}

function sairAdmin() {
  sessionStorage.clear();
  location.href = "index.html";
}

/* Funcao generica para chamadas da API com token */
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
      alert("Sessao expirada. Faca login novamente.");
      sairAdmin();
      throw new Error("Sessao expirada");
    }

    const dados = await resposta.json().catch(() => ({}));
    if (!resposta.ok) throw new Error(dados.mensagem || dados.erro || "Erro desconhecido.");

    return dados;
  } catch (erro) {
    console.error("Erro na API admin:", erro);
    throw erro;
  }
}

/* Carregar lista de usuarios */
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
    corpo.innerHTML = `<tr><td colspan="5" class="mensagem">Falha ao carregar usuarios.</td></tr>`;
  }
}

/* Aprovar usuario */
async function aprovarUsuario(id) {
  if (!confirm("Deseja aprovar este usuario?")) return;

  try {
    const resultado = await apiAdmin(`/admin/aprovar/${id}`, { method: "POST" });
    alert(resultado.mensagem || "Usuario aprovado com sucesso!");
    carregarUsuarios();
  } catch (e) {
    alert("Erro ao aprovar usuario: " + (e.message || ""));
  }
}

/* Remover usuario */
async function removerUsuario(id) {
  if (!confirm("Tem certeza que deseja remover este usuario?")) return;

  try {
    const resultado = await apiAdmin(`/admin/remover/${id}`, { method: "DELETE" });
    alert(resultado.mensagem || "Usuario removido com sucesso!");
    carregarUsuarios();
  } catch (e) {
    alert("Erro ao remover usuario: " + (e.message || ""));
  }
}

/* Inicializacao */
document.addEventListener("DOMContentLoaded", carregarUsuarios);



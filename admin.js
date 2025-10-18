"use strict";

// 🔗 URL base da API (ajustada para o backend real)
const API_BASE = "https://neorastro.cloud";

// 📋 Função para carregar a lista de usuários
async function carregarUsuarios() {
  const corpo = document.getElementById("corpo-tabela");
  corpo.innerHTML = `<tr><td colspan="5" class="mensagem">Carregando...</td></tr>`;

  try {
    const resposta = await fetch(`${API_BASE}/admin/usuarios`);
    const usuarios = await resposta.json();

    if (!resposta.ok) throw new Error(usuarios.mensagem || "Erro ao carregar usuários.");

    if (!usuarios.length) {
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
    corpo.innerHTML = `<tr><td colspan="5" class="mensagem">⚠️ Erro ao conectar com o servidor.</td></tr>`;
  }
}

// ✅ Função para aprovar um usuário
async function aprovarUsuario(id) {
  if (!confirm("Deseja aprovar este usuário?")) return;

  try {
    const resposta = await fetch(`${API_BASE}/admin/aprovar/${id}`, {
      method: "POST",
    });

    const resultado = await resposta.json();

    if (!resposta.ok) throw new Error(resultado.mensagem || "Erro ao aprovar usuário.");
    alert("✅ Usuário aprovado com sucesso!");
    carregarUsuarios();
  } catch (e) {
    alert("❌ " + (e.message || "Erro ao aprovar usuário."));
  }
}

// 🗑️ Função para remover usuário
async function removerUsuario(id) {
  if (!confirm("Tem certeza que deseja remover este usuário?")) return;

  try {
    const resposta = await fetch(`${API_BASE}/admin/remover/${id}`, {
      method: "DELETE",
    });

    const resultado = await resposta.json();

    if (!resposta.ok) throw new Error(resultado.mensagem || "Erro ao remover usuário.");
    alert("🗑️ Usuário removido com sucesso!");
    carregarUsuarios();
  } catch (e) {
    alert("❌ " + (e.message || "Erro ao remover usuário."));
  }
}

// 🚀 Inicialização
document.addEventListener("DOMContentLoaded", carregarUsuarios);


"use strict";

const API_BASE = "https://api.neorastro.cloud";

// Função para exibir a lista de usuários
async function carregarUsuarios() {
  const corpo = document.getElementById("corpo-tabela");
  corpo.innerHTML = `<tr><td colspan="5" class="mensagem">Carregando...</td></tr>`;

  try {
    const resposta = await fetch(`${API_BASE}/api/admin/usuarios`);
    const usuarios = await resposta.json();

    if (!usuarios.length) {
      corpo.innerHTML = `<tr><td colspan="5" class="mensagem">Nenhum usuário cadastrado.</td></tr>`;
      return;
    }

    corpo.innerHTML = "";
    usuarios.forEach(u => {
      const linha = document.createElement("tr");
      linha.innerHTML = `
        <td>${u.id}</td>
        <td>${u.nome}</td>
        <td>${u.email}</td>
        <td class="${u.aprovado ? "status-aprovado" : "status-pendente"}">
          ${u.aprovado ? "Aprovado" : "Pendente"}
        </td>
        <td>
          ${u.aprovado
            ? "-"
            : `<button class="btn-aprovar" onclick="aprovarUsuario(${u.id})">Aprovar</button>`}
        </td>
      `;
      corpo.appendChild(linha);
    });
  } catch (e) {
    corpo.innerHTML = `<tr><td colspan="5" class="mensagem">Erro ao carregar usuários.</td></tr>`;
  }
}

// Função para aprovar usuário
async function aprovarUsuario(id) {
  if (!confirm("Deseja aprovar este usuário?")) return;

  try {
    const resposta = await fetch(`${API_BASE}/api/admin/aprovar/${id}`, {
      method: "POST",
    });
    const resultado = await resposta.json();

    alert(resultado.mensagem || "Usuário aprovado!");
    carregarUsuarios();
  } catch (e) {
    alert("Erro ao aprovar usuário.");
  }
}

document.addEventListener("DOMContentLoaded", carregarUsuarios);

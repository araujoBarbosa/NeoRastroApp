(function () {
  "use strict";

  // =========================
  // Configurações globais
  // =========================
  const API_BASE = "https://api.neorastro.cloud";

  const API = {
    listar: `${API_BASE}/veiculos`,
    cadastrar: `${API_BASE}/veiculos`,
    remover: (id) => `${API_BASE}/veiculos/${id}`,
  };

  // =========================
  // Sessão e autenticação
  // =========================
  function pegarUsuario() {
    try {
      return JSON.parse(sessionStorage.getItem("usuarioLogado"));
    } catch {
      return null;
    }
  }

  function pegarToken() {
    return sessionStorage.getItem("token");
  }

  function sairSistema() {
    sessionStorage.clear();
    localStorage.removeItem("usuarioNome");
    location.href = "index.html"; // ✅ redireciona para o login
  }

  // =========================
  // Comunicação com o backend
  // =========================
  async function listarVeiculos() {
    const token = pegarToken();
    const resposta = await fetch(API.listar, {
      headers: {
        Authorization: "Bearer " + token,
        "Content-Type": "application/json",
      },
      mode: "cors",
    });
    if (!resposta.ok) throw new Error("Erro ao listar veículos");
    return await resposta.json();
  }

  async function cadastrarVeiculo(nome, imei) {
    const token = pegarToken();
    const resposta = await fetch(API.cadastrar, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      mode: "cors",
      body: JSON.stringify({ nome, imei }),
    });
    if (!resposta.ok) throw new Error("Erro ao cadastrar veículo");
    return await resposta.json();
  }

  async function removerVeiculo(id) {
    const token = pegarToken();
    const resposta = await fetch(API.remover(id), {
      method: "DELETE",
      headers: { Authorization: "Bearer " + token },
      mode: "cors",
    });
    if (!resposta.ok) throw new Error("Erro ao remover veículo");
    return await resposta.json();
  }

  // =========================
  // Mensagens visuais
  // =========================
  function mostrarMensagem(texto, erro = false) {
    const elemento = document.getElementById("mensagem-veiculo");
    if (!elemento) return;
    elemento.textContent = texto;
    elemento.className = "mensagem " + (erro ? "erro" : "sucesso");
  }

  function limparMensagem() {
    const elemento = document.getElementById("mensagem-veiculo");
    if (elemento) {
      elemento.textContent = "";
      elemento.className = "mensagem";
    }
  }

  // =========================
  // Manipulação de DOM
  // =========================
  function renderizarVeiculos(lista) {
    const container = document.getElementById("lista-veiculos");
    if (!container) return;

    container.innerHTML = "";

    if (!lista || lista.length === 0) {
      container.innerHTML = "<p>Nenhum veículo cadastrado.</p>";
      return;
    }

    lista.forEach((v) => {
      const item = document.createElement("div");
      item.className = "veiculo-item";
      item.innerHTML = `
        <strong>${v.nome}</strong><br>
        IMEI: ${v.imei}<br>
        <button class="abrir">🔎 Abrir no painel</button>
        <button class="remover">🗑️ Remover</button>
      `;

      // Abrir no painel
      item.querySelector(".abrir").addEventListener("click", () => {
        sessionStorage.setItem("imeiSelecionado", v.imei);
        location.href = "painel.html";
      });

      // Remover veículo
      item.querySelector(".remover").addEventListener("click", async () => {
        if (confirm(`Deseja realmente remover o veículo ${v.nome}?`)) {
          try {
            await removerVeiculo(v.id);
            mostrarMensagem("✅ Veículo removido com sucesso!");
            carregarVeiculos();
          } catch (erro) {
            console.error("Erro ao remover veículo:", erro);
            mostrarMensagem("❌ Erro ao remover veículo.", true);
          }
        }
      });

      container.appendChild(item);
    });
  }

  async function carregarVeiculos() {
    try {
      const veiculos = await listarVeiculos();
      renderizarVeiculos(veiculos);
    } catch (erro) {
      console.error("Erro ao carregar veículos:", erro);
      mostrarMensagem("❌ Não foi possível carregar os veículos.", true);
    }
  }

  function ligarFormulario() {
    const formulario = document.getElementById("formulario-veiculo");
    if (!formulario) return;

    formulario.addEventListener("submit", async (evento) => {
      evento.preventDefault();
      limparMensagem();

      const nome = document.getElementById("campo-nome-veiculo").value.trim();
      const imei = document.getElementById("campo-imei-veiculo").value.trim();

      if (!nome || !imei) {
        mostrarMensagem("⚠️ Preencha todos os campos.", true);
        return;
      }

      try {
        await cadastrarVeiculo(nome, imei);
        formulario.reset();
        mostrarMensagem("✅ Veículo cadastrado com sucesso!");
        carregarVeiculos();
      } catch (erro) {
        console.error("Erro ao cadastrar veículo:", erro);
        mostrarMensagem("❌ Erro ao cadastrar veículo.", true);
      }
    });
  }

  // =========================
  // Inicialização
  // =========================
  document.addEventListener("DOMContentLoaded", () => {
    const usuario = pegarUsuario();
    if (!usuario) {
      location.href = "index.html"; // ✅ redireciona ao login se não estiver autenticado
      return;
    }

    // Saudação
    const bemVindo = document.getElementById("bem-vindo");
    if (bemVindo) bemVindo.textContent = `Olá, ${usuario.nome || "Usuário"}!`;

    // Botão sair
    const botaoSair = document.getElementById("botao-sair");
    if (botaoSair) botaoSair.addEventListener("click", sairSistema);

    // Carregar veículos
    carregarVeiculos();

    // Formulário de cadastro
    ligarFormulario();
  });
})();




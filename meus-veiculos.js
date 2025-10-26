(function () {
  "use strict";

  // =========================
  // Configuracoes globais
  // =========================
  const API_BASE = "https://api.neorastro.cloud";

  const API = {
    listar: `${API_BASE}/veiculos`,
    cadastrar: `${API_BASE}/veiculos`,
    remover: (id) => `${API_BASE}/veiculos/${id}`,
  };

  // =========================
  // Sessao e autenticacao
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
    location.href = "index.html";
  }

  // =========================
  // Comunicacao com o backend
  // =========================
  async function apiRequisicao(url, opcoes = {}) {
    const token = pegarToken();
    const resposta = await fetch(url, {
      mode: "cors",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: "Bearer " + token } : {}),
      },
      ...opcoes,
    });

    if (resposta.status === 401) {
      mostrarMensagem("⚠️ Sessao expirada. Faca login novamente.", true);
      sairSistema();
      throw new Error("Sessao expirada");
    }

    const dados = await resposta.json().catch(() => ({}));
    if (!resposta.ok)
      throw new Error(dados.erro || dados.mensagem || "Erro desconhecido.");

    return dados;
  }

  async function listarVeiculos() {
    return apiRequisicao(API.listar);
  }

  async function cadastrarVeiculo(nome, imei) {
    return apiRequisicao(API.cadastrar, {
      method: "POST",
      body: JSON.stringify({ nome, imei }),
    });
  }

  async function removerVeiculo(id) {
    return apiRequisicao(API.remover(id), {
      method: "DELETE",
    });
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
  // Manipulacao de DOM
  // =========================
  function renderizarVeiculos(lista) {
    const container = document.getElementById("lista-veiculos");
    if (!container) return;

    container.innerHTML = "";

    if (!lista || lista.length === 0) {
      container.innerHTML = "<p>Nenhum veiculo cadastrado.</p>";
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

      // 🔍 Abrir no painel
      item.querySelector(".abrir").addEventListener("click", () => {
        sessionStorage.setItem("imeiSelecionado", v.imei);
        location.href = "painel.html";
      });

      // 🗑️ Remover veiculo
      item.querySelector(".remover").addEventListener("click", async () => {
        if (confirm(`Deseja realmente remover o veiculo ${v.nome}?`)) {
          try {
            await removerVeiculo(v.id);
            mostrarMensagem("✅ Veiculo removido com sucesso!");
            carregarVeiculos();
          } catch (erro) {
            console.error("Erro ao remover veiculo:", erro);
            mostrarMensagem("❌ Erro ao remover veiculo.", true);
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
      console.error("Erro ao carregar veiculos:", erro);
      mostrarMensagem("❌ Nao foi possivel carregar os veiculos.", true);
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
        mostrarMensagem("✅ Veiculo cadastrado com sucesso!");
        carregarVeiculos();
      } catch (erro) {
        console.error("Erro ao cadastrar veiculo:", erro);
        mostrarMensagem("❌ Erro ao cadastrar veiculo.", true);
      }
    });
  }

  // =========================
  // Inicializacao
  // =========================
  document.addEventListener("DOMContentLoaded", () => {
    const usuario = pegarUsuario();
    if (!usuario) {
      location.href = "index.html";
      return;
    }

    // Saudacao
    const bemVindo = document.getElementById("bem-vindo");
    if (bemVindo) bemVindo.textContent = `Ola, ${usuario.nome || "Usuario"}!`;

    // Botao sair
    const botaoSair = document.getElementById("botao-sair");
    if (botaoSair) botaoSair.addEventListener("click", sairSistema);

    // Carregar veiculos
    carregarVeiculos();

    // Formulario de cadastro
    ligarFormulario();
  });
})();





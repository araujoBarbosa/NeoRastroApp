"use strict";

/* 🔗 URL base da API (backend hospedado na VPS) */
const API_BASE = "https://api.neorastro.cloud";

/* ===== Alternar visibilidade da senha ===== */
function alternarVisibilidade(idDoCampo, botao) {
  try {
    const campo = document.getElementById(idDoCampo);
    if (!campo) return;

    // ✅ Armazena o valor atual da senha para evitar duplicação
    const valorAtual = campo.value;
    const estaVisivel = campo.type === "text";
    campo.type = estaVisivel ? "password" : "text";

    // ✅ Restaura o valor sem perder ou duplicar caracteres
    campo.value = valorAtual;

    if (botao) {
      botao.textContent = estaVisivel ? "👁️" : "🙈";
      botao.setAttribute("aria-pressed", String(!estaVisivel));
      botao.setAttribute("aria-label", estaVisivel ? "Mostrar senha" : "Ocultar senha");
    }
  } catch (erro) {
    console.error("Erro ao alternar visibilidade:", erro);
  }
}

(function () {
  "use strict";

  // ===== Exibir mensagens =====
  function mostrarMensagem(elemento, texto, ehErro) {
    if (!elemento) return;
    elemento.textContent = texto;
    elemento.classList.remove("erro", "sucesso");
    elemento.classList.add(ehErro ? "erro" : "sucesso");
  }

  function limparMensagem(elemento) {
    if (!elemento) return;
    elemento.textContent = "";
    elemento.classList.remove("erro", "sucesso");
  }

  // ===== Configurar formulario =====
  function ligarFormulario() {
    const formulario = document.getElementById("formulario-cadastro");
    if (!formulario) return;

    const campoNome = document.getElementById("campo-nome");
    const campoEmail = document.getElementById("campo-email");
    const campoTelefone = document.getElementById("campo-telefone");
    const campoEmpresa = document.getElementById("campo-empresa");
    const campoSenha = document.getElementById("campo-senha");
    const campoConfirmar = document.getElementById("campo-confirmar");
    const mensagem = document.getElementById("mensagem-cadastro");
    const botaoCadastro = document.getElementById("botao-cadastro");

    // Ativar botao somente quando checkbox for marcado
    const campoAceite = document.getElementById("campo-aceite");
    if (campoAceite && botaoCadastro) {
      campoAceite.addEventListener("change", () => {
        botaoCadastro.disabled = !campoAceite.checked;
      });
    }

    formulario.addEventListener("submit", async (evento) => {
      evento.preventDefault();
      limparMensagem(mensagem);

      const nome = campoNome.value.trim();
      const email = campoEmail.value.trim();
      const telefone = campoTelefone.value.trim();
      const empresa = campoEmpresa.value.trim();
      const senha = campoSenha.value;
      const confirmarSenha = campoConfirmar.value;

      if (!nome || !email || !telefone || !senha || !confirmarSenha) {
        mostrarMensagem(mensagem, "⚠️ Preencha todos os campos obrigatorios.", true);
        return;
      }
      if (senha !== confirmarSenha) {
        mostrarMensagem(mensagem, "⚠️ As senhas nao coincidem.", true);
        return;
      }

      botaoCadastro.disabled = true;
      botaoCadastro.textContent = "Criando conta...";

      try {
        // ✅ Comunicacao segura com backend Flask (rota correta: /cadastro)
        const resposta = await fetch(`${API_BASE}/cadastro`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          mode: "cors",
          body: JSON.stringify({ nome, email, telefone, empresa, senha }),
        });

        const dados = await resposta.json().catch(() => ({}));

        if (resposta.ok) {
          mostrarMensagem(
            mensagem,
            "✅ Cadastro realizado com sucesso! Redirecionando...",
            false
          );
          setTimeout(() => (window.location.href = "login.html"), 1500);
        } else {
          const erro = dados.erro || dados.message || "❌ Erro ao cadastrar. Tente novamente.";
          mostrarMensagem(mensagem, erro, true);
        }
      } catch (erro) {
        console.error("Erro de conexao:", erro);
        mostrarMensagem(mensagem, "❌ Falha na comunicacao com o servidor.", true);
      } finally {
        botaoCadastro.disabled = false;
        botaoCadastro.textContent = "Criar conta";
      }
    });
  }

  // ===== Inicializacao =====
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ligarFormulario, { once: true });
  } else {
    ligarFormulario();
  }
})();




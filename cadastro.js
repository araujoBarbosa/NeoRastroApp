"use strict";

/* URL base da API (backend hospedado na VPS) */
const API_BASE = "https://api.neorastro.cloud";

/* Alternar visibilidade da senha */
function alternarVisibilidade(idDoCampo, botao) {
  try {
    const campo = document.getElementById(idDoCampo);
    if (!campo) return;

    const valorAtual = campo.value;
    const visivel = campo.type === "text";
    campo.type = visivel ? "password" : "text";
    campo.value = valorAtual;

    if (botao) {
      botao.textContent = visivel ? "👁️" : "🙈";
      botao.setAttribute("aria-pressed", String(!visivel));
      botao.setAttribute("aria-label", visivel ? "Mostrar senha" : "Ocultar senha");
    }
  } catch (erro) {
    console.error("Erro ao alternar visibilidade:", erro);
  }
}

(function () {
  "use strict";

  /* Exibir mensagens */
  function mostrarMensagem(elemento, texto, erro) {
    if (!elemento) return;
    elemento.textContent = texto;
    elemento.classList.remove("erro", "sucesso");
    elemento.classList.add(erro ? "erro" : "sucesso");
  }

  function limparMensagem(elemento) {
    if (!elemento) return;
    elemento.textContent = "";
    elemento.classList.remove("erro", "sucesso");
  }

  /* Configurar formulario */
  function ligarFormulario() {
    const form = document.getElementById("formulario-cadastro");
    if (!form) return;

    const nome = document.getElementById("campo-nome");
    const email = document.getElementById("campo-email");
    const telefone = document.getElementById("campo-telefone");
    const empresa = document.getElementById("campo-empresa");
    const senha = document.getElementById("campo-senha");
    const confirmar = document.getElementById("campo-confirmar");
    const mensagem = document.getElementById("mensagem-cadastro");
    const botao = document.getElementById("botao-cadastro");
    const aceite = document.getElementById("campo-aceite");

    /* Habilitar o botao apenas se o aceite estiver marcado */
    if (aceite && botao) {
      aceite.addEventListener("change", () => {
        botao.disabled = !aceite.checked;
      });
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      limparMensagem(mensagem);

      const vNome = nome.value.trim();
      const vEmail = email.value.trim();
      const vTelefone = telefone.value.trim();
      const vEmpresa = empresa.value.trim();
      const vSenha = senha.value;
      const vConfirmar = confirmar.value;

      if (!vNome || !vEmail || !vTelefone || !vSenha || !vConfirmar) {
        mostrarMensagem(mensagem, "Preencha todos os campos obrigatorios.", true);
        return;
      }
      if (vSenha !== vConfirmar) {
        mostrarMensagem(mensagem, "As senhas nao coincidem.", true);
        return;
      }

      botao.disabled = true;
      botao.textContent = "Criando conta...";

      try {
        const resposta = await fetch(`${API_BASE}/cadastro`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          mode: "cors",
          body: JSON.stringify({
            nome: vNome,
            email: vEmail,
            telefone: vTelefone,
            empresa: vEmpresa,
            senha: vSenha,
          }),
        });

        const dados = await resposta.json().catch(() => ({}));

        if (resposta.ok) {
          mostrarMensagem(mensagem, "Cadastro realizado com sucesso! Redirecionando...", false);
          setTimeout(() => (window.location.href = "login.html"), 1500);
        } else {
          const erro = dados.erro || dados.message || "Erro ao cadastrar. Tente novamente.";
          mostrarMensagem(mensagem, erro, true);
        }
      } catch (erro) {
        console.error("Erro de conexao:", erro);
        mostrarMensagem(mensagem, "Falha na comunicacao com o servidor.", true);
      } finally {
        botao.disabled = false;
        botao.textContent = "Criar conta";
      }
    });
  }

  /* Inicializacao */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ligarFormulario, { once: true });
  } else {
    ligarFormulario();
  }
})();





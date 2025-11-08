"use strict";

/* ====== URL base da API (backend hospedado na VPS) ====== */
const API_BASE = "https://api.neorastro.cloud";

/* ====== Alternar visibilidade da senha ====== */
function alternarVisibilidade(idDoCampo, botao) {
  try {
    const campo = document.getElementById(idDoCampo);
    if (!campo) return;

    const visivel = campo.type === "text";
    campo.type = visivel ? "password" : "text";

    if (botao) {
      botao.textContent = visivel ? "👁️" : "🙈";
      botao.setAttribute("aria-pressed", String(!visivel));
      botao.setAttribute("aria-label", visivel ? "Mostrar senha" : "Ocultar senha");
    }
  } catch (erro) {
    console.error("Erro ao alternar visibilidade:", erro);
  }
}

/* ====== Escopo principal ====== */
(function () {
  "use strict";

  /* ====== Exibir mensagens ====== */
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

  /* ====== Configurar formulário ====== */
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

    /* Ativar botão apenas se o aceite estiver marcado */
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
        mostrarMensagem(mensagem, "Preencha todos os campos obrigatórios.", true);
        return;
      }

      if (vSenha !== vConfirmar) {
        mostrarMensagem(mensagem, "As senhas não coincidem.", true);
        return;
      }

      botao.disabled = true;
      botao.textContent = "Criando conta...";

      try {
        const resposta = await fetch(`${API_BASE}/cadastro`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          mode: "cors",
          body: JSON.stringify({
            nome: vNome,
            email: vEmail,
            telefone: vTelefone,
            empresa: vEmpresa,
            senha: vSenha
          }),
        });

        // Garante compatibilidade caso o backend retorne algo diferente
        let dados = {};
        try {
          dados = await resposta.json();
        } catch {
          dados = {};
        }

        if (resposta.ok) {
          mostrarMensagem(mensagem, "✅ Cadastro realizado com sucesso! Redirecionando...", false);
          setTimeout(() => (window.location.href = "login.html"), 1500);
        } else {
          const erro = dados.erro || dados.mensagem || dados.message || "Erro ao cadastrar. Tente novamente.";
          mostrarMensagem(mensagem, erro, true);
        }

      } catch (erro) {
        console.error("Erro de comunicação com o servidor:", erro);
        mostrarMensagem(mensagem, "⚠️ Falha na comunicação com o servidor. Verifique sua conexão e tente novamente.", true);
      } finally {
        botao.disabled = false;
        botao.textContent = "Criar conta";
      }
    });
  }

  /* ====== Inicialização ====== */
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", ligarFormulario, { once: true });
  } else {
    ligarFormulario();
  }
})();






/* ===== Alternar visibilidade da senha ===== */
"use strict";

function alternarVisibilidade(idDoCampo, botao) {
  const campo = document.getElementById(idDoCampo);
  if (!campo || !botao) return;

  const visivel = campo.type === "text";
  campo.type = visivel ? "password" : "text";
  botao.textContent = visivel ? "👁️" : "🙈";
  botao.setAttribute("aria-label", visivel ? "Mostrar senha" : "Ocultar senha");
}

/* ===== Fluxo de Login ===== */
(function iniciarLogin() {
  const iniciar = () => {
    const formulario = document.getElementById("formulario-entrada");
    if (!formulario) return;

    const campoEmail = document.getElementById("campo-email") || document.getElementById("email");
    const campoSenha = document.getElementById("campo-senha") || document.getElementById("senha");
    const botaoEntrar = document.getElementById("botao-entrar") || formulario.querySelector("button[type='submit']");
    const mensagem = document.getElementById("mensagem-login") || document.getElementById("mensagem");
    const botaoOlho = document.getElementById("toggleSenha");

    // 👁️ Ativar o "olhinho"
    if (botaoOlho && campoSenha) {
      botaoOlho.addEventListener("click", () => alternarVisibilidade(campoSenha.id, botaoOlho));
    }

    if (!campoEmail || !campoSenha || !botaoEntrar) return;

    // --- Ativa o botão apenas quando os campos estiverem preenchidos
    const atualizarBotao = () => {
      const valido = !!campoEmail.value.trim() && !!campoSenha.value;
      botaoEntrar.disabled = !valido;
    };
    formulario.addEventListener("input", atualizarBotao);
    atualizarBotao();

    // --- Envio do formulário
    formulario.addEventListener("submit", async (evento) => {
      evento.preventDefault();

      const email = campoEmail.value.trim();
      const senha = campoSenha.value;
      limparMensagem();

      if (!email || !senha) {
        mostrarMensagem("⚠️ Preencha todos os campos.", true);
        return;
      }

      setCarregando(true);

      try {
        // ✅ Comunicação com backend Flask segura
        const resposta = await fetch("https://api.neorastro.cloud/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          mode: "cors",
          credentials: "omit",
          body: JSON.stringify({ email, senha }),
        });

        const dados = await resposta.json().catch(() => ({}));

        if (!resposta.ok) {
          const erro = dados.erro || dados.mensagem || "❌ E-mail ou senha incorretos.";
          mostrarMensagem(erro, true);
          setCarregando(false);
          return;
        }

        mostrarMensagem("✅ Login realizado com sucesso! Redirecionando…", false);

        // Guarda sessão temporária
        sessionStorage.setItem("usuarioLogado", JSON.stringify(dados.usuario || { email }));
        sessionStorage.setItem("token", dados.token || "");

        setTimeout(() => {
          window.location.href = "painel.html";
        }, 800);
      } catch (erro) {
        console.error("Erro de conexão:", erro);
        mostrarMensagem("❌ Não foi possível conectar ao servidor.", true);
      } finally {
        setCarregando(false);
      }
    });

    // --- Funções auxiliares ---
    function setCarregando(ativo) {
      if (!botaoEntrar) return;
      botaoEntrar.disabled = !!ativo;
      botaoEntrar.textContent = ativo ? "Entrando…" : "Entrar";
    }

    function limparMensagem() {
      if (mensagem) {
        mensagem.textContent = "";
        mensagem.style.color = "";
      }
    }

    function mostrarMensagem(texto, erro = false) {
      if (!mensagem) return;
      mensagem.textContent = texto;
      mensagem.style.color = erro ? "#f87171" : "#4ade80";
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar, { once: true });
  } else {
    iniciar();
  }
})();




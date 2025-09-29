/* ===== Alternar visibilidade da senha ===== */
"use strict";

function alternarVisibilidade(idDoCampo, botao) {
  if (!idDoCampo || !botao) return;
  const campo = document.getElementById(idDoCampo);
  if (!campo) return;
  const visivel = campo.type === "text";
  try {
    campo.type = visivel ? "password" : "text";
  } catch (_) {}
  botao.textContent = visivel ? "👁️" : "🙈";
  botao.setAttribute("aria-pressed", String(!visivel));
  botao.setAttribute("aria-label", visivel ? "Mostrar senha" : "Ocultar senha");
}

/* ===== Fluxo de Login ===== */
(function iniciarLogin() {
  const iniciar = () => {
    const formulario = document.getElementById("formulario-entrada");
    if (!formulario) return;

    const campoEmail = document.getElementById("campo-email");
    const campoSenha = document.getElementById("campo-senha");
    const mensagem = document.getElementById("mensagem-login");
    const botaoEntrar = document.getElementById("botao-entrar");

    if (!campoEmail || !campoSenha || !botaoEntrar) return;

    // Acessibilidade para mensagem
    if (mensagem) {
      mensagem.setAttribute("role", "status");
      mensagem.setAttribute("aria-live", "polite");
    }

    // Habilitar/desabilitar botão conforme os campos
    const atualizarBotao = () => {
      const valido = !!campoEmail.value.trim() && !!campoSenha.value;
      botaoEntrar.disabled = !valido;
    };
    formulario.addEventListener("input", atualizarBotao);
    atualizarBotao();

    // Envio do formulário
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
        const resposta = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, senha }),
        });

        const dados = await resposta.json();

        if (!resposta.ok) {
          mostrarMensagem(dados.erro || "❌ E-mail ou senha incorretos.", true);
          setCarregando(false);
          return;
        }

        // Sucesso
        mostrarMensagem("✅ Login realizado com sucesso! Redirecionando…", false);

        // Guarda dados no navegador
        sessionStorage.setItem("usuarioLogado", JSON.stringify(dados.usuario));
        sessionStorage.setItem("token", dados.token);

        // Redireciona para painel
        setTimeout(() => {
          window.location.href = "painel.html";
        }, 600);
      } catch (erro) {
        mostrarMensagem("❌ Erro ao conectar com o servidor.", true);
        setCarregando(false);
      }
    });

    function setCarregando(ativo) {
      if (!botaoEntrar) return;
      botaoEntrar.disabled = !!ativo;
      if (ativo) {
        botaoEntrar.dataset.label = botaoEntrar.textContent || "Entrar";
        botaoEntrar.textContent = "Entrando…";
      } else {
        botaoEntrar.textContent = botaoEntrar.dataset.label || "Entrar";
      }
    }

    function limparMensagem() {
      if (!mensagem) return;
      mensagem.textContent = "";
      mensagem.classList.remove("erro", "sucesso");
    }

    function mostrarMensagem(texto, ehErro) {
      if (!mensagem) return;
      mensagem.textContent = texto;
      mensagem.classList.remove("erro", "sucesso");
      mensagem.classList.add(ehErro ? "erro" : "sucesso");
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar, { once: true });
  } else {
    iniciar();
  }
})();

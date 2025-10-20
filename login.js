"use strict";

/* ===== Alternar visibilidade da senha ===== */
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
  const API_BASE = "https://api.neorastro.cloud"; // ✅ domínio HTTPS do backend

  const iniciar = () => {
    const formulario = document.getElementById("formulario-entrada");
    if (!formulario) return;

    const campoEmail = document.getElementById("campo-email");
    const campoSenha = document.getElementById("campo-senha");
    const botaoEntrar = document.getElementById("botao-entrar");
    const mensagem = document.getElementById("mensagem-login");
    const botaoOlho = document.querySelector(".botao-alternar-senha");

    // 👁️ Ativar o "olhinho"
    if (botaoOlho && campoSenha) {
      botaoOlho.addEventListener("click", () =>
        alternarVisibilidade(campoSenha.id, botaoOlho)
      );
    }

    if (!campoEmail || !campoSenha || !botaoEntrar) return;

    // 🔄 Habilitar botão somente se os campos estiverem preenchidos
    const atualizarBotao = () => {
      const valido = campoEmail.value.trim() && campoSenha.value;
      botaoEntrar.disabled = !valido;
    };
    formulario.addEventListener("input", atualizarBotao);
    atualizarBotao();

    // 🚀 Envio do formulário
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
        // ✅ Comunicação com o backend Flask (corrigido)
        const resposta = await fetch(`${API_BASE}/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          mode: "cors",
          body: JSON.stringify({ email, senha }),
        });

        const dados = await resposta.json().catch(() => ({}));

        if (!resposta.ok) {
          const erro =
            dados.erro || dados.message || dados.mensagem || "❌ E-mail ou senha incorretos.";
          mostrarMensagem(erro, true);
          setCarregando(false);
          return;
        }

        mostrarMensagem("✅ Login realizado com sucesso! Redirecionando…", false);

        // 🔐 Armazenar sessão
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
        mensagem.classList.remove("erro", "sucesso");
      }
    }

    function mostrarMensagem(texto, erro = false) {
      if (!mensagem) return;
      mensagem.textContent = texto;
      mensagem.classList.remove("erro", "sucesso");
      mensagem.classList.add(erro ? "erro" : "sucesso");
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", iniciar, { once: true });
  } else {
    iniciar();
  }
})();




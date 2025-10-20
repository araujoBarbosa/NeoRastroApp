"use strict";

const API_BASE = "https://api.neorastro.cloud"; // ✅ API da VPS

// Alternar visibilidade da senha
function ligarAlternarSenha() {
  const botao = document.querySelector(".botao-alternar-senha");
  if (!botao) return;
  const alvoId = botao.getAttribute("aria-controls");
  const campo = document.getElementById(alvoId);
  if (!campo) return;

  botao.addEventListener("click", () => {
    const visivel = campo.type === "text";
    campo.type = visivel ? "password" : "text";
    botao.setAttribute("aria-pressed", String(!visivel));
    botao.setAttribute("aria-label", visivel ? "Mostrar senha" : "Ocultar senha");
  });
}

function iniciar() {
  const formulario = document.getElementById("formulario-entrada");
  const botao = document.getElementById("botao-entrar");
  const mensagem = document.getElementById("mensagem-login");
  const email = document.getElementById("campo-email");
  const senha = document.getElementById("campo-senha");

  const atualizarBotao = () => {
    botao.disabled = !(formulario.checkValidity() && email.value && senha.value);
  };
  formulario.addEventListener("input", atualizarBotao);
  formulario.addEventListener("change", atualizarBotao);

  formulario.addEventListener("submit", async (e) => {
    e.preventDefault();
    mensagem.textContent = "";
    mensagem.classList.remove("erro", "sucesso");

    try {
      botao.disabled = true;
      botao.dataset.label = botao.textContent;
      botao.textContent = "Entrando…";

      const dados = {
        email: email.value.trim(),
        senha: senha.value,
        lembrar: document.getElementById("campo-lembrar").checked,
      };

      const resposta = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(dados),
        mode: "cors",
      });

      if (!resposta.ok) {
        let mensagemErro = "❌ Credenciais inválidas ou falha de rede.";
        try {
          const err = await resposta.json();
          if (err && (err.mensagem || err.erro)) mensagemErro = err.mensagem || err.erro;
        } catch (_) {}
        throw new Error(mensagemErro);
      }

      const json = await resposta.json();

      // ✅ Salvar token para autenticação
      localStorage.setItem("token", json.token || "");

      // 🔧 Compatibilidade com painel.js (mantém login ativo)
      sessionStorage.setItem("token", json.token || "");
      sessionStorage.setItem("usuarioLogado", JSON.stringify(json.usuario || {}));

      mensagem.textContent = "✅ Login realizado! Redirecionando…";
      mensagem.classList.add("sucesso");

      // Redirecionar após login bem-sucedido
      setTimeout(() => {
        window.location.href = "painel.html";
      }, 600);

    } catch (erro) {
      mensagem.textContent = erro?.message || "❌ Não foi possível entrar. Tente novamente.";
      mensagem.classList.add("erro");
      botao.disabled = false;
      botao.textContent = botao.dataset.label || "Entrar";
    }
  });

  atualizarBotao();
  ligarAlternarSenha();
}

document.addEventListener("DOMContentLoaded", iniciar);



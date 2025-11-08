"use strict";

/* ===== Configuração da API ===== */
const API_BASE = "https://api.neorastro.cloud";

/* ===== Alternar visibilidade da senha ===== */
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

/* ===== Fluxo principal ===== */
function iniciar() {
  const formulario = document.getElementById("formulario-entrada");
  const botao = document.getElementById("botao-entrar");
  const mensagem = document.getElementById("mensagem-login");
  const email = document.getElementById("campo-email");
  const senha = document.getElementById("campo-senha");

  if (!formulario || !botao) return;

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
      botao.textContent = "Entrando...";

      const dados = {
        email: email.value.trim(),
        senha: senha.value,
      };

      const resposta = await fetch(`${API_BASE}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados),
        mode: "cors",
      });

      const json = await resposta.json().catch(() => ({}));

      if (!resposta.ok) {
        const msgErro = json.erro || json.mensagem || "Credenciais inválidas.";
        throw new Error(msgErro);
      }

      /* ===== Salvar dados do usuário ===== */
      const usuario = json.usuario || { email: dados.email };
      const token = json.token;

      // 💾 Agora salva tanto em session quanto em localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("usuarioLogado", JSON.stringify(usuario));
      sessionStorage.setItem("token", token);
      sessionStorage.setItem("usuarioLogado", JSON.stringify(usuario));

      mensagem.textContent = "Login realizado com sucesso! Redirecionando...";
      mensagem.classList.add("sucesso");

      // 🔁 Redireciona para admin.html se for admin
      setTimeout(() => {
        if (usuario.email.includes("admin")) {
          window.location.href = "admin.html";
        } else {
          window.location.href = "painel.html";
        }
      }, 1000);

    } catch (erro) {
      console.error("Erro no login:", erro);
      mensagem.textContent = erro.message || "Falha ao entrar. Tente novamente.";
      mensagem.classList.add("erro");
      botao.disabled = false;
      botao.textContent = botao.dataset.label || "Entrar";
    }
  });

  atualizarBotao();
  ligarAlternarSenha();
}

/* ===== Inicialização ===== */
document.addEventListener("DOMContentLoaded", iniciar);










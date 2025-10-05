// NeoRastro - Sistema de Rastreamento
// Frontend atualizado para Cloudflare Pages

document.addEventListener('DOMContentLoaded', function() {
    // Verificar se já está logado
    const token = localStorage.getItem('neorastro_token');
    if (token) {
        // Validar token e redirecionar se válido
        verificarToken(token);
    }
    
    // Configurar formulário de login
    const formLogin = document.getElementById('formLogin');
    if (formLogin) {
        formLogin.addEventListener('submit', realizarLogin);
    }
    
    // Links para outras páginas
    const linkCadastro = document.getElementById('linkCadastro');
    if (linkCadastro) {
        linkCadastro.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/cadastro.html';
        });
    }
});

async function realizarLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const btnLogin = document.getElementById('btnLogin');
    const mensagem = document.getElementById('mensagem');
    
    if (!email || !senha) {
        mostrarMensagem('Por favor, preencha todos os campos', 'erro');
        return;
    }
    
    // Desabilitar botão e mostrar loading
    btnLogin.disabled = true;
    btnLogin.textContent = 'Entrando...';
    mensagem.style.display = 'none';
    
    try {
        const response = await fetch('/api/usuarios', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'login',
                email: email,
                senha: senha
            })
        });
        
        const data = await response.json();
        
        if (response.ok && data.token) {
            // Login bem-sucedido
            localStorage.setItem('neorastro_token', data.token);
            localStorage.setItem('neorastro_usuario', JSON.stringify(data.usuario));
            
            mostrarMensagem('Login realizado com sucesso! Redirecionando...', 'sucesso');
            
            // Redirecionar após 1 segundo
            setTimeout(() => {
                window.location.href = '/painel.html';
            }, 1000);
            
        } else {
            // Erro no login
            mostrarMensagem(data.erro || 'Erro ao fazer login', 'erro');
        }
        
    } catch (error) {
        console.error('Erro no login:', error);
        mostrarMensagem('Erro de conexão. Tente novamente.', 'erro');
    } finally {
        // Reabilitar botão
        btnLogin.disabled = false;
        btnLogin.textContent = 'Entrar';
    }
}

async function verificarToken(token) {
    try {
        // Decodificar token simples (base64)
        const tokenData = JSON.parse(atob(token));
        
        // Verificar se não expirou (24 horas)
        const agora = Date.now();
        const tokenAge = agora - tokenData.timestamp;
        const umDiaEmMs = 24 * 60 * 60 * 1000; // 24 horas
        
        if (tokenAge > umDiaEmMs) {
            // Token expirado
            localStorage.removeItem('neorastro_token');
            localStorage.removeItem('neorastro_usuario');
            return;
        }
        
        // Token válido - redirecionar para painel
        window.location.href = '/painel.html';
        
    } catch (error) {
        // Token inválido - remover
        localStorage.removeItem('neorastro_token');
        localStorage.removeItem('neorastro_usuario');
    }
}

function mostrarMensagem(texto, tipo) {
    const mensagem = document.getElementById('mensagem');
    if (!mensagem) return;
    
    mensagem.textContent = texto;
    mensagem.className = `mensagem ${tipo}`;
    mensagem.style.display = 'block';
    
    // Auto-hide após 5 segundos se for sucesso
    if (tipo === 'sucesso') {
        setTimeout(() => {
            mensagem.style.display = 'none';
        }, 5000);
    }
}

// Função utilitária para logout
function logout() {
    localStorage.removeItem('neorastro_token');
    localStorage.removeItem('neorastro_usuario');
    window.location.href = '/login.html';
}

// Função para obter dados do usuário logado
function getUsuarioLogado() {
    const usuarioData = localStorage.getItem('neorastro_usuario');
    return usuarioData ? JSON.parse(usuarioData) : null;
}

// Função para obter token
function getToken() {
    return localStorage.getItem('neorastro_token');
}

// Verificar autenticação nas páginas protegidas
function verificarAutenticacao() {
    const token = getToken();
    const usuario = getUsuarioLogado();
    
    if (!token || !usuario) {
        window.location.href = '/login.html';
        return false;
    }
    
    return true;
}
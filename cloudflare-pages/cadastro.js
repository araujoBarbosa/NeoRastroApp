// NeoRastro - Sistema de Rastreamento
// Frontend de Cadastro atualizado para Cloudflare Pages

document.addEventListener('DOMContentLoaded', function() {
    // Verificar se já está logado
    const token = localStorage.getItem('neorastro_token');
    if (token) {
        window.location.href = '/painel.html';
        return;
    }
    
    // Configurar formulário de cadastro
    const formCadastro = document.getElementById('formCadastro');
    if (formCadastro) {
        formCadastro.addEventListener('submit', realizarCadastro);
    }
    
    // Links para outras páginas
    const linkLogin = document.getElementById('linkLogin');
    if (linkLogin) {
        linkLogin.addEventListener('click', (e) => {
            e.preventDefault();
            window.location.href = '/login.html';
        });
    }
});

async function realizarCadastro(event) {
    event.preventDefault();
    
    const nome = document.getElementById('nome').value;
    const email = document.getElementById('email').value;
    const senha = document.getElementById('senha').value;
    const confirmarSenha = document.getElementById('confirmarSenha').value;
    const btnCadastro = document.getElementById('btnCadastro');
    const mensagem = document.getElementById('mensagem');
    
    // Validações
    if (!nome || !email || !senha || !confirmarSenha) {
        mostrarMensagem('Por favor, preencha todos os campos', 'erro');
        return;
    }
    
    if (senha !== confirmarSenha) {
        mostrarMensagem('As senhas não coincidem', 'erro');
        return;
    }
    
    if (senha.length < 6) {
        mostrarMensagem('A senha deve ter pelo menos 6 caracteres', 'erro');
        return;
    }
    
    if (!isValidEmail(email)) {
        mostrarMensagem('Por favor, insira um email válido', 'erro');
        return;
    }
    
    // Desabilitar botão e mostrar loading
    btnCadastro.disabled = true;
    btnCadastro.textContent = 'Cadastrando...';
    mensagem.style.display = 'none';
    
    try {
        const response = await fetch('/api/usuarios', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                action: 'cadastro',
                nome: nome,
                email: email,
                senha: senha
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            // Cadastro bem-sucedido
            mostrarMensagem('Cadastro realizado com sucesso! Redirecionando para login...', 'sucesso');
            
            // Limpar formulário
            document.getElementById('formCadastro').reset();
            
            // Redirecionar após 2 segundos
            setTimeout(() => {
                window.location.href = '/login.html';
            }, 2000);
            
        } else {
            // Erro no cadastro
            mostrarMensagem(data.erro || 'Erro ao realizar cadastro', 'erro');
        }
        
    } catch (error) {
        console.error('Erro no cadastro:', error);
        mostrarMensagem('Erro de conexão. Tente novamente.', 'erro');
    } finally {
        // Reabilitar botão
        btnCadastro.disabled = false;
        btnCadastro.textContent = 'Cadastrar';
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

function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Validação em tempo real
document.addEventListener('DOMContentLoaded', function() {
    const senhaInput = document.getElementById('senha');
    const confirmarSenhaInput = document.getElementById('confirmarSenha');
    
    if (confirmarSenhaInput) {
        confirmarSenhaInput.addEventListener('input', function() {
            const senha = senhaInput.value;
            const confirmarSenha = this.value;
            
            if (confirmarSenha && senha !== confirmarSenha) {
                this.setCustomValidity('As senhas não coincidem');
                this.style.borderColor = '#ff4444';
            } else {
                this.setCustomValidity('');
                this.style.borderColor = '';
            }
        });
    }
    
    if (senhaInput) {
        senhaInput.addEventListener('input', function() {
            const senha = this.value;
            const strengthIndicator = document.getElementById('passwordStrength');
            
            if (strengthIndicator) {
                if (senha.length < 6) {
                    strengthIndicator.textContent = 'Senha muito fraca';
                    strengthIndicator.style.color = '#ff4444';
                } else if (senha.length < 8) {
                    strengthIndicator.textContent = 'Senha fraca';
                    strengthIndicator.style.color = '#ff8800';
                } else {
                    strengthIndicator.textContent = 'Senha forte';
                    strengthIndicator.style.color = '#44ff44';
                }
            }
        });
    }
});
// NeoRastro - Sistema de Rastreamento
// Frontend de Veículos atualizado para Cloudflare Pages

let usuario = null;

document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticação
    if (!verificarAutenticacao()) {
        return;
    }
    
    // Obter dados do usuário
    usuario = getUsuarioLogado();
    
    // Inicializar interface
    inicializarInterface();
    
    // Carregar lista de veículos
    carregarVeiculos();
});

function inicializarInterface() {
    // Exibir nome do usuário
    const nomeUsuario = document.getElementById('nomeUsuario');
    if (nomeUsuario && usuario) {
        nomeUsuario.textContent = usuario.nome;
    }
    
    // Configurar botões
    const btnLogout = document.getElementById('btnLogout');
    if (btnLogout) {
        btnLogout.addEventListener('click', logout);
    }
    
    const btnPainel = document.getElementById('btnPainel');
    if (btnPainel) {
        btnPainel.addEventListener('click', () => {
            window.location.href = '/painel.html';
        });
    }
    
    const btnAdicionarVeiculo = document.getElementById('btnAdicionarVeiculo');
    if (btnAdicionarVeiculo) {
        btnAdicionarVeiculo.addEventListener('click', mostrarFormularioCadastro);
    }
    
    // Configurar formulário de cadastro
    const formCadastroVeiculo = document.getElementById('formCadastroVeiculo');
    if (formCadastroVeiculo) {
        formCadastroVeiculo.addEventListener('submit', cadastrarVeiculo);
    }
    
    const btnCancelarCadastro = document.getElementById('btnCancelarCadastro');
    if (btnCancelarCadastro) {
        btnCancelarCadastro.addEventListener('click', ocultarFormularioCadastro);
    }
}

async function carregarVeiculos() {
    if (!usuario) return;
    
    const loadingDiv = document.getElementById('loading');
    if (loadingDiv) loadingDiv.style.display = 'block';
    
    try {
        const response = await fetch(`/api/veiculos?usuario_id=${usuario.id}`);
        const data = await response.json();
        
        if (response.ok) {
            exibirVeiculos(data.veiculos);
            atualizarEstatisticas(data.veiculos);
        } else {
            mostrarMensagem(data.erro || 'Erro ao carregar veículos', 'erro');
        }
    } catch (error) {
        console.error('Erro ao carregar veículos:', error);
        mostrarMensagem('Erro de conexão. Tente novamente.', 'erro');
    } finally {
        if (loadingDiv) loadingDiv.style.display = 'none';
    }
}

function exibirVeiculos(veiculos) {
    const listaVeiculos = document.getElementById('listaVeiculos');
    if (!listaVeiculos) return;
    
    listaVeiculos.innerHTML = '';
    
    if (veiculos.length === 0) {
        listaVeiculos.innerHTML = `
            <div class="veiculo-card vazio">
                <div class="veiculo-info">
                    <h3>Nenhum veículo cadastrado</h3>
                    <p>Clique em "Adicionar Veículo" para começar</p>
                </div>
            </div>
        `;
        return;
    }
    
    veiculos.forEach(veiculo => {
        const veiculoCard = document.createElement('div');
        veiculoCard.className = 'veiculo-card';
        veiculoCard.innerHTML = `
            <div class="veiculo-info">
                <h3>${veiculo.nome}</h3>
                <div class="detalhes">
                    <p><strong>Placa:</strong> ${veiculo.placa || 'Não informada'}</p>
                    <p><strong>IMEI:</strong> ${veiculo.imei}</p>
                    <p><strong>ID:</strong> #${veiculo.id}</p>
                </div>
            </div>
            <div class="veiculo-acoes">
                <button onclick="verVeiculoNoPainel(${veiculo.id})" class="btn-ver">
                    Ver no Painel
                </button>
                <button onclick="editarVeiculo(${veiculo.id})" class="btn-editar">
                    Editar
                </button>
                <button onclick="removerVeiculo(${veiculo.id}, '${veiculo.nome}')" class="btn-remover">
                    Remover
                </button>
            </div>
            <div class="veiculo-status">
                <span class="status-online">Online</span>
            </div>
        `;
        listaVeiculos.appendChild(veiculoCard);
    });
}

function atualizarEstatisticas(veiculos) {
    const totalVeiculos = document.getElementById('totalVeiculos');
    const veiculosOnline = document.getElementById('veiculosOnline');
    const veiculosOffline = document.getElementById('veiculosOffline');
    
    if (totalVeiculos) totalVeiculos.textContent = veiculos.length;
    if (veiculosOnline) veiculosOnline.textContent = veiculos.length; // Assumindo todos online por enquanto
    if (veiculosOffline) veiculosOffline.textContent = 0;
}

function mostrarFormularioCadastro() {
    const modalCadastro = document.getElementById('modalCadastro');
    if (modalCadastro) {
        modalCadastro.style.display = 'flex';
        document.getElementById('nomeVeiculo').focus();
    }
}

function ocultarFormularioCadastro() {
    const modalCadastro = document.getElementById('modalCadastro');
    if (modalCadastro) {
        modalCadastro.style.display = 'none';
        document.getElementById('formCadastroVeiculo').reset();
    }
}

async function cadastrarVeiculo(event) {
    event.preventDefault();
    
    const nome = document.getElementById('nomeVeiculo').value;
    const placa = document.getElementById('placaVeiculo').value;
    const imei = document.getElementById('imeiVeiculo').value;
    const btnCadastrar = document.getElementById('btnCadastrarVeiculo');
    
    if (!nome || !imei) {
        mostrarMensagem('Nome e IMEI são obrigatórios', 'erro');
        return;
    }
    
    if (imei.length !== 15) {
        mostrarMensagem('IMEI deve ter exatamente 15 dígitos', 'erro');
        return;
    }
    
    // Desabilitar botão
    btnCadastrar.disabled = true;
    btnCadastrar.textContent = 'Cadastrando...';
    
    try {
        const response = await fetch('/api/veiculos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                usuario_id: usuario.id,
                nome: nome,
                placa: placa || null,
                imei: imei
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarMensagem('Veículo cadastrado com sucesso!', 'sucesso');
            ocultarFormularioCadastro();
            carregarVeiculos(); // Recarregar lista
        } else {
            mostrarMensagem(data.erro || 'Erro ao cadastrar veículo', 'erro');
        }
        
    } catch (error) {
        console.error('Erro ao cadastrar veículo:', error);
        mostrarMensagem('Erro de conexão. Tente novamente.', 'erro');
    } finally {
        btnCadastrar.disabled = false;
        btnCadastrar.textContent = 'Cadastrar';
    }
}

async function removerVeiculo(veiculoId, nomeVeiculo) {
    if (!confirm(`Tem certeza que deseja remover o veículo "${nomeVeiculo}"?\n\nEsta ação não pode ser desfeita.`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/veiculos?veiculo_id=${veiculoId}&usuario_id=${usuario.id}`, {
            method: 'DELETE'
        });
        
        const data = await response.json();
        
        if (response.ok) {
            mostrarMensagem('Veículo removido com sucesso!', 'sucesso');
            carregarVeiculos(); // Recarregar lista
        } else {
            mostrarMensagem(data.erro || 'Erro ao remover veículo', 'erro');
        }
        
    } catch (error) {
        console.error('Erro ao remover veículo:', error);
        mostrarMensagem('Erro de conexão. Tente novamente.', 'erro');
    }
}

function editarVeiculo(veiculoId) {
    // Por enquanto, redirecionar para uma página de edição ou abrir modal
    alert('Funcionalidade de edição em desenvolvimento');
}

function verVeiculoNoPainel(veiculoId) {
    // Salvar ID do veículo selecionado e redirecionar
    localStorage.setItem('veiculo_selecionado', veiculoId);
    window.location.href = '/painel.html';
}

function mostrarMensagem(texto, tipo) {
    const mensagem = document.getElementById('mensagem');
    if (!mensagem) {
        // Criar elemento de mensagem se não existir
        const novoElemento = document.createElement('div');
        novoElemento.id = 'mensagem';
        novoElemento.className = 'mensagem';
        document.body.appendChild(novoElemento);
    }
    
    const elementoMensagem = document.getElementById('mensagem');
    elementoMensagem.textContent = texto;
    elementoMensagem.className = `mensagem ${tipo}`;
    elementoMensagem.style.display = 'block';
    
    // Auto-hide após 5 segundos
    setTimeout(() => {
        elementoMensagem.style.display = 'none';
    }, 5000);
}

// Validação de IMEI em tempo real
document.addEventListener('DOMContentLoaded', function() {
    const imeiInput = document.getElementById('imeiVeiculo');
    if (imeiInput) {
        imeiInput.addEventListener('input', function() {
            const imei = this.value.replace(/\D/g, ''); // Remove non-digits
            this.value = imei;
            
            const feedback = document.getElementById('imeiFeedback');
            if (feedback) {
                if (imei.length === 0) {
                    feedback.textContent = '';
                } else if (imei.length < 15) {
                    feedback.textContent = `IMEI deve ter 15 dígitos (${imei.length}/15)`;
                    feedback.style.color = '#ff8800';
                } else if (imei.length === 15) {
                    feedback.textContent = 'IMEI válido ✓';
                    feedback.style.color = '#44ff44';
                } else {
                    feedback.textContent = 'IMEI muito longo';
                    feedback.style.color = '#ff4444';
                    this.value = imei.substring(0, 15);
                }
            }
        });
    }
});

// Funções auxiliares (importadas do login.js)
function verificarAutenticacao() {
    const token = localStorage.getItem('neorastro_token');
    const usuario = getUsuarioLogado();
    
    if (!token || !usuario) {
        window.location.href = '/login.html';
        return false;
    }
    
    return true;
}

function getUsuarioLogado() {
    const usuarioData = localStorage.getItem('neorastro_usuario');
    return usuarioData ? JSON.parse(usuarioData) : null;
}

function logout() {
    localStorage.removeItem('neorastro_token');
    localStorage.removeItem('neorastro_usuario');
    window.location.href = '/login.html';
}
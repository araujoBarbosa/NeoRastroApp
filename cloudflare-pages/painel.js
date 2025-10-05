// NeoRastro - Sistema de Rastreamento
// Frontend do Painel atualizado para Cloudflare Pages

let mapInstance = null;
let markersLayer = null;
let usuario = null;
let veiculoSelecionado = null;

document.addEventListener('DOMContentLoaded', function() {
    // Verificar autenticação
    if (!verificarAutenticacao()) {
        return;
    }
    
    // Obter dados do usuário
    usuario = getUsuarioLogado();
    
    // Inicializar interface
    inicializarInterface();
    
    // Carregar dados iniciais
    carregarVeiculos();
    
    // Configurar atualizações automáticas
    setInterval(atualizarPosicoes, 30000); // Atualizar a cada 30 segundos
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
    
    const btnMeusVeiculos = document.getElementById('btnMeusVeiculos');
    if (btnMeusVeiculos) {
        btnMeusVeiculos.addEventListener('click', () => {
            window.location.href = '/meus-veiculos.html';
        });
    }
    
    // Inicializar mapa
    inicializarMapa();
}

function inicializarMapa() {
    try {
        // Verificar se Leaflet está disponível
        if (typeof L === 'undefined') {
            console.error('Leaflet não encontrado');
            return;
        }
        
        // Criar mapa centrado em São Paulo
        mapInstance = L.map('mapa').setView([-23.5505, -46.6333], 12);
        
        // Adicionar camada de tiles
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors'
        }).addTo(mapInstance);
        
        // Criar camada para marcadores
        markersLayer = L.layerGroup().addTo(mapInstance);
        
        console.log('Mapa inicializado com sucesso');
    } catch (error) {
        console.error('Erro ao inicializar mapa:', error);
    }
}

async function carregarVeiculos() {
    if (!usuario) return;
    
    try {
        const response = await fetch(`/api/veiculos?usuario_id=${usuario.id}`);
        const data = await response.json();
        
        if (response.ok) {
            exibirVeiculos(data.veiculos);
            if (data.veiculos.length > 0) {
                // Carregar posições do primeiro veículo por padrão
                veiculoSelecionado = data.veiculos[0];
                carregarPosicoes(data.veiculos[0].id);
            }
        } else {
            console.error('Erro ao carregar veículos:', data.erro);
        }
    } catch (error) {
        console.error('Erro ao carregar veículos:', error);
    }
}

function exibirVeiculos(veiculos) {
    const listaVeiculos = document.getElementById('listaVeiculos');
    if (!listaVeiculos) return;
    
    listaVeiculos.innerHTML = '';
    
    if (veiculos.length === 0) {
        listaVeiculos.innerHTML = `
            <div class="veiculo-item">
                <p>Nenhum veículo cadastrado</p>
                <button onclick="window.location.href='/meus-veiculos.html'">
                    Cadastrar Veículo
                </button>
            </div>
        `;
        return;
    }
    
    veiculos.forEach(veiculo => {
        const veiculoDiv = document.createElement('div');
        veiculoDiv.className = 'veiculo-item';
        veiculoDiv.innerHTML = `
            <div class="veiculo-info">
                <h3>${veiculo.nome}</h3>
                <p>Placa: ${veiculo.placa || 'Não informada'}</p>
                <p>IMEI: ${veiculo.imei}</p>
            </div>
            <div class="veiculo-acoes">
                <button onclick="selecionarVeiculo(${veiculo.id}, '${veiculo.nome}')">
                    Ver no Mapa
                </button>
                <button onclick="enviarComando(${veiculo.id}, 'BLOQUEIO')" class="btn-bloquear">
                    Bloquear
                </button>
                <button onclick="enviarComando(${veiculo.id}, 'DESBLOQUEIO')" class="btn-desbloquear">
                    Desbloquear
                </button>
            </div>
        `;
        listaVeiculos.appendChild(veiculoDiv);
    });
}

async function selecionarVeiculo(veiculoId, nomeVeiculo) {
    veiculoSelecionado = { id: veiculoId, nome: nomeVeiculo };
    await carregarPosicoes(veiculoId);
    
    // Destacar veículo selecionado
    document.querySelectorAll('.veiculo-item').forEach(item => {
        item.classList.remove('selecionado');
    });
    event.target.closest('.veiculo-item').classList.add('selecionado');
}

async function carregarPosicoes(veiculoId) {
    if (!usuario || !mapInstance) return;
    
    try {
        const response = await fetch(`/api/posicoes?veiculo_id=${veiculoId}&usuario_id=${usuario.id}&limite=50`);
        const data = await response.json();
        
        if (response.ok) {
            exibirPosicoesNoMapa(data.posicoes);
            atualizarInfoVeiculo(data);
        } else {
            console.error('Erro ao carregar posições:', data.erro);
        }
    } catch (error) {
        console.error('Erro ao carregar posições:', error);
    }
}

function exibirPosicoesNoMapa(posicoes) {
    if (!mapInstance || !markersLayer) return;
    
    // Limpar marcadores existentes
    markersLayer.clearLayers();
    
    if (posicoes.length === 0) {
        alert('Nenhuma posição encontrada para este veículo');
        return;
    }
    
    // Adicionar marcadores
    const pontos = [];
    posicoes.forEach((posicao, index) => {
        const lat = parseFloat(posicao.latitude);
        const lng = parseFloat(posicao.longitude);
        
        if (isNaN(lat) || isNaN(lng)) return;
        
        pontos.push([lat, lng]);
        
        // Criar marcador
        const icone = index === 0 ? 'red' : 'blue'; // Primeira posição (mais recente) em vermelho
        const marker = L.marker([lat, lng]).addTo(markersLayer);
        
        // Popup com informações
        marker.bindPopup(`
            <div>
                <strong>${veiculoSelecionado?.nome || 'Veículo'}</strong><br>
                Data: ${new Date(posicao.data_hora).toLocaleString('pt-BR')}<br>
                Velocidade: ${posicao.velocidade || 0} km/h<br>
                Evento: ${posicao.evento || 'N/A'}
            </div>
        `);
    });
    
    // Ajustar zoom para mostrar todas as posições
    if (pontos.length > 0) {
        const grupo = new L.featureGroup(markersLayer.getLayers());
        mapInstance.fitBounds(grupo.getBounds().pad(0.1));
    }
}

function atualizarInfoVeiculo(data) {
    const infoVeiculo = document.getElementById('infoVeiculo');
    if (!infoVeiculo || !data.posicoes || data.posicoes.length === 0) return;
    
    const ultimaPosicao = data.posicoes[0]; // Primeira posição é a mais recente
    
    infoVeiculo.innerHTML = `
        <h3>${veiculoSelecionado?.nome || 'Veículo Selecionado'}</h3>
        <p><strong>Última atualização:</strong> ${new Date(ultimaPosicao.data_hora).toLocaleString('pt-BR')}</p>
        <p><strong>Velocidade:</strong> ${ultimaPosicao.velocidade || 0} km/h</p>
        <p><strong>Status:</strong> ${ultimaPosicao.evento || 'Ativo'}</p>
        <p><strong>Total de posições:</strong> ${data.total}</p>
    `;
}

async function enviarComando(veiculoId, tipo) {
    if (!usuario) return;
    
    const motivo = prompt(`Motivo para ${tipo.toLowerCase()}:`);
    if (!motivo) return;
    
    try {
        const response = await fetch('/api/comandos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                veiculo_id: veiculoId,
                usuario_id: usuario.id,
                tipo: tipo,
                motivo: motivo
            })
        });
        
        const data = await response.json();
        
        if (response.ok) {
            alert(`Comando ${tipo} enviado com sucesso!`);
            carregarComandos(); // Atualizar lista de comandos
        } else {
            alert(data.erro || `Erro ao enviar comando ${tipo}`);
        }
    } catch (error) {
        console.error('Erro ao enviar comando:', error);
        alert('Erro de conexão. Tente novamente.');
    }
}

async function carregarComandos() {
    if (!usuario) return;
    
    try {
        const response = await fetch(`/api/comandos?usuario_id=${usuario.id}&limite=10`);
        const data = await response.json();
        
        if (response.ok) {
            exibirComandos(data.comandos);
        }
    } catch (error) {
        console.error('Erro ao carregar comandos:', error);
    }
}

function exibirComandos(comandos) {
    const listaComandos = document.getElementById('listaComandos');
    if (!listaComandos) return;
    
    listaComandos.innerHTML = '';
    
    if (comandos.length === 0) {
        listaComandos.innerHTML = '<p>Nenhum comando encontrado</p>';
        return;
    }
    
    comandos.forEach(comando => {
        const comandoDiv = document.createElement('div');
        comandoDiv.className = `comando-item status-${comando.status}`;
        comandoDiv.innerHTML = `
            <div>
                <strong>${comando.tipo}</strong> - ${comando.veiculo_nome}
                <span class="status">${comando.status.toUpperCase()}</span>
            </div>
            <div class="comando-detalhes">
                <small>
                    ${new Date(comando.data_hora).toLocaleString('pt-BR')} - 
                    ${comando.motivo || 'Sem motivo'}
                </small>
            </div>
        `;
        listaComandos.appendChild(comandoDiv);
    });
}

async function atualizarPosicoes() {
    if (veiculoSelecionado) {
        await carregarPosicoes(veiculoSelecionado.id);
    }
}

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
-- Script de criação do banco de dados NeoRastro para Cloudflare D1
-- Execute este script no Query Editor do D1 no painel da Cloudflare

-- Tabela de Usuários
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    status TEXT DEFAULT 'ativo', -- ativo | bloqueado | pendente
    criado_em TEXT DEFAULT (datetime('now')),
    atualizado_em TEXT DEFAULT (datetime('now'))
);

-- Tabela de Veículos
CREATE TABLE IF NOT EXISTS veiculos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    nome TEXT NOT NULL,
    placa TEXT,
    imei TEXT UNIQUE NOT NULL,
    criado_em TEXT DEFAULT (datetime('now')),
    atualizado_em TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- Tabela de Posições (enviadas pelo rastreador)
CREATE TABLE IF NOT EXISTS posicoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    imei TEXT NOT NULL,
    data_hora TEXT NOT NULL DEFAULT (datetime('now')),
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    velocidade REAL DEFAULT 0,
    evento TEXT,
    criado_em TEXT DEFAULT (datetime('now'))
);

-- Tabela de Comandos (bloqueio/desbloqueio)
CREATE TABLE IF NOT EXISTS comandos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    veiculo_id INTEGER NOT NULL,
    tipo TEXT NOT NULL, -- BLOQUEIO ou DESBLOQUEIO
    status TEXT DEFAULT 'pendente', -- pendente | enviado | concluido | erro
    motivo TEXT,
    data_hora TEXT DEFAULT (datetime('now')),
    processado_em TEXT,
    FOREIGN KEY (veiculo_id) REFERENCES veiculos(id) ON DELETE CASCADE
);

-- Tabela de IMEIs Autorizados (opcional, para controle de segurança)
CREATE TABLE IF NOT EXISTS imeis_autorizados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    imei TEXT UNIQUE NOT NULL,
    descricao TEXT,
    autorizado_em TEXT DEFAULT (datetime('now')),
    autorizado_por TEXT -- email do admin que autorizou
);

-- Índices para melhorar performance
CREATE INDEX IF NOT EXISTS idx_usuarios_email ON usuarios(email);
CREATE INDEX IF NOT EXISTS idx_veiculos_usuario_id ON veiculos(usuario_id);
CREATE INDEX IF NOT EXISTS idx_veiculos_imei ON veiculos(imei);
CREATE INDEX IF NOT EXISTS idx_posicoes_imei ON posicoes(imei);
CREATE INDEX IF NOT EXISTS idx_posicoes_data_hora ON posicoes(data_hora);
CREATE INDEX IF NOT EXISTS idx_comandos_veiculo_id ON comandos(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_comandos_status ON comandos(status);

-- Inserir dados de teste (opcional)
-- Usuário admin de teste
INSERT OR IGNORE INTO usuarios (nome, email, senha, status) 
VALUES ('Admin NeoRastro', 'admin@neorastro.cloud', 'YWRtaW4xMjM=', 'ativo');

-- Veículo de teste
INSERT OR IGNORE INTO veiculos (usuario_id, nome, placa, imei) 
VALUES (1, 'Veículo Teste', 'ABC-1234', '123456789012345');

-- Posições de teste
INSERT OR IGNORE INTO posicoes (imei, latitude, longitude, velocidade, evento) 
VALUES 
('123456789012345', -23.5505, -46.6333, 60, 'GPS_ATIVO'),
('123456789012345', -23.5515, -46.6343, 55, 'MOVIMENTO'),
('123456789012345', -23.5525, -46.6353, 0, 'PARADO');

-- Comando de teste
INSERT OR IGNORE INTO comandos (veiculo_id, tipo, status, motivo) 
VALUES (1, 'BLOQUEIO', 'pendente', 'Teste de bloqueio');

-- IMEI autorizado
INSERT OR IGNORE INTO imeis_autorizados (imei, descricao, autorizado_por) 
VALUES ('123456789012345', 'Dispositivo de teste', 'admin@neorastro.cloud');

-- Views úteis para consultas complexas
CREATE VIEW IF NOT EXISTS view_veiculos_completa AS
SELECT 
    v.id,
    v.nome,
    v.placa,
    v.imei,
    u.nome as usuario_nome,
    u.email as usuario_email,
    v.criado_em
FROM veiculos v
JOIN usuarios u ON v.usuario_id = u.id;

CREATE VIEW IF NOT EXISTS view_ultima_posicao AS
SELECT 
    v.id as veiculo_id,
    v.nome as veiculo_nome,
    v.placa,
    v.imei,
    p.latitude,
    p.longitude,
    p.velocidade,
    p.evento,
    p.data_hora as ultima_atualizacao
FROM veiculos v
LEFT JOIN posicoes p ON v.imei = p.imei
WHERE p.id = (
    SELECT MAX(id) 
    FROM posicoes p2 
    WHERE p2.imei = v.imei
);

-- Triggers para atualizar timestamp automaticamente
CREATE TRIGGER IF NOT EXISTS trigger_usuarios_update
    AFTER UPDATE ON usuarios
    FOR EACH ROW
BEGIN
    UPDATE usuarios 
    SET atualizado_em = datetime('now') 
    WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS trigger_veiculos_update
    AFTER UPDATE ON veiculos
    FOR EACH ROW
BEGIN
    UPDATE veiculos 
    SET atualizado_em = datetime('now') 
    WHERE id = NEW.id;
END;

-- Verificação final
SELECT 'Banco NeoRastro criado com sucesso!' as status,
       (SELECT COUNT(*) FROM usuarios) as total_usuarios,
       (SELECT COUNT(*) FROM veiculos) as total_veiculos,
       (SELECT COUNT(*) FROM posicoes) as total_posicoes,
       (SELECT COUNT(*) FROM comandos) as total_comandos;
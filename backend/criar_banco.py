import sqlite3

conn = sqlite3.connect("banco.db")
cursor = conn.cursor()

# ---------------------------
# Tabela de Usuários
# ---------------------------
cursor.execute("""
CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nome TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    senha TEXT NOT NULL,
    status TEXT DEFAULT 'ativo' -- ativo | bloqueado | pendente
)
""")

# ---------------------------
# Tabela de Posições (rastreadores)
# ---------------------------
cursor.execute("""
CREATE TABLE IF NOT EXISTS posicoes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    imei TEXT NOT NULL,
    timestamp TEXT NOT NULL,
    latitude REAL NOT NULL,
    longitude REAL NOT NULL,
    velocidade REAL,
    evento INTEGER
)
""")

# ---------------------------
# Tabela de Veículos
# ---------------------------
cursor.execute("""
CREATE TABLE IF NOT EXISTS veiculos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    usuario_id INTEGER NOT NULL,
    nome TEXT NOT NULL,
    placa TEXT,
    imei TEXT UNIQUE NOT NULL,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
)
""")

# ---------------------------
# Tabela de IMEIs autorizados
# ---------------------------
cursor.execute("""
CREATE TABLE IF NOT EXISTS imeis_autorizados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    imei TEXT UNIQUE NOT NULL
)
""")

# ---------------------------
# Tabela de Comandos (bloqueio/desbloqueio)
# ---------------------------
cursor.execute("""
CREATE TABLE IF NOT EXISTS comandos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    veiculo_id INTEGER NOT NULL,
    tipo TEXT NOT NULL,
    status TEXT NOT NULL,
    motivo TEXT,
    criado_em TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (veiculo_id) REFERENCES veiculos(id)
)
""")

conn.commit()
conn.close()
print("Banco criado/atualizado com sucesso ✅")

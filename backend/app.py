# ---------------------------
# Imports
# ---------------------------
from flask import Flask, request, jsonify, render_template
import sqlite3
import bcrypt
import jwt
import datetime
import secrets
from flask_cors import CORS

# ---------------------------
# Configurações
# ---------------------------
CHAVE_SECRETA = secrets.token_hex(32)  # chave secreta segura
ARQUIVO_BANCO = "banco.db"

# ---------------------------
# Inicialização do Flask
# ---------------------------
app = Flask(__name__, template_folder="templates", static_folder="static")
CORS(app)

# ---------------------------
# Funções auxiliares
# ---------------------------
def get_conexao():
    conn = sqlite3.connect(ARQUIVO_BANCO)
    conn.row_factory = sqlite3.Row
    return conn

def autenticar(request):
    cabecalho_auth = request.headers.get("Authorization")
    if not cabecalho_auth:
        return None
    try:
        token = cabecalho_auth.split(" ")[1]
        payload = jwt.decode(token, CHAVE_SECRETA, algorithms=["HS256"])
        return payload
    except Exception:
        return None

def inicializar_banco():
    conn = get_conexao()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS usuarios (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            nome TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            senha TEXT NOT NULL,
            status TEXT DEFAULT 'ativo'
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS veiculos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            usuario_id INTEGER NOT NULL,
            modelo TEXT,
            placa TEXT,
            imei TEXT UNIQUE NOT NULL,
            FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
        )
    """)

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS imeis_autorizados (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            imei TEXT UNIQUE NOT NULL
        )
    """)

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

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS posicoes (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            imei TEXT NOT NULL,
            timestamp TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            velocidade REAL,
            evento TEXT
        )
    """)

    conn.commit()
    conn.close()

# ---------------------------
# Rotas de Páginas (Frontend)
# ---------------------------
@app.route("/")
def index():
    return render_template("login.html")

@app.route("/login", methods=["GET"])
def login_page():
    return render_template("login.html")

@app.route("/cadastro", methods=["GET"])
def cadastro_page():
    return render_template("cadastro.html")

@app.route("/painel", methods=["GET"])
def painel_page():
    return render_template("painel.html")

@app.route("/meus-veiculos", methods=["GET"])
def meus_veiculos_page():
    return render_template("meus-veiculos.html")

# ---------------------------
# Rota de teste
# ---------------------------
@app.route("/ping", methods=["GET"])
def ping():
    return jsonify({"mensagem": "Servidor rodando com sucesso!"})

# ---------------------------
# Rotas de Usuários (API)
# ---------------------------
@app.route("/cadastro", methods=["POST"])
def cadastro():
    dados = request.json
    nome = dados.get("nome")
    email = dados.get("email")
    senha = dados.get("senha")

    if not nome or not email or not senha:
        return jsonify({"erro": "Preencha todos os campos obrigatórios."}), 400

    senha_hash = bcrypt.hashpw(senha.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

    conn = get_conexao()
    cursor = conn.cursor()

    try:
        cursor.execute(
            "INSERT INTO usuarios (nome, email, senha, status) VALUES (?, ?, ?, 'ativo')",
            (nome, email, senha_hash)
        )
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"erro": "E-mail já cadastrado."}), 400

    conn.close()
    return jsonify({"mensagem": "Usuário cadastrado com sucesso!"}), 201

@app.route("/login", methods=["POST"])
def login():
    dados = request.json
    email = dados.get("email")
    senha = dados.get("senha")

    conn = get_conexao()
    cursor = conn.cursor()
    cursor.execute("SELECT * FROM usuarios WHERE email = ?", (email,))
    usuario = cursor.fetchone()
    conn.close()

    if not usuario:
        return jsonify({"erro": "Usuário não encontrado."}), 401

    if not bcrypt.checkpw(senha.encode("utf-8"), usuario["senha"].encode("utf-8")):
        return jsonify({"erro": "Senha incorreta."}), 401

    if usuario["status"] != "ativo":
        return jsonify({"erro": "Conta bloqueada ou pendente."}), 403

    payload = {
        "id": usuario["id"],
        "email": usuario["email"],
        "exp": datetime.datetime.utcnow() + datetime.timedelta(hours=2)
    }
    token = jwt.encode(payload, CHAVE_SECRETA, algorithm="HS256")
    if isinstance(token, bytes):
        token = token.decode("utf-8")

    return jsonify({"mensagem": "Login realizado com sucesso!", "token": token})

# ---------------------------
# Rotas de Veículos
# ---------------------------
@app.route("/veiculos", methods=["GET"])
def listar_veiculos():
    usuario = autenticar(request)
    if not usuario:
        return jsonify({"erro": "Token inválido ou expirado"}), 401

    conn = get_conexao()
    cursor = conn.cursor()
    cursor.execute("SELECT id, modelo, placa, imei FROM veiculos WHERE usuario_id = ?", (usuario["id"],))
    veiculos = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return jsonify(veiculos)

@app.route("/veiculos", methods=["POST"])
def adicionar_veiculo():
    usuario = autenticar(request)
    if not usuario:
        return jsonify({"erro": "Token inválido ou expirado"}), 401

    dados = request.json
    modelo = dados.get("modelo")
    placa = dados.get("placa")
    imei = dados.get("imei")

    if not imei:
        return jsonify({"erro": "IMEI do rastreador é obrigatório."}), 400

    conn = get_conexao()
    cursor = conn.cursor()

    cursor.execute("SELECT id FROM imeis_autorizados WHERE imei = ?", (imei,))
    autorizado = cursor.fetchone()
    if not autorizado:
        conn.close()
        return jsonify({"erro": "Este rastreador não está autorizado."}), 403

    try:
        cursor.execute(
            "INSERT INTO veiculos (usuario_id, modelo, placa, imei) VALUES (?, ?, ?, ?)",
            (usuario["id"], modelo, placa, imei)
        )
        conn.commit()
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"erro": "Este rastreador já está cadastrado em outro veículo."}), 400

    conn.close()
    return jsonify({"mensagem": "Veículo adicionado com sucesso"}), 201

@app.route("/veiculos/<int:veiculo_id>", methods=["DELETE"])
def remover_veiculo(veiculo_id):
    usuario = autenticar(request)
    if not usuario:
        return jsonify({"erro": "Token inválido ou expirado"}), 401

    conn = get_conexao()
    cursor = conn.cursor()
    cursor.execute("DELETE FROM veiculos WHERE id = ? AND usuario_id = ?", (veiculo_id, usuario["id"]))
    conn.commit()
    conn.close()

    return jsonify({"mensagem": "Veículo removido com sucesso"})

# ---------------------------
# Rotas de Comandos
# ---------------------------
@app.route("/veiculos/<int:veiculo_id>/comando", methods=["POST"])
def criar_comando(veiculo_id):
    usuario = autenticar(request)
    if not usuario:
        return jsonify({"erro": "Token inválido ou expirado"}), 401

    dados = request.json
    tipo = (dados.get("tipo") or "").upper()
    motivo = dados.get("motivo", "")

    if tipo not in ("BLOQUEIO", "DESBLOQUEIO"):
        return jsonify({"erro": "Tipo de comando inválido"}), 400

    conn = get_conexao()
    cursor = conn.cursor()
    cursor.execute("SELECT id FROM veiculos WHERE id=? AND usuario_id=?", (veiculo_id, usuario["id"]))
    veiculo = cursor.fetchone()
    if not veiculo:
        conn.close()
        return jsonify({"erro": "Veículo não encontrado"}), 404

    cursor.execute(
        "INSERT INTO comandos (veiculo_id, tipo, status, motivo) VALUES (?, ?, 'PENDENTE', ?)",
        (veiculo_id, tipo, motivo)
    )
    conn.commit()
    comando_id = cursor.lastrowid
    conn.close()

    return jsonify({"mensagem": "Comando criado com sucesso", "comando_id": comando_id}), 201

@app.route("/comandos", methods=["GET"])
def listar_comandos():
    usuario = autenticar(request)
    if not usuario:
        return jsonify({"erro": "Token inválido ou expirado"}), 401

    conn = get_conexao()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT c.id, c.tipo, c.status, c.criado_em, v.modelo, v.placa
        FROM comandos c
        JOIN veiculos v ON v.id = c.veiculo_id
        WHERE v.usuario_id = ?
        ORDER BY c.id DESC
    """, (usuario["id"],))
    comandos = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return jsonify(comandos)

# ---------------------------
# Rotas de Posições
# ---------------------------
@app.route("/posicoes", methods=["POST"])
def salvar_posicao():
    dados = request.json
    imei = dados.get("imei")
    latitude = dados.get("latitude")
    longitude = dados.get("longitude")
    velocidade = dados.get("velocidade")
    evento = dados.get("evento")
    timestamp = dados.get("timestamp") or datetime.datetime.utcnow().isoformat()

    if not imei or latitude is None or longitude is None:
        return jsonify({"erro": "Campos obrigatórios: imei, latitude, longitude"}), 400

    conn = get_conexao()
    cursor = conn.cursor()
    cursor.execute(
        "INSERT INTO posicoes (imei, timestamp, latitude, longitude, velocidade, evento) VALUES (?, ?, ?, ?, ?, ?)",
        (imei, timestamp, latitude, longitude, velocidade, evento)
    )
    conn.commit()
    conn.close()

    return jsonify({"mensagem": "Posição salva com sucesso"}), 201

@app.route("/posicoes/<int:veiculo_id>", methods=["GET"])
def listar_posicoes(veiculo_id):
    usuario = autenticar(request)
    if not usuario:
        return jsonify({"erro": "Token inválido ou expirado"}), 401

    limite = int(request.args.get("limite", 50))

    conn = get_conexao()
    cursor = conn.cursor()
    cursor.execute("SELECT imei FROM veiculos WHERE id=? AND usuario_id=?", (veiculo_id, usuario["id"]))
    veiculo = cursor.fetchone()
    if not veiculo:
        conn.close()
        return jsonify({"erro": "Veículo não encontrado"}), 404

    imei = veiculo["imei"]
    cursor.execute("""
        SELECT id, imei, timestamp, latitude, longitude, velocidade, evento
        FROM posicoes
        WHERE imei = ?
        ORDER BY id DESC
        LIMIT ?
    """, (imei, limite))
    posicoes = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return jsonify(posicoes)

# ---------------------------
# Inicialização do servidor
# ---------------------------
inicializar_banco()

if __name__ == '__main__':
    app.run(debug=False, host='0.0.0.0', port=5000)

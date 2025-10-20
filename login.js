from flask import Flask, request, jsonify
from flask_cors import CORS
import mysql.connector
import bcrypt
import jwt
from datetime import datetime, timedelta

app = Flask(__name__)

# ✅ Permitir que o frontend (https://neorastro.cloud) acesse a API com segurança
CORS(app, resources={r"/*": {"origins": "https://neorastro.cloud"}})

# 🔑 Chave secreta para geração de tokens (não altere se já tiver uma configurada)
app.config['SECRET_KEY'] = 'sua_chave_super_secreta_aqui'

# =====================================================
# 🏠 Rota principal
@app.route('/')
def index():
    return 'API NeoRastro rodando com sucesso!'

# =====================================================
# 🔍 Teste de status (para ver se a API está online)
@app.route('/ping')
def ping():
    return jsonify({'status': 'ok'})

# =====================================================
# 🔐 Login de usuários
@app.route('/login', methods=['POST'])
def login():
    dados = request.get_json()
    email = dados.get('email')
    senha = dados.get('senha')

    if not email or not senha:
        return jsonify({'erro': 'Preencha todos os campos!'}), 400

    try:
        conexao = mysql.connector.connect(
            host="localhost",
            user="neorastro_user",
            password="Jad123456789son@",
            database="neorastro_db"
        )
        cursor = conexao.cursor(dictionary=True)
        cursor.execute("SELECT * FROM usuarios WHERE email = %s", (email,))
        usuario = cursor.fetchone()
        conexao.close()

        if not usuario or not bcrypt.checkpw(senha.encode('utf-8'), usuario['senha'].encode('utf-8')):
            return jsonify({'erro': 'E-mail ou senha incorretos!'}), 401

        token = jwt.encode({
            'id': usuario['id'],
            'exp': datetime.utcnow() + timedelta(hours=12)
        }, app.config['SECRET_KEY'], algorithm='HS256')

        return jsonify({'mensagem': 'Login bem-sucedido!', 'token': token, 'usuario': usuario})

    except Exception as e:
        return jsonify({'erro': f'Erro interno: {str(e)}'}), 500

# =====================================================
# 📝 Cadastro de usuários
@app.route('/cadastrar', methods=['POST'])
def cadastrar():
    try:
        dados = request.get_json() or request.form
        nome = dados.get('nome')
        email = dados.get('email')
        senha = dados.get('senha')

        if not nome or not email or not senha:
            return jsonify({'erro': 'Preencha todos os campos!'}), 400

        senha_hash = bcrypt.hashpw(senha.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

        conexao = mysql.connector.connect(
            host="localhost",
            user="neorastro_user",
            password="Jad123456789son@",
            database="neorastro_db"
        )
        cursor = conexao.cursor()
        cursor.execute("INSERT INTO usuarios (nome, email, senha, status) VALUES (%s, %s, %s, %s)",
                       (nome, email, senha_hash, 'pendente'))
        conexao.commit()
        conexao.close()

        return jsonify({'mensagem': 'Cadastro recebido com sucesso!'})

    except Exception as e:
        return jsonify({'erro': f'Erro interno: {str(e)}'}), 500


# =====================================================
# 🚀 Inicialização do servidor Flask
if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)





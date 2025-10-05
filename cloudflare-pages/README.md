# NeoRastro - Sistema de Rastreamento
Sistema de rastreamento veicular desenvolvido para Cloudflare Pages com banco D1.

## 🚀 Tecnologias Utilizadas
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Backend**: Cloudflare Functions (TypeScript)
- **Banco de Dados**: Cloudflare D1 (SQLite)
- **Mapas**: Leaflet.js
- **Hospedagem**: Cloudflare Pages

## 📁 Estrutura do Projeto
```
neorastro/
├── index.html              # Página inicial (redireciona para login)
├── login.html              # Página de login
├── cadastro.html           # Página de cadastro
├── painel.html             # Painel principal com mapa
├── meus-veiculos.html      # Gerenciamento de veículos
├── estilo.css              # Estilos CSS
├── login.js                # JavaScript do login
├── cadstro.js              # JavaScript do cadastro
├── painel.js               # JavaScript do painel
├── meus-veiculos.js        # JavaScript dos veículos
├── database-schema.sql     # Schema do banco D1
├── wrangler.toml           # Configuração Cloudflare
├── package.json            # Dependências do projeto
└── functions/
    └── api/
        ├── teste.ts        # Rota de teste
        ├── usuarios.ts     # Login e cadastro
        ├── veiculos.ts     # CRUD de veículos
        ├── posicoes.ts     # Posições GPS
        └── comandos.ts     # Comandos de bloqueio
```

## 🔧 Instalação no Cloudflare Pages

### 1. **Criar conta no Cloudflare**
- Acesse [Cloudflare](https://cloudflare.com)
- Crie uma conta gratuita

### 2. **Configurar D1 Database**
```bash
# Instalar Wrangler CLI
npm install -g wrangler

# Fazer login
wrangler login

# Criar banco D1
wrangler d1 create neorastro-db
```

### 3. **Configurar o projeto**
1. Faça upload dos arquivos para um repositório GitHub
2. No painel Cloudflare, vá em **Pages** → **Create a project**
3. Conecte seu repositório GitHub
4. Configure as variáveis:
   - Build command: `echo "Build completed"`
   - Build output directory: `/`
   - Root directory: `/`

### 4. **Configurar D1 Binding**
1. No painel do Pages, vá em **Settings** → **Functions**
2. Adicione D1 database binding:
   - Variable name: `DB`
   - D1 database: selecione o banco criado

### 5. **Executar SQL Schema**
1. No painel D1, vá no seu banco de dados
2. Clique em **Query editor**
3. Cole o conteúdo do arquivo `database-schema.sql`
4. Execute o script

## 🎯 Funcionalidades

### **Sistema de Usuários**
- ✅ Cadastro de usuários
- ✅ Sistema de login
- ✅ Autenticação com tokens
- ✅ Gerenciamento de sessão

### **Gerenciamento de Veículos**
- ✅ Cadastro de veículos (nome, placa, IMEI)
- ✅ Listagem de veículos do usuário
- ✅ Edição e remoção de veículos
- ✅ Validação de IMEI único

### **Rastreamento GPS**
- ✅ Recebimento de posições via API
- ✅ Visualização no mapa (Leaflet)
- ✅ Histórico de posições
- ✅ Informações de velocidade e eventos

### **Sistema de Comandos**
- ✅ Bloqueio de veículos
- ✅ Desbloqueio de veículos  
- ✅ Histórico de comandos
- ✅ Status dos comandos (pendente/enviado/concluído)

## 🔐 Segurança
- Validação de dados no frontend e backend
- Tokens de autenticação
- Verificação de propriedade de veículos
- Sanitização de inputs
- CORS configurado adequadamente

## 📊 Banco de Dados
O sistema utiliza 5 tabelas principais:

1. **usuarios** - Dados dos usuários
2. **veiculos** - Veículos cadastrados
3. **posicoes** - Posições GPS recebidas
4. **comandos** - Comandos de bloqueio/desbloqueio
5. **imeis_autorizados** - Controle de IMEIs válidos

## 🌐 APIs Disponíveis

### **Teste**
- `GET /api/teste` - Verificar funcionamento

### **Usuários**
- `POST /api/usuarios` - Login/Cadastro
- `GET /api/usuarios` - Listar usuários

### **Veículos**
- `GET /api/veiculos?usuario_id=X` - Listar veículos
- `POST /api/veiculos` - Cadastrar veículo
- `DELETE /api/veiculos?veiculo_id=X&usuario_id=Y` - Remover veículo

### **Posições**
- `POST /api/posicoes` - Registrar posição
- `GET /api/posicoes?veiculo_id=X&usuario_id=Y` - Buscar posições

### **Comandos**
- `POST /api/comandos` - Enviar comando
- `GET /api/comandos?usuario_id=X` - Listar comandos
- `PUT /api/comandos` - Atualizar status do comando

## 🔄 Integração com Rastreadores
Para integrar com rastreadores GPS (como Teltonika FMB920):
1. Configure o rastreador para enviar dados via HTTP POST
2. Use a URL: `https://seu-dominio.com/api/posicoes`
3. Envie dados no formato JSON:
```json
{
  "imei": "123456789012345",
  "latitude": -23.5505,
  "longitude": -46.6333,
  "velocidade": 60,
  "evento": "GPS_ATIVO"
}
```

## 🚀 Deploy
1. Faça push do código para GitHub
2. Conecte o repositório no Cloudflare Pages
3. Configure as variáveis de ambiente
4. O deploy será automático a cada push

## 📝 Usuário de Teste
- **Email**: admin@neorastro.cloud
- **Senha**: admin123
- **Veículo de Teste**: IMEI 123456789012345

## 📞 Suporte
Para dúvidas ou suporte, entre em contato através do repositório GitHub.
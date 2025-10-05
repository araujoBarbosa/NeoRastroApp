// Rota para gerenciar usuários - cadastro e login
export const onRequestPost: PagesFunction = async (ctx) => {
  const db = ctx.env.DB;
  const url = new URL(ctx.request.url);
  const pathname = url.pathname;
  
  try {
    const dados = await ctx.request.json() as any;
    
    // Se for cadastro
    if (pathname.includes('/cadastro') || dados.action === 'cadastro') {
      const { nome, email, senha } = dados;
      
      if (!nome || !email || !senha) {
        return new Response(JSON.stringify({
          erro: "Nome, email e senha são obrigatórios"
        }), {
          status: 400,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }
      
      // Verificar se email já existe
      const emailExiste = await db.prepare(
        "SELECT id FROM usuarios WHERE email = ?"
      ).bind(email).first();
      
      if (emailExiste) {
        return new Response(JSON.stringify({
          erro: "Email já cadastrado"
        }), {
          status: 400,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }
      
      // Hash simples da senha (em produção, use bcrypt)
      const senhaHash = btoa(senha); // Base64 como exemplo simples
      
      await db.prepare(
        "INSERT INTO usuarios (nome, email, senha) VALUES (?, ?, ?)"
      ).bind(nome, email, senhaHash).run();
      
      return new Response(JSON.stringify({
        mensagem: "Usuário cadastrado com sucesso!",
        status: "success"
      }), {
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    
    // Se for login
    if (pathname.includes('/login') || dados.action === 'login') {
      const { email, senha } = dados;
      
      if (!email || !senha) {
        return new Response(JSON.stringify({
          erro: "Email e senha são obrigatórios"
        }), {
          status: 400,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }
      
      const senhaHash = btoa(senha);
      const usuario = await db.prepare(
        "SELECT id, nome, email, status FROM usuarios WHERE email = ? AND senha = ?"
      ).bind(email, senhaHash).first();
      
      if (!usuario) {
        return new Response(JSON.stringify({
          erro: "Email ou senha incorretos"
        }), {
          status: 401,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }
      
      if (usuario.status !== 'ativo') {
        return new Response(JSON.stringify({
          erro: "Usuário bloqueado ou inativo"
        }), {
          status: 403,
          headers: { 
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        });
      }
      
      // Criar token simples (em produção, use JWT)
      const token = btoa(JSON.stringify({
        id: usuario.id,
        email: usuario.email,
        timestamp: Date.now()
      }));
      
      return new Response(JSON.stringify({
        mensagem: "Login realizado com sucesso!",
        token: token,
        usuario: {
          id: usuario.id,
          nome: usuario.nome,
          email: usuario.email
        }
      }), {
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    
  } catch (error) {
    return new Response(JSON.stringify({
      erro: "Erro interno do servidor",
      message: error instanceof Error ? error.message : "Erro desconhecido"
    }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
};

// GET para listar usuários (admin)
export const onRequestGet: PagesFunction = async (ctx) => {
  const db = ctx.env.DB;
  
  try {
    const { results } = await db.prepare(
      "SELECT id, nome, email, status FROM usuarios ORDER BY id DESC"
    ).all();
    
    return new Response(JSON.stringify({
      usuarios: results,
      total: results.length
    }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      erro: "Erro ao buscar usuários"
    }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
};
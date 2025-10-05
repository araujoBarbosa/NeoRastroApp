// Rota para gerenciar veículos
export const onRequestPost: PagesFunction = async (ctx) => {
  const db = ctx.env.DB;
  
  try {
    const dados = await ctx.request.json() as any;
    const { usuario_id, nome, placa, imei } = dados;
    
    if (!usuario_id || !nome || !imei) {
      return new Response(JSON.stringify({
        erro: "Usuário ID, nome e IMEI são obrigatórios"
      }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    
    // Verificar se IMEI já existe
    const imeiExiste = await db.prepare(
      "SELECT id FROM veiculos WHERE imei = ?"
    ).bind(imei).first();
    
    if (imeiExiste) {
      return new Response(JSON.stringify({
        erro: "IMEI já cadastrado"
      }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    
    // Verificar se usuário existe
    const usuarioExiste = await db.prepare(
      "SELECT id FROM usuarios WHERE id = ?"
    ).bind(usuario_id).first();
    
    if (!usuarioExiste) {
      return new Response(JSON.stringify({
        erro: "Usuário não encontrado"
      }), {
        status: 404,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    
    await db.prepare(
      "INSERT INTO veiculos (usuario_id, nome, placa, imei) VALUES (?, ?, ?, ?)"
    ).bind(usuario_id, nome, placa || null, imei).run();
    
    return new Response(JSON.stringify({
      mensagem: "Veículo cadastrado com sucesso!",
      status: "success"
    }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      erro: "Erro ao cadastrar veículo",
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

// GET para listar veículos de um usuário
export const onRequestGet: PagesFunction = async (ctx) => {
  const db = ctx.env.DB;
  const url = new URL(ctx.request.url);
  const usuario_id = url.searchParams.get('usuario_id');
  
  try {
    if (!usuario_id) {
      return new Response(JSON.stringify({
        erro: "usuario_id é obrigatório"
      }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    
    const { results } = await db.prepare(
      "SELECT id, nome, placa, imei FROM veiculos WHERE usuario_id = ? ORDER BY id DESC"
    ).bind(usuario_id).all();
    
    return new Response(JSON.stringify({
      veiculos: results,
      total: results.length
    }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      erro: "Erro ao buscar veículos"
    }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
};

// DELETE para remover veículo
export const onRequestDelete: PagesFunction = async (ctx) => {
  const db = ctx.env.DB;
  const url = new URL(ctx.request.url);
  const veiculo_id = url.searchParams.get('veiculo_id');
  const usuario_id = url.searchParams.get('usuario_id');
  
  try {
    if (!veiculo_id || !usuario_id) {
      return new Response(JSON.stringify({
        erro: "veiculo_id e usuario_id são obrigatórios"
      }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    
    // Verificar se o veículo pertence ao usuário
    const veiculo = await db.prepare(
      "SELECT id FROM veiculos WHERE id = ? AND usuario_id = ?"
    ).bind(veiculo_id, usuario_id).first();
    
    if (!veiculo) {
      return new Response(JSON.stringify({
        erro: "Veículo não encontrado ou não pertence a este usuário"
      }), {
        status: 404,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    
    await db.prepare(
      "DELETE FROM veiculos WHERE id = ? AND usuario_id = ?"
    ).bind(veiculo_id, usuario_id).run();
    
    return new Response(JSON.stringify({
      mensagem: "Veículo removido com sucesso!",
      status: "success"
    }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      erro: "Erro ao remover veículo"
    }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
};
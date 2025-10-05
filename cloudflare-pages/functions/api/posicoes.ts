// Rota para gerenciar posições dos veículos
export const onRequestPost: PagesFunction = async (ctx) => {
  const db = ctx.env.DB;
  
  try {
    const dados = await ctx.request.json() as any;
    const { imei, latitude, longitude, velocidade, evento } = dados;
    
    if (!imei || !latitude || !longitude) {
      return new Response(JSON.stringify({
        erro: "IMEI, latitude e longitude são obrigatórios"
      }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    
    // Verificar se o IMEI existe nos veículos cadastrados
    const veiculoExiste = await db.prepare(
      "SELECT id FROM veiculos WHERE imei = ?"
    ).bind(imei).first();
    
    if (!veiculoExiste) {
      return new Response(JSON.stringify({
        erro: "IMEI não cadastrado no sistema"
      }), {
        status: 404,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    
    await db.prepare(
      "INSERT INTO posicoes (imei, data_hora, latitude, longitude, velocidade, evento) VALUES (?, datetime('now'), ?, ?, ?, ?)"
    ).bind(imei, latitude, longitude, velocidade || 0, evento || null).run();
    
    return new Response(JSON.stringify({
      mensagem: "Posição registrada com sucesso!",
      status: "success",
      timestamp: new Date().toISOString()
    }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      erro: "Erro ao registrar posição",
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

// GET para buscar posições de um veículo
export const onRequestGet: PagesFunction = async (ctx) => {
  const db = ctx.env.DB;
  const url = new URL(ctx.request.url);
  const veiculo_id = url.searchParams.get('veiculo_id');
  const usuario_id = url.searchParams.get('usuario_id');
  const limite = url.searchParams.get('limite') || '50';
  
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
    
    // Verificar se o veículo pertence ao usuário e obter o IMEI
    const veiculo = await db.prepare(
      "SELECT imei FROM veiculos WHERE id = ? AND usuario_id = ?"
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
    
    const { results } = await db.prepare(
      "SELECT id, imei, data_hora, latitude, longitude, velocidade, evento FROM posicoes WHERE imei = ? ORDER BY id DESC LIMIT ?"
    ).bind(veiculo.imei, parseInt(limite)).all();
    
    return new Response(JSON.stringify({
      posicoes: results,
      total: results.length,
      veiculo_id: veiculo_id,
      imei: veiculo.imei
    }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      erro: "Erro ao buscar posições",
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
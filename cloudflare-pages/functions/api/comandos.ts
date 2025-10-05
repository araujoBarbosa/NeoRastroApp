// Rota para gerenciar comandos (bloqueio/desbloqueio)
export const onRequestPost: PagesFunction = async (ctx) => {
  const db = ctx.env.DB;
  
  try {
    const dados = await ctx.request.json() as any;
    const { veiculo_id, usuario_id, tipo, motivo } = dados;
    
    if (!veiculo_id || !usuario_id || !tipo) {
      return new Response(JSON.stringify({
        erro: "veiculo_id, usuario_id e tipo são obrigatórios"
      }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    
    // Validar tipo de comando
    if (!['BLOQUEIO', 'DESBLOQUEIO'].includes(tipo.toUpperCase())) {
      return new Response(JSON.stringify({
        erro: "Tipo deve ser 'BLOQUEIO' ou 'DESBLOQUEIO'"
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
      "SELECT id, nome FROM veiculos WHERE id = ? AND usuario_id = ?"
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
      "INSERT INTO comandos (veiculo_id, tipo, status, motivo, data_hora) VALUES (?, ?, 'pendente', ?, datetime('now'))"
    ).bind(veiculo_id, tipo.toUpperCase(), motivo || null).run();
    
    return new Response(JSON.stringify({
      mensagem: `Comando ${tipo.toUpperCase()} registrado com sucesso!`,
      status: "success",
      veiculo: veiculo.nome,
      tipo: tipo.toUpperCase(),
      timestamp: new Date().toISOString()
    }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      erro: "Erro ao registrar comando",
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

// GET para listar comandos de um usuário
export const onRequestGet: PagesFunction = async (ctx) => {
  const db = ctx.env.DB;
  const url = new URL(ctx.request.url);
  const usuario_id = url.searchParams.get('usuario_id');
  const veiculo_id = url.searchParams.get('veiculo_id');
  const limite = url.searchParams.get('limite') || '50';
  
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
    
    let query = `
      SELECT 
        c.id, c.veiculo_id, c.tipo, c.status, c.motivo, c.data_hora,
        v.nome as veiculo_nome, v.placa
      FROM comandos c
      JOIN veiculos v ON c.veiculo_id = v.id
      WHERE v.usuario_id = ?
    `;
    
    const params = [usuario_id];
    
    if (veiculo_id) {
      query += " AND c.veiculo_id = ?";
      params.push(veiculo_id);
    }
    
    query += " ORDER BY c.id DESC LIMIT ?";
    params.push(parseInt(limite));
    
    const { results } = await db.prepare(query).bind(...params).all();
    
    return new Response(JSON.stringify({
      comandos: results,
      total: results.length,
      usuario_id: usuario_id,
      veiculo_id: veiculo_id || 'todos'
    }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      erro: "Erro ao buscar comandos",
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

// PUT para atualizar status do comando (usado pelo sistema do rastreador)
export const onRequestPut: PagesFunction = async (ctx) => {
  const db = ctx.env.DB;
  
  try {
    const dados = await ctx.request.json() as any;
    const { comando_id, status } = dados;
    
    if (!comando_id || !status) {
      return new Response(JSON.stringify({
        erro: "comando_id e status são obrigatórios"
      }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    
    // Validar status
    if (!['pendente', 'enviado', 'concluido', 'erro'].includes(status.toLowerCase())) {
      return new Response(JSON.stringify({
        erro: "Status deve ser: 'pendente', 'enviado', 'concluido' ou 'erro'"
      }), {
        status: 400,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    
    const resultado = await db.prepare(
      "UPDATE comandos SET status = ? WHERE id = ?"
    ).bind(status.toLowerCase(), comando_id).run();
    
    if (resultado.changes === 0) {
      return new Response(JSON.stringify({
        erro: "Comando não encontrado"
      }), {
        status: 404,
        headers: { 
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });
    }
    
    return new Response(JSON.stringify({
      mensagem: "Status do comando atualizado com sucesso!",
      status: "success",
      comando_id: comando_id,
      novo_status: status.toLowerCase()
    }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
    
  } catch (error) {
    return new Response(JSON.stringify({
      erro: "Erro ao atualizar comando",
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
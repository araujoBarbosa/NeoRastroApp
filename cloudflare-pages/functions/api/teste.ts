// Rota de teste para verificar se a API está funcionando
export const onRequestGet: PagesFunction = async (ctx) => {
  const db = ctx.env.DB;
  
  try {
    const { results } = await db.prepare("SELECT 'NeoRastro API funcionando!' as status, datetime('now') as timestamp").all();
    
    return new Response(JSON.stringify({
      status: "success",
      message: "API NeoRastro operacional",
      data: results[0],
      cloudflare: true
    }), {
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  } catch (error) {
    return new Response(JSON.stringify({
      status: "error",
      message: "Erro ao conectar com o banco de dados",
      error: error.message
    }), {
      status: 500,
      headers: { 
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*"
      }
    });
  }
};
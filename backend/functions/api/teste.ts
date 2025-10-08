export const onRequestGet: PagesFunction = async (ctx) => {
  const db = ctx.env.DB; // DB é o nome que vamos configurar no próximo passo 
  const { results } = await db.prepare("SELECT 'funcionando!' as status").all();
  return new Response(JSON.stringify(results[0]), {
    headers: { "Content-Type": "application/json" }
  });
};
// ============================================================
// app.js — Ligação com o Supabase + ajudantes de acesso
// Usado por todas as telas (login, admin, colaborador, cliente).
// ============================================================
const sb = window.supabase.createClient(window.SUPA.url, window.SUPA.anonKey);

// Faz login com e-mail + senha.
async function entrar(email, senha){
  const { data, error } = await sb.auth.signInWithPassword({ email: email, password: senha });
  if(error) throw error;
  return data;
}

// Sai da conta e volta para o login.
async function sair(){
  await sb.auth.signOut();
  location.href = 'login.html';
}

// Descobre o papel/nome de quem está logado (lê a gaveta "perfis").
async function meuPerfil(){
  const { data:{ user } } = await sb.auth.getUser();
  if(!user) return null;
  const { data, error } = await sb.from('perfis').select('papel, nome').eq('id', user.id).single();
  if(error) return null;
  return data;
}

// Para onde cada papel vai depois de entrar.
function destinoPorPapel(papel){
  if(papel === 'admin')       return 'area-admin.html';
  if(papel === 'colaborador') return 'area-colaborador.html';
  if(papel === 'cliente')     return 'area-cliente.html';
  return 'login.html';
}

// Protege uma página: exige estar logado e (opcional) ter um dos papéis.
// Chame no topo de admin/colaborador/cliente. Devolve o perfil, ou redireciona.
async function exigirAcesso(papeisPermitidos){
  const { data:{ session } } = await sb.auth.getSession();
  if(!session){ location.href = 'login.html'; return null; }
  const perfil = await meuPerfil();
  if(!perfil){ await sair(); return null; }
  if(papeisPermitidos && papeisPermitidos.indexOf(perfil.papel) < 0){
    location.href = destinoPorPapel(perfil.papel);
    return null;
  }
  return perfil;
}

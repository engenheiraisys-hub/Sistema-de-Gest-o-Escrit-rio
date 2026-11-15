// ============================================================
// app.js — Ligação com o Supabase + ajudantes de acesso
// Usado por todas as telas (login, admin, colaborador, cliente).
// ============================================================

// ---------- PROTEÇÃO (segurança) ----------
// 1) Ninguém pode abrir o sistema "dentro" de outro site (golpe de clique escondido).
(function(){
  try{ if(window.top!==window.self){ var mesmo=false; try{ mesmo=(window.top.location.origin===location.origin); }catch(e){}
    if(!mesmo){ document.documentElement.style.display='none'; window.top.location=location.href; } } }catch(e){}
})();
// 2) Textos vindos do banco (nome, e-mail, endereço, tarefas...) nunca viram código na tela.
//    Tudo que é colocado na página passa por esta limpeza: tira comandos escondidos (on...=, javascript:,
//    <script>, <object>...). O texto continua aparecendo igual; só o código malicioso é descartado.
(function(){
  var P=Element.prototype, d=Object.getOwnPropertyDescriptor(P,'innerHTML');
  if(!d||!d.set||P.__protegido) return; P.__protegido=true;
  var RISCO=/<|&#|&\w+;/, TAG_RUIM=/^(script|object|embed|base|meta|frame|frameset|applet|noscript)$/i;
  var URL_ATR=/^(href|src|action|formaction|xlink:href|data|poster|background|ping|codebase|cite|lowsrc)$/i;
  var URL_RUIM=/^(javascript|vbscript|livescript|data:(?!image\/(png|jpe?g|gif|webp|svg\+xml)[;,]))/i;
  function limpar(html){
    var t=document.createElement('template'); d.set.call(t, html);
    var els=t.content.querySelectorAll('*');
    for(var i=0;i<els.length;i++){
      var el=els[i], tag=el.localName||'';
      if(TAG_RUIM.test(tag)){ el.remove(); continue; }
      if(/^(set|animate|animatetransform|animatemotion)$/i.test(tag) && /href|^on/i.test(el.getAttribute('attributeName')||'')){ el.remove(); continue; }
      for(var j=el.attributes.length-1;j>=0;j--){
        var a=el.attributes[j], n=a.name.toLowerCase();
        if(n.indexOf('on')===0 || n==='srcdoc' || n==='formaction' || (tag==='iframe' && n==='src')){ el.removeAttribute(a.name); continue; }
        if(URL_ATR.test(n) && URL_RUIM.test(String(a.value).replace(/[\s\x00-\x1f]+/g,''))) el.removeAttribute(a.name);
      }
    }
    return d.get.call(t);
  }
  window.limparHtml=limpar;
  Object.defineProperty(P,'innerHTML',{ configurable:true, enumerable:d.enumerable, get:d.get,
    set:function(v){ var s=(v==null)?'':String(v); d.set.call(this, RISCO.test(s)?limpar(s):s); } });
  var ia=P.insertAdjacentHTML;
  if(ia) P.insertAdjacentHTML=function(pos,html){ return ia.call(this,pos,limpar(String(html==null?'':html))); };
})();

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

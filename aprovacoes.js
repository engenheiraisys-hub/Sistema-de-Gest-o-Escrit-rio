/* aprovações e documentos de aprovação — usado pela área do administrador e pela área do colaborador */
/* ================= APROVAÇÕES E DOCUMENTOS DE APROVAÇÃO =================
   Perguntas: Prefeitura → matrícula; Vigilância → esgoto. As respostas ficam em projetos.aprovacoes (jsonb)
   junto com os dados usados nos documentos. Modelos em /modelos (Word e o PDF oficial da CASAN). */
(function(){
  function $(id){ return document.getElementById(id); }
  function esc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
  /* "Snº", "s/n", "S/Nº", "sem número"… = sem número (não leva "N°" na frente) */
  function semNumero(v){ var t=String(v||'').trim(); return !t || /^s\.?\s*\/?\s*n\.?\s*[º°o]?\.?$/i.test(t) || /^sem\s+n/i.test(t); }
  var IC={
    pref:'<svg viewBox="0 0 24 24"><line x1="3" x2="21" y1="22" y2="22"/><line x1="6" x2="6" y1="18" y2="11"/><line x1="10" x2="10" y1="18" y2="11"/><line x1="14" x2="14" y1="18" y2="11"/><line x1="18" x2="18" y1="18" y2="11"/><polygon points="12 2 20 7 4 7"/></svg>',
    mat:'<svg viewBox="0 0 24 24"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>',
    visa:'<svg viewBox="0 0 24 24"><path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/><path d="m9 12 2 2 4-4"/></svg>',
    esg:'<svg viewBox="0 0 24 24"><path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5s-3.5-4-4-6.5c-.5 2.5-2 4.9-4 6.5C6 11.1 5 13 5 15a7 7 0 0 0 7 7z"/></svg>',
    doc:'<svg viewBox="0 0 24 24"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/><path d="M10 9H8"/><path d="M16 13H8"/><path d="M16 17H8"/></svg>',
    baixar:'<svg viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>'
  };
  /* ---------- perguntas ---------- */
  var PERG=[
    {k:'prefeitura', t:'Possui aprovação na Prefeitura?', ic:IC.pref},
    {k:'matricula', t:'Possui matrícula?', sub:'Sem matrícula, o sistema prepara a Declaração de posse.', ic:IC.mat, se:'prefeitura'},
    {k:'vigilancia', t:'Possui aprovação na Vigilância Sanitária?', sub:'Com aprovação na Vigilância, entra o Memorial hidrossanitário.', ic:IC.visa},
    {k:'esgoto', t:'Possui rede de esgoto?', sub:'Sem rede: viabilidade de água. Com rede: viabilidade de água e de esgoto.', ic:IC.esg, se:'vigilancia'},
    {k:'habitese', t:'Vai solicitar habite-se sanitário?', sub:'Com habite-se, entra o Relatório de vistoria (unifamiliar: rede ou sistema local; demais usos: só com rede de esgoto).', ic:IC.visa, se:'vigilancia'}
  ];
  function docsDe(r, tipo){
    var d=[];
    if(r.prefeitura==='sim' && r.matricula==='nao') d.push('posse');
    if(r.vigilancia==='sim'){ d.push('viabilidade'); d.push('memorial'); if(/unifamiliar/i.test(tipo||'')) d.push('conformidade');
      /* relatório de vistoria do habite-se: unifamiliar (modelo de rede ou de sistema local); multi/mista/comercial só com rede */
      if(r.habitese==='sim' && (/unifamiliar/i.test(tipo||'') || r.esgoto==='sim')) d.push('vistoria'); }
    return d;
  }
  var NOMES={posse:'Declaração de posse', viabilidade:'Consulta de viabilidade CASAN', memorial:'Memorial hidrossanitário', conformidade:'Declaração de conformidade (VISA)', vistoria:'Relatório de vistoria (habite-se)'};
  function montarPerguntas(box, r, onMuda, tipoFn){
    if(!box) return;
    function desenhar(){
      box.innerHTML='';
      PERG.forEach(function(q){
        if(q.se && r[q.se]!=='sim') return;
        var d=document.createElement('div'); d.className='apr-q'+(q.se?' sub':'');
        d.innerHTML='<div class="q">'+q.ic+'<div>'+esc(q.t)+(q.sub?'<small>'+esc(q.sub)+'</small>':'')+'</div></div><span class="seg" role="group" aria-label="'+esc(q.t)+'"><button class="sortbtn" type="button" data-v="sim" aria-selected="'+(r[q.k]==='sim')+'">Sim</button><button class="sortbtn" type="button" data-v="nao" aria-selected="'+(r[q.k]==='nao')+'">Não</button></span>';
        d.querySelectorAll('[data-v]').forEach(function(b){ b.addEventListener('click',function(){ r[q.k]=(r[q.k]===b.dataset.v)?'':b.dataset.v; desenhar(); if(onMuda) onMuda(); }); });
        box.appendChild(d);
      });
      var lista=docsDe(r, tipoFn?tipoFn():'');
      var g=document.createElement('div'); g.className='apr-gera';
      g.innerHTML=lista.length?('Documentos de aprovação: <b>'+lista.map(function(k){return NOMES[k];}).join('</b> · <b>')+'</b>'):'Nenhum documento de aprovação a preparar com essas respostas.';
      box.appendChild(g);
    }
    desenhar();
    return desenhar;
  }
  /* novo projeto */
  var NOVO={};
  var redesenharNovo=montarPerguntas($('np-apr'), NOVO, null, function(){ return ($('np-tipo')||{}).value||''; });
  if($('np-tipo')) $('np-tipo').addEventListener('change',function(){ if(redesenharNovo) redesenharNovo(); });
  window.lerAprovacoesNovo=function(){ var r={prefeitura:NOVO.prefeitura||'',matricula:NOVO.matricula||'',vigilancia:NOVO.vigilancia||'',esgoto:NOVO.esgoto||'',habitese:NOVO.habitese||''}, dd={};
    document.querySelectorAll('#np-dados [data-k]').forEach(function(i){ var v=i.value.trim(); if(v) dd[i.dataset.k]=v; });
    if(Object.keys(dd).length) r.dados=dd;
    return (r.prefeitura||r.vigilancia||r.dados)?r:null; };
  window.limparAprovacoesNovo=function(){ Object.keys(NOVO).forEach(function(k){ delete NOVO[k]; }); document.querySelectorAll('#np-dados [data-k]').forEach(function(i){ i.value=(i.dataset.k==='obra_cidade')?'Florianópolis':''; }); if(redesenharNovo) redesenharNovo(); };

  /* ---------- dados usados nos documentos ---------- */
  var CAMPOS=[
    {g:'Proprietário'},
    {k:'prop_nome',l:'Nome completo',docs:['posse','viabilidade','memorial','conformidade']},
    {k:'prop_cpf',l:'CPF / CNPJ',docs:['posse','viabilidade','memorial','conformidade']},
    {k:'prop_email',l:'E-mail',docs:[]},
    {k:'prop_tel',l:'Telefone',docs:['viabilidade']},
    {k:'prop_end',l:'Endereço onde mora (rua e nº)',docs:['posse','viabilidade']},
    {k:'prop_bairro',l:'Bairro onde mora',docs:['posse']},
    {k:'prop_cidade',l:'Cidade onde mora',docs:['posse','viabilidade']},
    {g:'Imóvel / obra'},
    {k:'obra_end',l:'Endereço da obra (rua)',docs:['posse','viabilidade','memorial','conformidade','vistoria']},
    {k:'obra_num',l:'Nº',ph:'s/nº',docs:[]},
    {k:'obra_comp',l:'Complemento',ph:'ex.: casa 2, lote 5',docs:[]},
    {k:'obra_bairro',l:'Bairro da obra',docs:['posse','viabilidade','memorial','conformidade','vistoria']},
    {k:'obra_cidade',l:'Cidade da obra',ph:'Florianópolis',docs:['viabilidade']},
    {k:'obra_cep',l:'CEP da obra',docs:['conformidade']},
    {k:'obra_parcel',l:'A obra está em loteamento ou condomínio aprovado?',opts:['Não','Loteamento aprovado','Condomínio aprovado'],docs:[]},
    {k:'inscricao',l:'Inscrição imobiliária (IPTU)',ph:'XX.XX.XXX.XXXX.XXX-XXX',docs:['posse','memorial','conformidade','vistoria']},
    {k:'matricula_n',l:'Nº da matrícula',ph:'vazio = inexistente',docs:[]},
    {k:'area',l:'Área construída total (m²)',docs:['viabilidade','memorial','conformidade','vistoria']},
    {k:'quartos',l:'Nº de quartos (total)',docs:['viabilidade','memorial']},
    {k:'unidades',l:'Nº de unidades residenciais',ph:'1',docs:[]},
    {k:'andares',l:'Nº de pavimentos',ph:'1',docs:[]},
    {g:'Consulta de viabilidade CASAN'},
    {k:'img_earth',l:'Imagem do Google Earth (área marcada)',docs:['viabilidade'],img:true,largo:true},
    {k:'com_tipo',l:'Tipo de comércio',ph:'ex.: loja de roupas, escritório, restaurante',docs:['viabilidade'],soCom:true},
    {k:'com_ativ',l:'Descrição das atividades',ph:'ex.: venda de roupas e acessórios',docs:['viabilidade'],soCom:true,largo:true},
    {k:'area_com',l:'Área comercial / salas (m²)',ph:'1 pessoa a cada 7,5 m²',docs:['viabilidade','memorial'],soCom:true},
    {g:'Memorial hidrossanitário'},
    {k:'descricao',l:'Descrição da edificação',ph:'ex.: térrea com 1 suíte, 1 dormitório, banheiro, sala e cozinha integrados',docs:['memorial'],largo:true},
    {k:'quartos_casas',l:'Cada casa: quartos e reservatório',docs:['memorial'],casas:true,largo:true},
    {k:'af_torneiras',l:'Torneiras de jardim (ligação direta): quantas?',ph:'0 = nenhuma',docs:['memorial']},
    {k:'af_cisterna',l:'Possui cisterna de água potável?',opts:['sim','não'],docs:['memorial'],soCol:true},
    {k:'af_quente',l:'Possui instalação de água quente?',opts:['sim','não'],docs:['memorial']},
    {k:'af_reserv_n',l:'Reservatórios superiores (coletivos): quantos?',ph:'1',docs:[],soCol:true},
    {k:'cg_grupos',l:'Caixas de gordura',docs:['memorial'],grupos:true,largo:true},
    {k:'esg_destino',l:'O esgoto vai para',opts:['rede pública','ETE do condomínio/loteamento'],docs:['memorial'],soRede:true},
    {k:'pre_trat',l:'Precisa de pré-tratamento (fossa séptica + filtro anaeróbio antes da rede)?',opts:['não','sim'],docs:[],soRede:true,largo:true},
    {k:'esg_trat',l:'Tratamento do esgoto',opts:['fossa séptica + filtro anaeróbio','ETE compacta'],docs:['memorial'],soLocal:true},
    {k:'esg_inf',l:'Disposição final',opts:['sumidouro','vala de infiltração','lançamento na rede pluvial'],docs:['memorial'],soLocal:true},
    {k:'esg_inf_n',l:'Quantos sumidouros / valas?',ph:'sumidouro: 1 a 3',docs:['memorial'],soLocal:true,soInf:true},
    {k:'esg_inf_pct',l:'Cada sumidouro / vala recebe',opts:['100% da área','50% da área'],docs:['memorial'],soLocal:true,soInf:true},
    {k:'esg_sum_forma',l:'Formato do sumidouro',opts:['redondo','retangular'],docs:['memorial'],soLocal:true,soSum:true},
    {k:'esg_sum_dim',l:'Diâmetro do sumidouro (m)',ph:'ex.: 1,00',docs:['memorial'],soLocal:true,soSum:true},
    {k:'esg_vala_l',l:'Largura da vala = altura (m)',ph:'ex.: 0,50',docs:['memorial'],soLocal:true,soVala:true},
    {k:'esg_rec',l:'Possui recalque de esgoto (bomba)?',opts:['não','sim'],docs:[]},
    {k:'esg_rec_q',l:'Recalque: vazão da bomba (L/s)',ph:'ex.: 2,00',docs:['memorial'],soRecE:true},
    {k:'esg_rec_t',l:'Recalque: tempo de ciclo (min)',ph:'10',docs:[],soRecE:true},
    {k:'esg_rec_h',l:'Recalque: altura manométrica (m)',ph:'ex.: 8,00',docs:['memorial'],soRecE:true},
    {k:'esg_rec_eta',l:'Recalque: rendimento da bomba (%)',ph:'ex.: 50',docs:['memorial'],soRecE:true},
    {k:'esg_rec_bomba',l:'Recalque: bomba adotada',ph:'modelo / potência',docs:['memorial'],soRecE:true},
    {k:'mat_fossa',l:'Material da fossa séptica',opts:['concreto','polietileno','fibra de vidro'],docs:['memorial'],soTrat:true,soFossa:true},
    {k:'mat_filtro',l:'Material do filtro anaeróbio',opts:['concreto','polietileno','fibra de vidro'],docs:['memorial'],soTrat:true,soFossa:true},
    {k:'mat_sum',l:'Material do sumidouro',opts:['anéis de concreto','alvenaria de blocos/tijolos'],docs:['memorial'],soLocal:true,soSum:true},
    {k:'ci',l:'Coef. de infiltração do solo (L/m²·dia)',ph:'do ensaio de percolação',docs:['memorial','conformidade'],soLocal:true},
    {k:'reserv',l:'Reservatório superior adotado (litros, cada)',ph:'litros',docs:['memorial'],naoCasas:true},
    {k:'cist_vol',l:'Cisterna adotada (litros)',ph:'litros',docs:['memorial'],soCis:true,soCol:true},
    {k:'mat_reserv',l:'Material dos reservatórios superiores',opts:['polietileno (PEAD)','fibra de vidro','concreto armado'],docs:[],soCol:true},
    {k:'mat_cist',l:'Material da cisterna',opts:['concreto armado impermeabilizado','polietileno (PEAD)'],docs:['memorial'],soCis:true,soCol:true},
    {k:'rti',l:'RTI – reserva técnica de incêndio (litros)',ph:'vazio = não tem',docs:[],soCol:true},
    {k:'rec_horas',l:'Recalque: horas de funcionamento da bomba',ph:'4',docs:[],soCis:true,soCol:true},
    {k:'rec_bomba',l:'Recalque: bomba adotada',ph:'ex.: 1/2 cv',docs:['memorial'],soCis:true,soCol:true},
    {g:'Águas pluviais (memorial)'},
    {k:'pl_cond',l:'Quantos condutores verticais (PL)?',ph:'ex.: 2',docs:['memorial']},
    {k:'pl_rec',l:'Possui recalque de águas pluviais (bomba)?',opts:['não','sim'],docs:[]},
    {k:'pl_rec_q',l:'Recalque pluvial: vazão da bomba (L/s)',ph:'ex.: 2,00',docs:['memorial'],soRecP:true},
    {k:'pl_rec_t',l:'Recalque pluvial: tempo de ciclo (min)',ph:'10',docs:[],soRecP:true},
    {k:'pl_rec_h',l:'Recalque pluvial: altura manométrica (m)',ph:'ex.: 8,00',docs:['memorial'],soRecP:true},
    {k:'pl_rec_eta',l:'Recalque pluvial: rendimento da bomba (%)',ph:'ex.: 50',docs:['memorial'],soRecP:true},
    {k:'pl_rec_bomba',l:'Recalque pluvial: bomba adotada',ph:'modelo / potência',docs:['memorial'],soRecP:true},
    {k:'apv',l:'Possui aproveitamento de águas pluviais?',opts:['não','sim'],docs:[]},
    {k:'apv_casas',l:'Aproveitamento: quais casas?',ph:'ex.: 1   (vazio = todas)',docs:[],soApv:true,soCasasF:true},
    {k:'apv_cond',l:'Aproveitamento: quantos condutores (AP)?',ph:'ex.: 3',docs:['memorial'],soApv:true},
    {k:'apv_usos',l:'Aproveitamento: locais de uso (vazio = irrigação de jardim)',multi:['Irrigação de jardim','Limpeza de calçadas','Lavagem de veículos','Lavagem de contentores de lixo','Bacias sanitárias','Lavagem de roupas'],docs:[],soApv:true,largo:true},
    {k:'apv_trat',l:'Aproveitamento: unidades de tratamento',multi:['Remoção de detritos','Descarte de primeiras águas','Desinfecção'],docs:['conformidade'],soApv:true,largo:true},
    {k:'apv_area',l:'Aproveitamento: área de captação (m²)',ph:'área inclinada do telhado',docs:['memorial'],soApv:true},
    {k:'apv_irrig',l:'Aproveitamento: área de irrigação (m²)',ph:'ex.: 102,00',docs:['memorial'],soApv:true},
    {k:'apv_lm2',l:'Aproveitamento: litros por m² (por rega)',ph:'2',docs:[],soApv:true},
    {k:'apv_vezes',l:'Aproveitamento: regas por semana',ph:'2',docs:[],soApv:true},
    {k:'apv_precip',l:'Aproveitamento: precipitação média (mm/dia)',ph:'4,16',docs:[],soApv:true},
    {k:'apv_filtro',l:'Aproveitamento: filtro de remoção de detritos',ph:'ex.: Filtro marca xyz, para telhados de até 200 m²',docs:['memorial'],soApv:true,largo:true},
    {k:'apv_cist',l:'Aproveitamento: cisterna adotada (litros)',ph:'mínimo 10 dias de demanda',docs:['memorial'],soApv:true},
    {k:'apv_bomba',l:'Aproveitamento: pressurizador adotado',ph:'ex.: 1/2 cv   (vazio = não tem)',docs:[],soApv:true},
    {g:'Declaração de conformidade (VISA)'},
    {k:'na',l:'Nível da água – NA (m)',ph:'do ensaio de sondagem',docs:['conformidade'],soTrat:true},
    {k:'lagoa',l:'A obra está na bacia da Lagoa da Conceição?',opts:['Não','Sim'],docs:['conformidade'],soTrat:true},
    {k:'cf_solucoes',l:'8.8 Soluções técnicas adotadas (distâncias mínimas)',ph:'vazio = distâncias mínimas atendidas (NBR 7229 e NBR 13969)',docs:[],soTrat:true,largo:true},
    {k:'cf_recurso',l:'8.9 Recurso p/ 1,50 m acima do lençol (vazio = não necessário)',opts:['Não necessário','Somente aterro','Recalque com aterro','Recalque sem aterro','Outro'],docs:[],soTrat:true,soInf:true},
    {k:'cf_recurso_outro',l:'8.9 Outro recurso: descreva',docs:['conformidade'],soTrat:true,soInf:true,soOutro:true},
    {k:'cf_8_1',l:'8.1 A edificação está sujeita ao licenciamento ambiental?',opts:['SIM','NÃO','NÃO SE APLICA'],docs:[],soTrat:true},
    {k:'cf_lai',l:'8.1 Nº da LAI',docs:['conformidade'],soTrat:true,soLai:true},
    {k:'cf_8_5',l:'8.5 Legalização mantendo o sistema existente: o diagnóstico indica boas condições e eficiência?',opts:['SIM','NÃO','NÃO SE APLICA'],docs:[],soTrat:true,soLeg:true,largo:true},
    {k:'cf_8_14',l:'8.14 Lançamento na pluvial/corpo receptor: o efluente atende aos parâmetros de lançamento?',opts:['SIM','NÃO','NÃO SE APLICA'],docs:[],soLocal:true,soPlu:true,largo:true},
    {k:'cf_8_15',l:'8.15 Lançamento na pluvial/corpo receptor: os ensaios do solo indicam inviabilidade de infiltração?',opts:['SIM','NÃO','NÃO SE APLICA'],docs:[],soLocal:true,soPlu:true,largo:true},
    {k:'enquadramento',l:'Enquadramento (vazio = obra nova)',opts:['Obra nova','Reforma com ampliação','Reforma sem ampliação','Legalização Lei 374/10','Legalização','Substituição de projeto'],docs:[]},
    {k:'enq_contexto',l:'Contextualizar a ampliação/reforma/substituição',ph:'descreva o que muda em relação ao projeto anterior',docs:['conformidade'],soEnqRef:true,largo:true},
    {k:'phs_anterior',l:'Nº PHS anteriormente aprovado',ph:'número do PHS',docs:['conformidade'],soEnqRef:true},
    {k:'multi_tipo',l:'Multifamiliar: vertical ou horizontal?',opts:['vertical','horizontal'],docs:['conformidade'],soMulti:true},
    {k:'geminadas',l:'Geminadas: quantas?',ph:'vazio = isolada',docs:[]},
    {k:'cx_gradeamento',l:'Caixa de gradeamento (viabilidade de esgoto)',opts:['SIM','NÃO','NÃO SE APLICA'],docs:[],soRede:true},
    {k:'cx_quebra',l:'Caixa de quebra de pressão (viabilidade de esgoto)',opts:['SIM','NÃO','NÃO SE APLICA'],docs:[],soRede:true},
    {k:'destino_pluvial',l:'Destino das águas pluviais',opts:['Sarjeta','Rede pública de drenagem','Infiltração no terreno','Sumidouro / vala de infiltração'],docs:[]},
    {g:'Relatório de vistoria (habite-se)'},
    {k:'phs_proc',l:'Nº do processo de aprovação do PHS',ph:'dispensado p/ legalização Lei 374/10',docs:['vistoria']},
    {k:'hidrometro',l:'Nº do(s) hidrômetro(s)',docs:['vistoria']},
    {k:'vist_data',l:'Data da vistoria no imóvel',ph:'dd/mm/aaaa',docs:['vistoria']},
    {k:'apv_descarte',l:'5.15 Aproveitamento: volume de descarte (litros)',ph:'litros',docs:['vistoria'],soApv:true},
    {k:'vist_7_5',l:'7.5 Solo arenoso: foi previsto solo de proteção ao redor do sumidouro?',opts:['SIM','NÃO','NA'],docs:['vistoria'],soLocal:true,soInf:true,largo:true},
    {k:'ete_desc',l:'7.1 ETE Lodos Ativados: descrição (fabricante / modelo / volume)',docs:['vistoria'],soLocal:true,soEte:true,largo:true},
    {k:'vist_lic',l:'7.11 A edificação é sujeita ao licenciamento ambiental?',opts:['SIM','NÃO','NA'],docs:['vistoria'],soLocal:true},
    {k:'vist_lao',l:'7.11 Nº da LAO',docs:['vistoria'],soLocal:true,soLao:true},
    {k:'vist_9_3',l:'9.3 Estabelecimento de saúde: foi previsto depósito interno de resíduos de saúde (RDC 222/18)?',opts:['SIM','NÃO','NA'],docs:[],soCom:true,largo:true},
    {k:'oleo',l:'10 Há atividade com resíduos oleosos (posto, troca de óleo, lavação de veículos)?',opts:['não','sim'],docs:[],soCom:true,largo:true},
    {k:'oleo_lav',l:'10.7 Há área de lavagem de veículos?',opts:['não','sim'],docs:['vistoria'],soCom:true,soOleo:true},
    {k:'vist_4_11',l:'4.11 Reservatórios com parede compartilhada (aproveitamento/reuso/resíduos) têm afastamento mínimo de 60 cm?',opts:['SIM','NÃO','NA'],docs:['vistoria'],soCasasF:true,largo:true},
    {g:'Terreno (declaração de posse)'},
    {k:'ref',l:'Distância da esquina mais próxima',ph:'ex.: 400 metros da Rua Oliveira',docs:['posse']},
    {k:'t_area',l:'Área do terreno (m²)',docs:['posse']},
    {k:'t_frente',l:'Frente (m)',docs:['posse']},
    {k:'t_fundos',l:'Fundos (m)',docs:['posse']},
    {k:'t_dir',l:'Lateral direita (m)',docs:['posse']},
    {k:'t_esq',l:'Lateral esquerda (m)',docs:['posse']}
  ];
  /* novo projeto: dados do imóvel/obra e do terreno já no cadastro (vão para os documentos de aprovação) */
  (function(){
    var box=$('np-dados'); if(!box) return;
    var GR={'Imóvel / obra':1,'Terreno (declaração de posse)':1}, grid=null, on=false;
    CAMPOS.forEach(function(c){
      if(c.g){ on=!!GR[c.g]; if(!on) return; var h=document.createElement('div'); h.className='apr-grupo'; h.textContent=c.g; box.appendChild(h); grid=document.createElement('div'); grid.className='apr-grid'; box.appendChild(grid); return; }
      if(!on) return;
      var w=document.createElement('div'); w.innerHTML='<label>'+esc(c.l)+'</label>'+(c.opts?'<select data-k="'+c.k+'"><option value="">—</option>'+c.opts.map(function(o){ return '<option>'+esc(o)+'</option>'; }).join('')+'</select>':'<input type="text" data-k="'+c.k+'" placeholder="'+esc(c.ph||'')+'"'+(c.k==='obra_cidade'?' value="Florianópolis"':'')+'>');
      grid.appendChild(w);
    });
  })();
  var ST={id:null, proj:null, cli:null, r:{}, dados:{}, colunaOk:true};
  /* início da descrição da edificação (a Isys completa) */
  function descAuto(){
    var D=ST.dados, tipo=(ST.proj&&ST.proj.tipo)||'', and=parseInt(D.andares,10)||1, q=parseInt(D.quartos,10)||0, u=parseInt(D.unidades,10)||0;
    var s=/multi/i.test(tipo)?'Edificação multifamiliar'+(u>1?' com '+u+' unidades,':''):/comerc/i.test(tipo)?'Edificação comercial':/mist/i.test(tipo)?'Edificação de uso misto (residencial e comercial)':'Edificação unifamiliar';
    s+=(and<=1?' térrea':' com '+and+' pavimentos');
    if(q && !/comerc/i.test(tipo)) s+=(and<=1?' com ':', ')+q+(q===1?' dormitório':' dormitórios');
    return s+', ';
  }
  function ehCol(){ return /multi|comerc|mist/i.test((ST.proj&&ST.proj.tipo)||''); }
  function ehCom(){ return /comerc|mist/i.test((ST.proj&&ST.proj.tipo)||''); }
  /* unifamiliar com mais de uma casa: quartos de cada casa ("2,1") para o cálculo do esgoto por casa */
  /* enquadramento com "*" na ficha da VISA: reforma (com/sem ampliação) ou substituição → contextualizar e Nº PHS anterior */
  function ehEnqRef(){ return /reforma|substitui/i.test(ST.dados.enquadramento||''); }
  function nUnid(){ return Math.max(1,parseInt(ST.dados.unidades,10)||1); }
  function ehCasas(){ return !ehCol() && nUnid()>1; }
  /* guardado como "quartos:reservatório" por casa, ex.: "2:1000,1:500" */
  function lerCasas(s,parte){ return String(s||'').split(/[,;]/).filter(function(x){ return x.trim()!==''; }).map(function(x){ return Math.max(0,parseInt(String(x).split(':')[parte||0],10)||0); }); }
  function casasOk(s){ var q=lerCasas(s), r=lerCasas(s,1); return q.length===nUnid() && q.every(function(v,i){ return v>0 && r[i]>0; }); }
  function campoCasas(c,grid,precisa){
    var n=nUnid(), Q=lerCasas(ST.dados[c.k]), R=lerCasas(ST.dados[c.k],1), w=document.createElement('div'); w.style.gridColumn='1/-1'; w.className='apr-cg';
    var linhas=''; for(var i=0;i<n;i++){ var v=Q[i]||'', rv=R[i]||'';
      linhas+='<div class="apr-cg-row"><span class="apr-cg-n">Casa '+(i+1)+'</span><input type="number" min="1" value="'+v+'" data-q="'+i+'" placeholder="quartos"'+(precisa&&!v?' class="vazio"':'')+'><span>quartos</span>'
        +'<label>reservatório</label><input type="number" min="1" value="'+rv+'" data-r="'+i+'" placeholder="'+(v?'mín. '+nf(v*400,0):'litros')+'"'+(precisa&&!rv?' class="vazio"':'')+'><span>litros</span></div>'; }
    w.innerHTML='<label>'+esc(c.l)+'</label><div class="apr-cg-lista">'+linhas+'</div><small class="apr-cg-tot">Cada casa tem seu próprio reservatório e sistema de esgoto: os cálculos saem separados por casa. O total de quartos do projeto é somado automaticamente.</small>';
    function salvar(){ var arr=[], soma=0, ok=true;
      for(var i=0;i<n;i++){ arr.push((Q[i]||'')+':'+(R[i]||'')); if(Q[i]>0) soma+=Q[i]; else ok=false; }
      ST.dados[c.k]=arr.join(','); if(ok) ST.dados.quartos=String(soma); desenharCampos(); desenharDocs(); }
    w.querySelectorAll('input[data-q]').forEach(function(inp){ inp.addEventListener('change',function(){ var v=parseInt(inp.value,10); Q[+inp.dataset.q]=v>0?v:0; salvar(); }); });
    w.querySelectorAll('input[data-r]').forEach(function(inp){ inp.addEventListener('change',function(){ var v=parseInt(inp.value,10); R[+inp.dataset.r]=v>0?v:0; salvar(); }); });
    grid.appendChild(w);
  }
  /* NBR 13969: cada vala de infiltração com no máximo 30 m — avisa (por casa, quando houver mais de uma) */
  function avisoVala(){
    var D=ST.dados, extra='';
    /* aproveitamento pluvial: cisterna deve ter no mínimo 10 dias de demanda (VISA) */
    if(/^s/i.test(D.apv||'')){ var aI=num(D.apv_irrig), vi=aI>0?aI*(num(D.apv_lm2)>0?num(D.apv_lm2):2)*(num(D.apv_vezes)>0?num(D.apv_vezes):2)/7:0, cv=num(D.apv_cist);
      if(vi>0 && cv>0 && cv<10*vi) extra='Atenção: a cisterna de aproveitamento ('+nf(cv,0)+' L) é menor que 10 dias de demanda ('+nf(10*vi)+' L).'; }
    if(ST.r.esgoto==='sim' || !/vala/i.test(D.esg_inf||'')) return extra;
    try{
      var casas=ehCasas()&&casasOk(D.quartos_casas)?lerCasas(D.quartos_casas):[null], msg=[];
      casas.forEach(function(q,i){ var cm=calcMemorial(q?Object.assign({},D,{quartos:String(q)}):D,false);
        if(cm.vala && cm.vala.c>30) msg.push((q?'Casa '+(i+1)+': ':'')+'vala com '+nf(cm.vala.c)+' m'); });
      return [msg.length?'Atenção: '+msg.join('; ')+' — passa do limite de 30 m por vala (NBR 13969). Aumente o número de valas, a largura ou use 50% da área.':'', extra].filter(Boolean).join(' ');
    }catch(e){ return extra; }
  }
  function faltando(doc){ return CAMPOS.filter(function(c){ return c.k && (c.docs||[]).indexOf(doc)>=0 && !(c.casas && !ehCasas()) && !(c.naoCasas && ehCasas()) && !(c.soSum && !/^sum/i.test(ST.dados.esg_inf||'')) && !(c.soVala && !/vala/i.test(ST.dados.esg_inf||'')) && !(c.soFossa && ST.r.esgoto!=='sim' && /ete/i.test(ST.dados.esg_trat||'')) && !(c.soTrat && ST.r.esgoto==='sim' && !/^s/i.test(ST.dados.pre_trat||'')) && !(c.soRecE && !/^s/i.test(ST.dados.esg_rec||'')) && !(c.soRecP && !/^s/i.test(ST.dados.pl_rec||'')) && !(c.soApv && !/^s/i.test(ST.dados.apv||'')) && !(c.soCasasF && !ehCasas()) && !(c.soEnqRef && !ehEnqRef()) && !(c.soOutro && !/^outro/i.test(ST.dados.cf_recurso||'')) && !(c.soEte && !/ete/i.test(ST.dados.esg_trat||'')) && !(c.soLao && ST.dados.vist_lic!=='SIM') && !(c.soOleo && !/^s/i.test(ST.dados.oleo||'')) && !(c.soLai && ST.dados.cf_8_1!=='SIM') && !(c.soLeg && !/legaliza/i.test(ST.dados.enquadramento||'')) && !(c.soPlu && !/pluvial/i.test(ST.dados.esg_inf||'')) && !(c.soInf && /pluvial/i.test(ST.dados.esg_inf||'')) &&!(c.soMulti && !/multi/i.test((ST.proj&&ST.proj.tipo)||'')) && !(c.soLocal && ST.r.esgoto==='sim') && !(c.soCom && !ehCom()) && !(c.soCol && !ehCol()) && !(c.soRede && ST.r.esgoto!=='sim') && !(c.soCis && !/^s/i.test(ST.dados.af_cisterna||'')) && (c.grupos?!gruposOk(ST.dados[c.k]):c.casas?!casasOk(ST.dados[c.k]):!String(ST.dados[c.k]||'').trim()); }).map(function(c){ return c.l; }); }
  var PRONTOS={posse:'Word (.docx) igual ao seu modelo', viabilidade:'PDF oficial da CASAN preenchido', memorial:'Word (.docx) igual ao seu modelo, com os cálculos', conformidade:'Word (.docx) — o modelo oficial da VISA, já marcado', vistoria:'Word (.docx) — modelo oficial da VISA (rede ou sistema local), já marcado'};
  function desenharDocs(){
    var box=$('apr-docs'); if(!box) return; box.innerHTML='';
    var lista=docsDe(ST.r, ST.proj&&ST.proj.tipo);
    if(!lista.length){ box.innerHTML='<p class="apr-vazio">Responda às perguntas acima para ver os documentos de aprovação deste projeto.</p>'; }
    lista.forEach(function(k){
      var f=faltando(k), pronto=!!PRONTOS[k], av=k==='memorial'?avisoVala():'';
      var d=document.createElement('div'); d.className='apr-doc';
      d.innerHTML='<span class="ic">'+IC.doc+'</span><div class="tx"><b>'+NOMES[k]+'</b>'
        +(pronto?(f.length?'<small class="falta">Falta: '+esc(f.join(', '))+'</small>':'<small>Pronto para gerar · '+PRONTOS[k]+'</small>'):'<small>Em preparação — entra na próxima etapa</small>')+(av?'<small class="falta">'+esc(av)+'</small>':'')+'</div>'
        +(pronto?'<button class="pill '+(f.length?'ghost':'solid')+' sm" type="button">'+IC.baixar+'gerar</button>':'');
      var b=d.querySelector('button'); if(b) b.addEventListener('click',function(){ gerar(k,b); });
      box.appendChild(d);
    });
    var fa=$('apr-falta'); if(fa){ var n=lista.reduce(function(a,k){ return a+(PRONTOS[k]?faltando(k).length:0); },0); fa.textContent=n?'· '+n+' campo(s) faltando':''; }
  }
  /* dados do imóvel/obra e do terreno: ficam em "informações" do projeto; editáveis no modo editar e gravados ao alterar */
  function desenharInfo(lista){
    var box=$('pj-dados'); if(!box) return; box.innerHTML='';
    var editando=!!(document.getElementById('view-projeto')||{classList:{contains:function(){return false;}}}).classList.contains('editing'), grid=null, on=false;
    CAMPOS.forEach(function(c){
      if(c.g){ on=!!GR_INFO[c.g]; if(!on) return; var h=document.createElement('div'); h.className='apr-grupo'; h.textContent=c.g; box.appendChild(h); grid=document.createElement('div'); grid.className='apr-grid'; box.appendChild(grid); return; }
      if(!on) return;
      var precisa=(c.docs||[]).some(function(k){ return lista.indexOf(k)>=0; });
      var w=document.createElement('div'); w.innerHTML='<label>'+esc(c.l)+'</label>'+(c.opts?'<select><option value="">—</option>'+c.opts.map(function(o){ return '<option'+(ST.dados[c.k]===o?' selected':'')+'>'+esc(o)+'</option>'; }).join('')+'</select>':'<input type="text" placeholder="'+esc(c.ph||'')+'" value="'+esc(ST.dados[c.k]||'')+'">');
      var inp=w.querySelector('input,select'); if(c.opts) inp.addEventListener('change',function(){ ST.dados[c.k]=inp.value; desenharDocs(); }); inp.disabled=!editando; if(precisa && !inp.value.trim()) inp.classList.add('vazio');
      inp.addEventListener('input',function(){ ST.dados[c.k]=inp.value; inp.classList.toggle('vazio', precisa && !inp.value.trim()); desenharDocs(); });
      inp.addEventListener('change',function(){ salvarAprovacoes(true); if(c.k==='unidades') desenharCampos(); });
      grid.appendChild(w);
    });
  }
  async function salvarAprovacoes(curto){
    if(!ST.id) return; var n=$('apr-note');
    var dados={}; Object.keys(ST.dados).forEach(function(k){ var v=String(ST.dados[k]||'').trim(); if(v) dados[k]=v; });
    var val={prefeitura:ST.r.prefeitura||'',matricula:ST.r.matricula||'',vigilancia:ST.r.vigilancia||'',esgoto:ST.r.esgoto||'',habitese:ST.r.habitese||'',dados:dados};
    var up=await sb.from('projetos').update({aprovacoes:val}).eq('id',ST.id);
    var msg=(up&&up.error)?('Não foi possível salvar: '+up.error.message+(/aprovacoes/.test(up.error.message)?' — rode o sql-projetos-aprovacoes.sql no Supabase.':'')):(curto?'Dados do imóvel salvos. ✓':'Respostas e dados salvos. ✓');
    if(n) n.textContent=msg; var sn=document.getElementById('pj-status-note'); if(curto&&sn) sn.textContent=msg;
  }
  /* proprietário nos documentos: o cliente do projeto (dados do cadastro do cliente) ou outra pessoa/empresa */
  var CLI_MAP={prop_nome:'nome',prop_cpf:'cpf_cnpj',prop_email:'email',prop_tel:'telefone',prop_end:'endereco',prop_bairro:'bairro',prop_cidade:'cidade'};
  function puxarCliente(){ var cl=ST.cli||{}; Object.keys(CLI_MAP).forEach(function(k){ ST.dados[k]=cl[CLI_MAP[k]]||''; }); }
  function seletorProprietario(box){
    var d=document.createElement('div'); d.className='apr-prop';
    var cli=ST.cli&&ST.cli.nome?ST.cli.nome:'cliente do projeto';
    d.innerHTML='<span class="seg" role="group" aria-label="Proprietário nos documentos"><button class="sortbtn" type="button" data-o="cliente" aria-selected="'+(ST.dados.prop_origem!=='outro')+'">Cliente do projeto</button><button class="sortbtn" type="button" data-o="outro" aria-selected="'+(ST.dados.prop_origem==='outro')+'">Outro proprietário</button></span>'
      +'<small>'+(ST.dados.prop_origem==='outro'?'Preencha os dados da pessoa ou empresa em nome de quem sai a documentação.':'Dados do cadastro de <b>'+esc(cli)+'</b> — para mudar, edite o cliente na aba clientes.')+'</small>';
    d.querySelectorAll('[data-o]').forEach(function(b){ b.addEventListener('click',function(){
      var o=b.dataset.o; if(o===ST.dados.prop_origem) return; ST.dados.prop_origem=o;
      if(o==='cliente') puxarCliente(); else Object.keys(CLI_MAP).forEach(function(k){ ST.dados[k]=''; });
      desenharCampos(); desenharDocs();
    }); });
    box.appendChild(d);
  }  /* caixas de gordura: quantas caixas → modelo de cada uma → quantas pias cada uma recebe. Guardado como "pequena:1,dupla:4" */
  var CG_MODELOS=['pequena','simples','dupla','especial'];
  function tipoCG(n){ return n<=1?'pequena':n===2?'simples':n<=12?'dupla':'especial'; }
  function lerGrupos(s){ return String(s||'').split(/[,;]+/).map(function(x){ x=x.trim(); if(!x) return null; var m=x.split(':'); if(m.length>1) return {tp:CG_MODELOS.indexOf(m[0])>=0?m[0]:'', n:Math.max(1,parseInt(m[1],10)||1), N:parseInt(m[2],10)>0?parseInt(m[2],10):0}; var n=parseInt(x,10); return n>0?{tp:tipoCG(n),n:n}:null; }).filter(Boolean); }
  function gruposOk(s){ if(String(s==null?'':s).trim()==='0') return true; var G=lerGrupos(s); return G.length>0 && G.every(function(g){ return !!g.tp && (g.tp!=='especial' || g.N>0); }); }
  function campoGrupos(c,grid,precisa){
    var w=document.createElement('div'); w.style.gridColumn='1/-1'; w.className='apr-cg';
    var G=lerGrupos(ST.dados[c.k]);
    var zero=String(ST.dados[c.k]==null?'':ST.dados[c.k]).trim()==='0';
    function salvar(){ ST.dados[c.k]=zero?'0':G.map(function(g){ return (g.tp||'')+':'+g.n+(g.tp==='especial'&&g.N?':'+g.N:''); }).join(','); desenhar(); desenharDocs(); }
    function desenhar(){
      var tot=G.reduce(function(a,g){ return a+g.n; },0);
      w.innerHTML='<label>Quantas caixas de gordura?</label><input type="number" min="0" class="apr-cg-qtd'+(precisa&&!G.length&&!zero?' vazio':'')+'" value="'+(G.length||(zero?'0':''))+'" placeholder="ex.: 2">'
        +(G.length?'<div class="apr-cg-lista">'+G.map(function(g,i){
          return '<div class="apr-cg-row"><span class="apr-cg-n">Caixa '+(i+1)+'</span>'
            +'<label>modelo</label><select data-tp="'+i+'"'+(precisa&&!g.tp?' class="vazio"':'')+'><option value="">escolha…</option>'+CG_MODELOS.map(function(m){ return '<option'+(g.tp===m?' selected':'')+'>'+m+'</option>'; }).join('')+'</select>'
            +'<label>recebe</label><input type="number" min="1" value="'+g.n+'" data-n="'+i+'"><span>'+(g.n===1?'pia':'pias')+'</span>'
            +(g.tp==='especial'?'<label>N = pessoas que contribuem</label><input type="number" min="1" value="'+(g.N||'')+'" data-pn="'+i+'" placeholder="N"'+(precisa&&!g.N?' class="vazio"':'')+'>':'')+'</div>'; }).join('')+'</div>'
          +'<small class="apr-cg-tot">Total: '+tot+(tot===1?' pia':' pias')+' em '+G.length+(G.length===1?' caixa':' caixas')+'. Referência NBR 8160: pequena 1 pia · simples 2 · dupla 3 a 12 · especial mais de 12 (V = 2N + 20).</small>':'');
      var q=w.querySelector('.apr-cg-qtd'); q.addEventListener('change',function(){ var k=Math.max(0,parseInt(q.value,10)||0); zero=String(q.value).trim()!==''&&k===0; while(G.length<k) G.push({tp:'',n:1}); G.length=k; salvar(); });
      w.querySelectorAll('select[data-tp]').forEach(function(s){ s.addEventListener('change',function(){ G[+s.dataset.tp].tp=s.value; salvar(); }); });
      w.querySelectorAll('input[data-n]').forEach(function(inp){ inp.addEventListener('change',function(){ var v=parseInt(inp.value,10); G[+inp.dataset.n].n=v>0?v:1; salvar(); }); });
      w.querySelectorAll('input[data-pn]').forEach(function(inp){ inp.addEventListener('change',function(){ var v=parseInt(inp.value,10); G[+inp.dataset.pn].N=v>0?v:0; salvar(); }); });
    }
    desenhar(); grid.appendChild(w);
  }  var GR_INFO={'Imóvel / obra':1,'Terreno (declaração de posse)':1};
  function desenharCampos(){
    var box=$('apr-campos'); if(!box) return; box.innerHTML='';
    var lista=docsDe(ST.r, ST.proj&&ST.proj.tipo), grid=null, pular=false;
    desenharInfo(lista);
    CAMPOS.forEach(function(c){
      if(c.g){ pular=!!GR_INFO[c.g]; if(pular) return; }
      if(pular) return;
      if(c.g){ var h=document.createElement('div'); h.className='apr-grupo'; h.textContent=c.g; box.appendChild(h); if(c.g==='Proprietário') seletorProprietario(box); grid=document.createElement('div'); grid.className='apr-grid'; box.appendChild(grid); return; }
      if(c.soCom && !ehCom()) return;
      if(c.soCol && !ehCol()) return;
      if(c.soRede && ST.r.esgoto!=='sim') return;
      if(c.soLocal && ST.r.esgoto==='sim') return;
      if(c.soCis && !/^s/i.test(ST.dados.af_cisterna||'')) return;
      var precisa=(c.docs||[]).some(function(k){ return lista.indexOf(k)>=0; });
      if(c.img){ campoImagem(c,grid,precisa); return; }
      if(c.soApv && !/^s/i.test(ST.dados.apv||'')) return; /* sem aproveitamento: nada de aproveitamento aparece (nem as opções marcáveis) */
      if(c.multi){ /* várias opções marcáveis; guardado como "A, B, C" */
        var wm=document.createElement('div'); wm.style.gridColumn='1/-1';
        var atual=String(ST.dados[c.k]||'').toLowerCase();
        wm.innerHTML='<label>'+esc(c.l)+'</label><div style="display:flex;flex-wrap:wrap;gap:6px 18px;padding-top:4px">'+c.multi.map(function(o,i){ return '<label style="display:flex;align-items:center;gap:6px;font-weight:400;text-transform:none;letter-spacing:0;margin:0;cursor:pointer"><input type="checkbox" data-i="'+i+'"'+(atual.indexOf(o.toLowerCase())>=0?' checked':'')+' style="width:auto;margin:0">'+esc(o)+'</label>'; }).join('')+'</div>';
        var bx=wm.querySelectorAll('input[type=checkbox]'), lbm=wm.firstChild;
        var marcarVazio=function(){ lbm.style.color=(precisa && !String(ST.dados[c.k]||'').trim())?'#b3261e':''; };
        bx.forEach(function(b){ b.addEventListener('change',function(){ ST.dados[c.k]=[].filter.call(bx,function(x){ return x.checked; }).map(function(x){ return c.multi[+x.dataset.i]; }).join(', '); marcarVazio(); desenharDocs(); }); });
        marcarVazio(); grid.appendChild(wm); return; }
      if(c.grupos){ campoGrupos(c,grid,precisa); return; }
      if(c.casas){ if(ehCasas()) campoCasas(c,grid,precisa); return; }
      if(c.naoCasas && ehCasas()) return;
      if(c.soSum && !/^sum/i.test(ST.dados.esg_inf||'')) return;
      if(c.soVala && !/vala/i.test(ST.dados.esg_inf||'')) return;
      if(c.soFossa && ST.r.esgoto!=='sim' && /ete/i.test(ST.dados.esg_trat||'')) return;
      if(c.soTrat && ST.r.esgoto==='sim' && !/^s/i.test(ST.dados.pre_trat||'')) return;
      if(c.soRecE && !/^s/i.test(ST.dados.esg_rec||'')) return;
      if(c.soRecP && !/^s/i.test(ST.dados.pl_rec||'')) return;
      if(c.soApv && !/^s/i.test(ST.dados.apv||'')) return;
      if(c.soCasasF && !ehCasas()) return;
      if(c.soEnqRef && !ehEnqRef()) return;
      if(c.soOutro && !/^outro/i.test(ST.dados.cf_recurso||'')) return;
      if(c.soEte && !/ete/i.test(ST.dados.esg_trat||'')) return;
      if(c.soLao && ST.dados.vist_lic!=='SIM') return;
      if(c.soOleo && !/^s/i.test(ST.dados.oleo||'')) return;
      if(c.soLai && ST.dados.cf_8_1!=='SIM') return;
      if(c.soLeg && !/legaliza/i.test(ST.dados.enquadramento||'')) return;
      if(c.soPlu && !/pluvial/i.test(ST.dados.esg_inf||'')) return;
      if(c.soInf && /pluvial/i.test(ST.dados.esg_inf||'')) return;
      if(c.soMulti && !/multi/i.test((ST.proj&&ST.proj.tipo)||'')) return;
      if(c.k==='esg_sum_dim' && /ret/i.test(ST.dados.esg_sum_forma||'')) c=Object.assign({},c,{l:'Sumidouro: comprimento x largura (m)',ph:'ex.: 1,50 x 1,00'});
      if(c.opts){ var ws=document.createElement('div'), vOld=ST.dados[c.k]; if(vOld && c.opts.indexOf(vOld)<0) c=Object.assign({},c,{opts:[vOld].concat(c.opts)}); /* valor digitado antes continua aparecendo */ ws.innerHTML='<label>'+esc(c.l)+'</label><select><option value="">—</option>'+c.opts.map(function(o){ return '<option'+(ST.dados[c.k]===o?' selected':'')+'>'+esc(o)+'</option>'; }).join('')+'</select>'; var sl=ws.querySelector('select'); if(precisa && !sl.value) sl.classList.add('vazio'); sl.addEventListener('change',function(){ ST.dados[c.k]=sl.value; sl.classList.toggle('vazio', precisa && !sl.value); if(/^(af_cisterna|esg_inf|esg_sum_forma|esg_trat|esg_rec|pl_rec|apv|enquadramento|cf_recurso|vist_lic|oleo|pre_trat|cf_8_1)$/.test(c.k)) desenharCampos(); desenharDocs(); }); grid.appendChild(ws); return; }
      if(c.k==='descricao' && !String(ST.dados.descricao||'').trim()) ST.dados.descricao=descAuto();
      if(c.k==='reserv'||c.k==='cist_vol'){ try{ var cm=calcMemorial(ST.dados,true), cis=ehCol() && /^s/i.test(ST.dados.af_cisterna||''); c=Object.assign({},c,{ph:'mínimo '+nf(c.k==='cist_vol'?cm.consumo*0.6:cm.consumo*(cis?0.4:1),0)+' L'+(c.k==='reserv'&&ehCol()?' no total':'')}); }catch(e){} }
      var w=document.createElement('div'); if(c.largo) w.style.gridColumn='1/-1'; w.innerHTML='<label>'+esc(c.l)+'</label><input type="text" placeholder="'+esc(c.ph||'')+'" value="'+esc(ST.dados[c.k]||'')+'">';
      var inp=w.querySelector('input'); if(precisa && !inp.value.trim()) inp.classList.add('vazio');
      if(CLI_MAP[c.k] && ST.dados.prop_origem!=='outro'){ inp.readOnly=true; inp.classList.add('apr-ro'); if(!inp.value) inp.placeholder='vazio no cadastro'; }
      inp.addEventListener('input',function(){ ST.dados[c.k]=inp.value; inp.classList.toggle('vazio', precisa && !inp.value.trim()); desenharDocs(); });
      grid.appendChild(w);
    });
  }
  /* imagem do Google Earth: sobe para o armazenamento (bucket projeto-capas) e guarda o link nos dados do projeto */
  function campoImagem(c,grid,precisa){
    var w=document.createElement('div'); w.style.gridColumn='1/-1'; w.className='apr-img';
    var url=ST.dados[c.k]||'';
    w.innerHTML='<label>'+esc(c.l)+'</label><div class="apr-img-row">'+(url?'<img src="'+esc(url)+'" alt="">':'<span class="apr-img-vazio'+(precisa?' vazio':'')+'">nenhuma imagem</span>')
      +'<label class="pill ghost sm" style="cursor:pointer">'+IC.baixar.replace('M12 4v11M7 10l5 5 5-5','M12 15V4M7 9l5-5 5 5')+(url?'trocar imagem':'subir imagem')+'<input type="file" accept="image/png,image/jpeg" hidden></label>'
      +(url?'<button class="pill ghost sm" type="button" data-a="tirar">remover</button>':'')+'<small class="apr-img-nota"></small></div>';
    var inp=w.querySelector('input[type=file]'), nota=w.querySelector('.apr-img-nota');
    inp.addEventListener('change',async function(){
      var fl=inp.files&&inp.files[0]; if(!fl) return;
      nota.textContent='enviando…';
      var ext=/png/i.test(fl.type)?'png':'jpg', path='aprovacoes/'+ST.id+'-google-earth-'+Date.now()+'.'+ext;
      try{
        var up=await sb.storage.from('projeto-capas').upload(path,fl,{upsert:true,contentType:fl.type});
        if(up&&up.error) throw up.error;
        var pu=sb.storage.from('projeto-capas').getPublicUrl(path); ST.dados[c.k]=pu&&pu.data&&pu.data.publicUrl||'';
        desenharCampos(); desenharDocs(); var n=$('apr-note'); if(n) n.textContent='Imagem enviada — clique em salvar respostas e dados para guardar.';
      }catch(e){ nota.textContent='Não foi possível enviar: '+(e&&e.message||e); }
    });
    var tr=w.querySelector('[data-a=tirar]'); if(tr) tr.addEventListener('click',function(){ ST.dados[c.k]=''; desenharCampos(); desenharDocs(); });
    grid.appendChild(w);
  }
  var redesenharPj=null;
  window.carregarAprovacoes=async function(id){
    if(!id||!$('pj-apr')) return;
    ST.id=id; ST.r={}; ST.dados={}; ST.colunaOk=true; $('apr-note').textContent='';
    var r=await sb.from('projetos').select('id,nome,tipo,cliente_id,aprovacoes').eq('id',id).single();
    if(r.error){ ST.colunaOk=false; r=await sb.from('projetos').select('id,nome,tipo,cliente_id').eq('id',id).single(); }
    if(String(ST.id)!==String(id)) return;
    ST.proj=r.data||{};
    var ap=(ST.proj.aprovacoes&&typeof ST.proj.aprovacoes==='object')?ST.proj.aprovacoes:{};
    ['prefeitura','matricula','vigilancia','esgoto','habitese'].forEach(function(k){ ST.r[k]=ap[k]||''; });
    ST.dados=Object.assign({}, ap.dados||{});
    if(ST.proj.cliente_id){ try{ var c=await sb.from('clientes').select('*').eq('id',ST.proj.cliente_id).single(); ST.cli=c.data||null; }catch(e){ ST.cli=null; } }
    if(!ST.dados.prop_origem) ST.dados.prop_origem=(ST.dados.prop_nome && ST.cli && String(ST.dados.prop_nome).trim().toLowerCase()!==String(ST.cli.nome||'').trim().toLowerCase())?'outro':'cliente';
    if(ST.dados.prop_origem==='cliente') puxarCliente();
    if(!ST.dados.obra_cidade) ST.dados.obra_cidade='Florianópolis';
    redesenharPj=montarPerguntas($('pj-apr'), ST.r, function(){ desenharDocs(); desenharCampos(); }, function(){ return ST.proj&&ST.proj.tipo; });
    desenharDocs(); desenharCampos();
    if(!ST.colunaOk) $('apr-note').textContent='Para guardar as respostas, rode uma vez o arquivo sql-projetos-aprovacoes.sql no Supabase.';
  };
  if($('apr-salvar')) $('apr-salvar').addEventListener('click',function(){ salvarAprovacoes(false); });
  /* página do projeto aberta direto (atualizar a página): o roteador roda antes deste trecho existir — carrega agora */
  (function(){ var vp=document.getElementById('view-projeto'); if(vp && !vp.hidden && window.obraAtualId) window.carregarAprovacoes(window.obraAtualId); })();

  /* ---------- geração ---------- */
  function carregarScript(src){ return new Promise(function(res,rej){ var s=document.createElement('script'); s.src=src; s.onload=res; s.onerror=rej; document.head.appendChild(s); }); }
  function baixarDireto(blob,nome){ var a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download=nome; document.body.appendChild(a); a.click(); setTimeout(function(){ URL.revokeObjectURL(a.href); a.remove(); },1500); }
  /* ao gerar, o documento abre na tela para conferir; o download fica no botão "baixar" */
  var FALTA_ATUAL=[];
  async function baixar(blob,nome){
    var old=$('apr-previa'); if(old) old.remove();
    var ov=document.createElement('div'); ov.id='apr-previa'; ov.className='apr-previa';
    ov.innerHTML='<div class="apr-pv-bar"><b>'+esc(nome)+'</b>'+(FALTA_ATUAL.length?'<span class="apr-pv-falta">Faltam: '+esc(FALTA_ATUAL.join(', '))+' (sai com o espaço em branco)</span>':'')+'<span style="flex:1"></span><button class="pill solid sm" type="button" data-a="baixar">'+IC.baixar+'baixar</button><button class="pill ghost sm" type="button" data-a="fechar">fechar</button></div><div class="apr-pv-doc"><p class="apr-pv-msg">Montando a visualização…</p></div>';
    document.body.appendChild(ov);
    ov.querySelector('[data-a=baixar]').addEventListener('click',function(){ baixarDireto(blob,nome); });
    ov.querySelector('[data-a=fechar]').addEventListener('click',function(){ ov.remove(); });
    var box=ov.querySelector('.apr-pv-doc');
    try{
      var buf=await blob.arrayBuffer();
      if(/\.pdf$/i.test(nome)){
        if(!window.pdfjsLib){ await carregarScript('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js'); pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js'; }
        var doc=await pdfjsLib.getDocument({data:buf}).promise; box.innerHTML='';
        for(var p=1;p<=doc.numPages;p++){ var pg=await doc.getPage(p), vp=pg.getViewport({scale:1.4}), c=document.createElement('canvas'); c.width=vp.width; c.height=vp.height; box.appendChild(c); await pg.render({canvasContext:c.getContext('2d'),viewport:vp,annotationMode:pdfjsLib.AnnotationMode.ENABLE}).promise; }
      } else {
        if(!window.docx) await carregarScript('https://cdn.jsdelivr.net/npm/docx-preview@0.3.2/dist/docx-preview.min.js');
        box.innerHTML=''; await window.docx.renderAsync(buf, box, null, {inWrapper:true});
        /* brasão da conformidade: a visualização ignora a posição do Word; põe à esquerda do texto, como no arquivo */
        if(/^Declaração de Conformidade/.test(nome)) box.querySelectorAll('td p img').forEach(function(img){ var p=img.closest('p'), td=img.closest('td'); if(!p||!td) return; var dx=p.getBoundingClientRect().left-td.getBoundingClientRect().left; img.style.left=(12-dx)+'px'; img.style.zIndex='0'; });
        /* numeração: a visualização não reinicia os subitens (mostrava 2.9 em vez de 2.1); recalcula como o Word */
        (function(){ var cnt={}; box.querySelectorAll('p[class*="docx-num-"]').forEach(function(p){ var m=/docx-num-(\d+)-(\d+)/.exec(p.className); if(!m) return; var l=+m[2], c=cnt[m[1]]=cnt[m[1]]||[]; for(var i=0;i<l;i++) c[i]=c[i]||1; c[l]=(c[l]||0)+1; c.length=l+1; var ct=getComputedStyle(p,'::before').content; if(!/counter\(/.test(ct)) return; p.setAttribute('data-num', ct.replace(/counter\(docx-num-\d+-(\d+)\)|"((?:[^"\\]|\\.)*)"|\s+/g,function(a,k,s){ return k!=null?String(c[+k]||1):s!=null?s.replace(/\\9 ?/g,'  ').replace(/\\(.)/g,'$1'):''; })); }); })();
        var aviso=document.createElement('p'); aviso.className='apr-pv-msg'; aviso.textContent='Visualização aproximada do Word — o arquivo baixado abre no Word exatamente como o seu modelo (cabeçalho, logo e fontes).'; box.insertBefore(aviso, box.firstChild);
      }
    }catch(e){ box.innerHTML='<p class="apr-pv-msg">Não foi possível mostrar a visualização ('+esc(e&&e.message||e)+'). Use o botão baixar.</p>'; }
  }
  function nomeArq(s){ return String(s||'').replace(/[\\/:*?"<>|]/g,'').trim(); }
  function dataExtenso(){ var d=new Date(), M=['janeiro','fevereiro','março','abril','maio','junho','julho','agosto','setembro','outubro','novembro','dezembro']; return {dia:('0'+d.getDate()).slice(-2), mes:M[d.getMonth()], ano:String(d.getFullYear()), curta:('0'+d.getDate()).slice(-2)+'/'+('0'+(d.getMonth()+1)).slice(-2)+'/'+d.getFullYear()}; }
  function xmlEsc(s){ return String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
  async function gerar(k,btn){
    var f=faltando(k);
    FALTA_ATUAL=f; /* o que faltar aparece no topo da visualização */
    var txt=btn.innerHTML; btn.disabled=true; btn.textContent='gerando…';
    try{
      if(k==='posse') await gerarPosse(); else if(k==='viabilidade') await gerarViabilidade(); else if(k==='memorial') await gerarMemorial(); else if(k==='conformidade') await gerarConformidade(); else if(k==='vistoria') await gerarVistoria();
      $('apr-note').textContent=NOMES[k]+' gerado(a). ✓';
    }catch(e){ alert('Não foi possível gerar: '+(e&&e.message||e)); }
    finally{ btn.disabled=false; btn.innerHTML=txt; }
  }
  /* Declaração de posse: o próprio .docx do modelo, trocando só os trechos em branco */
  async function gerarPosse(){
    if(!window.JSZip) await carregarScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
    var D=ST.dados, b=function(v,n){ v=String(v||'').trim(); return v||new Array((n||12)+1).join('_'); }, dt=dataExtenso();
    var refEsq=String(D.ref||'').trim().replace(/^(a|à)\s+/i,''), nomeAss=String(D.prop_nome||'').trim().toUpperCase();
    var r=await fetch('modelos/declaracao-posse.docx'); if(!r.ok) throw new Error('modelo da declaração não encontrado');
    var zip=await JSZip.loadAsync(await r.arrayBuffer()), xml=await zip.file('word/document.xml').async('string');
    var trocas=[
      [/^Eu, /, 'Eu, '+b(D.prop_nome,30)+', com CPF de n° '+b(D.prop_cpf,20)+', residente e domiciliado à '+b(D.prop_end,40)+', bairro '+b(D.prop_bairro,18)+', na cidade de '+b(D.prop_cidade,24)+' declaro para os fins, que sou posseiro do imóvel de inscrição imobiliária (nº do IPTU) '+b(D.inscricao,'XX.XX.XXX.XXXX.XXX-XXX'.length)+', situado à '+b(D.obra_end,40)+(!semNumero(D.obra_num)?' N° '+String(D.obra_num).trim().replace(/^n\.?\s*[º°]\.?\s*/i,''):', s/nº')+', no bairro de '+b(D.obra_bairro,24)+', a '+(refEsq||'____ metros da Rua ____________________')+', com as seguintes características e confrontações:'],
      [/^Área de /, 'Área de '+b(D.t_area,18)+' metros quadrados;'],
      [/^Frente com /, 'Frente com '+b(D.t_frente,16)+' metros;'],
      [/^Fundos com /, 'Fundos com '+b(D.t_fundos,16)+' metros;'],
      [/^Lateral direita com /, 'Lateral direita com '+b(D.t_dir,12)+' metros;'],
      [/^Lateral esquerda com /, 'Lateral esquerda com '+b(D.t_esq,10)+' metros.'],
      [/^Florianópolis, /, 'Florianópolis, '+dt.dia+' de '+dt.mes+' de '+dt.ano+'.'],
      [/^\(posseiro\)$/, '\u0001']
    ];
    xml=xml.replace(/(<w:t(?: [^>]*)?>)([^<]*)(<\/w:t>)/g,function(m,a,tx,z){
      for(var i=0;i<trocas.length;i++){ if(trocas[i][0].test(tx)){ if(trocas[i][1]==='\u0001') return nomeAss?a.replace(/<w:t(?: [^>]*)?>/,'<w:t xml:space="preserve">')+xmlEsc(nomeAss)+'</w:t><w:br/><w:t xml:space="preserve">(posseiro)'+z:m; return a.replace(/<w:t(?: [^>]*)?>/,'<w:t xml:space="preserve">')+xmlEsc(trocas[i][1])+z; } }
      return m;
    });
    zip.file('word/document.xml',xml);
    var blob=await zip.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',compression:'DEFLATE'});
    baixar(blob,'Declaração de Posse - '+nomeArq(D.prop_nome||ST.proj.nome)+'.docx');
  }
  /* Consulta de viabilidade: o PDF oficial da CASAN com os campos preenchidos (continua editável) */
  async function gerarViabilidade(){
    if(!window.PDFLib) await carregarScript('https://cdnjs.cloudflare.com/ajax/libs/pdf-lib/1.17.1/pdf-lib.min.js');
    var D=ST.dados, dt=dataExtenso(), tipo=(ST.proj&&ST.proj.tipo)||'', and=parseInt(D.andares,10)||1;
    var r=await fetch('modelos/viabilidade-casan.pdf'); if(!r.ok) throw new Error('formulário da CASAN não encontrado');
    var pdf=await PDFLib.PDFDocument.load(await r.arrayBuffer()), form=pdf.getForm();
    var T=function(n,v){ try{ var f=form.getTextField(n); f.setText(String(v||'')); }catch(e){} };
    var C=function(n){ try{ form.getCheckBox(n).check(); }catch(e){} };
    T('PROPRIETÁRIO',D.prop_nome); T('CPFCNPJ',D.prop_cpf); T('EMAIL PARA CONTATO E RESPOSTA','engenheira.isys@gmail.com'); /* sempre o e-mail do escritório */ T('TELEFONE PARA CONTATO',D.prop_tel);
    T('ENDEREÇO DO PROPRIETÁRIO',D.prop_end); T('MUNICÍPIO',D.prop_cidade);
    T('MATRÍCULA DO REGISTRO DO IMÓVEL N', D.matricula_n||(ST.r.matricula==='nao'?'inexistente':''));
    T('ENDEREÇO DA OBRA',[D.obra_end,D.obra_num||'s/nº'].filter(Boolean).join(', ')); T('BAIRRO',D.obra_bairro); T('MUNICÍPIO_2',D.obra_cidade||'Florianópolis');
    T('NOME DO EMPREENDIMENTO',ST.proj&&ST.proj.nome);
    C('Caixa de verificação2'); /* finalidade: aprovação de projetos em prefeituras */
    /* tipo de empreendimento = tipo cadastrado no projeto (sem olhar o nº de pavimentos) */
    if(/comerc/i.test(tipo)) C('Caixa de verificação12');
    else if(/mist/i.test(tipo)) C('Caixa de verificação13');
    else if(/unifam|multifam|resid/i.test(tipo)) C('Caixa de verificação11');
    if(/comerc|mist/i.test(tipo)){ T('COMERCIAL Tipo de Comércio',D.com_tipo); var at=String(D.com_ativ||'').trim(), cut=at.length>85?at.lastIndexOf(' ',85):-1; if(cut>0){ T('Descrição das atividades 1',at.slice(0,cut)); T('Descrição das atividades 2',at.slice(cut+1)); } else T('Descrição das atividades 1',at); }
    T('Área construída total',D.area); T('quartos total',D.quartos); T('unid residenciais',D.unidades||'1'); T('andares',D.andares||'1'); T('Número de blocos','1');
    if(D.quartos||D.area_com||/comerc/i.test(tipo)){ var cm=calcMemorial(D,true,tipo); T('Consumo Estimado m³dia',nf(cm.consumo/1000)); } /* OT 04: 200 L × 2 pessoas/dormitório; comercial 50 L × 1 pessoa/7,5 m² */
    if(/comerc|mist/i.test(tipo) && D.area_com) T('Área total ocupada por salas',D.area_com);
    T('Local e Data','Florianópolis, '+dt.curta);
    /* imagem do Google Earth dentro do quadro do formulário */
    if(D.img_earth){ try{ var nm='O SOLICITANTE DEVERÁ COLAR IMAGEM DO GOOGLE EARTH HACHURAR OU CONTORNAR A ÁREA DA EDIFICAÇÃO CONDOMÍNIO OU LOTEAMENTO ONDE DEVERÁ FICAR CLARO E VISÍVEL A SITUAÇÃO EM RELAÇÃO ÀS RUAS DE ACESSO E DESTACAR REFERÊNCIAS', fld=form.getTextField(nm), wd=fld.acroField.getWidgets()[0], rc=wd.getRectangle(), ib=new Uint8Array(await (await fetch(D.img_earth)).arrayBuffer()), im=(ib[0]===0x89)?await pdf.embedPng(ib):await pdf.embedJpg(ib); var pgs=pdf.getPages(), pref=wd.P(), pg=pgs.find(function(p){ return pref&&p.ref===pref; })||pgs[0], pad=3, s=Math.min((rc.width-2*pad)/im.width,(rc.height-2*pad)/im.height), w=im.width*s, h=im.height*s; form.removeField(fld); pg.drawImage(im,{x:rc.x+(rc.width-w)/2,y:rc.y+(rc.height-h)/2,width:w,height:h}); }catch(e){ console.warn('imagem google earth',e); } }
    C('Caixa de verificação15'); /* água */
    if(ST.r.esgoto==='sim') C('Caixa de verificação16'); /* esgoto */
    try{ form.updateFieldAppearances(); }catch(e){}
    var bytes=await pdf.save();
    baixar(new Blob([bytes],{type:'application/pdf'}),'Consulta de Viabilidade CASAN - '+nomeArq(ST.proj&&ST.proj.nome)+'.pdf');
  }
  /* Memorial hidrossanitário: o próprio .docx do modelo; troca só os textos e recalcula
     reservatório, fossa séptica, filtro anaeróbio e sumidouros (NBR 7229 / 13969 / 17076). */
  function nf(v,d){ return Number(v).toLocaleString('pt-BR',{minimumFractionDigits:d==null?2:d,maximumFractionDigits:d==null?2:d}); }
  function num(s){ s=String(s==null?'':s).trim(); if(!s) return NaN; if(s.indexOf(',')>=0) s=s.replace(/\./g,'').replace(',','.'); return parseFloat(s); }
  function teto(v,p){ return Math.ceil(v/p-1e-9)*p; }
  function calcMemorial(D, esgotoRede, tipo){
    /* OT 04: residências uni/multifamiliares = 200 L/pessoa·dia, 2 pessoas/dormitório;
       áreas comerciais/administrativas = 50 L/pessoa·dia, 1 pessoa/7,5 m²; esgoto = 80% do consumo de água */
    tipo=tipo||(ST.proj&&ST.proj.tipo)||'';
    var soCom=/comerc/i.test(tipo), mis=/mist/i.test(tipo);
    var q=soCom?0:Math.max(1,parseInt(D.quartos,10)||1), Nr=2*q;
    var aCom=(soCom||mis)?((num(D.area_com)||0)||(soCom?(num(D.area)||0):0)):0, Nc=aCom>0?Math.ceil(aCom/7.5-1e-9):0;
    if(soCom && !Nc) Nc=1;
    var N=Nr+Nc, consumo=Nr*200+Nc*50, contrib=Nr*160+Nc*40;
    var RES=[500,750,1000,1500,2000,2500,3000,4000,5000,10000];
    var reserv=num(D.reserv)||0; /* reservatório adotado: sempre digitado pela Isys */
    var c={q:q,Nr:Nr,Nc:Nc,aCom:aCom,N:N,consumo:consumo,contrib:contrib,reserv:reserv,rede:!!esgotoRede};
    if(esgotoRede) return c;
    var T=contrib<=1500?1:contrib<=3000?0.92:contrib<=4500?0.83:contrib<=6000?0.75:contrib<=7500?0.67:contrib<=9000?0.58:0.5;
    c.T=T; c.K=65;
    c.vuF=1000+Nr*(160*T+65*1)+Nc*(40*T+65*0.2); /* fossa: Vu = 1000 + N(C·T + K·Lf) — Lf comercial 0,20 */
    c.vuA=1.6*contrib*T;                         /* filtro: Vu = 1,6·N·C·T */
    function cilindro(vu,hMin){ var Ds=[1.2,1.4,1.6,1.8,2.0,2.2,2.5]; for(var i=0;i<Ds.length;i++){ var r=Ds[i]/2, h=Math.max(hMin,teto(vu/1000/(Math.PI*r*r),0.05)); if(h<=2.2||i===Ds.length-1) return {d:Ds[i],r:r,h:h,v:Math.PI*r*r*h}; } }
    c.fossa=cilindro(c.vuF,1.2); c.filtro=cilindro(c.vuA,1.2);
    c.ci=num(D.ci); c.areaInf=c.ci>0?contrib/c.ci:NaN;
    /* cada sumidouro/vala recebe 100% ou 50% da área calculada (escolhido no preenchimento) */
    c.pct=/50/.test(D.esg_inf_pct||'')?0.5:1; c.areaUn=c.areaInf>0?c.areaInf*c.pct:NaN;
    /* vala: área = ((2 x altura) + largura) x comprimento, com altura = largura → comprimento = A / (3 x largura) */
    var lV=num(D.esg_vala_l)>0?num(D.esg_vala_l):0.5;
    c.vala={l:lV, cNec:c.areaUn>0?c.areaUn/(3*lV):NaN}; c.vala.c=c.areaUn>0?teto(c.vala.cNec,0.1):NaN; c.vala.a=(2*lV+lV)*c.vala.c;
    /* sumidouro: área = fundo + perímetro x altura (redondo: diâmetro; retangular: comprimento x largura) */
    var ret=/ret/i.test(D.esg_sum_forma||''), dm=String(D.esg_sum_dim||'').split(/\s*[x×X*]\s*/).map(num).filter(function(v){ return v>0; });
    var S={forma:ret?'ret':'red'};
    if(ret){ S.c=dm[0]||1.5; S.l=dm[1]||dm[0]||1; S.base=S.c*S.l; S.per=2*(S.c+S.l); }
    else { S.d=dm[0]||1; S.r=S.d/2; S.base=Math.PI*S.r*S.r; S.per=2*Math.PI*S.r; }
    S.hNec=c.areaUn>0?(c.areaUn-S.base)/S.per:NaN; S.h=S.hNec>0?teto(S.hNec,0.05):0.05; S.lat=S.per*S.h; S.a=S.base+S.lat;
    c.sum=S;
    return c;
  }
  async function gerarMemorial(){
    if(!window.JSZip) await carregarScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
    var D=ST.dados, dt=dataExtenso(), tipo=(ST.proj&&ST.proj.tipo)||'', rede=ST.r.esgoto==='sim';
    /* rede com pré-tratamento: fossa séptica + filtro anaeróbio antes da ligação na rede (cálculo igual ao sistema local, sem infiltração) */
    var preT=rede && /^s/i.test(D.pre_trat||''), c=calcMemorial(D,rede&&!preT);
    var uso=/multi/i.test(tipo)?'Residencial Multifamiliar':/comerc/i.test(tipo)?'Comercial':/mist/i.test(tipo)?'Misto (residencial e comercial)':'Residencial Unifamiliar';
    var b=function(v,n){ v=String(v||'').trim(); return v||new Array((n||12)+1).join('_'); };
    var r=await fetch('modelos/memorial-hidro.docx'); if(!r.ok) throw new Error('modelo do memorial não encontrado');
    var zip=await JSZip.loadAsync(await r.arrayBuffer()), xml=await zip.file('word/document.xml').async('string');
    var dec=function(s){ return s.replace(/&gt;/g,'>').replace(/&lt;/g,'<').replace(/&amp;/g,'&'); };
    var paras=[], re=/<w:p[ >][\s\S]*?<\/w:p>/g, m;
    while((m=re.exec(xml))){ var tx=dec((m[0].match(/<w:t(?: [^>]*)?>[^<]*<\/w:t>/g)||[]).map(function(t){ return t.replace(/<[^>]+>/g,''); }).join('')); paras.push({i:m.index,xml:m[0],tx:tx,novo:null}); }
    var cur=0;
    function achar(prefixo){ for(var i=cur;i<paras.length;i++){ if(paras[i].tx.replace(/\s+/g,' ').trim().indexOf(prefixo)===0){ cur=i+1; return paras[i]; } } throw new Error('trecho do modelo não encontrado: '+prefixo); }
    /* troca o texto mantendo a formatação: as primeiras "manter" partes ficam; cada linha (entre quebras) vai para a 1ª parte daquela linha */
    function editar(p, manter, linhas){
      var nT=0, seg=0, usado={};
      p.novo=p.xml.replace(/<w:br\/>|<w:t(?: [^>]*)?>[^<]*<\/w:t>/g,function(tok){
        if(tok==='<w:br/>'){ seg++; return tok; }
        nT++; if(nT<=manter) return tok;
        if(usado[seg] || linhas[seg]==null){ return '<w:t xml:space="preserve"></w:t>'; }
        usado[seg]=1; return '<w:t xml:space="preserve">'+xmlEsc(linhas[seg])+'</w:t>';
      });
    }
    function trocar(prefixo,manter,linhas){ editar(achar(prefixo),manter,Array.isArray(linhas)?linhas:[linhas]); }
    /* apaga até o próximo título, mas deixa 1 linha em branco antes dele (espaçamento do modelo) */
    function apagarAte(prefixoFim){ var ini=cur; var p=achar(prefixoFim), fim=paras.indexOf(p), branco=-1;
      for(var j=fim-1;j>=ini;j--){ if(!paras[j].tx.trim() && paras[j].xml.indexOf('<w:drawing')<0){ branco=j; break; } }
      for(var i=ini;i<fim;i++){ if(i!==branco && paras[i].xml.indexOf('<w:drawing')<0) paras[i].novo=''; } cur=fim; }
    /* tira as linhas em branco logo antes de p (título seguido direto do texto) */
    function semBrancoAntes(p){ for(var i=paras.indexOf(p)-1;i>=0 && !paras[i].tx.trim() && paras[i].xml.indexOf('<w:drawing')<0 && paras[i].xml.indexOf('<w:numPr>')<0;i--) paras[i].novo=''; }
    /* "(Não aplicável a este projeto)" sem negrito, igual ao modelo */
    var naXml=(paras.filter(function(x){ return x.tx.trim()==='(Não aplicável a este projeto)'; })[0]||{}).xml||'';
    /* rótulo em negrito fica; o valor vai no texto normal (como no modelo) */
    function rotulo(prefixo,valor){ var p=achar(prefixo), feito=false, bTx='';
      var nova=p.xml.replace(/<w:r[ >][\s\S]*?<\/w:r>/g,function(r){
        if(!/<w:t[ >]/.test(r)) return r;
        var bd=/<w:b\/>|<w:b w:val="(1|true)"\/>/.test((r.match(/<w:rPr>[\s\S]*?<\/w:rPr>/)||[''])[0]);
        if(bd && !feito){ bTx+=r.replace(/<w:t(?: [^>]*)?>([^<]*)<\/w:t>|<[^>]+>/g,'$1'); return r; }
        var primeiro=!feito, k=0; feito=true;
        return r.replace(/<w:t(?: [^>]*)?>[^<]*<\/w:t>/g,function(){ k++; var v=(primeiro&&k===1)?(/\s$/.test(bTx)?'':' ')+valor:''; return '<w:t xml:space="preserve">'+xmlEsc(v)+'</w:t>'; });
      });
      if(feito) p.novo=nova; else editar(p,1,[' '+valor]); }
    var endObra=b(D.obra_end,30)+', '+(String(D.obra_num||'').trim()||'snº')+', no bairro de '+b(D.obra_bairro,18)+' - Florianópolis';
    /* textos que mudam conforme o uso (residencial / comercial / misto) */
    var Tn=(c.T===1?'1':nf(c.T)), pR=c.Nr>0, pC=c.Nc>0;
    var nfa=function(v){ return nf(v, v%1?2:0); };
    var popTxt=[pR?'2 pessoas por dormitório = 2 x '+c.q+' = '+c.Nr+(pC?' (residencial)':''):'', pC?'1 pessoa / 7,5 m² = '+nfa(c.aCom)+' / 7,5 = '+c.Nc+(pR?' (comercial)':''):''].filter(Boolean).join(' + ')+((pR&&pC)?' = '+c.N:'')+' contribuintes';
    var parc=function(lr,lc){ return [pR?'('+c.Nr+' hab. x '+lr+' litros/dia)':'', pC?'('+c.Nc+' pessoas x '+lc+' litros/dia)':''].filter(Boolean).join(' + '); };
    var cDesc=[pR?'160L/hab.dia':'', pC?'40L/pessoa.dia'+(pR?' no comercial':''):''].filter(Boolean).join(' e ');
    var contribPP='Contribuição por pessoa = '+[pR?'200 litros x 80% = 160 litros':'', pC?'50 litros x 80% = 40 litros'+(pR?' (comercial)':''):''].filter(Boolean).join(' / ');
    trocar('Descrição da Edificação',1,': '+(String(D.descricao||'').trim()||descAuto()).replace(/,\s*$/,'.'));
    rotulo('Inscrição imobiliária',b(D.inscricao,22));
    rotulo('Uso',uso);
    rotulo('Proprietário',b(D.prop_nome,30).toUpperCase()+', CPF: '+b(D.prop_cpf,14)+'.');
    trocar('Local:',1,' '+endObra);
    trocar('Área total da edificação:',1,' '+b(D.area,8)+' m²');
    rotulo('População:',popTxt);
    /* 2.1 água fria — descrição: torneiras de jardim, reservatório(s), cisterna e água quente */
    (function(){
      var EXT=['','uma','duas','três','quatro','cinco','seis','sete','oito','nove','dez'];
      var nT=parseInt(D.af_torneiras,10); if(isNaN(nT)) nT=1;
      var col=/multi|comerc|mist/i.test(tipo), nR=Math.max(1,parseInt(D.af_reserv_n,10)||1);
      var res=col?(nR>1?'dos '+(EXT[nR]==='duas'?'dois':(EXT[nR]==='uma'?'um':(EXT[nR]||nR)))+' reservatórios superiores coletivos':'do reservatório superior coletivo'):((parseInt(D.unidades,10)||1)>1?'do reservatório superior de cada unidade':'do reservatório superior');
      var cis=col && /^s/i.test(D.af_cisterna||''), aq=/^s/i.test(D.af_quente||''); /* unifamiliar nunca tem cisterna */
      var ini=nT>0?'O sistema predial de água fria prevê fornecimento com distribuição direta para '+(EXT[nT]||nT)+(nT===1?' torneira':' torneiras')+' de jardim, e indireta a partir '+res+', para os demais pontos de consumo por meio dos ramais de distribuição definidos em projeto.'
                 :'O sistema predial de água fria prevê fornecimento com distribuição indireta a partir '+res+', para todos os pontos de consumo por meio dos ramais de distribuição definidos em projeto.';
      var fim=(cis?'A edificação possui cisterna'+(col?' coletiva':'')+' de água potável':'Não há cisternas de água potável')+' e '+(aq?(cis?'possui':'a edificação possui')+' instalação de água quente.':'não há instalação de água quente.');
      trocar('O sistema predial de água fria',0,ini+' '+fim);
    })();
    trocar('População = ',0,'População = '+c.N+' habitantes;');
    trocar('Consumo = ',0,'Consumo = '+parc(200,50)+' = '+nf(c.consumo,0)+' Litros;');
    /* 2.3 e 2.4: com cisterna, 60% do consumo fica na cisterna e 40% no reservatório superior */
    var colM=/multi|comerc|mist/i.test(tipo), cisM=colM && /^s/i.test(D.af_cisterna||''), nRM=colM?Math.max(1,parseInt(D.af_reserv_n,10)||1):1;
    function acrescentar(p,linhas){ var base=p.xml.replace(/<w:br\/>/g,''); p.novo=(p.novo==null?p.xml:p.novo)+linhas.map(function(l){ var n=0; return base.replace(/<w:t(?: [^>]*)?>[^<]*<\/w:t>/g,function(){ n++; return '<w:t xml:space="preserve">'+(n===1?xmlEsc(l):'')+'</w:t>'; }); }).join(''); }
    var pVM=achar('Valores Mínimos = '); editar(pVM,0,['Valores Mínimos = '+nf(c.consumo,0)+' litros']);
    /* unifamiliar com mais de uma casa: cada casa tem seu reservatório → 2.3 e 2.4 por casa (casas iguais ficam juntas) */
    var QC=lerCasas(D.quartos_casas), RC=lerCasas(D.quartos_casas,1), nUG=Math.max(1,parseInt(D.unidades,10)||1);
    var casasM=!colM && nUG>1 && QC.length===nUG && QC.every(function(q){ return q>0; });
    function linhaP(base,tx){ var k=0; return base.replace(/<w:br\/>/g,'').replace(/<w:t(?: [^>]*)?>[^<]*<\/w:t>/g,function(){ k++; return '<w:t xml:space="preserve">'+(k===1?xmlEsc(tx):'')+'</w:t>'; }); }
    function nomesCasas(n){ return n.length===1?'Casa '+n[0]:'Casas '+n.slice(0,-1).join(', ')+' e '+n[n.length-1]; }
    function agrupar(L){ var G=[]; L.forEach(function(v,i){ var g=G.filter(function(x){ return x.v===v; })[0]; if(!g){ g={v:v,n:[]}; G.push(g); } g.n.push(i+1); }); return G; }
    if(casasM){
      var iV=paras.indexOf(pVM), pPo=paras[iV-2], pCs=paras[iV-1], brX=paras[iV+1].xml;
      var rotX=(paras.filter(function(x){ return x.tx.trim()==='FOSSA SÉPTICA'; })[0]||{}).xml||brX;
      pPo.novo=agrupar(QC).map(function(g,j){ var Nh=2*g.v, cs=Nh*200;
        return (j?brX:'')+linhaP(rotX,nomesCasas(g.n)+(g.n.length>1?' – cada uma com ':' – ')+g.v+(g.v===1?' dormitório:':' dormitórios:'))
          +linhaP(pPo.xml,'População = '+Nh+' habitantes;')+linhaP(pCs.xml,'Consumo = ('+Nh+' hab. x 200 litros/dia) = '+nf(cs,0)+' Litros;')+linhaP(pVM.xml,'Valores Mínimos = '+nf(cs,0)+' litros'); }).join('');
      pCs.novo=''; pVM.novo='';
    }
    if(cisM) acrescentar(pVM,['Cisterna (reservatório inferior) = 60% x '+nf(c.consumo,0)+' = '+nf(c.consumo*0.6,0)+' litros','Reservatório superior = 40% x '+nf(c.consumo,0)+' = '+nf(c.consumo*0.4,0)+' litros']);
    var vRes=num(D.reserv)>0?nf(num(D.reserv),0):'______', vCis=num(D.cist_vol)>0?nf(num(D.cist_vol),0):'______';
    var pRA=achar('1 reservatório de'); editar(pRA,0,[nRM+(nRM===1?' reservatório':' reservatórios')+(cisM?(nRM===1?' superior':' superiores'):'')+(colM?(nRM===1?' coletivo':' coletivos'):'')+' de '+vRes+' litros']);
    if(cisM) acrescentar(pRA,['1 cisterna'+(colM?' coletiva':'')+' de '+vCis+' litros']);
    if(casasM){ var linR=agrupar(QC.map(function(q,i){ return RC[i]||0; })).map(function(g){ return nomesCasas(g.n)+': 1 reservatório de '+(g.v>0?nf(g.v,0):'______')+' litros'+(g.n.length>1?' cada':''); });
      editar(pRA,0,[linR[0]]); if(linR.length>1) acrescentar(pRA,linR.slice(1)); }
    /* 2.5: com RTI, volume total reservado – RTI = volume aproveitável (sem RTI fica "não aplicável") */
    var rtiM=num(D.rti)||0;
    if(colM && rtiM>0){ achar('Volume total aproveitável'); var pNA=achar('(Não aplicável'); var totM=nRM*(num(D.reserv)||0)+(cisM?(num(D.cist_vol)||0):0);
      editar(pNA,0,['Volume total reservado = '+nf(totM,0)+' litros']); acrescentar(pNA,['RTI = '+nf(rtiM,0)+' litros','Volume aproveitável = '+nf(totM,0)+' – '+nf(rtiM,0)+' = '+nf(totM-rtiM,0)+' litros']); }
    /* 2.6: com cisterna há recalque até o reservatório superior */
    if(cisM){ achar('Cálculo do sistema de recalque'); var pRc=achar('(Não aplicável'); var hM=num(D.rec_horas)>0?num(D.rec_horas):4, qh=c.consumo/hM;
      editar(pRc,0,['Volume diário = '+nf(c.consumo,0)+' litros']); acrescentar(pRc,['Tempo de funcionamento da bomba = '+nf(hM,hM%1?1:0)+' horas','Vazão de recalque = '+nf(c.consumo,0)+' / '+nf(hM,hM%1?1:0)+' = '+nf(qh,0)+' L/h = '+nf(qh/3600)+' L/s','Bomba adotada: '+(String(D.rec_bomba||'').trim()||'______')]); }
    /* 2.7: extravasão — texto fixo; com cisterna, acrescenta a da cisterna */
    if(cisM){ var pEx=achar('Limpeza e extravasão'); acrescentar(pEx,['A limpeza e extravasão da cisterna são direcionadas à caixa de areia/drenagem pluvial em local visível.']); }
    /* 2.8: hidrômetros — unifamiliar: 1 por casa (até 3 no lote); multifamiliar/comercial/misto: coletivo + medidores individuais */
    (function(){
      var EXm=['','um','dois','três','quatro','cinco','seis','sete','oito','nove','dez'], nU=Math.max(1,parseInt(D.unidades,10)||1), tx;
      if(colM) tx='Utilizado 1 (um) hidrômetro coletivo na testada do lote conforme normas da concessionária, e medidores de água individuais para cada unidade, instalados em local comum e de fácil acesso.';
      else if(nU>1) tx='Utilizados '+nU+' ('+(EXm[nU]||nU)+') hidrômetros individuais, um para cada unidade, na testada do lote conforme normas da concessionária.';
      else tx='Utilizado 1 (um) hidrômetro individual na testada do lote conforme normas da concessionária.';
      trocar('Utilizado 1',0,tx);
    })();
    /* 2.9: materiais — água quente em PPR; material dos reservatórios (coletivos) e da cisterna */
    (function(){
      var mr=String(D.mat_reserv||'').toLowerCase(), mc=String(D.mat_cist||'').toLowerCase(), aqM=/^s/i.test(D.af_quente||'');
      var reservTx=(!colM||!mr||/poliet|pead/.test(mr))?'de polietileno de alta densidade (PEAD)':/fibra/.test(mr)?'de fibra de vidro':'em concreto armado';
      var nomeRes=(!colM&&nUG>1)?'reservatórios superiores (um por unidade)':nRM>1?'reservatórios superiores':'reservatório superior';
      var cisTx=cisM?', cisterna '+(/poliet|pead/.test(mc)?'de polietileno de alta densidade (PEAD)':/concreto/.test(mc)?'em concreto armado impermeabilizado':'em ______'):'';
      trocar('Tubulação de água fria em PVC',0,'Tubulação de água fria em PVC'+(aqM?', tubulação de água quente em PPR':'')+', registros e válvulas em PVC com acabamento cromado, '+nomeRes+' '+reservTx+cisTx+'.');
    })();
    /* 3.2 caixa de inspeção (texto fixo, corrigido); edita sem mover a ordem de busca */
    (function(){ var p=paras.filter(function(x){ return x.tx.replace(/\s+/g,' ').trim().indexOf('As caixas serão de 0,60')===0; })[0]; if(p) editar(p,0,['As caixas serão de 0,60 x 0,60 m e no máximo 1 metro de altura.']); })();
    /* 3.3 caixas de gordura — uma por grupo de pias; tipo pela NBR 8160 5.1.5.1.3 (pequena = medidas do modelo) */
    (function(){
      function pAt(pre){ return paras.filter(function(x){ return x.tx.replace(/\s+/g,' ').trim().indexOf(pre)===0; })[0]; }
      var p1=pAt('De acordo com o item 5.1.5.1.3'), p2=pAt('com contribuição de'), pCo=pAt('Comprimento:'), pLa=pAt('Largura:'), pSe=pAt('Parte submersa do septo'), pCa=pAt('Capacidade de retenção'), pDN=pAt('Diâmetro nominal da tubulação de saída');
      if(!p1||!p2||!pCo||!pLa||!pSe||!pCa||!pDN) return;
      /* 0 caixas informadas: item não aplicável */
      if(String(D.cg_grupos==null?'':D.cg_grupos).trim()==='0'){ p1.novo=naXml||linha0(p1.xml); [p2,pCo,pLa,pSe,pCa,pDN].forEach(function(p){ p.novo=''; }); semBrancoAntes(p1); return; }
      function linha0(b){ var k=0; return b.replace(/<w:t(?: [^>]*)?>[^<]*<\/w:t>/g,function(){ k++; return '<w:t xml:space="preserve">'+(k===1?'(Não aplicável a este projeto)':'')+'</w:t>'; }); }
      var G=lerGrupos(D.cg_grupos).map(function(g){ return {tp:g.tp||tipoCG(g.n), n:g.n, N:g.N}; }); if(!G.length) G=[{tp:'pequena',n:1}];
      var totP=G.reduce(function(a,g){ return a+g.n; },0);
      var LET={pequena:'a',simples:'b',dupla:'c',especial:'d'}, PL={pequena:'pequenas',simples:'simples',dupla:'duplas',especial:'especiais'};
      /* agrupa por tipo, na ordem em que aparecem */
      var tipos=[], por={}, NP={}; G.forEach(function(g,gi){ var tp=g.tp==='especial'?'especial#'+gi:g.tp; if(!por[tp]){ por[tp]=[]; tipos.push(tp); } por[tp].push(g.n); if(g.tp==='especial') NP[tp]=g.N; });
      function linha(base,tx){ var k=0; return base.replace(/<w:br\/>/g,'').replace(/<w:t(?: [^>]*)?>[^<]*<\/w:t>/g,function(){ k++; return '<w:t xml:space="preserve">'+(k===1?xmlEsc(tx):'')+'</w:t>'; }); }
      var out='';
      tipos.forEach(function(key,ti){
        var tp=key.split('#')[0], L=por[key], n=L.length, iguais=L.every(function(x){ return x===L[0]; });
        var pp=function(k){ return k+(k===1?' pia':' pias'); };
        if(ti>0) out+=linha(p1.xml,'');
        out+=linha(p1.xml,'De acordo com o item 5.1.5.1.3.'+LET[tp]+' da NBR 8160/99'+(ti===0?(n>1?' serão '+n+' caixas de gordura '+PL[tp]+',':' a caixa será 1 caixa de gordura '+tp+','):(n>1?', também serão adotadas '+n+' caixas de gordura '+PL[tp]+',':', também será adotada 1 caixa de gordura '+tp+',')));
        out+=linha(p2.xml,'com contribuição de '+(n>1?(iguais?pp(L[0])+' cada':'respectivamente '+L.join(', ')+' pias'):pp(L[0]))+', com as seguintes dimensões mínimas'+(n>1?' (cada caixa)':'')+':');
        var dims;
        if(tp==='pequena') dims=['Comprimento: 0,30 m;','Largura: 0,30 m;','Parte submersa do septo: 0,20 m;','Capacidade de retenção: 120 L;','Diâmetro nominal da tubulação de saída: DN 100mm.'];
        else if(tp==='simples') dims=['Diâmetro interno: 0,40 m;','Parte submersa do septo: 0,20 m;','Capacidade de retenção: 31 L;','Diâmetro nominal da tubulação de saída: DN 75mm.'];
        else if(tp==='dupla') dims=['Diâmetro interno: 0,60 m;','Parte submersa do septo: 0,35 m;','Capacidade de retenção: 120 L;','Diâmetro nominal da tubulação de saída: DN 100mm.'];
        else { /* especial: V = 2N + 20, N = pessoas servidas pelas pias desta caixa */
          var Np=NP[key]||0, V=Np?2*Np+20:0;
          dims=['Formato prismático de base retangular;',(Np?'Volume da câmara de retenção: V = 2 x N + 20 = 2 x '+Np+' + 20 = '+nf(V,0)+' L (N = '+Np+' pessoas);':'Volume da câmara de retenção: V = 2 x N + 20 = 2 x ____ + 20 = ____ L;'),'Parte submersa do septo: 0,40 m;','Altura molhada: 0,60 m;','Diâmetro nominal da tubulação de saída: DN 100mm.'];
        }
        dims.forEach(function(d){ out+=linha(pCo.xml,d); });
      });
      p1.novo=out; [p2,pCo,pLa,pSe,pCa,pDN].forEach(function(p){ p.novo=''; });
    })();    if(rede && !preT){
      var eteM=/ete/i.test(D.esg_destino||''); /* rede pública (padrão) ou ETE do condomínio/loteamento */
      trocar('O sistema predial de esgoto prevê',0,'O sistema predial de esgoto prevê a geração de efluentes junto aos pontos de consumo de água e coleta por meio de ramais e sub-ramais de esgoto definidos em projeto. Foram dimensionadas as tubulações de ventilação conforme norma técnica vigente. Todos os pontos de geração de esgoto coletados são conduzidos '+(eteM?'à rede coletora do condomínio/loteamento e tratados na ETE (estação de tratamento de esgoto) do empreendimento.':'à rede coletora pública de esgoto.'));
      trocar('Sistema local de tratamento.',0,eteM?'ETE (estação de tratamento de esgoto) do condomínio/loteamento.':'Rede coletora pública de esgoto (CASAN).');
      var pSC=achar('Sistema composto por'); editar(pSC,0,['(Não aplicável a este projeto)']); semBrancoAntes(pSC);
      apagarAte('Cálculo de contribuição diária');
      trocar('População = ',0,'População = '+c.N+' habitantes.');
      trocar('Contribuição por pessoa',0,contribPP);
      trocar('Valores Mínimos = (',0,'Valores Mínimos = '+parc(160,40)+' = '+nf(c.contrib,0)+' Litros.');
      trocar('Dimensionamento das unidades do sistema de tratamento de esgoto',0,'Dimensionamento das unidades do sistema de tratamento de esgoto.');
      var pNA=achar('FOSSA SÉPTICA'); pNA.novo=naXml; semBrancoAntes(pNA);
      apagarAte('Dimensões úteis adotadas');
      var pD=achar('FOSSA SÉPTICA'); pD.novo=naXml; semBrancoAntes(pD);
      apagarAte('Dimensionamento do volume do poço de recalque');
    } else {
      /* 3.4.1: fossa+filtro ou ETE compacta; sumidouros ou valas (quantidade digitada);
         unifamiliar com 2–3 casas = um sistema por casa; multi/comercial/misto = sistema coletivo */
      var steM=!preT && /ete/i.test(D.esg_trat||''), valaM=!preT && /vala/i.test(D.esg_inf||''), nInf=parseInt(D.esg_inf_n,10)||0;
      var pluM=!rede && /pluvial/i.test(D.esg_inf||''); /* sistema local com lançamento do efluente tratado na rede pluvial (sem infiltração) */
      var infTx=(nInf||'____')+' '+(valaM?(nInf===1?'vala de infiltração':'valas de infiltração'):(nInf===1?'sumidouro':'sumidouros'));
      var compTx='composto por '+(steM?'1 ETE (estação de tratamento de esgoto) compacta':'1 Fossa Séptica, 1 Filtro Anaeróbio')+' e '+infTx+' com';
      var nCasas=Math.max(1,parseInt(D.unidades,10)||1);
      if(preT){
        var eteP=/ete/i.test(D.esg_destino||''), destP=eteP?'à rede coletora do condomínio/loteamento e tratados na ETE (estação de tratamento de esgoto) do empreendimento.':'à rede coletora pública de esgoto.';
        trocar('O sistema predial de esgoto prevê',0,'O sistema predial de esgoto prevê a geração de efluentes junto aos pontos de consumo de água e coleta por meio de ramais e sub-ramais de esgoto definidos em projeto. Foram dimensionadas as tubulações de ventilação conforme norma técnica vigente. Todos os pontos de geração de esgoto coletados passam por pré-tratamento em fossa séptica e filtro anaeróbio e, em seguida, são conduzidos '+destP);
        trocar('Sistema local de tratamento.',0,(eteP?'ETE (estação de tratamento de esgoto) do condomínio/loteamento':'Rede coletora pública de esgoto (CASAN)')+', após pré-tratamento em fossa séptica e filtro anaeróbio.');
        var preTx='composto por 1 Fossa Séptica e 1 Filtro Anaeróbio, com lançamento do efluente tratado na '+(eteP?'rede coletora do condomínio/loteamento.':'rede coletora pública de esgoto.');
        trocar('Sistema composto por',0,ehCol()?'Pré-tratamento coletivo '+preTx:nCasas>1?'Cada unidade habitacional ('+nCasas+' unidades) possui seu próprio pré-tratamento, '+preTx:'Pré-tratamento '+preTx);
        achar('1,50 metros de distância').novo='';
      } else if(pluM){
        trocar('Sistema local de tratamento.',0,'Sistema local de tratamento, com lançamento do efluente tratado na rede pluvial.');
        var pluTx='composto por '+(steM?'1 ETE (estação de tratamento de esgoto) compacta':'1 Fossa Séptica e 1 Filtro Anaeróbio')+', com lançamento do efluente tratado na rede pluvial.';
        trocar('Sistema composto por',0,ehCol()?'Sistema coletivo '+pluTx:nCasas>1?'Cada unidade habitacional ('+nCasas+' unidades) possui seu próprio sistema de tratamento, '+pluTx:'Sistema '+pluTx);
        achar('1,50 metros de distância').novo='';
      } else
      trocar('Sistema composto por',0,ehCol()?'Sistema coletivo '+compTx:nCasas>1?'Cada unidade habitacional ('+nCasas+' unidades) possui seu próprio sistema de tratamento, '+compTx:'Sistema '+compTx);
      /* 3.4.2 a 3.4.4: unifamiliar com mais de uma casa → um cálculo por casa (casas com os mesmos quartos ficam juntas) */
      var qC=lerCasas(D.quartos_casas), GC=null;
      if(!ehCol() && nCasas>1 && qC.length===nCasas && qC.every(function(q){ return q>0; })){ GC=[];
        qC.forEach(function(q,i){ var g=GC.filter(function(x){ return x.q===q; })[0]; if(!g){ g={q:q,casas:[],c:calcMemorial(Object.assign({},D,{quartos:String(q)}),false,tipo)}; GC.push(g); } g.casas.push(i+1); }); }
      if(!GC) calcEsgoto();
      else {
        var iRef=function(pre,de){ for(var i=de;i<paras.length;i++){ if(paras[i].tx.replace(/\s+/g,' ').trim().indexOf(pre)===0) return i; } throw new Error('trecho do modelo não encontrado: '+pre); };
        var vazio=function(i){ return !paras[i].tx.trim() && paras[i].xml.indexOf('<w:drawing')<0; };
        var linhaX=function(base,tx){ var k=0; return base.replace(/<w:br\/>/g,'').replace(/<w:t(?: [^>]*)?>[^<]*<\/w:t>/g,function(){ k++; return '<w:t xml:space="preserve">'+(k===1?xmlEsc(tx):'')+'</w:t>'; }); };
        var iC=iRef('Cálculo de contribuição diária',cur), iU=iRef('Dimensionamento das unidades do sistema de tratamento de esgoto',iC), iA=iRef('Dimensões úteis adotadas',iU), iP=iRef('Dimensionamento do volume do poço de recalque',iA);
        var baseRot=paras[iRef('FOSSA SÉPTICA',iU)].xml, brancoXml=''; for(var ib=iU;ib<iA;ib++){ if(vazio(ib)){ brancoXml=paras[ib].xml; break; } }
        var SEG=[[iC+1,iU],[iU+1,iA],[iA+1,iP]].map(function(s){ var a=s[0], z=s[1]; while(a<z&&vazio(a)) a++; while(z>a&&vazio(z-1)) z--; return {ini:s[0],fim:s[1],a:a,z:z,out:[]}; });
        var cTot=c;
        GC.forEach(function(g){ c=g.c; for(var i=iC+1;i<iP;i++) paras[i].novo=null; cur=iC; calcEsgoto();
          SEG.forEach(function(s){ var tx=''; for(var i=s.a;i<s.z;i++) tx+=(paras[i].novo==null?paras[i].xml:paras[i].novo); s.out.push(tx); }); });
        c=cTot; Tn=(c.T===1?'1':nf(c.T));
        var rotCasa=function(g){ var n=g.casas, dm=g.q+(g.q===1?' dormitório':' dormitórios');
          return n.length===1?'Casa '+n[0]+' – '+dm+' ('+g.c.N+' habitantes):':'Casas '+n.slice(0,-1).join(', ')+' e '+n[n.length-1]+' – cada uma com '+dm+' ('+g.c.N+' habitantes cada):'; };
        SEG.forEach(function(s){ var out=GC.map(function(g,j){ return (j?brancoXml:'')+linhaX(baseRot,rotCasa(g))+s.out[j]; }).join('');
          for(var i=s.ini;i<s.fim;i++) paras[i].novo=(i<s.a||i>=s.z)?null:(i===s.a?out:''); });
        cur=iP;
      }
      /* 3.7 materiais: acrescenta fossa, filtro (se não for ETE) e sumidouro ou vala */
      (function(){ var pM=paras.filter(function(x){ return x.tx.replace(/\s+/g,' ').trim().indexOf('Tubulação de esgoto em PVC')===0; })[0]; if(!pM) return;
        var mt=function(v){ v=String(v||'').toLowerCase(); return /poliet/.test(v)?'em polietileno':/fibra/.test(v)?'em fibra de vidro':/concreto/.test(v)?'em concreto':'em ______'; };
        var it=[]; if(!steM){ it.push('fossa séptica '+mt(D.mat_fossa)); it.push('filtro anaeróbio '+mt(D.mat_filtro)); }
        if(!preT && !pluM) it.push(valaM?(nInf===1?'vala de infiltração':'valas de infiltração')+' com tubulação de PVC perfurada envolta em brita'
          :(nInf===1?'sumidouro ':'sumidouros ')+(/alven/i.test(D.mat_sum||'')?'em alvenaria de blocos/tijolos':/concreto/i.test(D.mat_sum||'')?'em anéis de concreto':'em ______'));
        it.unshift('caixa de passagem/inspeção em concreto');
        var lst=['Tubulação de esgoto em PVC'].concat(it); editar(pM,0,[lst.slice(0,-1).join(', ')+' e '+lst[lst.length-1]+'.']); })();
    }
    function calcEsgoto(){
      var S=c.sum, F=c.fossa, A=c.filtro; Tn=(c.T===1?'1':nf(c.T));
      trocar('População = ',0,'População = '+c.N+' habitantes.');
      trocar('Contribuição por pessoa',0,contribPP);
      trocar('Valores Mínimos = (',0,'Valores Mínimos = '+parc(160,40)+' = '+nf(c.contrib,0)+' Litros.');
      var tInf=valaM?'VALA DE INFILTRAÇÃO':'SUMIDOURO', pctTx=(c.pct===0.5?'50%':'100%');
      /* ETE compacta: fossa e filtro dão lugar à referência ao memorial da estação (fabricante) */
      function blocoETE(titulo,linhas){ var pT=achar('FOSSA SÉPTICA'), i0=paras.indexOf(pT), iF=i0+1;
        while(iF<paras.length && paras[iF].tx.replace(/\s+/g,' ').trim().indexOf('VALA DE INFILTRAÇÃO')!==0) iF++;
        var br=-1; for(var j=iF-1;j>i0;j--){ if(!paras[j].tx.trim()){ br=j; break; } }
        pT.novo=linhaP(pT.xml,titulo); var k=0;
        for(var i=i0+1;i<iF;i++){ if(i===br) continue; paras[i].novo=(k<linhas.length && paras[i].tx.trim())?linhaP(paras[i].xml,linhas[k++]):''; }
        cur=iF; }
      if(steM) blocoETE('ETE COMPACTA',['Contribuição diária = '+nf(c.contrib,0)+' L/dia ('+c.N+' contribuintes)','Dimensionamento conforme o memorial da estação de tratamento de esgoto (fabricante), em anexo.']);
      else {
      achar('FOSSA SÉPTICA');
      trocar('N = no de pessoas',0,'N = no de pessoas > '+c.N+' habitantes');
      trocar('C = Contribuição de despejos',0,'C = Contribuição de despejos > '+cDesc);
      trocar('T = período de detenção',0,'T = período de detenção, em dias > '+(c.T===1?'01':nf(c.T)));
      trocar('Lf = ',0,'Lf = Contribuição de lodo fresco (L/hab.dia) > '+[pR?'01':'',pC?'0,20'+(pR?' no comercial':''):''].filter(Boolean).join(' e '));
      trocar('Vu = 1000 + ',0,'Vu = 1000 + '+[pR?c.Nr+' * (160 * '+Tn+'+ 65 * 1)':'', pC?c.Nc+' * (40 * '+Tn+'+ 65 * 0,2)':''].filter(Boolean).join(' + '));
      trocar('Vu =',0,'Vu = '+nf(c.vuF,0)+'L > '+nf(c.vuF/1000)+'m3');
      achar('FILTRO ANAERÓBIO');
      trocar('N = Número de contribuintes',0,'N = Número de contribuintes > '+c.N+' habitantes');
      trocar('C = Contribuição de despejos',0,'C = Contribuição de despejos, litro/ pessoa x dia > '+cDesc);
      trocar('T = Tempo de detenção hidráulica',0,'T = Tempo de detenção hidráulica, em dias > '+(c.T===1?'01':nf(c.T)));
      trocar('Vu = 1,6 * '+'',0,'Vu = 1,6 * N * C * T');
      trocar('Vu = 1,6 * ',0,(pR&&!pC)?'Vu = 1,6 * '+c.N+' * 160 * '+Tn:(pC&&!pR)?'Vu = 1,6 * '+c.N+' * 40 * '+Tn:'Vu = 1,6 * ('+c.Nr+' * 160 + '+c.Nc+' * 40) * '+Tn);
      trocar('Vu = ',0,'Vu = '+nf(c.vuA,0)+'L > '+nf(c.vuA/1000)+'m3');
      }
      /* pré-tratamento (rede): sem unidade de infiltração */
      if(preT||pluM){ var pV1=achar('VALA DE INFILTRAÇÃO'); cur=paras.indexOf(pV1); apagarAte('Dimensões úteis adotadas');
        achar('Dimensões úteis adotadas');
        if(steM) blocoETE('ETE COMPACTA',['Dimensões conforme o memorial da estação de tratamento de esgoto (fabricante), em anexo.']);
        else { achar('FOSSA SÉPTICA');
        trocar('Volume',0,['Volume = Área x Altura','Volume = (π×r² ) x '+nf(F.h),'Volume = (π×'+nf(F.r)+'² ) x '+nf(F.h)]);
        trocar('Volume',0,['Volume = '+nf(F.v)+'m³','','Adotado:','Diâmetro: '+nf(F.d)+'m','Altura: '+nf(F.h)+'m']);
        achar('FILTRO ANAERÓBIO');
        trocar('Volume',0,['Volume = Área x Altura','Volume = (π×r² ) x '+nf(A.h),'Volume = (π×'+nf(A.r)+'² ) x '+nf(A.h)]);
        trocar('Volume',0,['Volume = '+nf(A.v)+'m³','','Adotado:','Diâmetro: '+nf(A.d)+'m','Altura: '+nf(A.h)+'m']); }
        var pV2=achar('VALA DE INFILTRAÇÃO'); cur=paras.indexOf(pV2); apagarAte('Dimensionamento do volume do poço de recalque');
        return; }
      trocar('VALA DE INFILTRAÇÃO',0,tInf);
      /* área de infiltração = contribuição de esgoto (total, L/dia) / Ci */
      trocar('C = Contribuição de despejos',0,'C = Contribuição de esgoto, litros/dia ('+nf(c.contrib,0)+' L/dia)');
      trocar('A = C / Ci',0,'A = Contribuição de esgoto / Ci = C / Ci');
      trocar('A = ',0,'A = '+nf(c.contrib,0)+' / '+(c.ci>0?nf(c.ci):'____'));
      trocar('A = ',0,'A = '+(c.areaInf>0?nf(c.areaInf):'____')+'m² > '+infTx+' com '+pctTx+' de área de infiltração'+(c.pct<1&&c.areaUn>0?' ('+nf(c.areaUn)+'m² cada)':''));
      achar('Dimensões úteis adotadas');
      if(steM) blocoETE('ETE COMPACTA',['Dimensões conforme o memorial da estação de tratamento de esgoto (fabricante), em anexo.']);
      else {
      achar('FOSSA SÉPTICA');
      trocar('Volume',0,['Volume = Área x Altura','Volume = (π×r² ) x '+nf(F.h),'Volume = (π×'+nf(F.r)+'² ) x '+nf(F.h)]);
      trocar('Volume',0,['Volume = '+nf(F.v)+'m³','','Adotado:','Diâmetro: '+nf(F.d)+'m','Altura: '+nf(F.h)+'m']);
      achar('FILTRO ANAERÓBIO');
      trocar('Volume',0,['Volume = Área x Altura','Volume = (π×r² ) x '+nf(A.h),'Volume = (π×'+nf(A.r)+'² ) x '+nf(A.h)]);
      trocar('Volume',0,['Volume = '+nf(A.v)+'m³','','Adotado:','Diâmetro: '+nf(A.d)+'m','Altura: '+nf(A.h)+'m']);
      }
      trocar('VALA DE INFILTRAÇÃO',0,tInf);
      var cap=function(s){ return s.charAt(0).toUpperCase()+s.slice(1); };
      var aNec=c.areaUn>0?nf(c.areaUn):'____';
      if(valaM){ var V=c.vala, ok=V.c>0;
        /* vala: A = ((2 x altura) + largura) x comprimento, altura = largura */
        trocar('A = (π×r',0,'A = ((2 x Altura) + Largura) x Comprimento, sendo Altura = Largura = '+nf(V.l)+'m');
        trocar('A = (π x',0,'Comprimento = A necessária / ((2 x '+nf(V.l)+') + '+nf(V.l)+') = '+aNec+' / '+nf(3*V.l)+' = '+(ok?nf(V.cNec):'____')+'m');
        trocar('A = ',0,'A = ((2 x '+nf(V.l)+') + '+nf(V.l)+') x '+(ok?nf(V.c):'____'));
        trocar('A = ',0,'A = '+(ok?nf(V.a):'____')+'m²');
        trocar('Diâmetro:',0,'Largura: '+nf(V.l)+'m  |  Altura: '+nf(V.l)+'m');
        trocar('Altura:',0,'Comprimento: '+(ok?nf(V.c):'____')+'m');
        trocar('2 Sumidouros com',0,cap(infTx)+' com '+(ok?nf(V.a):'____')+'m² de infiltração cada');
      } else {
        /* sumidouro: A = fundo + perímetro x altura */
        var okS=S.hNec>0, fT=S.forma==='ret'?nf(S.c)+' x '+nf(S.l):'π x '+nf(S.r)+'²', pT=S.forma==='ret'?'2 x ('+nf(S.c)+' + '+nf(S.l)+')':'2 x π x '+nf(S.r);
        trocar('A = (π×r',0,'A = Área do fundo + Perímetro x Altura  →  fundo = '+fT+' = '+nf(S.base)+'m²; perímetro = '+pT+' = '+nf(S.per)+'m');
        trocar('A = (π x',0,'Altura = (A necessária – fundo) / perímetro = ('+aNec+' – '+nf(S.base)+') / '+nf(S.per)+' = '+(okS?nf(S.hNec):'____')+'m');
        trocar('A = ',0,'A = '+nf(S.base)+' + '+nf(S.per)+' x '+nf(S.h)+' = '+nf(S.base)+' + '+nf(S.lat));
        trocar('A = ',0,'A = '+nf(S.a)+'m²');
        trocar('Diâmetro:',0,S.forma==='ret'?'Dimensões: '+nf(S.c)+' x '+nf(S.l)+'m (retangular)':'Diâmetro: '+nf(S.d)+'m');
        trocar('Altura:',0,'Altura: '+nf(S.h)+'m');
        trocar('2 Sumidouros com',0,cap(infTx)+' com '+nf(S.a)+'m² de infiltração'+(nInf>1?' cada':''));
      }
    }
    /* 3.5 e 3.6: recalque de esgoto (quando houver) — V útil = Q x T / 4; P = (Q x Hman) / (75 x η) */
    function recalque(pre){
      var qR=num(D[pre+'_q']), tR=num(D[pre+'_t'])>0?num(D[pre+'_t']):10, hR=num(D[pre+'_h']), eR=num(D[pre+'_eta']); if(eR>1) eR=eR/100;
      var fq=qR>0?nf(qR):'____', vR=qR>0?qR*60*tR/4:NaN, pR2=(qR>0&&hR>0&&eR>0)?qR*hR/(75*eR):NaN;
      achar('Dimensionamento do volume do poço de recalque'); var pPR=achar('(Não aplicável');
      editar(pPR,0,['Vazão da bomba: Q = '+fq+' L/s']);
      acrescentar(pPR,['Tempo de ciclo: T = '+nf(tR,tR%1?1:0)+' min','V útil = Q x T / 4 = '+fq+' x 60 x '+nf(tR,tR%1?1:0)+' / 4 = '+(vR>0?nf(vR,0)+' litros ('+nf(vR/1000)+' m³)':'____')]);
      achar('Indicação da potência da bomba de recalque'); var pPB=achar('(Não aplicável');
      editar(pPB,0,['P = (Q x Hman) / (75 x η)']);
      acrescentar(pPB,['Q = '+fq+' L/s; Hman = '+(hR>0?nf(hR):'____')+' m; η = '+(eR>0?nf(eR*100,0)+'%':'____'),'P = ('+fq+' x '+(hR>0?nf(hR):'____')+') / (75 x '+(eR>0?nf(eR):'____')+') = '+(pR2>0?nf(pR2)+' cv':'____'),'Bomba adotada: '+(String(D[pre+'_bomba']||'').trim()||'______')]);
    }
    if(/^s/i.test(D.esg_rec||'')) recalque('esg_rec');
    /* 4.1 águas pluviais: condutores PL-1…PL-n e destino final */
    (function(){
      var n=parseInt(D.pl_cond,10)||0, L=[]; for(var i=1;i<=n;i++) L.push('PL-'+i);
      var cond=n<=0?'aos condutores verticais':n===1?'ao condutor vertical PL-1':'aos condutores verticais '+L.slice(0,-1).join(', ')+' e '+L[n-1];
      var ds=String(D.destino_pluvial||'').trim(), dl=ds.toLowerCase();
      var fim=(!ds||/sarjeta|calha/.test(dl))?'por fim despejada na calha viária (sarjeta).':/rede|drenag/.test(dl)?'por fim despejada na rede pública de drenagem pluvial.':/infiltr/.test(dl)?'por fim infiltrada no próprio terreno.':'por fim despejada em '+ds+'.';
      trocar('O sistema de captação de água pluvial',0,'O sistema de captação de água pluvial visa recolher as águas captadas na cobertura provenientes da chuva, são encaminhadas '+cond+' e horizontais, sendo direcionadas até as caixas de areia específicas e '+fim);
    })();
    if(/^s/i.test(D.pl_rec||'')) recalque('pl_rec');
    /* 5. aproveitamento de águas pluviais (quando houver): subitens 5.1 a 5.15 */
    if(/^s/i.test(D.apv||'')){
      achar('SISTEMA DE APROVEITAMENTO'); var pAp=achar('(Não aplicável');
      var hX=(paras.filter(function(x){ return x.tx.trim()==='Caixa de areia' && x.xml.indexOf('<w:numPr>')>=0; })[0]||{}).xml;
      var tX=(paras.filter(function(x){ return x.tx.trim().indexOf('As caixas serão de 60 x 60')===0; })[0]||{}).xml||pAp.xml;
      var bP=paras[paras.indexOf(pAp)+1], bX=(bP && !bP.tx.trim())?bP.xml:'';
      var naX=pAp.xml, o='';
      var H=function(t){ o+=linhaP(hX,t); }, P=function(t){ o+=linhaP(tX,t); }, NA=function(){ o+=naX; }, B=function(){ o+=bX; };
      var nA=parseInt(D.apv_cond,10)||0, AP=[]; for(var i=1;i<=nA;i++) AP.push('AP'+i);
      var apTx=nA?(nA===1?'AP1':AP.slice(0,-1).join(', ')+' e '+AP[nA-1]):'AP1';
      var aC=num(D.apv_area), aI=num(D.apv_irrig), lm=num(D.apv_lm2)>0?num(D.apv_lm2):2, vz=num(D.apv_vezes)>0?num(D.apv_vezes):2, pr=num(D.apv_precip)>0?num(D.apv_precip):4.16, cv=num(D.apv_cist);
      var sem=aI>0?aI*lm*vz:NaN, vi=sem/7, cd=aC>0?pr*aC:NaN, cr=vi*10, bombaA=String(D.apv_bomba||'').trim();
      var F=function(v,d){ return v>0?nf(v,d):'____'; };
      var cs=String(D.apv_casas||'').match(/\d+/g);
      if(nUG>1 && !colM && cs && cs.length && cs.length<nUG) P('Somente '+(cs.length===1?'a casa '+cs[0]+' terá':'as casas '+cs.slice(0,-1).join(', ')+' e '+cs[cs.length-1]+' terão')+' aproveitamento pluvial, por opção do proprietário.');
      H('Descrição completa do sistema de aproveitamento de águas pluviais da edificação:');
      P('Será captada 100% da área de cobertura da edificação por meio de calhas e condutores verticais que conduzem as águas pluviais ('+apTx+') para filtro de remoção de detritos. Após a passagem pelo filtro, essas águas são conduzidas para a cisterna e, posteriormente, '+(bombaA?'pressurizadas para a alimentação dos pontos de uso.':'para a alimentação dos pontos de uso.'));
      H('Indicação dos locais de uso da água pluvial:'); P(String(D.apv_usos||'').trim().replace(/\.?$/,'.').replace(/^\.$/,'')||'Irrigação de jardim.');
      H('Indicação da área de captação adotada:'); P('Área de captação de '+F(aC)+'m², referente a área inclinada do telhado.');
      H('Apresentação da demanda diária necessária:'); P('Demanda diária necessária conforme orientações técnicas da VISA.');
      P('Área de irrigação'); P('Vi = '+F(aI)+'m² x '+nf(lm,lm%1?2:0)+'L/m² x '+nf(vz,vz%1?1:0)+' vezes na semana.'); P('Vi = ('+F(sem,0)+'L/semana) / 7dias'); P('Vi = '+F(vi)+'L/dia');
      H('Indicação da precipitação média adotada:'); P('Precipitação média adotada de '+nf(pr)+'mm/dia. Conforme as orientações técnicas da VISA.');
      H('Comparativo entre demanda e captação:'); P('Captação diária prevista:'); P('Cd = '+nf(pr)+'mm/dia x '+F(aC)+'m²'); P('Cd = '+F(cd)+'L/dia'); B();
      P('Captação prevista x Demanda prevista'); P(F(cd)+'L/dia '+(cd>=vi?'>':'<')+' '+F(vi)+'L/dia');
      P(cd>=vi||!(cd>0&&vi>0)?'Ou seja, o sistema tem área de captação suficiente para atender a demanda.':'Ou seja, a área de captação não é suficiente para atender toda a demanda.');
      H('Descrição da unidade de remoção de detritos adotada:'); P(String(D.apv_filtro||'').trim()||'______');
      H('Cálculo do volume do sistema de descarte das primeiras águas pluviais:'); NA();
      H('Volume adotado para o sistema de descarte das primeiras águas:'); NA();
      H('Dispositivo utilizado para impedir o refluxo das águas descartadas para o sistema de aproveitamento:'); NA();
      H('Descrição do sistema de desinfecção:'); NA();
      H('Volume adotado para o reservatório de aproveitamento de águas pluviais e a quantidade de dias que o reservatório supre a demanda:');
      P('Previsto o mínimo 10 dias de reserva conforme orientação técnica da VISA. Volume de demanda diária de '+F(vi)+'L'); P('Capacidade da cisterna:'); P('Cr = 10 x '+F(vi)+'L'); P('Cr = '+F(cr)+'L'); P('Adotado = '+F(cv,0)+'L'); B();
      P('Quantidade de dias que o reservatório supre a demanda:'); P('Reserva = '+F(cv,0)+'/'+F(vi)); P('Reserva ≅ '+(cv>0&&vi>0?Math.floor(cv/vi+1e-9):'____')+' dias');
      H('Descrição do sistema de alimentação alternativa com água potável a ser adotado:'); NA();
      H('Indicação da utilização de recalque/pressurização das águas pluviais aproveitadas (dispensada apresentação do cálculo):'); if(bombaA) P('Será utilizado apenas um pressurizador para a alimentação dos pontos de consumo de águas pluviais.'); else NA();
      H('Indicação da potência da bomba/pressurizador:'); if(bombaA) P('Adotado um pressurizador com '+bombaA+'.'); else NA();
      if(hX) pAp.novo=o;
    }
    var pAss=achar(String(paras.filter(function(p){ return /CPF:/.test(p.tx) && p.tx.indexOf('Proprietário')<0; }).slice(-1)[0].tx).replace(/\s+/g,' ').trim().slice(0,12));
    var nomeAss=b(D.prop_nome,30).toUpperCase();
    editar(pAss,1,[nomeAss,'CPF: '+b(D.prop_cpf,14)]);
    /* nome do cliente na assinatura em negrito */
    (function(){ var alvo='>'+xmlEsc(nomeAss)+'</w:t>', feito=false;
      pAss.novo=pAss.novo.replace(/<w:r(?: [^>]*)?>[\s\S]*?<\/w:r>/g,function(r){ if(feito || r.indexOf(alvo)<0) return r; feito=true;
        if(/<w:rPr>/.test(r)){ if(/<w:b\/>/.test(r)) return r; return /<w:rFonts[^>]*\/>/.test(r)?r.replace(/(<w:rFonts[^>]*\/>)/,'$1<w:b/><w:bCs/>'):r.replace('<w:rPr>','<w:rPr><w:b/><w:bCs/>'); }
        return r.replace(/^(<w:r(?: [^>]*)?>)/,'$1<w:rPr><w:b/><w:bCs/></w:rPr>'); }); })();
    /* espaçamento final: só 1 linha em branco antes dos itens 6 e 7; mais espaço para a assinatura do cliente */
    (function(){
      var vz=function(p){ return p && !p.tx.trim() && p.xml.indexOf('<w:drawing')<0 && p.xml.indexOf('<w:numPr>')<0; };
      ['DEPÓSITO DE RESÍDUOS','ASSINATURAS'].forEach(function(pre){ var h=paras.filter(function(x){ return x.tx.trim().indexOf(pre)===0; })[0]; if(!h) return;
        for(var i=paras.indexOf(h)-2;i>=0 && vz(paras[i]) && vz(paras[i+1]);i--) paras[i+1].novo=''; });
      var pb=paras[paras.indexOf(pAss)-1]; if(vz(pb) && pb.novo==null) pb.novo=pb.xml+pb.xml+pb.xml+pb.xml;
      /* uma linha em branco entre o título "MEMORIAL DESCRITIVO…" e o item 1 */
      var pT=paras.filter(function(x){ return x.tx.trim().indexOf('MEMORIAL DESCRITIVO')===0; })[0], iT=paras.indexOf(pT);
      if(pT && pT.novo==null){ var bl=paras.slice(iT+1).filter(vz)[0]; if(bl) pT.novo=pT.xml+bl.xml; }
    })();
    trocar('Florianópolis,',0,'Florianópolis, '+dt.dia+' de '+dt.mes+' de '+dt.ano);
    var out='', pos=0; paras.forEach(function(p){ out+=xml.slice(pos,p.i)+(p.novo==null?p.xml:p.novo); pos=p.i+p.xml.length; }); out+=xml.slice(pos);
    /* espaçamento uniforme, do título até "ASSINATURAS": 1 linha em branco antes de cada item e subitem;
       nenhuma entre o título do item e o seu texto; espaços dentro do texto (cálculos) ficam como estão */
    out=(function(s){
      var t0=s.indexOf('MEMORIAL DESCRITIVO'), tA=s.indexOf('ASSINATURAS',t0); if(t0<0||tA<0) return s;
      var a=Math.max(s.lastIndexOf('<w:p ',t0),s.lastIndexOf('<w:p>',t0)), bA=Math.max(s.lastIndexOf('<w:p ',tA),s.lastIndexOf('<w:p>',tA)); if(a<0||bA<=a) return s;
      var meio=s.slice(a,bA), P=meio.match(/<w:p(?: [^>]*)?\/>|<w:p[ >][\s\S]*?<\/w:p>/g)||[]; if(P.join('')!==meio) return s; /* só mexe se o trecho for só de parágrafos */
      var txt=function(p){ return (p.match(/<w:t(?: [^>]*)?>[^<]*<\/w:t>/g)||[]).map(function(x){ return x.replace(/<[^>]+>/g,''); }).join('').trim(); };
      var tipoP=function(p){ if(/<w:drawing|<w:pict|w:type="page"|<w:sectPr/.test(p)) return 'c'; if(/<w:numId w:val="2"\/>/.test(p)) return 'h'; return txt(p)?'c':'b'; };
      var bStd=null, res=[], pend=[], ult=null;
      P.forEach(function(p){ var k=tipoP(p); if(k==='b'){ if(!bStd) bStd=p; pend.push(p); return; }
        if(k==='h'){ if(ult && (pend[0]||bStd)) res.push(pend[0]||bStd); }
        else if(ult!=='h') res=res.concat(pend);
        pend=[]; res.push(p); ult=k; });
      if(pend[0]||bStd) res.push(pend[0]||bStd);
      return s.slice(0,a)+res.join('')+s.slice(bA);
    })(out);
    /* fonte e tamanho únicos (Arial 10) e mesmo espaçamento de linha em todo o texto (o título fica como no modelo) */
    out=(function(s){
      var t0=s.indexOf('MEMORIAL DESCRITIVO'); if(t0<0) return s;
      var a=Math.max(s.lastIndexOf('<w:p ',t0),s.lastIndexOf('<w:p>',t0)), fimB=s.lastIndexOf('<w:sectPr'); if(a<0||fimB<=a) return s;
      var RP=/<w:p(?: [^>]*)?\/>|<w:p[ >][\s\S]*?<\/w:p>/g, meio=s.slice(a,fimB), P=meio.match(RP)||[];
      if(P.join('')!==meio){ var tA=s.indexOf('ASSINATURAS',t0); fimB=Math.max(s.lastIndexOf('<w:p ',tA),s.lastIndexOf('<w:p>',tA)); meio=s.slice(a,fimB); P=meio.match(RP)||[]; if(P.join('')!==meio) return s; }
      var FONTE='<w:rFonts w:ascii="Arial" w:eastAsia="Arial" w:hAnsi="Arial" w:cs="Arial"/>', TAM='<w:sz w:val="20"/><w:szCs w:val="20"/>';
      var DEPOIS=/<w:(highlight|u|effect|bdr|shd|fitText|vertAlign|rtl|cs|em|lang|eastAsianLayout|specVanish|oMath)[ \/>]/;
      function rpr(x){ /* x = conteúdo interno de <w:rPr> */
        x=x.replace(/<w:rFonts[^>]*\/>/g,'').replace(/<w:sz(?:Cs)? [^>]*\/>/g,'');
        var m=x.match(/^(<w:rStyle[^>]*\/>)?/); x=(m[1]||'')+FONTE+x.slice((m[1]||'').length);
        var k=x.search(DEPOIS); return k<0?x+TAM:x.slice(0,k)+TAM+x.slice(k); }
      var res=P.map(function(p,i){
        if(i===0 || /<w:drawing|<w:pict|txbxContent/.test(p)) return p;
        /* runs */
        p=p.replace(/<w:r(?: [^>]*)?>[\s\S]*?<\/w:r>/g,function(r){
          if(/<w:rPr>/.test(r)) return r.replace(/<w:rPr>([\s\S]*?)<\/w:rPr>/,function(_,x){ return '<w:rPr>'+rpr(x)+'</w:rPr>'; });
          return r.replace(/^(<w:r(?: [^>]*)?>)/,'$1<w:rPr>'+FONTE+TAM+'</w:rPr>'); });
        /* parágrafo: marca de parágrafo (altura das linhas em branco) e espaçamento antes/depois = 0 */
        if(/\/>$/.test(p)) p=p.replace(/\/>$/,'>')+'</w:p>'; /* parágrafo vazio abreviado <w:p/> */
        p=p.replace('<w:pPr/>','');
        if(!/<w:pPr>/.test(p)) p=p.replace(/^(<w:p(?: [^>]*)?>)/,'$1<w:pPr></w:pPr>');
        p=p.replace(/<w:pPr>([\s\S]*?)<\/w:pPr>/,function(_,x){
          var rp=''; x=x.replace(/<w:rPr>([\s\S]*?)<\/w:rPr>/,function(__,y){ rp=y; return ''; });
          x=x.replace(/<w:spacing [^>]*\/>/,'');
          var esp='<w:spacing w:before="0" w:after="0" w:line="276" w:lineRule="auto"/>';
          var k=x.search(/<w:(ind|contextualSpacing|mirrorIndents|suppressOverlap|jc|textDirection|textAlignment|textboxTightWrap|outlineLvl|divId|cnfStyle|sectPr|pPrChange)[ \/>]/);
          x=k<0?x+esp:x.slice(0,k)+esp+x.slice(k);
          var k2=x.search(/<w:(sectPr|pPrChange)[ \/>]/), rpx='<w:rPr>'+rpr(rp)+'</w:rPr>';
          x=k2<0?x+rpx:x.slice(0,k2)+rpx+x.slice(k2);
          return '<w:pPr>'+x+'</w:pPr>'; });
        return p; });
      return s.slice(0,a)+res.join('')+s.slice(fimB);
    })(out);
    zip.file('word/document.xml',out);
    /* número dos itens (1., 1.1, 1.1.1) no mesmo tamanho do texto */
    var nf0=zip.file('word/numbering.xml'); if(nf0){ var nx=await nf0.async('string'), ia=nx.indexOf('w:abstractNumId="1"'), fa=nx.indexOf('</w:abstractNum>',ia);
      if(ia>0&&fa>ia){ var bl=nx.slice(ia,fa).replace(/<w:sz w:val="\d+"\/>/g,'<w:sz w:val="20"/>').replace(/<w:szCs w:val="\d+"\/>/g,'<w:szCs w:val="20"/>'); zip.file('word/numbering.xml',nx.slice(0,ia)+bl+nx.slice(fa)); } }
    var blob=await zip.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',compression:'DEFLATE'});
    baixar(blob,'Memorial Hidrossanitário - '+nomeArq(ST.proj&&ST.proj.nome)+'.docx');
    return c;
  }
  /* Declaração de conformidade (VISA): respostas padrão conforme o projeto (com ou sem rede de esgoto) */
  function respostasConformidade(D, rede){
    var S='SIM', N='NÃO', NA='NÃO SE APLICA', loc=!rede, pre=rede&&/^s/i.test(D.pre_trat||''), lp=loc||pre; /* pré-tratamento com rede: item 8 respondido como sistema local */
    var plu=loc&&/pluvial/i.test(D.esg_inf||''); /* sistema local com lançamento do efluente tratado na rede pluvial */
    var op=function(v){ return lp&&/^(SIM|NÃO|NÃO SE APLICA)$/.test(v||'')?v:NA; };
    var dren=/rede|drenagem/i.test(String(D.destino_pluvial||'')), apv=/^s/i.test(String(D.apv||''));
    /* caixa de gordura: SIM se o projeto tem caixas; NÃO SE APLICA se informou 0 (campo vazio = SIM) */
    var cg=String(D.cg_grupos==null?'':D.cg_grupos).trim(), temCG=cg===''||lerGrupos(cg).length>0;
    var opc=function(v){ v=String(v||'').toUpperCase(); return rede&&(v===S||v===N)?v:NA; };
    var r={
      '4.1':N,'5.1':S,'5.2':rede?S:N,'5.3':dren?S:N,
      '6.1':S,'6.2':S,'6.3':S,'6.4':S,'6.5':S,'6.6':temCG?S:NA,'6.7':temCG?S:NA,'6.8':opc(D.cx_gradeamento),'6.9':opc(D.cx_quebra),
      '7.1':NA,'7.2':NA,
      '8.1':op(D.cf_8_1),'8.2':lp&&/aprovad/i.test(D.obra_parcel||'')?S:NA,'8.3':lp&&ehCasas()?S:NA,'8.4':lp?S:NA,'8.5':/legaliza/i.test(D.enquadramento||'')?op(D.cf_8_5):NA,'8.7':lp?S:NA,'8.8':lp?S:NA,'8.9':lp&&!plu?S:NA,'8.10':lp?S:NA,'8.11':NA,'8.12':lp&&/^s/i.test(D.lagoa||'')?S:NA,'8.13':lp?S:NA,'8.14':plu?(op(D.cf_8_14)===NA&&!D.cf_8_14?S:op(D.cf_8_14)):NA,'8.15':plu?(op(D.cf_8_15)===NA&&!D.cf_8_15?S:op(D.cf_8_15)):NA,'8.16':lp&&!plu?S:NA,
      '9.1':S,'9.2':S,'9.3':S,'10.1':apv?S:N,'10.2':apv?S:NA,'10.3':apv?S:NA
    };
    return r;
  }
  /* Declaração de conformidade: o próprio .docx oficial (modelos/conformidade-visa.docx); marca os "( )" com X
     conforme o projeto e escreve os dados abaixo de cada campo. Nada do layout é alterado. */
  async function gerarConformidade(){
    if(!window.JSZip) await carregarScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
    var D=ST.dados, rede=ST.r.esgoto==='sim', R=respostasConformidade(D,rede), tipo=(ST.proj&&ST.proj.tipo)||'';
    var r=await fetch('modelos/conformidade-visa.docx'); if(!r.ok) throw new Error('modelo da declaração de conformidade não encontrado');
    var zip=await JSZip.loadAsync(await r.arrayBuffer()), xml=await zip.file('word/document.xml').async('string');
    /* brasão da Prefeitura: no modelo ele está dentro de um "grupo" de formas, que alguns leitores (e a visualização) não mostram;
       troca por uma imagem simples, na mesma posição e tamanho */
    xml=xml.replace(/<mc:AlternateContent><mc:Choice Requires="wps"><w:drawing><wp:anchor[\s\S]*?<a:blip r:embed="(rId\d+)"[\s\S]*?<\/mc:AlternateContent>/, function(m,rid){
      return '<w:drawing><wp:anchor distT="0" distB="0" distL="0" distR="0" simplePos="0" relativeHeight="487153664" behindDoc="1" locked="0" layoutInCell="1" allowOverlap="1"><wp:simplePos x="0" y="0"/><wp:positionH relativeFrom="column"><wp:posOffset>116525</wp:posOffset></wp:positionH><wp:positionV relativeFrom="paragraph"><wp:posOffset>7018</wp:posOffset></wp:positionV><wp:extent cx="460550" cy="544734"/><wp:effectExtent l="0" t="0" r="0" b="0"/><wp:wrapNone/><wp:docPr id="1" name="Brasao"/><wp:cNvGraphicFramePr><a:graphicFrameLocks noChangeAspect="1"/></wp:cNvGraphicFramePr><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:nvPicPr><pic:cNvPr id="2" name="Brasao"/><pic:cNvPicPr/></pic:nvPicPr><pic:blipFill><a:blip r:embed="'+rid+'"/><a:stretch><a:fillRect/></a:stretch></pic:blipFill><pic:spPr><a:xfrm><a:off x="0" y="0"/><a:ext cx="460550" cy="544734"/></a:xfrm><a:prstGeom prst="rect"><a:avLst/></a:prstGeom></pic:spPr></pic:pic></a:graphicData></a:graphic></wp:anchor></w:drawing>';
    });    var enq=String(D.enquadramento||'Obra nova').toLowerCase(), gem=parseInt(D.geminadas,10)||0, uni=/unifamiliar/i.test(tipo)||!tipo;
    var pl=String(D.destino_pluvial||'Sarjeta').toLowerCase(), area=D.area?D.area+' m²':'';
    var norm=function(s){ return String(s||'').replace(/\s+/g,' ').trim().toLowerCase(); };
    /* decide se o "( )" com aquele rótulo, dentro da pergunta q, recebe X */
    function marca(q,rot){
      var L=norm(rot);
      if(L==='sim'||L==='não'||L==='não se aplica') return R[q]===L.toUpperCase().replace('NÃO SE APLICA','NÃO SE APLICA');
      if(q==='2.1'){ if(/^obra nova/.test(L)) return /nova/.test(enq); if(/com ampliação/.test(L)) return /com amplia/.test(enq); if(/sem ampliação/.test(L)) return /sem amplia/.test(enq); if(/lei 374/.test(L)) return /374/.test(enq); if(/^legalização$/.test(L)) return /legaliza/.test(enq)&&!/374/.test(enq); if(/substituição/.test(L)) return /substitui/.test(enq); }
      if(q==='3'){ if(/unifamiliar/.test(L)) return uni; if(/^isolada/.test(L)) return uni&&!gem; if(/^geminada/.test(L)) return uni&&gem>0; if(/mista/.test(L)) return /mist/i.test(tipo); if(/multifamiliar vertical/.test(L)) return /multi/i.test(tipo) && /vert/i.test(D.multi_tipo||''); if(/multifamiliar horizontal/.test(L)) return /multi/i.test(tipo) && /horiz/i.test(D.multi_tipo||''); if(/^comercial/.test(L)) return /comerc/i.test(tipo); return false; }
      if(q==='8.6'){ if(rede){ if(!/^s/i.test(D.pre_trat||'')) return false; return /^tratamento preliminar/.test(L)||/^tanque séptico/.test(L)||/^filtro anaeróbio ascendente/.test(L); } var ete=/ete/i.test(D.esg_trat||''), vala=/vala/i.test(D.esg_inf||'');
        if(/^tanque séptico/.test(L)||/^filtro anaeróbio ascendente/.test(L)) return !ete;
        if(/^lodos ativados fluxo contínuo/.test(L)||/^desinfecção/.test(L)) return ete;
        if(/^sumidouro/.test(L)) return !vala&&!/pluvial/i.test(D.esg_inf||''); if(/^valas de infiltração/.test(L)) return vala; return false; }
      if(q==='10.1'||q==='10.2'){ if(!/^s/i.test(D.apv||'')) return false; var lst=norm(q==='10.1'?(D.apv_usos||'Irrigação de jardim'):D.apv_trat); return !!L && lst.indexOf(L)>=0; }
      if(q==='8.9'){ if(rede && !/^s/i.test(D.pre_trat||'')) return false; if(!rede && /pluvial/i.test(D.esg_inf||'')) return false; var rc=norm(D.cf_recurso||'não necessário');
        if(/^não necessário/.test(L)) return /^não nec/.test(rc); if(/^somente aterro/.test(L)) return /^somente/.test(rc);
        if(/^recalque com aterro/.test(L)) return /^recalque com/.test(rc); if(/^recalque sem aterro/.test(L)) return /^recalque sem/.test(rc);
        if(/^outro/.test(L)) return /^outro/.test(rc); return false; }
      if(q==='9.4'){ if(/^infiltração direta/.test(L)) return /infiltra/.test(pl)&&!/sumidouro|vala/.test(pl); if(/^sumidouro\/vala/.test(L)) return /sumidouro|vala/.test(pl); if(/^sarjeta/.test(L)) return /sarjeta/.test(pl); if(/^rede de drenagem/.test(L)) return /rede|drenagem/.test(pl); }
      return false;
    }
    var RT={nome:'Isys de Mattos Vieira',cpf:'079.717.789-29',crea:'143918-7',end:'Avenida Red Park, 1180 - São João do Rio Vermelho',cid:'Florianópolis / 88060292',comp:'casa 7',email:'engenheira.isys@gmail.com',cel:'48 996556899',fixo:''};
    var endCompleto=[D.obra_end,(String(D.obra_num||'').trim()||'snº'),D.obra_bairro].filter(Boolean).join(' - ')+(D.obra_cep?' - CEP '+D.obra_cep:'');
    /* campo → valor escrito numa linha nova abaixo do rótulo, na mesma célula */
    var VALORES=[
      [/^1\.1 - PROPRIETÁRIO DO IMÓVEL\/OBRA/, String(D.prop_nome||'').toUpperCase()],
      [/^1\.2 - CPF\/CNPJ/, D.prop_cpf],
      [/^1\.3 - ENDEREÇO COMPLETO/, endCompleto],
      [/^1\.4 - NÚMERO DA INSCRIÇÃO/, D.inscricao],
      [/^11\.1- NOME COMPLETO/, RT.nome],[/^11\.2 - CPF$/, RT.cpf],[/^11\.3 - Nº CONSELHO/, RT.crea],
      [/^11\. 4 - ENDEREÇO/, RT.end],[/^11\.5 - CIDADE\/CEP/, RT.cid],[/^11\.6 - COMPLEMENTO/, RT.comp],
      [/^11\.7 - ENDEREÇO ELETRÔNICO/, RT.email],[/^11\.8 - Nº TELEFONE MÓVEL/, RT.cel],[/^11\.9 - Nº TELEFONE FIXO/, RT.fixo]
    ];
    var linhaValor=function(pXml,valor){
      var ppr=(pXml.match(/<w:pPr>[\s\S]*?<\/w:pPr>/)||[''])[0].replace(/<w:spacing[^>]*\/>/,'<w:spacing w:before="30"/>');
      return '<w:p>'+ppr+'<w:r><w:rPr><w:rFonts w:ascii="Arial" w:hAnsi="Arial" w:cs="Arial"/><w:sz w:val="20"/><w:szCs w:val="20"/></w:rPr><w:t xml:space="preserve">'+xmlEsc(valor)+'</w:t></w:r></w:p>';
    };
    var q='', bloco='';
    var out=xml.replace(/<w:p[ >][\s\S]*?<\/w:p>/g,function(p){
      var toks=[], re=/(<w:t(?: [^>]*)?>)([^<]*)(<\/w:t>)/g, m; while((m=re.exec(p))) toks.push({i:m.index,full:m[0],a:m[1],t:m[2],z:m[3]});
      if(!toks.length) return p;
      var txt=toks.map(function(t){ return t.t; }).join('').replace(/\s+/g,' ').trim();
      var mq=txt.match(/^(\d+\.\d+)\b/); if(mq) q=mq[1]; else if(/^3 - USO DA EDIFICAÇÃO/.test(txt)) q='3'; else if(/^2\.1$/.test(txt)) q='2.1';
      if(/^2 - TIPO ENQUADRAMENTO/.test(txt)) q='2';
      var novos=toks.map(function(t){ return t.t; }), mudou=false;
      /* marcações "( )" */
      for(var k=0;k<toks.length;k++){
        if(novos[k]!=='(') continue;
        var meio=(k+1<toks.length && /^\s*$/.test(toks[k+1].t) && toks[k+2] && /^\)/.test(toks[k+2].t))?k+1:-1;
        var fecha=meio>=0?k+2:((k+1<toks.length && toks[k+1].t===')')?k+1:-1);
        if(fecha<0) continue;
        var rot=toks[fecha].t.slice(1); for(var j=fecha+1;j<toks.length && toks[j].t!=='(';j++) rot+=toks[j].t;
        if(marca(q,rot)){ if(meio>=0) novos[meio]='X'; else novos[k]='(X'; mudou=true; }
      }
      /* quantidade de unidades isoladas/geminadas e área total do uso residencial unifamiliar */
      if(q==='3' && /^Isolada\. Quantas\?/.test(txt.replace(/^\(\s*X?\s*\)\s*/,'')) && uni && !gem){ novos[toks.length-1]+=' '+(D.unidades||'1'); mudou=true; }
      if(q==='3' && /^Geminada\. Quantas\?/.test(txt.replace(/^\(\s*X?\s*\)\s*/,'')) && uni && gem){ novos[toks.length-1]+=' '+gem; mudou=true; }
      /* 8.7: CI do solo e NA */
      if(q==='8.7' && /CI solo:/.test(txt) && (!rede||/^s/i.test(D.pre_trat||''))){ for(var c=0;c<toks.length;c++){ if(toks[c].t==='solo:' && toks[c+1]) { novos[c+1]=' '+(D.ci||'______')+' '; } if(toks[c].t==='-' && toks[c+1] && toks[c+1].t==='m'){ novos[c]='- '+(D.na||'____')+' '; } } mudou=true; }
      /* 10.1: área de captação logo após o rótulo */
      if(q==='10.1' && /Área de captação:/.test(txt) && /^s/i.test(D.apv||'') && String(D.apv_area||'').trim()){ for(var c2=0;c2<toks.length;c2++){ if(/captação:/.test(toks[c2].t)){ novos[c2]=toks[c2].t.replace('captação:','captação: '+String(D.apv_area).trim()+' m² '); mudou=true; break; } } }
      if(/^Nº PHS anteriormente aprovado:/.test(txt) && D.phs_anterior){ novos[toks.length-1]+=' '+D.phs_anterior; mudou=true; }
      var res=p;
      if(mudou){ var o='', pos=0; toks.forEach(function(t,ix){ o+=p.slice(pos,t.i)+(novos[ix]===t.t?t.full:t.a.replace(/^<w:t(?: [^>]*)?>/,'<w:t xml:space="preserve">')+xmlEsc(novos[ix])+t.z); pos=t.i+t.full.length; }); res=o+p.slice(pos); }
      /* valores dos campos (linha nova logo abaixo do rótulo) */
      for(var v=0;v<VALORES.length;v++){ if(VALORES[v][0].test(txt)){ if(VALORES[v][1]) res+=linhaValor(p,VALORES[v][1]); break; } }
      /* 3: áreas de cada uso, escritas abaixo do rótulo do bloco marcado */
      if(q==='3'){
        var tl=txt.replace(/^\(\s*X?\s*\)\s*/,'');
        if(/^\(/.test(txt)){ bloco=/unifamiliar/i.test(tl)?'uni':/mista/i.test(tl)?'mis':/multifamiliar vertical/i.test(tl)?'mv':/multifamiliar horizontal/i.test(tl)?'mh':/^comercial/i.test(tl)?'com':/outros usos/i.test(tl)?'out':bloco; }
        var aT=num(D.area), aC=num(D.area_com), fm=function(v){ return v>0?nf(v)+' m²':''; }, val='';
        if(txt==='Área total' && bloco==='uni' && uni) val=fm(aT);
        else if(txt==='Área total' && bloco==='mis' && /mist/i.test(tipo)) val=fm(aT);
        else if(txt==='Área residencial' && /mist/i.test(tipo)) val=fm(aT>0&&aC>0?aT-aC:NaN);
        else if(txt==='Área comercial' && /mist/i.test(tipo)) val=fm(aC);
        else if(/^Área total multifamiliar vertical/.test(txt) && /multi/i.test(tipo) && /vert/i.test(D.multi_tipo||'')) val=fm(aT);
        else if(/^Área total multifamiliar horizontal/.test(txt) && /multi/i.test(tipo) && /horiz/i.test(D.multi_tipo||'')) val=fm(aT);
        else if(/^Área total comercial/.test(txt) && /comerc/i.test(tipo)) val=fm(aT>0?aT:aC);
        if(val) res+=linhaValor(p,val);
      }
      /* 8.1: nº da LAI */
      if((!rede||/^s/i.test(D.pre_trat||'')) && /^8\.1 - A edificação está sujeita/.test(txt) && D.cf_8_1==='SIM' && String(D.cf_lai||'').trim()) res+=linhaValor(p,'Nº da LAI: '+String(D.cf_lai).trim());
      /* 8.8: soluções técnicas; 8.9: descrição do "Outro" recurso */
      if((!rede||/^s/i.test(D.pre_trat||'')) && /^Descrever soluções técnicas adotadas/.test(txt)) res+=linhaValor(p,String(D.cf_solucoes||'').trim()||'Distâncias horizontais mínimas atendidas, conforme NBR 7229/93 e NBR 13969/97.');
      if((!rede||/^s/i.test(D.pre_trat||'')) && /Outro\. Descrever:\s*$/.test(txt) && /^outro/i.test(D.cf_recurso||'') && String(D.cf_recurso_outro||'').trim()) res+=linhaValor(p,String(D.cf_recurso_outro).trim());
      /* 2: contextualização da reforma/ampliação/substituição */
      if(/^\*CONTEXTUALIZAR/.test(txt) && /reforma|substitui/i.test(enq) && String(D.enq_contexto||'').trim()) res+=linhaValor(p,String(D.enq_contexto).trim());
      return res;
    });
    zip.file('word/document.xml',out);
    var blob=await zip.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',compression:'DEFLATE'});
    baixar(blob,'Declaração de Conformidade - '+nomeArq(ST.proj&&ST.proj.nome)+'.docx');
  }
  /* ---------- Relatório de vistoria do habite-se sanitário (modelos oficiais da VISA: rede coletora ou sistema local) ---------- */
  function respostasVistoria(D, rede, tipo){
    var S='SIM', N='NÃO', NA='NA', sim=function(v){ return /^s/i.test(String(v||'')); };
    var apv=sim(D.apv), rec=sim(D.esg_rec), recP=sim(D.pl_rec), col=/multi|comerc|mist/i.test(tipo||''), casas=ehCasas();
    var cg=String(D.cg_grupos==null?'':D.cg_grupos).trim(), temCG=cg===''||lerGrupos(cg).length>0;
    var and=parseInt(D.andares,10)||1, r={};
    /* 4 – água potável */
    ['4.1','4.2','4.4','4.6','4.7','4.8','4.9','4.10','4.12','4.13','4.14','4.15','4.16','4.19','4.20'].forEach(function(k){ r[k]=S; });
    r['4.3']=casas?S:NA; r['4.5']=S; r['4.11']=casas&&/^(SIM|NÃO|NA)$/.test(D.vist_4_11||'')?D.vist_4_11:NA; r['4.17']=sim(D.af_quente)?S:N; r['4.18']=(col&&and>1)?S:NA;
    /* 5 – aproveitamento de águas de chuva */
    for(var i=1;i<=12;i++) r['5.'+i]=apv?S:NA;
    /* 6 – esgoto */
    ['6.1','6.2','6.7','6.8'].forEach(function(k){ r[k]=S; });
    ['6.3','6.4','6.5','6.6'].forEach(function(k){ r[k]=temCG?S:NA; });
    r['6.9']=rec?S:N;
    if(rede){ r['6.10']=rec?(/^n/i.test(D.cx_quebra||'')?N:S):NA; r['6.11']=/^s/i.test(D.cx_gradeamento||'')?S:NA; r['6.12']=S; r['6.13']=S; }
    else { r['6.10']=rec?S:NA; r['6.11']=S; r['6.12']=S; }
    /* 7 – pré-tratamento (rede) ou tratamento local */
    var esc3=function(v){ return /^(SIM|NÃO|NA)$/.test(v||'')?v:NA; };
    if(rede){ r['7.1']=sim(D.pre_trat)?S:NA; }
    else { ['7.1','7.2','7.3','7.4','7.8','7.10'].forEach(function(k){ r[k]=S; }); var pluV=/pluvial/i.test(D.esg_inf||''); if(pluV) r['7.4']=NA; r['7.5']=pluV?NA:esc3(D.vist_7_5); r['7.6']=pluV?S:NA; r['7.7']=sim(D.lagoa)?S:NA; r['7.9']=casas?S:NA; r['7.11']=esc3(D.vist_lic); }
    /* 8 – pluviais não aproveitadas */
    ['8.1','8.4','8.5','8.6','8.7'].forEach(function(k){ r[k]=S; }); r['8.2']=recP?S:N; r['8.3']=recP?S:NA;
    /* 9 – resíduos sólidos; 10 – resíduos oleosos */
    var com=/comerc|mist/i.test(tipo||''), oleo=com&&sim(D.oleo);
    r['9.1']=S; r['9.2']=col?S:NA; r['9.3']=com&&/^(SIM|NÃO|NA)$/.test(D.vist_9_3||'')?D.vist_9_3:NA;
    for(var j=1;j<=10;j++) r['10.'+j]=oleo?S:NA;
    if(oleo) r['10.7']=sim(D.oleo_lav)?S:NA;
    return r;
  }
  async function gerarVistoria(){
    if(!window.JSZip) await carregarScript('https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js');
    var D=ST.dados, tipo=(ST.proj&&ST.proj.tipo)||'', rede=ST.r.esgoto==='sim', R=respostasVistoria(D,rede,tipo);
    var r=await fetch(rede?'modelos/vistoria-rede.docx':'modelos/vistoria-local.docx'); if(!r.ok) throw new Error('modelo do relatório de vistoria não encontrado');
    var zip=await JSZip.loadAsync(await r.arrayBuffer()), xml=await zip.file('word/document.xml').async('string');
    var norm=function(s){ return String(s||'').replace(/\s+/g,' ').trim().toLowerCase(); };
    var enq=norm(D.enquadramento||'Obra nova'), gem=parseInt(D.geminadas,10)||0, uni=/unifamiliar/i.test(tipo)||!tipo;
    var c=calcMemorial(D,true,tipo), aT=num(D.area), aC=num(D.area_com), fm=function(v){ return v>0?nf(v)+' m²':''; };
    var RT={nome:'Isys de Mattos Vieira',cpf:'079.717.789-29',crea:'143918-7',end:'Avenida Red Park, 1180 - São João do Rio Vermelho',cid:'Florianópolis / 88060292',comp:'casa 7',email:'engenheira.isys@gmail.com',cel:'48 996556899',fixo:''};
    /* população por unidade (2 pessoas por dormitório) */
    var popUn=(function(){ if(ehCasas()){ var q=lerCasas(D.quartos_casas); if(q.length) return q.map(function(v,i){ return 'Casa '+(i+1)+': '+(2*v)+' pessoas'; }).join('; '); }
      var u=Math.max(1,parseInt(D.unidades,10)||1), qq=Math.max(1,parseInt(D.quartos,10)||1); return Math.round(2*qq/u)+' pessoas'; })();
    /* reservatórios */
    var supV=(function(){ if(ehCasas()){ var v=lerCasas(D.quartos_casas,1).filter(function(x){ return x>0; }); if(v.length>1) return nf(v.reduce(function(a,b){ return a+b; },0),0)+' ('+v.map(function(x){ return nf(x,0); }).join(' + ')+')'; if(v.length) return nf(v[0],0); }
      var rv=num(D.reserv)||0, n=/multi|comerc|mist/i.test(tipo)?(parseInt(D.af_reserv_n,10)||1):1; return rv?(n>1?nf(rv*n,0)+' ('+n+' x '+nf(rv,0)+')':nf(rv,0)):''; })();
    var infV=/^s/i.test(D.af_cisterna||'')&&num(D.cist_vol)?nf(num(D.cist_vol),0):'0';
    /* caixas de gordura */
    var CGV={pequena:120,simples:31,dupla:120}, CGP={pequena:'pequenas',simples:'simples',dupla:'duplas',especial:'especiais'};
    var G=String(D.cg_grupos||'').trim()==='0'?[]:lerGrupos(D.cg_grupos).map(function(g){ return {tp:g.tp||tipoCG(g.n), n:g.n, N:g.N}; });
    var porTp={}, ordem=[]; G.forEach(function(g){ if(!porTp[g.tp]){ porTp[g.tp]=[]; ordem.push(g.tp); } porTp[g.tp].push(g); });
    var cgQtd=G.length?ordem.map(function(t){ var k=porTp[t].length; return k+' '+(k>1?CGP[t]:t); }).join(', '):'Não possui';
    var cgPias=G.length?ordem.map(function(t){ var L=porTp[t].map(function(g){ return g.n; }); return t+': '+L.join(', ')+(L.length===1&&L[0]===1?' pia':' pias')+(L.length>1?' (respectivamente)':''); }).join('; '):'Não se aplica';
    var cgVol=G.length?ordem.map(function(t){ if(t==='especial') return 'especial: '+porTp[t].map(function(g){ return g.N?(2*g.N+20)+' L':'____ L'; }).join(', '); return t+': '+CGV[t]+' L'; }).join('; '):'Não se aplica';
    var apv=/^s/i.test(D.apv||''), filtroM2=(String(D.apv_filtro||'').match(/(\d+(?:[.,]\d+)?)\s*m²/)||[])[1]||String(D.apv_area||'').trim();
    var endObra=[D.obra_end,(String(D.obra_num||'').trim()||'s/nº')].filter(Boolean).join(', ');
    /* 1) colunas SIM / NÃO / NA das tabelas */
    function poeX(cell){
      var run='<w:r><w:rPr><w:b/><w:bCs/></w:rPr><w:t>X</w:t></w:r>', feito=false;
      cell=cell.replace(/<w:r(?: [^>]*)?>(?:<w:rPr>[\s\S]*?<\/w:rPr>)?<\/w:r>/,function(){ feito=true; return run; });
      if(!feito) cell=cell.replace(/<\/w:p>/,run+'</w:p>');
      return cell.replace(/<w:pPr>([\s\S]*?)<\/w:pPr>/,function(m,inn){ if(/<w:jc /.test(inn)) return m; return /<w:rPr>/.test(inn)?'<w:pPr>'+inn.replace(/<w:rPr>/,'<w:jc w:val="center"/><w:rPr>')+'</w:pPr>':'<w:pPr>'+inn+'<w:jc w:val="center"/></w:pPr>'; });
    }
    xml=xml.replace(/<w:tr[ >][\s\S]*?<\/w:tr>/g,function(row){
      var cells=row.match(/<w:tc>[\s\S]*?<\/w:tc>/g)||[]; if(cells.length!==4) return row;
      var t0=(cells[0].match(/<w:t(?: [^>]*)?>[^<]*<\/w:t>/g)||[]).map(function(t){ return t.replace(/<[^>]+>/g,''); }).join('').trim();
      var mq=t0.match(/^(\d+\.\d+)/); if(!mq || !R[mq[1]]) return row;
      if([1,2,3].some(function(i){ return /<w:t[ >]/.test(cells[i]); })) return row;
      var col={'SIM':1,'NÃO':2,'NA':3}[R[mq[1]]]; if(!col) return row;
      return row.replace(cells[col],poeX(cells[col]));
    });
    /* 2) marcações "( )" e valores escritos abaixo de cada rótulo */
    function marca(sec,q,rot){
      var L=norm(rot).replace(/\*$/,'');
      if(sec==='2'){ if(/^obra nova/.test(L)) return /nova/.test(enq); if(/com ampliação/.test(L)) return /com amplia/.test(enq); if(/sem ampliação/.test(L)) return /sem amplia/.test(enq); if(/^substituição/.test(L)) return /substitui/.test(enq); if(/lei 374/.test(L)) return /374/.test(enq); if(/^legalização$/.test(L)) return /legaliza/.test(enq)&&!/374/.test(enq); }
      if(sec==='3'){ if(/unifamiliar/.test(L)) return uni; if(/^isolada/.test(L)) return uni&&!gem; if(/^geminada/.test(L)) return uni&&gem>0; if(/mista/.test(L)) return /mist/i.test(tipo); if(/multifamiliar vertical/.test(L)) return /multi/i.test(tipo)&&/vert/i.test(D.multi_tipo||''); if(/multifamiliar horizontal/.test(L)) return /multi/i.test(tipo)&&/horiz/i.test(D.multi_tipo||''); if(/^comercial/.test(L)) return /comerc/i.test(tipo); return false; }
      if(q==='5.11'){ return apv && norm(D.apv_usos||'Irrigação de jardim').indexOf(L)>=0; }
      if(q==='7.1' && !rede){ var ete=/ete/i.test(D.esg_trat||''), vala=/vala/i.test(D.esg_inf||'');
        if(/^tanque séptico/.test(L)||/^filtro anaeróbio/.test(L)) return !ete; if(/^ete lodos ativados/.test(L)||/^desinfecção/.test(L)) return ete;
        if(/^sumidouro/.test(L)) return !vala&&!/pluvial/i.test(D.esg_inf||''); if(/^valas de infiltração/.test(L)) return vala; if(/^lançamento na pluvial/.test(L)) return /pluvial/i.test(D.esg_inf||''); }
      return false;
    }
    function linhaV(pXml,valor){
      var ppr=(pXml.match(/<w:pPr>[\s\S]*?<\/w:pPr>/)||[''])[0].replace(/<w:numPr>[\s\S]*?<\/w:numPr>/,'');
      var rpr=((pXml.match(/<w:r(?: [^>]*)?>\s*(<w:rPr>[\s\S]*?<\/w:rPr>)/)||[])[1]||'').replace(/<w:b\/>|<w:bCs\/>|<w:b w:val="1"\/>|<w:bCs w:val="1"\/>/g,'');
      return '<w:p>'+ppr+'<w:r>'+rpr+'<w:t xml:space="preserve">'+xmlEsc(valor)+'</w:t></w:r></w:p>';
    }
    var sec='', q='', bloco='', nPop=0, pend='';
    var VAL=[
      [/^1\.1 - Propriet/, String(D.prop_nome||'').toUpperCase()],[/^1\.2 - CPF\/CNPJ/, D.prop_cpf],[/^1\.3 . Endereço/, endObra],
      [/^1\.4 - Bairro/, D.obra_bairro],[/^1\.5 - Complemento/, D.obra_comp],[/^1\.6 . Inscrição/, D.inscricao],
      [/^Nº PROCESSO APROVAÇÃO/, /374/.test(enq)?'Dispensado (legalização pela Lei nº 374/10)':D.phs_proc],
      [/^\*CONTEXTUALIZAR/, /reforma|substitui/.test(enq)?String(D.enq_contexto||'').trim():''],
      [/Quantidade e tipo de caixa/, cgQtd],[/Nº pias por tipo de caixa/, cgPias],[/Volume da \(s\) caixa/, cgVol],
      [/^12\.1 - NOME/, RT.nome],[/^12\.2 - CPF/, RT.cpf],[/^12\.3 - Nº CONSELHO/, RT.crea],[/^12\.4 - ENDEREÇO/, RT.end],[/^12\.5 - COMPLEMENTO/, RT.comp],
      [/^12\.6 - CIDADE/, RT.cid],[/^12\.7 - ENDEREÇO ELETR/, RT.email],[/^12\.8 - Nº TELEFONE M/, RT.cel],[/^12\.9 - Nº TELEFONE F/, RT.fixo],[/^12\.10 . DATA DA VISTORIA/, D.vist_data]
    ];
    var out=xml.replace(/<w:p[ >][\s\S]*?<\/w:p>/g,function(p){
      var toks=[], re=/(<w:t(?: [^>]*)?>)([^<]*)(<\/w:t>)/g, m; while((m=re.exec(p))) toks.push({i:m.index,full:m[0],a:m[1],t:m[2],z:m[3]});
      if(!toks.length) return p;
      var txt=toks.map(function(t){ return t.t; }).join('').replace(/\s+/g,' ').trim();
      var ms=txt.match(/^(\d+)\s*[-–]\s*[A-ZÁÉÍÓÚÇ]/); if(ms){ sec=ms[1]; q=''; }
      var mq=txt.match(/^(\d+\.\d+)\b/); if(mq){ q=mq[1]; sec=q.split('.')[0]; }
      var novos=toks.map(function(t){ return t.t; }), mudou=false;
      /* "( ) rótulo" dentro do mesmo trecho de texto */
      for(var k=0;k<toks.length;k++){
        if(!/\(\s*\)/.test(novos[k])) continue;
        novos[k]=novos[k].replace(/\((\s*)\)([^(]*)/g,function(all,sp,rot){ if(sec==='3'){ var b=norm(rot); bloco=/unifamiliar/.test(b)?'uni':/mista/.test(b)?'mis':/multifamiliar vertical/.test(b)?'mv':/multifamiliar horizontal/.test(b)?'mh':/^comercial/.test(b)?'com':/^outros/.test(b)?'out':bloco; }
          if(marca(sec,q,rot)){ mudou=true; var extra=''; if(sec==='3'&&/^isolada/i.test(rot.trim())) extra=' '+(D.unidades||'1'); if(sec==='3'&&/^geminada/i.test(rot.trim())) extra=' '+gem; return '( X )'+rot.replace(/\s+$/,'')+extra+' '; }
          return all; });
      }
      /* 7.1: descrição da ETE; 7.11: nº da LAO */
      if(!rede && q==='7.1' && /ete/i.test(D.esg_trat||'') && String(D.ete_desc||'').trim()){ for(var e1=0;e1<toks.length;e1++){ if(/ETE Lodos Ativados/i.test(novos[e1]) && /_{3,}/.test(novos[e1])){ novos[e1]=novos[e1].replace(/_{3,}/,' '+String(D.ete_desc).trim()+' '); mudou=true; } } }
      if(!rede && /^7\.11\b/.test(txt) && D.vist_lic==='SIM' && String(D.vist_lao||'').trim()){ for(var e2=0;e2<toks.length;e2++){ if(/_{3,}/.test(novos[e2])){ novos[e2]=novos[e2].replace(/_{3,}/,' '+String(D.vist_lao).trim()+' '); mudou=true; break; } } }
      /* sublinhados "______" preenchidos */
      var preencher=null;
      if(/^4\.21/.test(txt)) preencher=infV; else if(/^4\.22/.test(txt)) preencher=supV;
      else if(pend && /_{3,}/.test(txt)){ preencher=pend==='5.13'?(apv?String(D.apv_cist||'').trim():''):pend==='5.14'?(apv?filtroM2:''):(apv?String(D.apv_descarte||'').trim():''); pend=''; }
      if(/^5\.1[345]\b/.test(txt) && !/_{3,}/.test(txt)) pend=txt.slice(0,4);
      if(preencher){ var feito=false; for(var u=0;u<toks.length;u++){ if(/_{3,}/.test(novos[u])){ novos[u]=feito?novos[u].replace(/_+/g,''):novos[u].replace(/_{3,}/,' '+preencher+' ').replace(/_+/g,''); feito=true; mudou=true; } } }
      if(/hidrômetro\s*\(s\):\s*$/i.test(txt) && String(D.hidrometro||'').trim()){ novos[toks.length-1]+=' '+String(D.hidrometro).trim(); mudou=true; }
      var res=p;
      if(mudou){ var o='', pos=0; toks.forEach(function(t,ix){ o+=p.slice(pos,t.i)+(novos[ix]===t.t?t.full:t.a.replace(/^<w:t(?: [^>]*)?>/,'<w:t xml:space="preserve">')+xmlEsc(novos[ix])+t.z); pos=t.i+t.full.length; }); res=o+p.slice(pos); }
      for(var v=0;v<VAL.length;v++){ if(VAL[v][0].test(txt)){ if(String(VAL[v][1]||'').trim()) res+=linhaV(p,String(VAL[v][1]).trim()); break; } }
      /* 3: áreas e população de cada uso */
      if(sec==='3'){ var val='';
        if(txt==='Área total' && bloco==='uni' && uni) val=fm(aT);
        else if(txt==='Área total' && bloco==='mis' && /mist/i.test(tipo)) val=fm(aT);
        else if(txt==='Área residencial' && /mist/i.test(tipo)) val=fm(aT>0&&aC>0?aT-aC:NaN);
        else if(txt==='Área comercial' && /mist/i.test(tipo)) val=fm(aC);
        else if(/^Área total multifamiliar vertical/.test(txt) && bloco==='mv' && /multi/i.test(tipo) && /vert/i.test(D.multi_tipo||'')) val=fm(aT);
        else if(/^Área total multifamiliar horizontal/.test(txt) && bloco==='mh' && /multi/i.test(tipo) && /horiz/i.test(D.multi_tipo||'')) val=fm(aT);
        else if(/^Área total comercial/.test(txt) && /comerc/i.test(tipo)) val=fm(aT>0?aT:aC);
        else if(/^População de projeto por unidade/.test(txt) && uni){ nPop++; if((nPop===1&&!gem)||(nPop===2&&gem)) val=popUn; }
        else if(/^População total/.test(txt) && bloco==='mv' && /multi/i.test(tipo) && /vert/i.test(D.multi_tipo||'')) val=c.N+' pessoas';
        else if(/^População total/.test(txt) && bloco==='mh' && /multi/i.test(tipo) && /horiz/i.test(D.multi_tipo||'')){ var un=Math.max(1,parseInt(D.unidades,10)||1); val=Math.round(c.N/un)+' por unidade / '+c.N+' total'; }
        else if(/^População total/.test(txt) && bloco==='com' && /comerc/i.test(tipo)) val=c.N+' pessoas';
        if(val) res+=linhaV(p,val);
      }
      return res;
    });
    zip.file('word/document.xml',out);
    var blob=await zip.generateAsync({type:'blob',mimeType:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',compression:'DEFLATE'});
    baixar(blob,'Relatório de Vistoria - '+nomeArq(ST.proj&&ST.proj.nome)+'.docx');
  }
  window.aprGerarTeste={posse:gerarPosse, viabilidade:gerarViabilidade, memorial:gerarMemorial, conformidade:gerarConformidade, vistoria:gerarVistoria, calc:calcMemorial, avisoVala:avisoVala, st:ST}; /* para conferência */

})();

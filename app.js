'use strict';
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const svgPaths={
  hammer:'<path d="m15 12-6.5 6.5a2.1 2.1 0 0 1-3-3L12 9"/><path d="m17.5 2.5 4 4-4 4-4-4zM14 6l-2 2"/>',
  zap:'<path d="m13 2-9 11h7l-1 9 10-12h-7l1-8Z"/>',
  droplets:'<path d="M12 3C8 9 6 11 6 15a6 6 0 1 0 12 0c0-4-2-6-6-12Z"/><path d="M9 16c0 1.6 1 2.8 2.6 3"/>',
  sparkles:'<path d="m12 3 1.9 6.1L20 11l-6.1 1.9L12 19l-1.9-6.1L4 11l6.1-1.9L12 3ZM19 17l.7 2.3L22 20l-2.3.7L19 23l-.7-2.3L16 20l2.3-.7L19 17Z"/>',
  paint:'<path d="M3 7h13a3 3 0 0 1 0 6h-3"/><rect x="3" y="5" width="12" height="6" rx="1.5"/><path d="M13 13v3h-2v6"/>',
  leaf:'<path d="M20 4C7 4 4 11 4 16a4 4 0 0 0 4 4c5 0 12-3 12-16Z"/><path d="M4 20c3-5 7-8 12-11"/>',
  box:'<path d="m12 2 9 5-9 5-9-5 9-5ZM3 7v10l9 5 9-5V7M12 12v10"/>',
  monitor:'<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M8 22h8M12 18v4"/>',
  scissors:'<circle cx="6" cy="6" r="3"/><circle cx="6" cy="18" r="3"/><path d="m8.1 8.1 12 12m-12-4.2 12-12"/>',
  camera:'<path d="M4 7h4l2-3h5l2 3h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z"/><circle cx="12" cy="13" r="4"/>',
  book:'<path d="M3 5c3-2 6-2 9 0v15c-3-2-6-2-9 0V5Zm9 0c3-2 6-2 9 0v15c-3-2-6-2-9 0V5Z"/>',
  clock:'<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  grid:'<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  heart:'<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  pin:'<path d="M20 10c0 5-8 12-8 12S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.5"/>',
  arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>'
};
const categoryIcons={'Reformas':'hammer','Elétrica':'zap','Hidráulica':'droplets','Limpeza':'sparkles','Pintura':'paint','Jardinagem':'leaf','Montagem':'box','Tecnologia':'monitor','Beleza':'scissors','Fotografia':'camera','Aulas':'book','Outros':'grid'};
function icon(name,sz=23){return `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svgPaths[name]||svgPaths.grid}</svg>`}
const categories=[['Reformas','▦','Pedreiros e reformas'],['Elétrica','ϟ','Instalações elétricas'],['Hidráulica','◉','Encanamentos'],['Limpeza','✧','Limpeza e faxina'],['Pintura','▧','Pintores'],['Jardinagem','❀','Jardins e plantas'],['Montagem','▤','Móveis e instalações'],['Tecnologia','⌘','Computadores e redes'],['Beleza','✦','Estética e beleza'],['Fotografia','▣','Fotos e vídeos'],['Aulas','⌁','Professores'],['Outros','···','Mais serviços']];
const demoPros=[
{id:'demo-1',name:'Marcos Almeida',category:'Reformas',city:'São José dos Campos',bio:'Pequenas reformas, assentamento de pisos e acabamentos residenciais. Trabalho com atenção aos detalhes e compromisso em cada etapa.',initials:'MA',photo:'assets/portrait-marcos.jpg',upgrade:'https://images.unsplash.com/photo-1560250097-0b93528c311a?w=720&q=85',fallback:'assets/portrait-marcos.jpg'},
{id:'demo-2',name:'Camila Oliveira',category:'Limpeza',city:'Jacareí',bio:'Limpeza residencial, pós-obra e organização de ambientes. Cuidado com cada cantinho da sua casa.',initials:'CO',photo:'assets/portrait-camila.jpg',upgrade:'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=720&q=85',fallback:'assets/portrait-camila.jpg'},
{id:'demo-3',name:'Rafael Martins',category:'Elétrica',city:'São José dos Campos',bio:'Instalações elétricas, reparos e manutenção preventiva para deixar sua casa mais segura.',initials:'RM',photo:'assets/portrait-rafael.jpg',upgrade:'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=720&q=85',fallback:'assets/portrait-rafael.jpg'},
{id:'demo-4',name:'Fernanda Lima',category:'Pintura',city:'Taubaté',bio:'Pintura residencial, efeitos decorativos e acabamentos com capricho em todos os ambientes.',initials:'FL',photo:'assets/portrait-fernanda.jpg',upgrade:'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=720&q=85',fallback:'assets/portrait-fernanda.jpg'},
{id:'demo-5',name:'Pedro Santos',category:'Tecnologia',city:'Caçapava',bio:'Montagem de computadores, upgrades, manutenção e suporte técnico para o dia a dia.',initials:'PS',photo:'assets/portrait-pedro.jpg',upgrade:'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=720&q=85',fallback:'assets/portrait-pedro.jpg'},
{id:'demo-6',name:'Bianca Rocha',category:'Jardinagem',city:'São José dos Campos',bio:'Paisagismo, manutenção de jardins e cuidados especiais com suas plantas e áreas verdes.',initials:'BR',photo:'assets/portrait-bianca.jpg',upgrade:'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=720&q=85',fallback:'assets/portrait-bianca.jpg'}];
const categoryPictures={
'Reformas':['https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=450&q=83','assets/category-reforms.jpg'],
'Elétrica':['https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=450&q=83','assets/category-technology.jpg'],
'Hidráulica':['https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=450&q=83','assets/category-reforms.jpg'],
'Limpeza':['https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=450&q=83','assets/category-cleaning.jpg'],
'Pintura':['https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=450&q=83','assets/category-reforms.jpg'],
'Jardinagem':['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=450&q=83','assets/category-cleaning.jpg'],
'Montagem':['https://images.unsplash.com/photo-1503602642458-232111445657?w=450&q=83','assets/category-technology.jpg'],
'Tecnologia':['https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=450&q=83','assets/category-technology.jpg'],
'Beleza':['https://images.unsplash.com/photo-1560066984-138dadb4c035?w=450&q=83','assets/category-beauty.jpg'],
'Fotografia':['https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=450&q=83','assets/category-beauty.jpg'],
'Aulas':['https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=450&q=83','assets/category-cleaning.jpg'],
'Outros':['https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=450&q=83','assets/category-beauty.jpg']};

const demoRequests=[{id:'demo-r1',title:'Instalar três luminárias',category:'Elétrica',city:'São José dos Campos',description:'Procuro profissional para instalar três luminárias na sala e no corredor.',created:Date.now()-86400000*2,owner:'Cliente demonstrativo',photos:[],demo:true},{id:'demo-r2',title:'Pintura de um quarto',category:'Pintura',city:'Taubaté',description:'Preciso pintar um quarto pequeno. Tinta já comprada.',created:Date.now()-86400000*4,owner:'Cliente demonstrativo',photos:[],demo:true},{id:'demo-r3',title:'Montagem de guarda-roupa',category:'Montagem',city:'Jacareí',description:'Montagem de guarda-roupa novo de seis portas.',created:Date.now()-86400000*5,owner:'Cliente demonstrativo',photos:[],demo:true}];
const key='conecta.reconstruido.v1';
function load(){try{return {...{profile:null,works:[],requests:[],favorites:[]},...JSON.parse(localStorage.getItem(key))}}catch{return {profile:null,works:[],requests:[],favorites:[]}}}
let photosBusy=false, uploadGeneration=0;
let state=load(), currentPage='home',selectedPro=null, stagedImages=[],profileImage=null,toastTimer,exploreTab='all';
function save(){try{localStorage.setItem(key,JSON.stringify(state));return true}catch{notify('Armazenamento cheio. Tente usar fotos menores ou excluir registros antigos.');return false}}
const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function notify(message){const t=$('#toast');t.textContent=message;t.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('visible'),3200)}
function dialog(opts){const cfg=typeof opts==='string'?{message:opts}:opts||{};const tone=cfg.tone||'info';const title=cfg.title||'Aviso';const eyebrow=cfg.eyebrow||'CONECTA';const message=cfg.message||'';const button=cfg.buttonLabel||'Entendi';modal(`<div class="conecta-dialog conecta-dialog-${tone}"><div class="conecta-dialog-badge">${tone==='success'?'✓':tone==='error'?'!':'i'}</div><span class="conecta-dialog-eyebrow">${eyebrow}</span><h2>${esc(title)}</h2><p>${esc(message)}</p><div class="conecta-dialog-actions"><button type="button" class="btn btn-green" data-action="close-modal">${esc(button)}</button></div></div>`)}
function allPros(){return window.ConectaV9?.profilesForCatalog?.() ?? [...(state.profile?[{...state.profile,id:'mine',initials:initials(state.profile.name)}]:[]),...demoPros]}
function initials(n){return String(n||'').split(' ').filter(Boolean).slice(0,2).map(s=>s[0].toUpperCase()).join('')||'CO'}
function proCard(p){const saved=(state.favorites||[]).includes(p.id);return `<article class="pro-card"><div class="pro-card-cover"><span class="cover-badge">${icon(categoryIcons[p.category],15)} ${esc(p.category)}</span><div class="cover-art" aria-hidden="true">${icon(categoryIcons[p.category],102)}</div><div class="pro-avatar">${p.photo?`<img src="${esc(p.photo)}" ${p.upgrade?`data-upgrade-src="${esc(p.upgrade)}"`:""} ${p.fallback?`onerror="this.onerror=null;this.src='${esc(p.fallback)}'"`:''} alt="Foto ilustrativa de ${esc(p.name)}">`:esc(p.initials||initials(p.name))}</div></div><button class="save-badge ${saved?'is-saved':''}" type="button" data-favorite="${esc(p.id)}" aria-pressed="${saved}" aria-label="${saved?'Remover dos salvos':'Salvar perfil de '+esc(p.name)}">${icon('heart',19)}</button><div class="pro-content"><span class="pro-label">${p.id==='mine'?'MEU PERFIL':'CONHEÇA O PROFISSIONAL'}</span><h3>${esc(p.name)}</h3><p>${esc(p.bio||'Profissional da comunidade Conecta.')}</p><div class="pro-meta"><span>${icon('pin',15)} ${esc(p.city)}${p.neighborhood?' · '+esc(p.neighborhood):''}</span><span class="verified">${p.id==='mine'?'Seu perfil':p.id.startsWith('demo-')?'Perfil de exemplo':'Perfil publicado'}</span></div>${p.ownerUid?`<span class="v12-rating-chip" data-rating-for="${esc(p.ownerUid)}">Ainda sem avaliações</span>`:''}<div class="pro-footer"><span class="pro-availability"><span class="contact-dot"></span> Ver apresentação</span><button class="btn btn-green" data-pro="${esc(p.id)}">Ver perfil ${icon('arrow',17)}</button></div></div></article>`}
function upgradeImages(){ $$('img[data-upgrade-src]:not([data-upgrade-started])').forEach(img=>{img.dataset.upgradeStarted='true';const candidate=new Image();candidate.onload=()=>{if(img.isConnected)img.src=candidate.src};candidate.src=img.dataset.upgradeSrc;});}
function setupSelects(){const opt='<option value="">Todas as categorias</option>'+categories.map(([c])=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');$('#categoryFilter').innerHTML=opt;$('#heroCategory').innerHTML=opt;$('#requestCategory').innerHTML=opt;$('#profileCategory').innerHTML='<option value="">Selecione o serviço</option>'+categories.map(([c])=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');$('#sidebarCategories').innerHTML=categories.map(([c])=>`<button class="sidebar-category" type="button" data-filter-category="${esc(c)}"><span class="sidebar-category-square">${icon(categoryIcons[c],12)}</span>${esc(c)}<small>${demoPros.filter(p=>p.category===c).length}</small></button>`).join('')}
function renderHome(){
  $('#categories').innerHTML=categories.map(([name,_,subtitle])=>{
    const pic=categoryPictures[name];return `<button class="category-item" data-category="${esc(name)}"><span class="category-picture"><img src="${pic[1]}" data-upgrade-src="${pic[0]}" loading="lazy" alt=""></span><span class="category-words"><strong>${esc(name)}</strong><small>${esc(subtitle)}</small></span><span class="category-go" aria-hidden="true">↗</span></button>`
  }).join('');
  $('#featured').innerHTML=allPros().slice(0,3).map(proCard).join('');
  $('#heroProCount').textContent=allPros().length;
  $('#heroCatCount').textContent=categories.length;
  $('#heroReqCount').textContent=state.requests.length+demoRequests.length;
  upgradeImages();
}
function renderExplore(){
  const q=$('#searchPros').value.trim().toLowerCase(),cat=$('#categoryFilter').value,city=$('#cityFilter').value.toLowerCase(),neighborhood=$('#neighborhoodFilter').value.trim().toLocaleLowerCase('pt-BR');
  let list=allPros().filter(p=>(!cat||p.category===cat)&&(!city||p.city.toLowerCase().includes(city))&&(!neighborhood||String(p.neighborhood||'').toLocaleLowerCase('pt-BR').includes(neighborhood))&&(!q||[p.name,p.category,p.bio,p.city,p.neighborhood||''].join(' ').toLowerCase().includes(q))&&(exploreTab!=='saved'||(state.favorites||[]).includes(p.id)));
  if($('#proSort').value==='name')list.sort((a,b)=>a.name.localeCompare(b.name,'pt-BR'));
  if($('#proSort').value==='city')list.sort((a,b)=>a.city.localeCompare(b.city,'pt-BR'));
  if($('#proSort').value==='rating')list.sort((a,b)=>{const get=p=>window.ConectaReviewScores?.get(p.ownerUid)?.average||0;const count=p=>window.ConectaReviewScores?.get(p.ownerUid)?.count||0;return get(b)-get(a)||count(b)-count(a)});
  $$('.explore-tabs button').forEach(b=>b.classList.toggle('active',b.dataset.exploreTab===exploreTab));
  $$('.sidebar-category').forEach(b=>b.classList.toggle('active',b.dataset.filterCategory===cat));
  $('#resultCount').innerHTML=`<span><strong>${list.length}</strong> ${list.length===1?'profissional encontrado':'profissionais encontrados'}</span>`;
  $('#professionalsList').innerHTML=list.map(proCard).join('')||empty(exploreTab==='saved'?'Nenhum perfil salvo':'Nenhum resultado',exploreTab==='saved'?'Toque no coração de um perfil para salvá-lo aqui.':'Tente outro filtro, categoria ou cidade.');
  upgradeImages();
}

function daysAgo(date){const days=Math.max(0,Math.floor((Date.now()-date)/86400000));return days===0?'Hoje':days===1?'Ontem':`Há ${days} dias`}
function requestCard(r){const catIcon=icon(categoryIcons[r.category]||'grid',27);return `<article class="request-card v11-request-card"><div class="v11-request-card-mark">${catIcon}</div><div class="v11-request-card-inner"><div class="request-card-top"><div class="request-header"><span class="chip">${esc(r.category)}</span><span class="chip dim">${r.demo?'EXEMPLO':'PUBLICADO POR VOCÊ'}</span></div><span class="request-state">Em aberto</span></div><h3>${esc(r.title)}</h3><p>${esc(r.description)}</p><div class="request-meta"><span>${icon('pin',15)} ${esc(r.city)}</span><span>${icon('clock',15)} ${daysAgo(r.created)}</span>${r.photos?.length?`<span>${icon('camera',15)} ${r.photos.length} fotos</span>`:''}</div>${r.photos?.length?`<div class="request-pictures">${r.photos.map((src,i)=>`<img src="${src}" alt="Foto do pedido" data-image="${esc(r.id)}:${i}" loading="lazy">`).join('')}</div>`:''}<div class="request-bottom"><div class="request-owner"><span class="v11-owner-avatar">${esc((r.owner||'Você').trim().charAt(0).toUpperCase())}</span><div><strong>${esc(r.owner||'Você')}</strong><small>${r.demo?'Pedido demonstrativo':'Salvo neste navegador'}</small></div></div><div class="request-actions">${r.demo?'<span class="request-link-note">Exemplo de pedido</span>':`<button class="btn btn-light" data-delete-request="${esc(r.id)}">Excluir pedido</button>`}</div></div></div></article>`}
function renderRequests(){const q=$('#requestSearch').value.toLowerCase(),cat=$('#requestCategory').value,sort=$('#requestSort').value;let list=[...state.requests,...demoRequests].filter(r=>(!cat||r.category===cat)&&(!q||[r.title,r.city,r.description].join(' ').toLowerCase().includes(q))).sort((a,b)=>sort==='old'?a.created-b.created:b.created-a.created);$('#requestList').innerHTML=list.map(requestCard).join('')||empty('Nenhum pedido encontrado','Tente outro filtro ou publique uma nova necessidade.')}
function empty(title,body){return `<div class="empty"><h3>${esc(title)}</h3><p>${esc(body)}</p></div>`}
function updateProfileUI(){
  const created=!!state.profile?.name;
  $$('[data-profile-cta]').forEach(button=>button.textContent=created?'Meu perfil':'Criar perfil');
  $('#profileTabLabel').textContent=created?'Meu perfil':'Criar perfil';
  $('#dashboardTitle').textContent=created?'Meu espaço no Conecta':'Crie seu perfil no Conecta';
  $('#dashboardSubtitle').textContent=created?'Gerencie seu perfil, mostre o que faz e acompanhe suas publicações.':'Apresente seus serviços e comece a construir sua vitrine profissional.';
  $('#profileFormTitle').textContent=created?'Editar informações profissionais':'Crie seu perfil profissional';
  $('#profileFormDescription').textContent=created?'Atualize seus dados para manter seu perfil sempre completo.':'Preencha seus dados e apresente seu trabalho aos futuros clientes.';
  $('#profileSubmitText').textContent=created?'Salvar alterações':'Criar perfil';
  $('#profileCreatedActions').hidden=!created;
}
function renderDashboard(){
  const p=state.profile||{};
  const f=$('#profileForm');
  for(const key of ['name','category','city','neighborhood','phone','bio']) f.elements[key].value=p[key]||'';
  profileImage=p.photo||null;
  $('#profilePreview').innerHTML=profileImage?`<img src="${profileImage}" alt="Foto de perfil">`:'';
  updateProfileUI();
  $('#myWorks').innerHTML=state.works.length?state.works.map(w=>workCard(w,true)).join(''):empty('Nenhum trabalho ainda','Adicione trabalhos e mostre suas fotos para futuros clientes.');
  $('#myRequests').innerHTML=state.requests.length?state.requests.map(requestCard).join(''):empty('Você ainda não publicou pedidos','Publique o primeiro pedido e ele aparecerá aqui.');
}
function workCard(w,manage=false){return `<article class="work-card"><div class="work-photos">${w.photos?.[0]?`<img src="${w.photos[0]}" alt="${esc(w.title)}" data-workphoto="${esc(w.id)}:0">`:''}</div><div class="work-content"><h3>${esc(w.title)}</h3><p>${esc(w.description)}</p><small>${w.photos?.length||0} fotos</small>${manage?`<div style="margin-top:12px"><button data-delete-work="${esc(w.id)}">Excluir trabalho</button></div>`:''}</div></article>`}
function renderProfessional(){const p=allPros().find(x=>x.id===selectedPro);if(!p){route('explore');return}let works=p.id==='mine'?state.works:[];const own=p.id==='mine';const example=p.id.startsWith('demo-');const real=!own&&!example&&!!p.ownerUid;let contact=own?'<p class="modal-help">Este é seu perfil público.</p>':example?'<p class="modal-help">Este é um perfil ilustrativo. Não é possível enviar mensagens.</p>':real?(p.hasWhatsapp?`<button class="btn btn-green" data-whatsapp-pro="${esc(p.id)}">Conversar no WhatsApp ↗</button><button class="btn btn-chat-light" data-chat-pro="${esc(p.id)}">Enviar mensagem pelo Conecta</button>`:`<button class="btn btn-green" data-chat-pro="${esc(p.id)}">Enviar mensagem no Conecta ↗</button><small>Este profissional prefere conversar pelo aplicativo.</small>`):'<p class="modal-help">Contato indisponível.</p>';$('#professionalDetail').innerHTML=`<div class="detail-banner"><div class="detail-avatar">${p.photo?`<img src="${esc(p.photo)}" ${p.upgrade?`data-upgrade-src="${esc(p.upgrade)}"`:""} alt="">`:esc(p.initials||initials(p.name))}</div></div><div class="detail-main"><div><span class="overline">${own?'SEU PERFIL':example?'PERFIL DEMONSTRATIVO':'PROFISSIONAL DO CONECTA'}</span><h1>${esc(p.name)}</h1><span class="chip">${esc(p.category)}</span><p>${esc(p.bio||'Sem apresentação ainda.')}</p><p>⌖ ${esc(p.city)}${p.neighborhood?' · '+esc(p.neighborhood):''}</p>${p.ownerUid?`<section id="v12ReviewsSection" class="v12-reviews" data-reviews-for="${esc(p.ownerUid)}"><div class="v13-review-head"><h2>Avaliações de clientes</h2>${real?'<button type="button" class="btn btn-green" data-action="jump-review">Avaliar profissional ★</button>':''}</div><div class="v12-reviews-content">Carregando avaliações...</div></section>`:'<div class="v12-reviews-demo">Perfil demonstrativo, ainda sem avaliações reais.</div>'}</div><aside class="detail-aside"><h3>${own?'Seu perfil':'Vamos conversar?'}</h3><p>${own?'Confira como seu perfil aparece aos clientes.':example?'Dados fictícios para demonstração.':'Conte ao profissional sobre o serviço de que você precisa.'}</p>${contact}</aside></div><div class="detail-portfolio"><h2>Trabalhos realizados</h2><div class="portfolio-grid">${works.length?works.map(w=>workCard(w)).join(''):empty('Sem trabalhos publicados','Este perfil ainda não publicou fotos de trabalhos.')}</div></div>`}
function route(page){if(['dashboard','inbox'].includes(page) && !window.ConectaV9?.requireAuth(page==='dashboard'?'profile':'messages'))return;currentPage=page;$$('.page').forEach(el=>el.classList.toggle('active',el.id===`page-${page}`));$$('.navlink').forEach(b=>b.classList.toggle('current',b.dataset.route===page));$('#mobileNav').classList.remove('open');$('#menuBtn').setAttribute('aria-expanded','false');window.scrollTo({top:0});document.body.dataset.page=page;if(page==='home')renderHome();if(page==='explore')renderExplore();if(page==='requests')renderRequests();if(page==='dashboard')renderDashboard();if(page==='professional'){renderProfessional();upgradeImages()}if(page==='inbox')window.ConectaV9?.renderInbox?.()}
function modal(html){uploadGeneration++;photosBusy=false;$('#modalBody').innerHTML=html;$('#modal').classList.add('show');$('#modal').setAttribute('aria-hidden','false');document.body.style.overflow='hidden'}
function closeModal(){uploadGeneration++;photosBusy=false;$('#modal').classList.remove('show');$('#modal').setAttribute('aria-hidden','true');document.body.style.overflow='';stagedImages=[]}
function options(selected=''){return categories.map(([name])=>`<option ${selected===name?'selected':''}>${esc(name)}</option>`).join('')}
function openRequest(){if(!window.ConectaV9?.requireAuth('request'))return;stagedImages=[];modal(`<div class="v11-modal-request"><div class="v11-modal-rail"><div class="v11-modal-rail-brand"><span class="v11-rail-mark">✳</span> conecta.</div><span class="v11-rail-kicker">NOVO PEDIDO</span><h2>Uma ideia. <br> Um pedido. <br><em>O começo <br> de tudo.</em></h2><p>Conte o que você precisa e organize as informações do serviço com clareza.</p><div class="v11-modal-rail-illustration"><span class="v11-rail-circle"></span><div class="v11-rail-card one"><b>01</b><span>Descreva o trabalho</span></div><div class="v11-rail-card two"><b>02</b><span>Informe os detalhes</span></div><div class="v11-rail-card three"><b>03</b><span>Salve seu pedido</span></div></div><small>Conecta · Pessoas certas, projetos reais.</small></div><div class="v11-modal-main"><div class="v11-modal-heading"><span class="v11-eyebrow">NOVO PEDIDO DE SERVIÇO</span><h2>O que você precisa?</h2><p>Preencha os dados abaixo para organizar sua solicitação.</p></div><form id="requestForm" class="modal-form modal-form-request"><div class="v11-modal-field"><div class="v11-modal-field-title"><span>01</span><div><h3>Sobre o serviço</h3><p>Comece contando o que precisa ser feito.</p></div></div><label>Título do pedido<input name="title" required maxlength="90" placeholder="Ex.: Instalação de ventilador"></label><div class="modal-grid-two"><label>Categoria<select name="category">${options()}</select></label><label>Cidade<input name="city" required maxlength="60" placeholder="Em qual cidade?"></label></div></div><div class="v11-modal-field"><div class="v11-modal-field-title"><span>02</span><div><h3>Explique os detalhes</h3><p>Uma boa descrição facilita o entendimento.</p></div></div><label>Descrição do serviço<textarea name="description" required maxlength="1000" rows="4" placeholder="Descreva o que precisa, medidas, materiais e outros detalhes importantes..."></textarea></label></div><div class="v11-modal-field"><div class="v11-modal-field-title"><span>03</span><div><h3>Adicione fotos <em>opcional</em></h3><p>Imagens ajudam a entender melhor o pedido.</p></div></div><label class="upload-dropzone"><span class="upload-icon">＋</span><strong>Selecionar imagens</strong><small>JPG, PNG ou WEBP · até quatro fotos</small><input id="requestPhotos" type="file" accept="image/jpeg,image/png,image/webp" multiple></label><div id="uploadPreview" class="image-preview"></div></div><p class="modal-help">Versão de teste: os pedidos e fotos ainda ficam armazenados somente neste navegador.</p><div class="modal-actions"><button type="button" class="btn btn-light" data-action="close-modal">Cancelar</button><button type="submit" class="btn btn-green">Salvar pedido ↗</button></div></form></div></div>`)}
function openWork(){if(!window.ConectaV9?.requireAuth('profile'))return;if(!state.profile?.name){notify('Crie seu perfil antes de publicar trabalhos.');route('dashboard');return}stagedImages=[];modal(`<div class="request-modal-shell"><div class="request-modal-intro"><span class="overline">PORTFÓLIO</span><h2>Adicionar trabalho</h2><p>Mostre um projeto que você realizou e valorize seus resultados com imagens e contexto.</p></div><form id="workForm" class="modal-form modal-form-request"><div class="modal-section"><h3>Apresentação do trabalho</h3><label>Nome do trabalho<input name="title" required maxlength="90" placeholder="Ex.: Reforma de cozinha"></label><label>Descrição<textarea name="description" rows="4" maxlength="650" required placeholder="O que foi feito neste serviço?"></textarea></label></div><div class="modal-section"><h3>Galeria</h3><label class="upload-dropzone"><span class="upload-icon">＋</span><strong>Selecionar fotos</strong><small>Até seis imagens para compor seu portfólio</small><input id="workPhotos" type="file" accept="image/jpeg,image/png,image/webp" multiple></label><div id="uploadPreview" class="image-preview"></div></div><p class="modal-help">As imagens ficam neste navegador, não são enviadas a outros usuários.</p><div class="modal-actions"><button type="button" class="btn btn-light" data-action="close-modal">Cancelar</button><button type="submit" class="btn btn-green">Salvar trabalho ↗</button></div></form></div>`)}
async function compress(file,max=720){
  if(!file.type.startsWith('image/')||file.size>12*1024*1024)throw Error('Use uma imagem JPG, PNG ou WEBP de até 12 MB.');
  // Decode asynchronously and resize before storing, so requests remain responsive.
  if(typeof createImageBitmap==='function'){
    const bitmap=await createImageBitmap(file);
    try{
      const scale=Math.min(1,max/Math.max(bitmap.width,bitmap.height));
      const canvas=document.createElement('canvas');
      canvas.width=Math.max(1,Math.round(bitmap.width*scale));canvas.height=Math.max(1,Math.round(bitmap.height*scale));
      canvas.getContext('2d').drawImage(bitmap,0,0,canvas.width,canvas.height);
      return canvas.toDataURL('image/jpeg',.60);
    }finally{bitmap.close()}
  }
  return new Promise((resolve,reject)=>{
    const img=new Image(),reader=new FileReader();
    reader.onload=()=>{img.onload=()=>{const scale=Math.min(1,max/Math.max(img.width,img.height));const c=document.createElement('canvas');c.width=Math.round(img.width*scale);c.height=Math.round(img.height*scale);c.getContext('2d').drawImage(img,0,0,c.width,c.height);resolve(c.toDataURL('image/jpeg',.60))};img.onerror=()=>reject(Error('Imagem inválida'));img.src=reader.result};
    reader.onerror=()=>reject(Error('Falha ao ler a foto'));reader.readAsDataURL(file);
  });
}
async function readPhotos(input,max){
  const files=[...input.files], form=input.closest('form'), preview=form?.querySelector('#uploadPreview');
  if(files.length>max){notify(`Escolha no máximo ${max} fotos.`);input.value='';return}
  const token=++uploadGeneration;photosBusy=true;stagedImages=[];
  const submit=form?.querySelector('[type="submit"]');if(submit)submit.disabled=true;
  if(preview)preview.innerHTML='<p class="upload-status" role="status">Preparando suas fotos...</p>';
  try{
    const processed=[];
    for(let i=0;i<files.length;i++){
      await new Promise(resolve=>requestAnimationFrame(resolve));
      const image=await compress(files[i],640);
      if(token!==uploadGeneration||!input.isConnected)return;
      processed.push(image);
      if(preview)preview.innerHTML=`<p class="upload-status" role="status">Preparando fotos: ${i+1} de ${files.length}</p>`;
    }
    stagedImages=processed;
    if(preview)preview.innerHTML=processed.map(x=>`<img src="${x}" alt="Prévia da foto">`).join('');
  }catch(err){stagedImages=[];input.value='';if(preview)preview.innerHTML='';notify(err.message||'Não foi possível processar as fotos.');}
  finally{if(token===uploadGeneration){photosBusy=false;if(submit)submit.disabled=false}}
}
function saveRequest(f){
  if(photosBusy){notify('Aguarde terminar o processamento das imagens.');return}
  const data=new FormData(f);
  state.requests.unshift({id:'r'+Date.now(),title:String(data.get('title')).trim(),category:data.get('category'),city:String(data.get('city')).trim(),description:String(data.get('description')).trim(),photos:[...stagedImages],created:Date.now(),owner:state.profile?.name||'Você'});
  if(!save()){state.requests.shift();return}
  closeModal();notify('Pedido salvo neste navegador!');route('requests');
}
function saveWork(f){
  if(photosBusy){notify('Aguarde terminar o processamento das imagens.');return}
  const data=new FormData(f);
  state.works.unshift({id:'w'+Date.now(),title:String(data.get('title')).trim(),description:String(data.get('description')).trim(),photos:[...stagedImages]});
  if(!save()){state.works.shift();return}
  closeModal();notify('Trabalho salvo no seu portfólio neste navegador!');route('dashboard');dash('portfolio');
}
function dash(name){$$('[data-dash]').forEach(b=>b.classList.toggle('selected',b.dataset.dash===name));$$('.dash-panel').forEach(el=>el.classList.toggle('active',el.id===`dash${name==='myrequests'?'Myrequests':name==='portfolio'?'Portfolio':'Profile'}`));renderDashboard()}
function showImage(src){modal(`<h2>Visualizar imagem</h2><img class="image-view" src="${src}" alt="Imagem ampliada">`)}
document.addEventListener('click',e=>{const b=e.target.closest('button,a,[data-image],[data-workphoto]');if(!b)return;if(b.dataset.route){e.preventDefault();route(b.dataset.route)}else if(b.dataset.favorite){const id=b.dataset.favorite;state.favorites=state.favorites||[];state.favorites=state.favorites.includes(id)?state.favorites.filter(x=>x!==id):[...state.favorites,id];save();if(currentPage==='home')renderHome();if(currentPage==='explore')renderExplore();notify(state.favorites.includes(id)?'Perfil adicionado aos salvos.':'Perfil removido dos salvos.')}else if(b.dataset.category){exploreTab='all';$('#categoryFilter').value=b.dataset.category;route('explore')}else if(b.dataset.filterCategory){$('#categoryFilter').value=$('#categoryFilter').value===b.dataset.filterCategory?'':b.dataset.filterCategory;renderExplore()}else if(b.dataset.exploreTab){exploreTab=b.dataset.exploreTab;renderExplore()}else if(b.dataset.categoryScroll){$('#categories').scrollBy({left:b.dataset.categoryScroll==='next'?490:-490,behavior:'smooth'})}else if(b.dataset.pro){selectedPro=b.dataset.pro;route('professional')}else if(b.dataset.action==='open-request')openRequest();else if(b.dataset.action==='open-work')openWork();else if(b.dataset.action==='view-my-profile'){if(state.profile?.name){selectedPro='mine';route('professional')}}else if(b.dataset.action==='close-modal')closeModal();else if(b.dataset.dash)dash(b.dataset.dash);else if(b.dataset.deleteRequest){if(confirm('Excluir este pedido?')){state.requests=state.requests.filter(r=>r.id!==b.dataset.deleteRequest);save();renderRequests();renderDashboard();notify('Pedido excluído')}}else if(b.dataset.deleteWork){if(confirm('Excluir este trabalho?')){state.works=state.works.filter(w=>w.id!==b.dataset.deleteWork);save();renderDashboard();notify('Trabalho excluído')}}else if(b.dataset.image){const [id,n]=b.dataset.image.split(':');const r=[...state.requests,...demoRequests].find(r=>r.id===id);if(r?.photos[+n])showImage(r.photos[+n])}else if(b.dataset.workphoto){const [id,n]=b.dataset.workphoto.split(':');const w=state.works.find(w=>w.id===id);if(w?.photos[+n])showImage(w.photos[+n])}});
document.addEventListener('submit',e=>{if(e.target.id==='heroSearch'){e.preventDefault();$('#searchPros').value=$('#heroQuery').value;$('#categoryFilter').value=$('#heroCategory').value;exploreTab='all';route('explore')}else if(e.target.id==='topMarketplaceSearch'){e.preventDefault();$('#searchPros').value=$('#topSearchQuery').value;$('#categoryFilter').value='';exploreTab='all';route('explore')}else if(e.target.id==='profileForm'){e.preventDefault();window.ConectaV9?.saveProfile(e.target)}else if(e.target.id==='requestForm'){e.preventDefault();saveRequest(e.target)}else if(e.target.id==='workForm'){e.preventDefault();saveWork(e.target)}});
document.addEventListener('change',async e=>{if(e.target.id==='requestPhotos')await readPhotos(e.target,4);else if(e.target.id==='workPhotos')await readPhotos(e.target,6);else if(e.target.id==='profilePicture'&&e.target.files[0]){try{profileImage=await compress(e.target.files[0],600);$('#profilePreview').innerHTML=`<img src="${profileImage}" alt="Prévia">`}catch{notify('Erro ao ler foto de perfil')}}});
['searchPros','cityFilter','neighborhoodFilter'].forEach(id=>$('#'+id).addEventListener('input',renderExplore));$('#categoryFilter').addEventListener('change',renderExplore);$('#proSort').addEventListener('change',renderExplore);['requestSearch','requestCategory','requestSort'].forEach(id=>$('#'+id).addEventListener(id==='requestSearch'?'input':'change',renderRequests));$('#clearFilters').addEventListener('click',()=>{$('#searchPros').value='';$('#categoryFilter').value='';$('#cityFilter').value='';$('#neighborhoodFilter').value='';$('#proSort').value='default';exploreTab='all';renderExplore()});$('#closeModal').addEventListener('click',closeModal);$('#modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal()});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});$('#menuBtn').addEventListener('click',()=>{const opened=$('#mobileNav').classList.toggle('open');$('#menuBtn').setAttribute('aria-expanded',String(opened))});
setupSelects();updateProfileUI();route('home');

window.ConectaUI={notify,dialog,closeModal,modal};

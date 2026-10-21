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
  arrow:'<path d="M5 12h14m-6-6 6 6-6 6"/>',
  truck:'<path d="M3 7h11v8H3z"/><path d="M14 10h3l3 3v2h-6z"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/>',
  wind:'<path d="M3 8h10a2 2 0 1 0-2-2"/><path d="M3 12h15a2.5 2.5 0 1 1-2.5 2.5"/><path d="M3 16h8a2 2 0 1 1-2 2"/>',
  car:'<path d="M5 15l1.5-5h11L19 15"/><rect x="3" y="11" width="18" height="5" rx="1"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/>',
  paw:'<circle cx="8" cy="7" r="1.8"/><circle cx="14" cy="6.4" r="1.8"/><circle cx="18" cy="9.4" r="1.8"/><circle cx="6" cy="11" r="1.8"/><path d="M8.5 19c0-2.7 2-4.8 4.5-4.8s4.5 2.1 4.5 4.8c0 .9-.8 1.6-1.7 1.6H10.2c-.9 0-1.7-.7-1.7-1.6Z"/>',
  shirt:'<path d="M9 4 7 6 4 7l2 4v9h12v-9l2-4-3-1-2-2-3 2-3-2Z"/>',
  party:'<path d="M5 20 19 6"/><path d="m7 6 11 11"/><path d="m4 4 3 3"/><path d="M14 3h7v7"/>',
  firstaid:'<path d="M9 4h6v4h4v8h-4v4H9v-4H5V8h4z"/>'
};
const categoryIcons={'Reformas':'hammer','Elétrica':'zap','Hidráulica':'droplets','Limpeza':'sparkles','Pintura':'paint','Jardinagem':'leaf','Montagem':'box','Tecnologia':'monitor','Beleza':'scissors','Fotografia':'camera','Aulas':'book','Marcenaria':'hammer','Ar-condicionado':'wind','Fretes':'truck','Pet care':'paw','Costura':'shirt','Eventos':'party','Automotivo':'car','Saúde':'firstaid','Outros':'grid'};
function icon(name,sz=23){return `<svg width="${sz}" height="${sz}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${svgPaths[name]||svgPaths.grid}</svg>`}
const categories=[['Reformas','▦','Pedreiros e reformas'],['Elétrica','ϟ','Instalações elétricas'],['Hidráulica','◉','Encanamentos'],['Limpeza','✧','Limpeza e faxina'],['Pintura','▧','Pintores'],['Jardinagem','❀','Jardins e plantas'],['Montagem','▤','Móveis e instalações'],['Tecnologia','⌘','Computadores e redes'],['Beleza','✦','Estética e beleza'],['Fotografia','▣','Fotos e vídeos'],['Aulas','⌁','Professores'],['Marcenaria','▥','Móveis sob medida'],['Ar-condicionado','≈','Instalação e manutenção'],['Fretes','⇄','Mudanças e entregas'],['Pet care','◌','Banho, tosa e cuidados'],['Costura','✂','Ajustes e confecção'],['Eventos','✶','Festas e eventos'],['Automotivo','◈','Serviços para veículos'],['Saúde','＋','Cuidados e bem-estar'],['Outros','···','Mais serviços']];
const categoryPictures={
'Reformas':['https://images.unsplash.com/photo-1503387762-592deb58ef4e?w=450&q=83','assets/category-reformas.svg'],
'Elétrica':['https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=450&q=83','assets/category-el-trica.svg'],
'Hidráulica':['https://images.unsplash.com/photo-1585704032915-c3400ca199e7?w=450&q=83','assets/category-hidr-ulica.svg'],
'Limpeza':['https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=450&q=83','assets/category-limpeza.svg'],
'Pintura':['https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=450&q=83','assets/category-pintura.svg'],
'Jardinagem':['https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=450&q=83','assets/category-jardinagem.svg'],
'Montagem':['https://images.unsplash.com/photo-1503602642458-232111445657?w=450&q=83','assets/category-montagem.svg'],
'Tecnologia':['https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=450&q=83','assets/category-tecnologia.svg'],
'Beleza':['https://images.unsplash.com/photo-1560066984-138dadb4c035?w=450&q=83','assets/category-beleza.svg'],
'Fotografia':['https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=450&q=83','assets/category-fotografia.svg'],
'Aulas':['https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=450&q=83','assets/category-aulas.svg'],

'Marcenaria':['https://images.unsplash.com/photo-1504148455328-c376907d081c?w=450&q=83','assets/category-marcenaria.svg'],
'Ar-condicionado':['https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=450&q=83','assets/category-ar-condicionado.svg'],
'Fretes':['https://images.unsplash.com/photo-1553413077-190dd305871c?w=450&q=83','assets/category-fretes.svg'],
'Pet care':['https://images.unsplash.com/photo-1517849845537-4d257902454a?w=450&q=83','assets/category-pet-care.svg'],
'Costura':['https://images.unsplash.com/photo-1512436991641-6745cdb1723f?w=450&q=83','assets/category-costura.svg'],
'Eventos':['https://images.unsplash.com/photo-1511578314322-379afb476865?w=450&q=83','assets/category-eventos.svg'],
'Automotivo':['https://images.unsplash.com/photo-1486006920555-c77dcf18193c?w=450&q=83','assets/category-automotivo.svg'],
'Saúde':['assets/category-health.webp','assets/category-health.webp'],
'Outros':['https://images.unsplash.com/photo-1521737711867-e3b97375f902?w=450&q=83','assets/category-outros.svg']};

const key='conecta.reconstruido.v1';
function load(){return {profile:null,works:[],requests:[],favorites:[]}} // Account data comes from Firebase. Legacy local entries are not read.
let photosBusy=false, uploadGeneration=0;
let publicRequests=[],offersByRequest=new Map();
let coverImage=null, coverBusy=false;
let state=load(), currentPage='home',selectedPro=null, stagedImages=[],profileImage=null,toastTimer,exploreTab='all';
function save(){return true} // Publicações e salvos não usam mais o navegador.
const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function safePhoto(url){const value=String(url||'');return (/^https:\/\/firebasestorage\.googleapis\.com\//.test(value)||(/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(value)&&value.length<=95000))?esc(value):''}
function notify(message){const t=$('#toast');t.textContent=message;t.classList.add('visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>t.classList.remove('visible'),3200)}
function dialog(opts){const cfg=typeof opts==='string'?{message:opts}:opts||{};const tone=cfg.tone||'info';const title=cfg.title||'Aviso';const eyebrow=cfg.eyebrow||'CONECTA';const message=cfg.message||'';const button=cfg.buttonLabel||'Entendi';modal(`<div class="conecta-dialog conecta-dialog-${tone}"><div class="conecta-dialog-badge">${tone==='success'?'✓':tone==='error'?'!':'i'}</div><span class="conecta-dialog-eyebrow">${eyebrow}</span><h2>${esc(title)}</h2><p>${esc(message)}</p><div class="conecta-dialog-actions"><button type="button" class="btn btn-green" data-action="close-modal">${esc(button)}</button></div></div>`)}
function allPros(){return window.ConectaV9?.profilesForCatalog?.() ?? []}
function initials(n){return String(n||'').split(' ').filter(Boolean).slice(0,2).map(s=>s[0].toUpperCase()).join('')||'CO'}
function proCard(p){const saved=(state.favorites||[]).includes(p.id);return `<article class="pro-card"><div class="pro-card-cover"><span class="cover-badge">${icon(categoryIcons[p.category],15)} ${esc(p.category)}</span><div class="cover-art" aria-hidden="true">${icon(categoryIcons[p.category],102)}</div><div class="pro-avatar">${p.photo?`<img src="${esc(p.photo)}" ${p.upgrade?`data-upgrade-src="${esc(p.upgrade)}"`:""} ${p.fallback?`onerror="this.onerror=null;this.src='${esc(p.fallback)}'"`:''} alt="Foto ilustrativa de ${esc(p.name)}">`:esc(p.initials||initials(p.name))}</div></div><button class="save-badge ${saved?'is-saved':''}" type="button" data-favorite="${esc(p.id)}" aria-pressed="${saved}" aria-label="${saved?'Remover dos salvos':'Salvar perfil de '+esc(p.name)}">${icon('heart',19)}</button><div class="pro-content"><span class="pro-label">${p.id==='mine'?'MEU PERFIL':'CONHEÇA O PROFISSIONAL'}</span><h3>${esc(p.name)}</h3><p>${esc(p.bio||'Profissional da comunidade Conecta.')}</p><div class="pro-meta"><span>${icon('pin',15)} ${esc(p.city)}${p.neighborhood?' · '+esc(p.neighborhood):''}</span><span class="verified">${p.id==='mine'?'Seu perfil':p.id.startsWith('demo-')?'Perfil de exemplo':'Perfil publicado'}</span></div>${p.ownerUid?`<span class="v12-rating-chip" data-rating-for="${esc(p.ownerUid)}">Ainda sem avaliações</span>`:''}<div class="pro-footer"><span class="pro-availability"><span class="contact-dot"></span> Ver apresentação</span><button class="btn btn-green" data-pro="${esc(p.id)}">Ver perfil ${icon('arrow',17)}</button></div></div></article>`}
const conectaUpgradedImages = new Map();
function upgradeImages(){
  $$('img[data-upgrade-src]:not([data-upgrade-started])').forEach(img=>{
    const src=img.dataset.upgradeSrc;
    img.dataset.upgradeStarted='true';
    if(!src || src===img.getAttribute('src'))return;
    const updateMatches=()=>{
      // Covers the original cards, the animation clones, and cards created by later renders.
      $$('img[data-upgrade-src]').forEach(other=>{
        if(other.dataset.upgradeSrc===src && other.isConnected && other.getAttribute('src')!==src)other.src=src;
      });
    };
    const existing=conectaUpgradedImages.get(src);
    if(existing==='loaded'){updateMatches();return}
    if(existing==='loading'||existing==='error')return;
    conectaUpgradedImages.set(src,'loading');
    const loader=new Image();
    loader.onload=()=>{conectaUpgradedImages.set(src,'loaded');updateMatches()};
    loader.onerror=()=>conectaUpgradedImages.set(src,'error');
    loader.src=src;
  });
}
function setupSelects(){const opt='<option value="">Todas as categorias</option>'+categories.map(([c])=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');$('#categoryFilter').innerHTML=opt;$('#heroCategory').innerHTML=opt;$('#requestCategory').innerHTML=opt;$('#profileCategory').innerHTML='<option value="">Selecione o serviço</option>'+categories.map(([c])=>`<option value="${esc(c)}">${esc(c)}</option>`).join('');$('#sidebarCategories').innerHTML=categories.map(([c])=>`<button class="sidebar-category" type="button" data-filter-category="${esc(c)}"><span class="sidebar-category-square">${icon(categoryIcons[c],19)}</span>${esc(c)}<small></small></button>`).join('')}
function renderHome(){
  $('#categories').innerHTML=categories.map(([name,_,subtitle])=>{
    const pic=categoryPictures[name];return `<button class="category-item" data-category="${esc(name)}"><span class="v19-category-icon" aria-hidden="true">${icon(categoryIcons[name],23)}</span><span class="category-picture"><img src="${pic[1]}" data-upgrade-src="${pic[0]}" data-category-image="${esc(name)}" loading="eager" decoding="async" alt=""></span><span class="category-words"><strong>${esc(name)}</strong><small>${esc(subtitle)}</small></span></button>`
  }).join('');
  $('#featured').innerHTML=allPros().length?allPros().slice(0,3).map(proCard).join(''):empty('Profissionais chegando em breve','Se você oferece serviços, crie seu perfil gratuitamente e participe do Conecta.');
  $('#heroProCount').textContent=allPros().length;
  $('#heroCatCount').textContent=categories.length;
  $('#heroReqCount').textContent=publicRequests.length;
  upgradeImages();
}
function renderExplore(){
  const q=$('#searchPros').value.trim().toLowerCase(),cat=$('#categoryFilter').value,city=$('#cityFilter').value.trim(),neighborhood=$('#neighborhoodFilter').value.trim();
  let list=allPros().filter(p=>(!cat||p.category===cat)&&(!city||(window.ConectaRegions?.matchesCity(p.city,city)??String(p.city||'').toLowerCase().includes(city.toLowerCase())))&&(!neighborhood||(window.ConectaRegions?.matches(p,neighborhood)??String(p.neighborhood||'').toLocaleLowerCase('pt-BR').includes(neighborhood.toLocaleLowerCase('pt-BR'))))&&(!q||[p.name,p.category,p.bio,p.city,p.neighborhood||''].join(' ').toLowerCase().includes(q))&&(exploreTab!=='saved'||(state.favorites||[]).includes(p.id)));
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
function requestCard(r){
  const owner=!!window.ConectaBackend?.user && window.ConectaBackend.user.uid===r.ownerUid;
  const photos=Array.isArray(r.photos)?r.photos.map(safePhoto).filter(Boolean):[];
  const catIcon=icon(categoryIcons[r.category]||'grid',27);
  const closed=r.status==='closed';
  const actions=owner?`${closed?'':`<button class="btn btn-green" type="button" data-close-request="${esc(r.id)}">Encerrar pedido</button>`}<button class="btn btn-light" type="button" data-delete-request="${esc(r.id)}">Excluir pedido</button>`:
    (closed?'<span class="v46-request-closed-note">Pedido encerrado</span>':`<button class="btn btn-green" type="button" data-offer-request="${esc(r.id)}">Tenho interesse</button>`);
  const proposals=owner?(offersByRequest.get(r.id)||[]):[];
  const offerPanel=owner?`<div class="v24-offers"><strong>${proposals.length?proposals.length+' '+(proposals.length===1?'interessado':'interessados'):(closed?'Nenhuma proposta recebida':'Aguardando propostas')}</strong>${proposals.map(o=>`<div class="v24-offer"><div><strong>${esc(o.providerName)}</strong><p>${esc(o.message)}</p></div><button type="button" class="btn btn-light" data-pro="user:${esc(o.providerUid)}">Ver profissional</button></div>`).join('')}</div>`:'';
  const label=owner?'SEU PEDIDO':'PEDIDO PUBLICADO';
  return `<article class="request-card v11-request-card"><div class="v11-request-card-mark">${catIcon}</div><div class="v11-request-card-inner"><div class="request-card-top"><div class="request-header"><span class="chip">${esc(r.category)}</span><span class="chip dim">${label}</span></div><span class="request-state ${closed?'v46-request-closed':''}">${closed?'Encerrado':'Em aberto'}</span></div><h3>${esc(r.title)}</h3><p>${esc(r.description)}</p><div class="request-meta"><span>${icon('pin',15)} ${esc(r.city)}</span><span>${icon('clock',15)} ${daysAgo(r.created)}</span>${photos.length?`<span>${icon('camera',15)} ${photos.length} fotos</span>`:''}</div>${photos.length?`<div class="request-pictures">${photos.map((src,i)=>`<img src="${src}" alt="Foto do serviço" data-image="${esc(r.id)}:${i}" loading="lazy">`).join('')}</div>`:''}<div class="request-bottom"><div class="request-owner"><span class="v11-owner-avatar">${esc((r.owner||'Cliente').trim().charAt(0).toUpperCase())}</span><div><strong>${esc(r.owner||'Cliente Conecta')}</strong><small>Publicado no Conecta</small></div></div><div class="request-actions">${actions}</div></div>${offerPanel}</div></article>`;
}
function renderRequests(){const q=$('#requestSearch').value.toLowerCase(),cat=$('#requestCategory').value,sort=$('#requestSort').value;let list=[...publicRequests].filter(r=>(window.ConectaRegions?.isSJC(r.city) ?? r.city==='São José dos Campos')&&(!cat||r.category===cat)&&(!q||[r.title,r.city,r.description].join(' ').toLowerCase().includes(q))).sort((a,b)=>sort==='old'?a.created-b.created:b.created-a.created);$('#requestList').innerHTML=list.map(requestCard).join('')||empty('Nenhum pedido encontrado','Tente outro filtro ou publique uma nova necessidade.')}
function empty(title,body){return `<div class="empty"><h3>${esc(title)}</h3><p>${esc(body)}</p></div>`}
function updateProfileUI(){
  const created=!!state.profile?.name;
  // O nome vem do Firebase Authentication, mesmo se a conta ainda não publicou um perfil profissional.
  const account=window.ConectaBackend?.user;
  const accountName=account?(String(account.displayName||'').trim()||String(state.profile?.name||'').trim()||'Minha conta'):'Perfil profissional';
  $$('[data-profile-cta]').forEach(button=>{
    button.textContent=accountName;
    button.title=accountName;
    button.setAttribute('aria-label',account?'Abrir perfil de '+accountName:'Abrir perfil profissional');
  });
  const navMyProfile=$('.desktop-nav [data-open-my-profile]');if(navMyProfile)navMyProfile.style.display=created?'none':'';
  const label=$('#profileTabLabel .v30-tab-text');if(label)label.textContent=created?'Editar perfil':'Perfil profissional';
  const backToProfile=$('.v33-back-to-profile');if(backToProfile)backToProfile.hidden=!created;
  $('#dashboardTitle').innerHTML=(created?'Editar perfil':'Perfil profissional')+'<span class="v30-title-dot">.</span>';
  $('#dashboardSubtitle').textContent=created?'Atualize suas informações e organize seu portfólio e pedidos.':'Apresente seus serviços e crie seu perfil no Conecta.';
  $('#profileFormTitle').textContent=created?'Atualize sua apresentação.':'Seu perfil, do seu jeito.';
  $('#profileFormDescription').textContent=created?'Mantenha seus dados em dia para receber novos contatos.':'Preencha seus dados para os clientes conhecerem seu trabalho.';
  $('#profileSubmitText').textContent=created?'Salvar alterações':'Publicar perfil';
}
function updateCoverPreview(){
  const target=$('#profileCoverPreview'),remove=$('[data-action="remove-profile-cover"]');
  if(!target)return;
  const src=safePhoto(coverImage||'');
  target.innerHTML=src?`<img src="${src}" alt="Sua foto de capa">`:defaultCoverMarkup();
  if(remove)remove.hidden=!src;
}
function renderDashboard(){
  const p=state.profile||{};
  const f=$('#profileForm');
  for(const key of ['name','category','city','neighborhood','phone','bio']) f.elements[key].value=key==='city'?'São José dos Campos':(p[key]||'');
  profileImage=p.photo||null;
  $('#profilePreview').innerHTML=profileImage?`<img src="${profileImage}" alt="Foto de perfil">`:'';
  coverImage=p.cover||'';
  updateCoverPreview();
  updateProfileUI();
  $('#myWorks').innerHTML=state.works.length?state.works.map(w=>workCard(w,true)).join(''):empty('Nenhum trabalho ainda','Adicione trabalhos e mostre suas fotos para futuros clientes.');
  $('#myRequests').innerHTML=state.requests.length?state.requests.map(requestCard).join(''):empty('Você ainda não publicou pedidos','Publique o primeiro pedido e ele aparecerá aqui.');
  f.dispatchEvent(new Event('input'));
}
function workCard(w,manage=false){return `<article class="work-card"><div class="work-photos">${w.photos?.[0]&&safePhoto(w.photos[0])?`<img src="${safePhoto(w.photos[0])}" alt="${esc(w.title)}" data-workphoto="${esc(w.id)}:0">`:''}</div><div class="work-content"><h3>${esc(w.title)}</h3><p>${esc(w.description)}</p><small>${w.photos?.length?`${w.photos.length} foto${w.photos.length===1?'':'s'}`:'Trabalho publicado'}</small>${manage?`<div style="margin-top:12px"><button data-delete-work="${esc(w.id)}">Excluir trabalho</button></div>`:''}</div></article>`}
function defaultCoverMarkup(){return `<div class="v39-cover-default" aria-label="Capa padrão Conecta"><div class="v39-cover-content"><div class="v39-cover-brand"><span class="v39-brand-mark" aria-hidden="true"><i></i><i></i><i></i><i></i></span><span class="v39-brand-name">conecta<span>.</span></span></div><p>Conectando pessoas a boas oportunidades.</p></div><div class="v39-cover-emblem" aria-hidden="true"><i></i><i></i><i></i><i></i></div></div>`}
function renderProfessional(){const p=allPros().find(x=>x.id===selectedPro)||(selectedPro==='mine' && state.profile?.name?{...state.profile,id:'mine',initials:initials(state.profile.name)}:null);if(!p){route('explore');return}let works=window.ConectaLaunch?.worksFor(p.ownerUid)||[];window.ConectaLaunch?.observeWorks(p.ownerUid);const own=p.id==='mine'||(!!p.ownerUid&&p.ownerUid===window.ConectaBackend?.user?.uid);document.body.classList.toggle('v33-own-profile',own);$('#page-professional').classList.toggle('v33-is-own',own);$$('.desktop-nav [data-open-my-profile]').forEach(b=>b.classList.toggle('current',own));const example=p.id.startsWith('demo-');const real=!own&&!example&&!!p.ownerUid;const reviews=!own&&p.ownerUid?`<section id="v12ReviewsSection" class="v12-reviews v36-reviews" data-reviews-for="${esc(p.ownerUid)}"><div class="v13-review-head"><h2>Avaliações de clientes</h2></div><div class="v12-reviews-content">Carregando avaliações...</div></section>`:'';let contact='';if(own){contact='<p class="modal-help">Este é seu perfil público.</p>'}else if(example){contact='<p class="modal-help">Este é um perfil ilustrativo. Não é possível enviar mensagens.</p>'}else if(real){contact=`<div class="v36-contact-stack"><button class="btn btn-green v36-chat-highlight" data-chat-pro="${esc(p.id)}">Vamos conversar</button>${p.hasWhatsapp?`<button class="btn v36-contact-secondary" data-whatsapp-pro="${esc(p.id)}">Solicitar WhatsApp</button>`:''}</div>`}else{contact='<p class="modal-help">Contato indisponível.</p>'}$('#professionalDetail').innerHTML=`${own?`<div class="v33-own-toolbar"><div class="v33-own-title"><span class="v33-own-eyebrow">MINHA CONTA</span><strong>Meu perfil</strong></div><div class="v38-own-actions"><button class="v33-edit-profile" type="button" data-action="edit-own-profile" aria-label="Editar meu perfil"><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m16 4 4 4-12 12H4v-4L16 4Z"/><path d="m14 6 4 4"/></svg>Editar perfil</button><button class="v38-delete-profile" type="button" data-action="delete-own-profile" aria-label="Deletar meu perfil">Deletar perfil</button></div></div>`:''}<div class="detail-banner ${safePhoto(p.cover)?'has-cover':'v39-has-default-cover'}">${safePhoto(p.cover)?`<img class="v32-public-cover" src="${safePhoto(p.cover)}" alt="Capa do perfil de ${esc(p.name)}">`:defaultCoverMarkup()}<div class="detail-avatar">${p.photo?`<img src="${esc(p.photo)}" ${p.upgrade?`data-upgrade-src="${esc(p.upgrade)}"`:""} alt="">`:esc(p.initials||initials(p.name))}</div></div><div class="detail-main ${own?'v33-own-detail':''}"><div class="v36-profile-copy"><span class="overline">${own?'SEU PERFIL':example?'PERFIL DEMONSTRATIVO':'PROFISSIONAL DO CONECTA'}</span><h1>${esc(p.name)}</h1><span class="chip">${esc(p.category)}</span><p>${esc(p.bio||'Sem apresentação ainda.')}</p><p>⌖ ${esc(p.city)}${p.neighborhood?' · '+esc(p.neighborhood):''}</p></div><aside class="detail-aside v36-contact-card"><span class="v36-contact-kicker">${own?'PERFIL VISÍVEL':'FALAR COM O PROFISSIONAL'}</span><h3>${own?'Seu perfil':example?'Vamos conversar?':'Gostou deste perfil?'}</h3><p>${own?'Confira como seu perfil aparece aos clientes.':example?'Dados fictícios para demonstração.':`Fale agora com ${esc(p.name)} e explique o serviço que você precisa.`}</p>${contact}</aside></div><div class="detail-portfolio"><div class="v33-portfolio-heading"><h2>Trabalhos realizados</h2>${own?'<button type="button" class="v33-manage-portfolio" data-action="manage-own-portfolio">Gerenciar portfólio</button>':''}</div><div class="portfolio-grid">${works.length?works.map(w=>workCard(w)).join(''):empty('Sem trabalhos publicados','Este perfil ainda não publicou fotos de trabalhos.')}</div></div>${reviews}`}

let ownProfileLookupInProgress=false;
async function openOwnProfile(){
  if(!window.ConectaV9?.requireAuth('profile'))return;
  if(state.profile?.name){
    selectedPro='mine';
    route('professional');
    return;
  }
  // Firebase auth state and the private profile can finish loading at different times.
  // Do not mistake a published profile for a missing one while the network is responding.
  const backend=window.ConectaBackend;
  const account=backend?.user;
  if(ownProfileLookupInProgress)return;
  if(!account?.uid || typeof backend.getOwnProfile!=='function'){
    notify('Aguarde o carregamento da sua conta e tente abrir seu perfil novamente.');
    return;
  }
  ownProfileLookupInProgress=true;
  const actionButtons=[...document.querySelectorAll('[data-open-my-profile]')];
  actionButtons.forEach(button=>button.setAttribute('aria-busy','true'));
  const requestedUid=account.uid;
  try{
    const profile=await backend.getOwnProfile();
    if(window.ConectaBackend?.user?.uid!==requestedUid)return;
    if(profile?.name){
      state.profile={...profile,id:'mine'};
      selectedPro='mine';
      route('professional');
    }else{
      route('dashboard');
      dash('profile');
    }
  }catch(err){
    notify('Não foi possível consultar seu perfil. Confira sua conexão e tente novamente.');
    console.warn('Erro ao carregar o perfil profissional:',err);
  }finally{
    ownProfileLookupInProgress=false;
    actionButtons.forEach(button=>button.removeAttribute('aria-busy'));
  }
}
function route(page){if(['dashboard','inbox'].includes(page) && !window.ConectaV9?.requireAuth(page==='dashboard'?'profile':'messages'))return;currentPage=page;$$('.page').forEach(el=>el.classList.toggle('active',el.id===`page-${page}`));$$('.navlink').forEach(b=>b.classList.toggle('current',b.dataset.route===page||(b.hasAttribute('data-open-my-profile') && (page==='dashboard'||(page==='professional'&&selectedPro==='mine')))));$('#mobileNav').classList.remove('open');$('#menuBtn').setAttribute('aria-expanded','false');window.scrollTo({top:0});document.body.dataset.page=page;if(page==='home')renderHome();if(page==='explore')renderExplore();if(page==='requests')renderRequests();if(page==='dashboard')renderDashboard();if(page==='professional'){renderProfessional();upgradeImages()}if(page==='inbox')window.ConectaV9?.renderInbox?.()}
function modal(html){uploadGeneration++;photosBusy=false;$('#modalBody').innerHTML=html;$('#modal').classList.add('show');$('#modal').setAttribute('aria-hidden','false');document.body.style.overflow='hidden'}
function closeModal(){uploadGeneration++;photosBusy=false;$('#modal').classList.remove('show');$('#modal').setAttribute('aria-hidden','true');document.body.style.overflow='';stagedImages=[]}
function options(selected=''){return categories.map(([name])=>`<option ${selected===name?'selected':''}>${esc(name)}</option>`).join('')}
function openRequest(){
  if(!window.ConectaV9?.requireAuth('request'))return;
  stagedImages=[];
  modal(`<div class="v32-form-modal v32-request-modal"><div class="v32-modal-heading"><span class="v32-eyebrow">NOVO PEDIDO</span><h2>O que você precisa?</h2><p>Conte o serviço que deseja contratar. Profissionais de São José dos Campos poderão enviar propostas.</p></div>
    <form id="requestForm" class="modal-form v32-publish-form">
      <label class="v32-field">Título do serviço<input name="title" required minlength="5" maxlength="90" placeholder="Ex.: Instalar ventilador de teto" autofocus></label>
      <div class="v32-modal-two"><label class="v32-field">Categoria<select name="category" required>${options()}</select></label><label class="v32-field">Cidade<input name="city" required value="São José dos Campos" readonly aria-readonly="true"></label></div>
      <label class="v32-field">Descreva o que precisa<textarea name="description" required minlength="10" maxlength="1000" rows="5" placeholder="Explique o serviço, os detalhes importantes e o que espera do profissional."></textarea></label>
      <div class="v32-photos-row"><div><strong>Fotos do serviço <span>opcional</span></strong><p>Até 4 fotos JPG ou JPEG, de no máximo 12 MB cada. Otimizadas automaticamente.</p></div><label class="v32-pick-files"><input id="requestPhotos" type="file" accept="image/jpeg,.jpg,.jpeg" multiple>Adicionar fotos</label></div>
      <div id="uploadPreview" class="image-preview v32-image-preview" aria-live="polite"></div>
      <p class="v32-privacy-tip">Não informe endereço residencial, telefone ou dados pessoais na descrição. O pedido será público.</p>
      <div class="modal-actions v32-modal-actions"><button type="button" class="btn btn-light" data-action="close-modal">Cancelar</button><button type="submit" class="btn btn-green">Publicar pedido</button></div>
    </form></div>`);
}
function openWork(){
  if(!window.ConectaV9?.requireAuth('profile'))return;
  if(!state.profile?.name){notify('Crie seu perfil antes de publicar trabalhos.');route('dashboard');return}
  stagedImages=[];
  modal(`<div class="v32-form-modal v32-work-modal"><div class="v32-modal-heading"><span class="v32-eyebrow">SEU PORTFÓLIO</span><h2>Adicionar trabalho</h2><p>Mostre o que você realizou para quem está procurando seus serviços.</p></div>
    <form id="workForm" class="modal-form v32-publish-form">
      <label class="v32-field">Nome do trabalho<input name="title" required minlength="3" maxlength="90" placeholder="Ex.: Reforma de cozinha" autofocus></label>
      <label class="v32-field">Como foi o serviço?<textarea name="description" required minlength="5" maxlength="650" rows="5" placeholder="Explique o que foi feito e o resultado entregue."></textarea></label>
      <div class="v32-photos-row"><div><strong>Galeria de fotos <span>opcional</span></strong><p>Compartilhe até 4 fotos JPG ou JPEG, de no máximo 12 MB cada.</p></div><label class="v32-pick-files"><input id="workPhotos" type="file" accept="image/jpeg,.jpg,.jpeg" multiple>Escolher fotos</label></div>
      <div id="uploadPreview" class="image-preview v32-image-preview" aria-live="polite"></div>
      <p class="v32-privacy-tip">Publique apenas imagens próprias ou autorizadas. Seus trabalhos aparecerão para visitantes.</p>
      <div class="modal-actions v32-modal-actions"><button type="button" class="btn btn-light" data-action="close-modal">Cancelar</button><button type="submit" class="btn btn-green">Publicar trabalho</button></div>
    </form></div>`);
}
async function compress(file,max=720,limit=81000,aspect=null){
  if(file.type!=='image/jpeg'||file.size>12*1024*1024)throw Error('Envie somente imagens JPG ou JPEG de até 12 MB.');
  const img=await new Promise((resolve,reject)=>{
    const image=new Image(),url=URL.createObjectURL(file);
    image.onload=()=>{URL.revokeObjectURL(url);resolve(image)};
    image.onerror=()=>{URL.revokeObjectURL(url);reject(Error('Não foi possível abrir a imagem.'))};
    image.src=url;
  });
  let maxSide=max;
  for(let attempt=0;attempt<9;attempt++){
    let sourceW=img.naturalWidth,sourceH=img.naturalHeight,sourceX=0,sourceY=0;
    if(aspect){if(sourceW/sourceH>aspect){sourceW=sourceH*aspect;sourceX=(img.naturalWidth-sourceW)/2}else{sourceH=sourceW/aspect;sourceY=(img.naturalHeight-sourceH)/2}}
    const scale=Math.min(1,maxSide/sourceW);
    const canvas=document.createElement('canvas');
    canvas.width=Math.max(1,Math.round(sourceW*scale));canvas.height=Math.max(1,Math.round(sourceH*scale));
    canvas.getContext('2d').drawImage(img,sourceX,sourceY,sourceW,sourceH,0,0,canvas.width,canvas.height);
    const data=canvas.toDataURL('image/jpeg',Math.max(.30,.67-attempt*.045));
    if(data.length<=limit)return data;
    maxSide=Math.max(220,Math.floor(maxSide*.84));
  }
  throw Error('A imagem ainda ficou grande. Experimente outra foto.');
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
      const image=await compress(files[i],600,81000);
      if(token!==uploadGeneration||!input.isConnected)return;
      processed.push(image);
      if(preview)preview.innerHTML=`<p class="upload-status" role="status">Preparando fotos: ${i+1} de ${files.length}</p>`;
    }
    stagedImages=processed;
    if(preview)preview.innerHTML=processed.map(x=>`<img src="${x}" alt="Prévia da foto">`).join('');
  }catch(err){stagedImages=[];input.value='';if(preview)preview.innerHTML='';notify(err.message||'Não foi possível processar as fotos.');}
  finally{if(token===uploadGeneration){photosBusy=false;if(submit)submit.disabled=false}}
}
function openOffer(requestId){
  if(!window.ConectaV9?.requireAuth('profile'))return;
  if(!state.profile?.name){notify('Crie seu perfil profissional para enviar propostas.');route('dashboard');return}
  const job=publicRequests.find(r=>r.id===requestId);
  if(!job){notify('Pedido indisponível.');return}
  if(job.status!=='open'){notify('Este pedido já foi encerrado.');return}
  if(job.ownerUid===window.ConectaBackend?.user?.uid){notify('Você não pode responder ao próprio pedido.');return}
  modal(`<div class="request-modal-shell"><div class="request-modal-intro"><span class="overline">PROPOSTA DE SERVIÇO</span><h2>${esc(job.title)}</h2><p>Apresente como você pode ajudar. O cliente poderá ver seu perfil e iniciar uma conversa no Conecta.</p></div><form id="offerForm" data-request-id="${esc(job.id)}" class="modal-form"><label>Sua proposta<textarea name="message" required minlength="15" maxlength="400" rows="5" placeholder="Olá! Posso ajudar com esse serviço. Tenho experiência em..."></textarea></label><p class="modal-help">Sua proposta e o nome do seu perfil serão visíveis para quem publicou este pedido.</p><div class="modal-actions"><button type="button" class="btn btn-light" data-action="close-modal">Cancelar</button><button type="submit" class="btn btn-green">Enviar proposta</button></div></form></div>`);
}
async function saveOffer(form){
  if(!window.ConectaV9?.requireAuth('profile'))return;
  const button=form.querySelector('button[type="submit"]');button.disabled=true;
  try{
    await window.ConectaBackend.createOffer(form.dataset.requestId,form.elements.message.value);
    closeModal();notify('Proposta enviada! O cliente poderá ver seu perfil e entrar em contato.');
  }catch(err){notify('Não foi possível enviar a proposta: '+(err?.code==='permission-denied'?'Confira se você já enviou uma proposta para este pedido.':err?.message||'Tente novamente.'))}
  finally{if(button.isConnected)button.disabled=false}
}
async function saveRequest(f){
  if(photosBusy){notify('Aguarde terminar o processamento das imagens.');return}
  if(!window.ConectaV9?.requireAuth('request'))return;
  const backend=window.ConectaBackend;
  if(!backend?.createRequest){notify('A conexão com Firebase não está pronta. Tente novamente.');return}
  const data=new FormData(f), button=f.querySelector('[type="submit"]');
  const input={title:String(data.get('title')||'').trim(),category:String(data.get('category')||''),city:String(data.get('city')||'').trim(),description:String(data.get('description')||'').trim()};
  if(input.title.length<5||input.city.length<2||input.description.length<10){notify('Confira título, cidade e descrição antes de publicar.');return}
  button.disabled=true;button.textContent='Publicando...';
  try{
    await backend.createRequest(input,[...stagedImages]);
    closeModal();notify('Pedido publicado! Ele já pode aparecer para outros usuários.');route('requests');
  }catch(err){notify('Não foi possível publicar: '+(err?.message||'verifique a conexão e as regras do Firebase.'))}
  finally{if(button.isConnected){button.disabled=false;button.textContent='Publicar pedido'}}
}
async function saveWork(f){
  if(photosBusy){notify('Aguarde terminar o processamento das imagens.');return}
  if(!window.ConectaV9?.requireAuth('profile'))return;
  if(!state.profile?.name){notify('Publique seu perfil antes de adicionar trabalhos.');return}
  const backend=window.ConectaBackend;
  if(!backend?.createWork){notify('Firebase indisponível. Tente novamente.');return}
  const data=new FormData(f),button=f.querySelector('[type="submit"]');
  const input={title:String(data.get('title')||'').trim(),description:String(data.get('description')||'').trim()};
  if(input.title.length<3||input.description.length<5){notify('Informe título e descrição do trabalho.');return}
  button.disabled=true;button.textContent='Publicando...';
  try{
    await backend.createWork(input,[...stagedImages]);
    closeModal();notify('Trabalho publicado em seu perfil!');route('dashboard');dash('portfolio');
  }catch(err){notify('Não foi possível publicar: '+(err?.message||'verifique sua conexão e o Firestore.'))}
  finally{if(button.isConnected){button.disabled=false;button.textContent='Publicar trabalho'}}
}
function dash(name){$$('[data-dash]').forEach(b=>b.classList.toggle('selected',b.dataset.dash===name));$$('.dash-panel').forEach(el=>el.classList.toggle('active',el.id===`dash${name==='myrequests'?'Myrequests':name==='portfolio'?'Portfolio':'Profile'}`));renderDashboard()}
function showImage(src){modal(`<h2>Visualizar imagem</h2><img class="image-view" src="${src}" alt="Imagem ampliada">`)}
document.addEventListener('click',e=>{const b=e.target.closest('button,a,[data-image],[data-workphoto]');if(!b)return;if(b.hasAttribute('data-profile-cta')||b.hasAttribute('data-open-my-profile')){e.preventDefault();openOwnProfile()}else if(b.dataset.action==='edit-own-profile'){e.preventDefault();route('dashboard');dash('profile')}else if(b.dataset.action==='manage-own-portfolio'){e.preventDefault();route('dashboard');dash('portfolio')}else if(b.dataset.route){e.preventDefault();route(b.dataset.route)}else if(b.dataset.favorite){
  const id=b.dataset.favorite, backend=window.ConectaBackend;
  if(!window.ConectaV9?.requireAuth('favorite'))return;
  if(!id.startsWith('user:'))return notify('Este perfil não pode ser salvo.');
  const isSaved=(state.favorites||[]).includes(id);
  b.disabled=true;
  backend.setFavorite(id.slice(5),!isSaved).catch(err=>notify('Não foi possível atualizar seus salvos: '+(err?.message||'erro de conexão'))).finally(()=>{if(b.isConnected)b.disabled=false});
}else if(b.dataset.category){exploreTab='all';$('#categoryFilter').value=b.dataset.category;route('explore')}else if(b.dataset.filterCategory){$('#categoryFilter').value=$('#categoryFilter').value===b.dataset.filterCategory?'':b.dataset.filterCategory;renderExplore()}else if(b.dataset.exploreTab){exploreTab=b.dataset.exploreTab;renderExplore()}else if(b.dataset.categoryScroll){$('#categories').scrollBy({left:b.dataset.categoryScroll==='next'?490:-490,behavior:'smooth'})}else if(b.dataset.pro){selectedPro=b.dataset.pro;route('professional')}else if(b.dataset.offerRequest)openOffer(b.dataset.offerRequest);else if(b.dataset.action==='open-request')openRequest();else if(b.dataset.action==='open-work')openWork();else if(b.dataset.action==='remove-profile-cover'){coverImage='';const input=$('#profileCoverPicture');if(input)input.value='';updateCoverPreview();notify('Capa removida da prévia. Salve o perfil para confirmar.')}else if(b.dataset.action==='view-my-profile'){if(state.profile?.name){selectedPro='mine';route('professional')}}else if(b.dataset.action==='delete-own-profile'){window.ConectaV9?.deleteProfile?.()}else if(b.dataset.action==='close-modal')closeModal();else if(b.dataset.dash)dash(b.dataset.dash);else if(b.dataset.closeRequest){
  const r=state.requests.find(item=>item.id===b.dataset.closeRequest);
  if(!r||r.status!=='open')return notify('Este pedido não está mais em aberto.');
  if(!confirm('Encerrar este pedido? Depois de encerrado, ele não receberá novas propostas.'))return;
  b.disabled=true;
  window.ConectaBackend.closeRequest(r.id).then(()=>notify('Pedido encerrado! Novas propostas foram desativadas.')).catch(err=>{notify('Não foi possível encerrar o pedido: '+(err?.message||'verifique as regras do Firebase.'));b.disabled=false});
}else if(b.dataset.deleteRequest){
  const r=state.requests.find(r=>r.id===b.dataset.deleteRequest);
  if(!r||!confirm('Excluir este pedido publicado?'))return;
  b.disabled=true;
  window.ConectaBackend.deleteRequest(r).then(()=>notify('Pedido removido da plataforma.')).catch(err=>{notify('Erro ao excluir pedido: '+err.message);b.disabled=false});
}else if(b.dataset.deleteWork){
  const w=state.works.find(w=>w.id===b.dataset.deleteWork);
  if(!w||!confirm('Excluir este trabalho do portfólio?'))return;
  b.disabled=true;
  window.ConectaBackend.deleteWork(w).then(()=>notify('Trabalho removido do portfólio.')).catch(err=>{notify('Erro ao excluir trabalho: '+err.message);b.disabled=false});
}else if(b.dataset.image){const [id,n]=b.dataset.image.split(':');const r=publicRequests.find(r=>r.id===id);if(r?.photos[+n]&&safePhoto(r.photos[+n]))showImage(safePhoto(r.photos[+n]))}else if(b.dataset.workphoto){const [id,n]=b.dataset.workphoto.split(':');const selected=allPros().find(p=>p.id===selectedPro);const w=(window.ConectaLaunch?.worksFor(selected?.ownerUid)||[]).find(w=>w.id===id);if(w?.photos[+n]&&safePhoto(w.photos[+n]))showImage(safePhoto(w.photos[+n]))}});
document.addEventListener('submit',e=>{if(e.target.id==='heroSearch'){e.preventDefault();$('#searchPros').value=$('#heroQuery').value;$('#categoryFilter').value=$('#heroCategory').value;exploreTab='all';route('explore')}else if(e.target.id==='topMarketplaceSearch'){e.preventDefault();$('#searchPros').value=$('#topSearchQuery').value;$('#categoryFilter').value='';exploreTab='all';route('explore')}else if(e.target.id==='profileForm'){e.preventDefault();window.ConectaV9?.saveProfile(e.target)}else if(e.target.id==='requestForm'){e.preventDefault();saveRequest(e.target)}else if(e.target.id==='workForm'){e.preventDefault();saveWork(e.target)}else if(e.target.id==='offerForm'){e.preventDefault();saveOffer(e.target)}});
document.addEventListener('change',async e=>{if(e.target.id==='requestPhotos')await readPhotos(e.target,4);else if(e.target.id==='workPhotos')await readPhotos(e.target,4);else if(e.target.id==='profileCoverPicture'&&e.target.files[0]){coverBusy=true;$('#profileSubmit').disabled=true;try{coverImage=await compress(e.target.files[0],1000,93000,3.2);updateCoverPreview()}catch(err){notify(err.message||'Não foi possível preparar a capa.')}finally{coverBusy=false;$('#profileSubmit').disabled=false}}else if(e.target.id==='profilePicture'&&e.target.files[0]){try{profileImage=await compress(e.target.files[0],600,115000);$('#profilePreview').innerHTML=`<img src="${profileImage}" alt="Prévia">`}catch(err){e.target.value='';notify(err.message||'Não foi possível preparar a foto de perfil.')}}});
['searchPros','cityFilter','neighborhoodFilter'].forEach(id=>$('#'+id).addEventListener('input',renderExplore));$('#categoryFilter').addEventListener('change',renderExplore);$('#proSort').addEventListener('change',renderExplore);['requestSearch','requestCategory','requestSort'].forEach(id=>$('#'+id).addEventListener(id==='requestSearch'?'input':'change',renderRequests));$('#clearFilters').addEventListener('click',()=>{$('#searchPros').value='';$('#categoryFilter').value='';$('#cityFilter').value='São José dos Campos';$('#neighborhoodFilter').value='';$('#proSort').value='default';exploreTab='all';$('#neighborhoodFilter').dispatchEvent(new Event('input',{bubbles:true}))});$('#closeModal').addEventListener('click',closeModal);$('#modal').addEventListener('click',e=>{if(e.target.id==='modal')closeModal()});document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()});$('#menuBtn').addEventListener('click',()=>{const opened=$('#mobileNav').classList.toggle('open');$('#menuBtn').setAttribute('aria-expanded',String(opened))});
state.requests=[];state.works=[];state.favorites=[];
setupSelects();updateProfileUI();route('home');

window.ConectaUI={notify,dialog,closeModal,modal};

window.ConectaV24Hooks={
  requests(list){publicRequests=list;const uid=window.ConectaBackend?.user?.uid;state.requests=uid?list.filter(r=>r.ownerUid===uid):[];window.ConectaLaunch?.watchOwnRequests(state.requests);if(currentPage==='requests')renderRequests();if(currentPage==='dashboard')renderDashboard();if(currentPage==='home')renderHome()},
  offers(id,list){offersByRequest.set(id,list);if(currentPage==='dashboard')renderDashboard();if(currentPage==='requests')renderRequests()},
  works(list){state.works=list;if(currentPage==='dashboard')renderDashboard();if(currentPage==='professional')renderProfessional()},
  favorites(list){state.favorites=list;if(currentPage==='explore')renderExplore();if(currentPage==='home')renderHome()},
  reset(){offersByRequest.clear();state.requests=[];state.works=[];state.favorites=[];if(currentPage==='requests')renderRequests();if(currentPage==='dashboard')renderDashboard();if(currentPage==='explore')renderExplore()},
  ownerRequests(){const uid=window.ConectaBackend?.user?.uid;state.requests=uid?publicRequests.filter(r=>r.ownerUid===uid):[];window.ConectaLaunch?.watchOwnRequests(state.requests);if(currentPage==='dashboard')renderDashboard()}
};

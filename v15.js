/* Conecta V15: regional discovery, powered by curated municipal neighborhood data.
   No AI API or geolocation is used, and no address is sent to third parties. */
(function(){
  const $=s=>document.querySelector(s);
  const fold=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
  const isSJC=city=>['sao jose dos campos','sjc','s jose dos campos'].includes(fold(city));
  const sameNeighborhood=(a,b)=>{
    const x=fold(a),y=fold(b);
    return x===y || (x.length>=7 && y.length>=7 && (x.includes(y)||y.includes(x)));
  };
  // Curated, non-exhaustive examples from SJC's city-region neighborhood listings.
  // References and maintenance guidance in LEIA-ME-V15.txt.
  const regions={
    norte:{title:'Zona Norte',aliases:['zona norte','regiao norte','norte','norte sjc'],neighborhoods:[
      'Santana','Jardim Altos de Santana','Alto da Ponte','Vila Paiva','Altos da Vila Paiva','Jardim Telespark',
      'Vila Sinhá','Jardim Guimarães','Vila Leila','Vila Rossi','Vila Zizinha','Vila Alexandrina',
      'Vila do Carmo','Vila Esmeralda','Vila Cristina','Vila César','Jardim Jaci','Jardim Anchieta',
      'Vila Monte Alegre','Jardim Santarém','Vila Dona','Vila Pasto Alto','Vila Nova Cristina',
      'Jardim Ouro Preto','Vila Rangel','Vila Machado','Portal de Minas','Vila Leonídia',
      'Jardim Mariteia','Vila Nossa Senhora das Graças','Vila Veneziani','Jardim Santa Matilde',
      'Vila Cândida','Jardim Minas Gerais','Vila Unidos','Chácaras das Oliveiras','Chácara Miranda'
    ]},
    sul:{title:'Zona Sul',aliases:['zona sul','regiao sul','sul','sul sjc'],neighborhoods:[
      'Jardim Satélite','Bosque dos Eucaliptos','Floradas de São José','Parque Industrial',
      'Jardim Morumbi','Palmeiras de São José','Campo dos Alemães','Parque dos Ipês',
      'Jardim Colonial','Jardim Imperial','Residencial União','Jardim Petrópolis',
      'Jardim Veneza','Parque Independência','Jardim Oriente','Jardim Estoril',
      'Jardim Rosário','Jardim Sul','Jardim Anhembi','Jardim Portugal'
    ]},
    oeste:{title:'Zona Oeste',aliases:['zona oeste','regiao oeste','oeste','oeste sjc'],neighborhoods:[
      'Jardim das Indústrias','Jardim Alvorada','Parque Residencial Aquarius','Aquarius','Urbanova'
    ]},
    leste:{title:'Zona Leste',aliases:['zona leste','regiao leste','leste','leste sjc'],neighborhoods:[
      'Jardim Castanheiras','Jardim Paraíso do Sol','Jardim Nova Michigan','Parque Novo Horizonte',
      'Jardim Cerejeiras','Residencial Galo Branco','Eugênio de Melo','Jardim Ismênia',
      'Jardim Maracanã','Jardim Olímpia','Vila Tesouro','Jardim Universo','Jardim Motorama',
      'Jardim São Vicente','Vista Verde','Campos de São José'
    ]},
    sudeste:{title:'Zona Sudeste',aliases:['zona sudeste','regiao sudeste','sudeste','sudeste sjc'],neighborhoods:[
      'Jardim Santa Luzia','Santa Júlia','Jardim Santa Rosa','Jardim São Judas Tadeu',
      'Jardim da Granja','Parque Santa Rita','Jardim Santa Fé','Vila Iracema',
      'Vila São Benedito','Jardim Souto','Parque Martim Cererê','Jardim Colorado','Jardim Uirá'
    ]},
    centro:{title:'Região Central',aliases:['zona central','regiao central','centro','central'],neighborhoods:[
      'Monte Castelo','Vila Progresso','Vila Tupi','Jardim Esplanada','Jardim Esplanada II',
      'Vila Guarani','Vila Santa Luzia','Vila Maria','Vila Santos','Vila Terezinha','Jardim Jussara'
    ]}
  };
  const aliases=Object.entries(regions).flatMap(([key,r])=>r.aliases.map(alias=>({key,alias:fold(alias)})));
  const pickRegion=q=>{
    const value=fold(q);
    if(!value)return null;
    const found=aliases.find(x=>x.alias===value)||aliases.find(x=>x.alias.startsWith(value)&&value.length>=5);
    return found?.key||null;
  };
  const matches=(pro,query)=>{
    const regionKey=pickRegion(query);
    if(regionKey){
      if(!isSJC(pro.city))return false;
      return regions[regionKey].neighborhoods.some(n=>sameNeighborhood(n,pro.neighborhood));
    }
    return fold(pro.neighborhood).includes(fold(query));
  };
  window.ConectaRegions={regions,pickRegion,matches};
  const input=$('#neighborhoodFilter');
  if(!input)return;
  input.placeholder='Bairro ou região (ex.: Zona Norte)';
  input.setAttribute('autocomplete','off');
  const wrapper=document.createElement('div');
  wrapper.className='v15-region-assist';
  wrapper.id='regionAssistant';
  input.closest('.sidebar-section')?.appendChild(wrapper);
  function draw(){
    const query=input.value.trim(),key=pickRegion(query);
    if(!key){
      if(!query){wrapper.innerHTML='<span class="v15-region-hint">Experimente: Zona Norte, Zona Oeste ou Santana</span>'}
      else wrapper.innerHTML='<span class="v15-region-hint">Buscando diretamente pelo nome do bairro.</span>';
      return;
    }
    const r=regions[key], profs=typeof allPros==='function'?allPros():[];
    const present=new Set(profs.filter(p=>isSJC(p.city)&&r.neighborhoods.some(n=>sameNeighborhood(n,p.neighborhood))).map(p=>fold(p.neighborhood)));
    const active=r.neighborhoods.filter(n=>[...present].some(p=>sameNeighborhood(p,n)));
    wrapper.innerHTML=`<div class="v15-region-result"><span class="v15-region-title">${r.title} · São José dos Campos</span><small>${r.neighborhoods.length} bairros conhecidos na lista, ${active.length} com profissionais cadastrados</small></div><div class="v15-region-chips">${r.neighborhoods.slice(0,16).map(n=>`<button type="button" data-v15-bairro="${n.replace(/"/g,'&quot;')}" class="${[...present].some(p=>sameNeighborhood(p,n))?'has-pro':''}">${n}</button>`).join('')}</div><p class="v15-region-info">Os resultados incluem os profissionais que informaram um bairro reconhecido nessa região. A lista é parcial e pode ser ampliada.</p>`;
  }
  input.addEventListener('input',draw);
  document.addEventListener('click',e=>{
    const btn=e.target.closest('[data-v15-bairro]');if(!btn)return;
    input.value=btn.dataset.v15Bairro;
    input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();
  });
  draw();
})();

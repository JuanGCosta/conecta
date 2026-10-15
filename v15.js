/* Conecta V17: location filters with accent-insensitive cities and neighborhood/region aliases.
   Regional inference is limited to known Sao Jose dos Campos neighborhoods. */
(function(){
  const $=s=>document.querySelector(s);
  const fold=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9\s]/g,' ').replace(/\s+/g,' ').trim();
  // Match the city regardless of accents, state abbreviation and common SJC spellings.
  const cityKey=value=>{
    let s=fold(value).replace(/\s+(?:sp)$/,'').trim();
    if(/^(?:sjc|s j c|s jose dos campos|sao jose campos|sj dos campos|sj campos|s j dos campos|sao jose dos campos)$/.test(s))return 'sao jose dos campos';
    return s;
  };
  const matchesCity=(city,query)=>{
    const q=cityKey(query);
    if(!q)return true;
    const c=cityKey(city);
    return !!c&&(c===q||(q.length>=3&&c.startsWith(q)));
  };
  const isSJC=city=>cityKey(city)==='sao jose dos campos';
  // Normalize common abbreviations used when professionals register a neighborhood.
  const neighborhoodKey=value=>fold(value)
    .replace(/\b(?:jd|jdm|jard)\b/g,'jardim')
    .replace(/\b(?:vl|vla)\b/g,'vila')
    .replace(/\b(?:pq|pqe)\b/g,'parque')
    .replace(/\b(?:res|resid)\b/g,'residencial')
    .replace(/\b(?:ch|chac)\b/g,'chacara')
    .replace(/\bsta\b/g,'santa')
    .replace(/^bairro\s+/,'')
    .trim();
  const noPrefix=s=>s.replace(/^(?:(?:jardim|vila|parque|residencial|chacara)\s+)+/,'');
  const neighborhoodParts=value=>String(value||'').split(/[,;|/]/).map(neighborhoodKey).filter(Boolean);
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
      'Vila Guarani','Vila Santa Luzia','Vila Maria','Vila Santos','Vila Terezinha','Jardim Jussara','Centro'
    ]}
  };
  // A plain "Centro" is a neighborhood in many cities, not a SJC-only region.
  regions.centro.aliases=regions.centro.aliases.filter(s=>s!=='centro').concat(['regiao centro','zona centro']);
  const aliases=Object.entries(regions).flatMap(([key,r])=>r.aliases.map(alias=>({key,alias:fold(alias)})));
  const pickRegion=q=>{
    const value=fold(q);
    if(!value)return null;
    const exact=aliases.find(a=>a.alias===value);
    if(exact)return exact.key;
    const possible=aliases.filter(a=>value.length>=5&&a.alias.startsWith(value));
    const keys=[...new Set(possible.map(a=>a.key))];
    return keys.length===1?keys[0]:null;
  };
  // Prefer unambiguous exact records to avoid confusing similarly named neighborhoods
  // in different regions (e.g. Jardim Santa Luzia and Vila Santa Luzia).
  const knownNeighborhoods=Object.entries(regions).flatMap(([key,r])=>r.neighborhoods.map(name=>({key,canonical:neighborhoodKey(name)})));
  const partRegionKeys=value=>{
    const direct=knownNeighborhoods.filter(n=>n.canonical===value);
    if(direct.length)return [...new Set(direct.map(n=>n.key))];
    const base=noPrefix(value);
    if(base.length<5)return [];
    const similar=knownNeighborhoods.filter(n=>noPrefix(n.canonical)===base);
    const keys=[...new Set(similar.map(n=>n.key))];
    return keys.length===1?keys:[];
  };
  const belongsToRegion=(pro,key)=>{
    if(!isSJC(pro.city))return false;
    return neighborhoodParts(pro.neighborhood).some(part=>{
      if(pickRegion(part)===key)return true;
      return partRegionKeys(part).includes(key);
    });
  };
  const matches=(pro,query)=>{
    const q=neighborhoodKey(query);
    if(!q)return true;
    const regionKey=pickRegion(query);
    if(regionKey){
      if(belongsToRegion(pro,regionKey))return true;
      // Other cities may explicitly use the same region name, but we do not infer it.
      return neighborhoodParts(pro.neighborhood).some(part=>pickRegion(part)===regionKey);
    }
    return neighborhoodParts(pro.neighborhood).some(part=>part.includes(q));
  };
  window.ConectaRegions={regions,pickRegion,matches,matchesCity,isSJC,belongsToRegion,neighborhoodKey};
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
      wrapper.innerHTML=query
        ? '<span class="v15-region-hint">Filtrando pelo bairro informado. A busca ignora acentos e entende abreviações como Jd. e Vl.</span>'
        : '<span class="v15-region-hint">Você também pode buscar por Zona Norte, Zona Sul, Zona Leste, Zona Oeste, Zona Sudeste ou Região Central de São José dos Campos.</span>';
      return;
    }
    const r=regions[key],profs=typeof allPros==='function'?allPros():[];
    const otherCity=$('#cityFilter')?.value.trim();
    if(otherCity&&!matchesCity('São José dos Campos',otherCity)){
      wrapper.innerHTML='<span class="v15-region-hint">O mapeamento automático de zonas está disponível para São José dos Campos. Em outras cidades, use o nome do bairro ou a região informada pelo profissional.</span>';
      return;
    }
    const matched=profs.filter(p=>belongsToRegion(p,key));
    const available=neighborhoodPartsList(matched);
    // List neighborhoods with registered professionals first, including those past the
    // first 16 entries of the original curated list.
    const ranked=[...r.neighborhoods].sort((a,b)=>Number(available.has(neighborhoodKey(b)))-Number(available.has(neighborhoodKey(a))));
    const active=ranked.filter(n=>available.has(neighborhoodKey(n)));
    const chips=ranked.map(n=>{
      const activeClass=available.has(neighborhoodKey(n))?'has-pro':'';
      return `<button type="button" data-v15-bairro="${n.replace(/&/g,'&amp;').replace(/"/g,'&quot;')}" class="${activeClass}">${n}</button>`;
    }).join('');
    wrapper.innerHTML=`<div class="v15-region-result"><span class="v15-region-title">${r.title} · São José dos Campos</span><small>${matched.length} ${matched.length===1?'profissional cadastrado':'profissionais cadastrados'} com bairro identificado nessa região</small></div><div class="v15-region-chips">${chips}</div><p class="v15-region-info">A busca regional considera os bairros informados no cadastro. Perfis sem bairro não podem ser localizados por região. Os bairros sugeridos não representam uma lista completa.</p>`;
  }
  function neighborhoodPartsList(profs){
    const names=new Set();
    const known=regions[pickRegion(input.value)]?.neighborhoods||[];
    profs.forEach(pro=>neighborhoodParts(pro.neighborhood).forEach(part=>{
      const match=known.find(name=>{
        const norm=neighborhoodKey(name);
        return norm===part||(noPrefix(part).length>=5&&noPrefix(part)===noPrefix(norm));
      });
      if(match)names.add(neighborhoodKey(match));
    }));
    return names;
  }
  input.addEventListener('input',draw);
  $('#cityFilter')?.addEventListener('input',draw);
  document.addEventListener('click',e=>{
    const btn=e.target.closest('[data-v15-bairro]');if(!btn)return;
    input.value=btn.dataset.v15Bairro;
    input.dispatchEvent(new Event('input',{bubbles:true}));input.focus();
  });
  draw();
})();

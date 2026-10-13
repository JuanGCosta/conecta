/* Conecta V11: visual enhancements only; existing Firebase/auth behavior retained. */
(function(){
  'use strict';
  const $ = s=>document.querySelector(s);
  // Keep chips and counts in sync even when the V9 event listeners render directly.
  const syncRequests=()=>{
    const count=$('#requestList')?.querySelectorAll('.request-card').length||0;
    const display=$('#v11RequestCount');
    if(display)display.textContent=count===1?'1 pedido encontrado':`${count} pedidos encontrados`;
    const current=$('#requestCategory')?.value||'';
    document.querySelectorAll('[data-request-chip]').forEach(el=>el.classList.toggle('active',el.dataset.requestChip===current));
  };
  if(typeof window.renderRequests==='function'){
    const original=window.renderRequests;
    window.renderRequests=function(...args){const result=original.apply(this,args);syncRequests();return result};
  }
  ['requestSearch','requestCategory','requestSort'].forEach(id=>{
    const el=$('#'+id);if(el){el.addEventListener('input',syncRequests);el.addEventListener('change',syncRequests)}
  });
  document.addEventListener('click',e=>{
    const chip=e.target.closest('[data-request-chip]');
    if(chip){
      const select=$('#requestCategory');
      if(!select)return;
      select.value=chip.dataset.requestChip;
      select.dispatchEvent(new Event('change',{bubbles:true}));
    }
  });
  // Preview updates locally while the professional types; nothing is uploaded.
  const form=$('#profileForm');
  if(form){
    const live=()=>{
      const name=form.elements.namedItem('name')?.value.trim()||'Seu nome aqui';
      const cat=form.elements.namedItem('category')?.value||'Sua especialidade';
      const city=form.elements.namedItem('city')?.value.trim()||'Sua cidade';
      const bio=form.elements.namedItem('bio')?.value.trim()||'Apresente seu trabalho aos clientes e mostre sua experiência.';
      const text={'#v11PreviewName':name,'#v11PreviewCategory':cat,'#v11PreviewCity':city,'#v11PreviewBio':bio};
      for(const [selector,content] of Object.entries(text)){const el=$(selector);if(el)el.textContent=content;}
      const avatar=$('#v11ProfileAvatar');if(avatar){
        const img=$('#profilePreview img');
        avatar.replaceChildren();
        if(img){const preview=document.createElement('img');preview.src=img.src;preview.alt='Sua foto de perfil';avatar.appendChild(preview)}
        else avatar.textContent=(name==='Seu nome aqui'?'C':name.charAt(0)).toUpperCase();
      }
    };
    form.addEventListener('input',live);
    form.addEventListener('change',()=>setTimeout(live,50));
    const imgObserver = new MutationObserver(live);
    const preview=$('#profilePreview'); if(preview)imgObserver.observe(preview,{childList:true});
    document.addEventListener('click',e=>{if(e.target.closest('[data-route="dashboard"],[data-dash]'))setTimeout(live,40)});
    live();
  }
  // Initial count, as app.js already rendered the home route before this script.
  if(typeof window.renderRequests==='function')window.renderRequests();
})();

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
  // Initial count, as app.js already rendered the home route before this script.
  if(typeof window.renderRequests==='function')window.renderRequests();
})();


(function(){
  const buttons=[...document.querySelectorAll('#page-home .hero-quick-actions [data-quick-category]')];
  const filter=document.querySelector('#categoryFilter');
  if(!buttons.length || !filter)return;
  function sync(category=''){
    buttons.forEach(btn=>btn.classList.toggle('is-active', !!category && btn.dataset.quickCategory===category));
  }
  sync(filter.value);
  document.addEventListener('click',e=>{
    const b=e.target.closest('[data-quick-category]');
    if(!b)return;
    filter.value=b.dataset.quickCategory;
    sync(b.dataset.quickCategory);
    if(typeof route==='function')route('explore');
    else window.location.hash='';
  });
  filter.addEventListener('change',()=>sync(filter.value));
  const oldRender=window.renderHome;
  if(typeof oldRender==='function'){
    window.renderHome=function(){ oldRender(); sync(filter.value); };
  }
})();

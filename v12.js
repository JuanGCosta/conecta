/* Conecta V12: category marquee and honest, authenticated user reviews. */
(function(){
  const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
  const ratingCache=new Map();
  const subscriptions=new Map();
  window.ConectaReviewScores=new Map();
  function renderRatings(){
    $$('[data-rating-for]').forEach(el=>{
      const values=ratingCache.get(el.dataset.ratingFor);
      if(!values){if(el.textContent!=='Ainda sem avaliações')el.textContent='Ainda sem avaliações';return;}
      const n=values.length,avg=n?values.reduce((s,r)=>s+r.rating,0)/n:0;
      const label=n?`★ ${avg.toFixed(1).replace('.',',')} · ${n} avaliação${n!==1?'ões':''}`:'Ainda sem avaliações';
      if(el.textContent!==label)el.textContent=label;
    });
    $$('[data-reviews-for]').forEach(el=>{
      const uid=el.dataset.reviewsFor,values=ratingCache.get(uid),target=el.querySelector('.v12-reviews-content');
      if(!target)return;
      if(!values){if(target.dataset.state!=='loading'){target.textContent='Carregando avaliações...';target.dataset.state='loading'}return;}
      if(target.dataset.state==='error')return;
      const n=values.length,avg=n?values.reduce((s,r)=>s+r.rating,0)/n:0;
      const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
      if(target._conectaReviewData === values)return;
      target._conectaReviewData=values;
      target.dataset.state='ready';
      target.innerHTML=`<div class="v12-review-summary"><strong>${n?'★ '+avg.toFixed(1).replace('.',','):'Sem avaliações ainda'}</strong><span>${n?`${n} avaliação${n!==1?'ões':''} de usuários cadastrados`:'Seja a primeira pessoa a avaliar'}</span></div><p class="v12-review-disclaimer">Avaliações de usuários. O Conecta ainda não verifica a conclusão dos serviços.</p><div class="v12-review-list">${values.slice().sort((a,b)=>(b.updatedAt?.seconds||0)-(a.updatedAt?.seconds||0)).slice(0,12).map(r=>`<article class="v12-review"><div><strong>${esc(r.authorName)}</strong><span aria-label="Nota ${r.rating} de 5">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</span></div><p>${esc(r.comment)}</p></article>`).join('')}</div><form id="v12ReviewForm" class="v12-review-form" data-review-form="${esc(uid)}"><h3>Deixe sua avaliação</h3><label>Nota<select name="rating" required><option value="5">★★★★★ · 5</option><option value="4">★★★★☆ · 4</option><option value="3">★★★☆☆ · 3</option><option value="2">★★☆☆☆ · 2</option><option value="1">★☆☆☆☆ · 1</option></select></label><label>Comentário<textarea name="comment" required maxlength="500" rows="3" placeholder="Conte sua experiência com este profissional"></textarea></label><button class="btn btn-green" type="submit">Enviar avaliação</button></form>`;
    });
  }
  function followVisible(){
    const backend=window.ConectaBackend;
    if(!backend?.configured||!backend.subscribeReviews)return;
    const ids=new Set($$('[data-reviews-for],[data-rating-for]').map(n=>n.dataset.reviewsFor||n.dataset.ratingFor));
    for(const id of ids){
      if(subscriptions.has(id))continue;
      subscriptions.set(id,backend.subscribeReviews(id,list=>{ratingCache.set(id,list);window.ConectaReviewScores.set(id,{average:list.length?list.reduce((sum,r)=>sum+r.rating,0)/list.length:0,count:list.length});renderRatings();if($('#proSort')?.value==='rating')window.renderExplore?.()},err=>{console.warn('Conecta reviews:',err);$$('[data-reviews-for="'+id+'"] .v12-reviews-content').forEach(target=>{target.dataset.state='error';target.textContent='Não foi possível carregar as avaliações. Verifique as regras do Firestore.'});}));
    }
    // Render only when new DOM nodes appear or review data changes.
    // renderRatings compares the exact array reference to avoid an observer loop.
    renderRatings();
  }
  const observer=new MutationObserver(()=>{if(!observer.scheduled){observer.scheduled=true;requestAnimationFrame(()=>{observer.scheduled=false;followVisible()})}});
  document.addEventListener('DOMContentLoaded',()=>{
    ['featured','professionalsList','professionalDetail'].forEach(id=>{const el=document.getElementById(id);if(el)observer.observe(el,{childList:true,subtree:true})});
    followVisible();
    window.addEventListener('conecta-backend-ready',followVisible,{once:true});
    const belt=$('#categories');
    if(belt){
      let pause=false,offset=0,last=0,width=0;
      // Clone categories only for animation; clones are hidden from accessibility tree.
      function prepare(){
        belt.querySelectorAll('[data-v12-clone]').forEach(n=>n.remove());
        const cards=[...belt.children];if(!cards.length)return;
        cards.forEach(card=>{const clone=card.cloneNode(true);clone.dataset.v12Clone='';clone.setAttribute('aria-hidden','true');clone.tabIndex=-1;clone.querySelectorAll('button,a,input').forEach(c=>c.tabIndex=-1);belt.appendChild(clone)});
        width=cards[0]&&belt.children[cards.length]?belt.children[cards.length].offsetLeft-cards[0].offsetLeft:0;
      }
      const viewport=belt.parentElement;
      viewport.addEventListener('mouseenter',()=>pause=true);
      viewport.addEventListener('mouseleave',()=>pause=false);
      viewport.addEventListener('focusin',()=>pause=true);
      viewport.addEventListener('focusout',()=>pause=false);
      viewport.addEventListener('touchstart',()=>pause=true,{passive:true});
      const original=window.renderHome;
      if(typeof original==='function')window.renderHome=function(...args){const out=original.apply(this,args);prepare();return out};
      prepare();
      window.matchMedia('(max-width:900px)').addEventListener('change',prepare);
      let lastSignature='';
      const mo=new MutationObserver(()=>{const count=belt.querySelectorAll('.category-item:not([data-v12-clone])').length;const sig=String(count)+'/'+belt.querySelectorAll('[data-v12-clone]').length;if(sig!==lastSignature&&count&&count!==belt.querySelectorAll('[data-v12-clone]').length){lastSignature=sig;prepare()}});
      mo.observe(belt,{childList:true});
      function tick(t){if(last&&!pause&&width>0&&!matchMedia('(prefers-reduced-motion: reduce)').matches){offset+=(t-last)*.025;if(offset>=width)offset-=width;belt.style.transform=`translate3d(${-offset}px,0,0)`}last=t;requestAnimationFrame(tick)}
      requestAnimationFrame(tick);
      document.querySelectorAll('[data-category-scroll]').forEach(b=>b.addEventListener('click',()=>{offset=(offset+(b.dataset.categoryScroll==='next'?230:-230)+width)%width},{capture:true}));
    }
  });
  document.addEventListener('click',e=>{
    const jump=e.target.closest('[data-action="jump-review"]');
    if(!jump)return;
    const section=document.querySelector('#v12ReviewsSection');
    section?.scrollIntoView({behavior:'smooth',block:'start'});
    // The review form is injected when the Firestore listener responds.
    setTimeout(()=>document.querySelector('#v12ReviewForm [name="rating"]')?.focus({preventScroll:true}),250);
  });
  document.addEventListener('submit',async e=>{
    const f=e.target.closest('[data-review-form]');if(!f)return;e.preventDefault();
    const backend=window.ConectaBackend;
    if(!backend?.configured){window.ConectaV9?.openAuth();return}
    if(!backend.user?.emailVerified){window.ConectaV9?.openAuth('login');return}
    const uid=f.dataset.reviewForm;if(uid===backend.user.uid){window.ConectaUI?.dialog({tone:'info',eyebrow:'AVALIAÇÕES',title:'Você está no seu próprio perfil',message:'Para manter as avaliações honestas, não é possível avaliar o seu próprio perfil.'});return}
    const button=f.querySelector('button[type=submit]');button.disabled=true;
    try{await backend.saveReview(uid,Number(f.elements.rating.value),f.elements.comment.value);f.reset();window.ConectaUI?.dialog({tone:'success',eyebrow:'AVALIAÇÕES',title:'Avaliação publicada',message:'Sua avaliação foi enviada com sucesso e já aparece no perfil do profissional.'})}
    catch(err){window.ConectaUI?.dialog({tone:'error',eyebrow:'AVALIAÇÕES',title:'Não foi possível enviar',message:String(err?.message||err||'Tente novamente em instantes.')})}finally{button.disabled=false}
  });
})();

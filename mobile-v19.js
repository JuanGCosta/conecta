/* Conecta V19 • Apenas experiência de interface. A busca e a autenticação continuam no app.js / Firebase. */
(()=>{
 'use strict';
 const get=id=>document.getElementById(id);
 const filterButton=get('v19FilterOpen');
 const filterSheet=get('v19FilterSheet');
 const filterBackdrop=get('v19FilterBackdrop');
 const filterClose=get('v19FilterClose');
 const filterApply=get('v19FilterApply');
 const filterCount=get('v19FilterCount');
 const citySheet=get('v19CitySheet');
 const cityInput=get('v19CityInput');
 const cityLabel=get('v19CityLabel');
 const cityFilter=get('cityFilter');
 const isMobile=()=>window.matchMedia('(max-width:900px)').matches;
 const originalSheetParent=filterSheet?.parentNode;
 const originalSheetNext=filterSheet?.nextSibling;
 function positionSheet(){
   if(!filterSheet || !originalSheetParent)return;
   if(isMobile()){
     // Render outside transformed/overflowing page containers so backdrop cannot block touches.
     if(filterSheet.parentNode!==document.body)document.body.appendChild(filterSheet);
   }else if(filterSheet.parentNode!==originalSheetParent){
     originalSheetParent.insertBefore(filterSheet,originalSheetNext);
   }
 }

 let returnFocus=null;
 const safeValue=()=>cityFilter?.value.trim()||'';
 const updateCity=()=>{if(cityLabel)cityLabel.textContent=safeValue()||'Escolher cidade'};
 function countFilters(){
   const count=['cityFilter','neighborhoodFilter','categoryFilter'].filter(id=>!!get(id)?.value.trim()).length;
   filterCount.textContent=count;
   filterCount.hidden=!count;
   filterButton.setAttribute('aria-label',`Abrir filtros${count?' ('+count+' ativos)':''}`);
   updateCity();
 }
 function setFilters(open){
   positionSheet();
   if(!isMobile())open=false;
   document.body.classList.toggle('v19-filters-open',open);
   filterButton.setAttribute('aria-expanded',String(open));
   filterSheet.setAttribute('aria-hidden',String(!open));
   if(open){returnFocus=document.activeElement;filterClose.focus({preventScroll:true});}
   else if(returnFocus?.isConnected){returnFocus.focus({preventScroll:true});returnFocus=null;}
 }
 filterButton?.addEventListener('click',()=>setFilters(true));
 filterClose?.addEventListener('click',()=>setFilters(false));
 filterApply?.addEventListener('click',()=>setFilters(false));
 filterBackdrop?.addEventListener('click',()=>setFilters(false));
 for(const id of ['cityFilter','neighborhoodFilter','categoryFilter']){
   get(id)?.addEventListener('input',countFilters);
   get(id)?.addEventListener('change',countFilters);
 }
 get('clearFilters')?.addEventListener('click',()=>{requestAnimationFrame(countFilters)});
 function setCityModal(open){
   citySheet.classList.toggle('is-open',open);
   document.body.classList.toggle('v19-city-open',open);
   citySheet.setAttribute('aria-hidden',String(!open));
   if(open){returnFocus=document.activeElement;cityInput.value=safeValue();cityInput.focus({preventScroll:true})}
   else {if(returnFocus?.isConnected){returnFocus.focus({preventScroll:true});returnFocus=null;}}
 }
 get('v19CityOpen')?.addEventListener('click',()=>setCityModal(true));
 citySheet?.querySelectorAll('[data-city-close]').forEach(el=>el.addEventListener('click',()=>setCityModal(false)));
 get('v19CityForm')?.addEventListener('submit',e=>{
   e.preventDefault();
   const value=cityInput.value.trim();if(!value)return;
   cityFilter.value=value;
   cityFilter.dispatchEvent(new Event('input',{bubbles:true}));
   countFilters();setCityModal(false);
   // Use the existing router through its original navigation buttons; it also re-renders results.
   document.querySelector('.desktop-nav [data-route="explore"]')?.click();
 });
 get('v19CityClear')?.addEventListener('click',()=>{
   cityFilter.value='';cityFilter.dispatchEvent(new Event('input',{bubbles:true}));
   countFilters();setCityModal(false);
   document.querySelector('.desktop-nav [data-route="explore"]')?.click();
 });
 document.addEventListener('keydown',e=>{
   if(e.key!=='Escape')return;
   if(citySheet.classList.contains('is-open'))setCityModal(false);
   else if(document.body.classList.contains('v19-filters-open'))setFilters(false);
 });
 document.addEventListener('click',e=>{
   const target=e.target.closest('[data-route]');
   if(target){setFilters(false);if(citySheet.classList.contains('is-open'))setCityModal(false)}
   if(target || e.target.closest('[data-category],[data-filter-category],[data-explore-tab]'))requestAnimationFrame(countFilters);
 });
 // When the explorer is opened, active filters remain visible through their counter.
 // This avoids multiple renderers and keeps app.js as the only filtering implementation.
 window.addEventListener('resize',()=>{positionSheet();if(!isMobile())setFilters(false)});
 positionSheet();
 countFilters();
})();

/* Presentation enhancements only. Original app, authentication and filters stay unchanged. */
(()=>{
  'use strict';
  const isReducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!isReducedMotion && 'IntersectionObserver' in window){
    const observer=new IntersectionObserver(entries=>{
      entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('is-visible');observer.unobserve(entry.target)}});
    },{threshold:.08,rootMargin:'0px 0px -30px 0px'});
    const observe=()=>{
      document.querySelectorAll('#page-home .section-head,#page-home .clean-cta').forEach(el=>{
        if(!el.classList.contains('reveal-element')){el.classList.add('reveal-element');observer.observe(el)}
      });
    };
    if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',observe,{once:true});else observe();
  }
})();

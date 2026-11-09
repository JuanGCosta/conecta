/* Pesquisa local dos tópicos deste documento. Nenhuma consulta é enviada a servidores. */
(() => {
  'use strict';
  const input = document.querySelector('#document-search');
  const sections = [...document.querySelectorAll('.document-section')];
  const feedback = document.querySelector('#search-feedback');
  const empty = document.querySelector('#search-empty');
  const clear = document.querySelector('#clear-search');
  if (!input || !sections.length) return;
  const normalize = value => (value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
  const items = sections.map(section => ({ section, text: normalize(section.textContent) }));
  const update = () => {
    const q = normalize(input.value);
    let count = 0;
    items.forEach(({section,text}) => {
      const match = !q || text.includes(q);
      section.hidden = !match;
      if (match) count++;
    });
    empty.hidden = !q || count !== 0;
    feedback.hidden = !q;
    if (q) feedback.textContent = count === 0 ? 'Nenhum tópico corresponde à pesquisa.' : `${count} ${count === 1 ? 'tópico encontrado' : 'tópicos encontrados'} nesta página.`;
  };
  input.addEventListener('input',update);
  input.addEventListener('keydown',event => { if (event.key === 'Escape') { input.value = ''; update(); input.blur(); } });
  if (clear) clear.addEventListener('click',() => { input.value = ''; update(); input.focus(); });
})();

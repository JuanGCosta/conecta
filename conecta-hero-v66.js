/* Conecta v66 — seletor visual de categorias mantendo o <select> real usado pelo app. */
(() => {
  'use strict';
  const select = document.getElementById('heroCategory');
  const trigger = document.getElementById('v66CategoryTrigger');
  const label = document.getElementById('v66CategoryValue');
  const list = document.getElementById('v66CategoryMenu');
  if (!select || !trigger || !label || !list) return;

  let open = false;
  let items = [];
  let activeIndex = 0;
  const textFor = () => select.selectedOptions[0]?.textContent?.trim() || 'Todas as categorias';
  function syncLabel() {
    label.textContent = textFor();
    items.forEach(button => button.setAttribute('aria-selected', String(button.dataset.value === select.value)));
  }
  function buildList() {
    const fragment = document.createDocumentFragment();
    items = Array.from(select.options).map((option, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'v66-category-option';
      button.textContent = option.textContent;
      button.dataset.value = option.value;
      button.setAttribute('role', 'option');
      button.id = `v66-cat-${i}`;
      button.setAttribute('aria-selected', String(select.value === option.value));
      button.addEventListener('click', () => {
        select.value = option.value;
        select.dispatchEvent(new Event('change', {bubbles: true}));
        syncLabel();
        setOpen(false);
        trigger.focus();
      });
      fragment.appendChild(button);
      return button;
    });
    list.replaceChildren(fragment);
    syncLabel();
  }
  function setOpen(next) {
    open = !!next;
    list.hidden = !open;
    trigger.setAttribute('aria-expanded', String(open));
    trigger.classList.toggle('v66-open', open);
    if (open) {
      syncLabel();
      const idx = items.findIndex(b => b.dataset.value === select.value);
      activeIndex = idx < 0 ? 0 : idx;
      items[activeIndex]?.scrollIntoView({block: 'nearest'});
    }
  }
  trigger.addEventListener('click', () => setOpen(!open));
  trigger.addEventListener('keydown', e => {
    if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
      e.preventDefault();
      if (!open) setOpen(true);
      if (e.key === 'Home') activeIndex = 0;
      else if (e.key === 'End') activeIndex = items.length - 1;
      else activeIndex = Math.max(0, Math.min(items.length - 1, activeIndex + (e.key === 'ArrowDown' ? 1 : -1)));
      items[activeIndex]?.focus();
    }
    if (e.key === 'Escape') setOpen(false);
  });
  list.addEventListener('keydown', e => {
    const focused = items.indexOf(document.activeElement);
    if (e.key === 'Escape') { e.preventDefault(); setOpen(false); trigger.focus(); }
    else if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
      e.preventDefault();
      const delta = e.key === 'ArrowDown' ? 1 : -1;
      const next = e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : Math.max(0, Math.min(items.length - 1, focused + delta));
      items[next]?.focus();
    }
  });
  document.addEventListener('pointerdown', e => {
    if (open && !trigger.contains(e.target) && !list.contains(e.target)) setOpen(false);
  });
  document.addEventListener('keydown', e => {
    if (open && e.key === 'Escape') { setOpen(false); trigger.focus(); }
  });
  select.addEventListener('change', syncLabel);
  new MutationObserver(buildList).observe(select, {childList:true, subtree:true});
  buildList();
})();

/* V67: seletor de categorias personalizado, mantendo o select original e seu evento change. */
(() => {
  'use strict';
  const select = document.getElementById('heroCategory');
  const trigger = document.getElementById('v66CategoryTrigger');
  const label = document.getElementById('v66CategoryValue');
  const menu = document.getElementById('v66CategoryMenu');
  const page = document.getElementById('page-home');
  if (!select || !trigger || !label || !menu || !page) return;

  menu.classList.add('v68-category-portal');
  document.body.appendChild(menu);
  let buttons = [];
  let opened = false;
  const sync = () => {
    label.textContent = select.selectedOptions[0]?.textContent?.trim() || 'Todas as categorias';
    buttons.forEach(button => button.setAttribute('aria-selected', String(button.dataset.value === select.value)));
  };
  // Position the list against the trigger using viewport coordinates.
  // Since the menu is attached to <body> it cannot be clipped by the hero.
  function positionMenu() {
    if (!opened || menu.hidden) return;
    const rect = trigger.getBoundingClientRect();
    const viewport = window.visualViewport;
    const viewH = viewport ? viewport.height + viewport.offsetTop : window.innerHeight;
    const viewW = viewport ? viewport.width + viewport.offsetLeft : window.innerWidth;
    const inset = 12;
    const isSmall = viewW <= 760;
    const safeBottom = isSmall ? 86 : 12; // reserve a área da navegação inferior mobile
    const desiredWidth = Math.min(isSmall ? viewW - 28 : 284, viewW - inset * 2);
    let x = rect.right - desiredWidth;
    x = Math.max(inset, Math.min(x, viewW - desiredWidth - inset));
    const below = viewH - rect.bottom - safeBottom - 8;
    const above = rect.top - inset - 8;
    const upward = !isSmall && below < 200 && above > below + 60;
    const available = Math.max(110, upward ? above : below);
    const height = Math.min(isSmall ? 370 : 460, available);
    const y = upward ? Math.max(inset, rect.top - height - 8) : Math.min(viewH - safeBottom - height, rect.bottom + 8);
    Object.assign(menu.style, {left: x + 'px',top: y + 'px', width: desiredWidth + 'px',maxHeight: height + 'px'});
  }
  function close() {
    opened = false;
    menu.hidden = true;
    trigger.setAttribute('aria-expanded', 'false');
    trigger.classList.remove('v67-open');
  }
  function open() {
    if (!page.classList.contains('active')) return;
    opened = true;
    sync();
    menu.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    trigger.classList.add('v67-open');
    positionMenu();
    const selected = buttons.find(b => b.dataset.value === select.value);
    if (selected) menu.scrollTop = Math.max(0, selected.offsetTop - 65);
  }
  function rebuild() {
    const fragment = document.createDocumentFragment();
    buttons = Array.from(select.options).map((option, index) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'v67-category-option';
      button.id = 'v67-category-' + index;
      button.setAttribute('role','option');
      button.dataset.value = option.value;
      button.textContent = option.textContent;
      button.addEventListener('click', () => {
        select.value = option.value;
        select.dispatchEvent(new Event('change', {bubbles: true}));
        sync();
        close();
        trigger.focus();
      });
      fragment.appendChild(button);
      return button;
    });
    menu.replaceChildren(fragment);
    sync();
  }
  trigger.addEventListener('click', () => opened ? close() : open());
  trigger.addEventListener('keydown', e => {
    if (['ArrowDown','ArrowUp','Home','End'].includes(e.key)) {
      e.preventDefault();
      if (!opened) open();
      const current = Math.max(0, buttons.findIndex(b => b.dataset.value === select.value));
      const index = e.key === 'Home' ? 0 : e.key === 'End' ? buttons.length - 1 : Math.max(0, Math.min(buttons.length - 1, current + (e.key === 'ArrowDown' ? 1 : -1)));
      buttons[index]?.focus();
    }
    if (e.key === 'Escape') close();
  });
  menu.addEventListener('keydown', e => {
    if (e.key === 'Escape') {e.preventDefault();close();trigger.focus();return;}
    if (!['ArrowDown','ArrowUp','Home','End'].includes(e.key)) return;
    e.preventDefault();
    const current = Math.max(0, buttons.indexOf(document.activeElement));
    const index = e.key === 'Home' ? 0 : e.key === 'End' ? buttons.length - 1 : Math.max(0, Math.min(buttons.length - 1, current + (e.key === 'ArrowDown' ? 1 : -1)));
    buttons[index]?.focus();
  });
  document.addEventListener('pointerdown', e => {
    if (opened && !trigger.contains(e.target) && !menu.contains(e.target)) close();
  });
  document.addEventListener('keydown', e => {if (opened && e.key === 'Escape'){close();trigger.focus();}});
  select.addEventListener('change', sync);
  new MutationObserver(rebuild).observe(select, {childList:true, subtree:true});
  new MutationObserver(() => {if (!page.classList.contains('active')) close();}).observe(page, {attributes:true,attributeFilter:['class']});
  window.addEventListener('popstate', close);
  window.addEventListener('resize', positionMenu);
  window.addEventListener('scroll', positionMenu, {passive:true, capture:true});
  window.visualViewport?.addEventListener('resize', positionMenu);
  window.visualViewport?.addEventListener('scroll', positionMenu);
  rebuild();
})();

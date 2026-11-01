/* Conecta V48: registra o service worker do PWA (app instalável e Play Store).
   Não altera nada na tela. Se o navegador não tiver suporte, nada acontece. */
(function () {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js', { scope: './' })
      .catch(e => console.warn('[Conecta] Service worker não registrado:', e));
  });
})();

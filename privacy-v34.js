/* Central de privacidade — UI de acesso e solicitações. Não executa exclusão automática. */
(function(){
  'use strict';
  const $=s=>document.querySelector(s);
  const currentBackend=()=>window.ConectaBackend;
  function openCenter(){
    const mobileMenu=$('#mobileNav');
    mobileMenu?.classList.remove('open');
    $('#menuBtn')?.setAttribute('aria-expanded','false');
    const logged=!!currentBackend()?.user?.emailVerified;
    const html=`<section class="v34-privacy-modal" aria-labelledby="v34PrivacyHeading">
      <span class="v34-overline">Seus dados, suas escolhas</span>
      <h2 id="v34PrivacyHeading">Central de Privacidade</h2>
      <p>Consulte como seus dados são usados e solicite acesso ou exclusão. Informações públicas do perfil continuam visíveis enquanto publicadas.</p>
      <div class="v34-privacy-links"><a href="privacidade.html" target="_blank" rel="noopener noreferrer">Política de Privacidade</a><a href="termos.html" target="_blank" rel="noopener noreferrer">Termos de Uso</a></div>
      ${!logged?'<div class="v34-privacy-notice">Entre com uma conta e confirme seu e-mail para acessar os recursos abaixo.</div>':''}
      <div class="v34-privacy-section"><h3>Baixar dados disponíveis</h3><p>Gere um arquivo JSON com seu perfil, contato privado, favoritos, pedidos, trabalhos, conversas e alguns outros registros associados à conta. Uma cópia integral pode precisar de atendimento adicional.</p><button type="button" data-privacy-export>Baixar meus dados</button></div>
      <div class="v34-privacy-section"><h3>Solicitar uma cópia completa</h3><p>Registre uma solicitação de acesso para conferência e atendimento pelo responsável do Conecta.</p><button type="button" data-privacy-request="access">Solicitar meus dados</button></div>
      <div class="v34-privacy-section"><h3>Limpar dados antigos deste navegador</h3><p>Remove somente os dados locais de versões antigas do Conecta. Isso não apaga os dados da sua conta no Firebase nem a sessão de login.</p><button type="button" data-privacy-clear-local>Limpar dados antigos</button></div>
      <div class="v34-privacy-section danger"><h3>Solicitar exclusão de conta e dados</h3><p>Registra um pedido para processamento administrativo. <strong>Não exclui automaticamente</strong> a conta, mensagens ou outros dados. Você receberá uma confirmação de registro, não de exclusão.</p><button type="button" data-privacy-request="deletion">Solicitar exclusão</button></div>
      <div class="v34-privacy-notice">Antes do lançamento público, o responsável precisa divulgar sua identidade e um canal externo de contato para atender solicitações sem acesso à conta.</div>
      <p id="v34PrivacyFeedback" class="v34-privacy-feedback" role="status" aria-live="polite"></p>
    </section>`;
    if(typeof modal==='function')modal(html);
  }
  function feedback(t){const e=$('#v34PrivacyFeedback');if(e)e.textContent=t;else if(typeof notify==='function')notify(t)}
  function requireAccount(){
    if(currentBackend()?.user?.emailVerified)return true;
    window.ConectaV9?.requireAuth?.('messages');return false;
  }
  document.addEventListener('click',async event=>{
    const target=event.target.closest('[data-privacy-open],[data-privacy-export],[data-privacy-request],[data-privacy-clear-local]');
    if(!target)return;
    event.preventDefault();
    if(target.hasAttribute('data-privacy-open')){openCenter();return;}
    if(target.hasAttribute('data-privacy-clear-local')){
      if(!confirm('Remover os dados de versões antigas armazenados apenas neste navegador? A conta online não será afetada.'))return;
      try{
        ['conecta.reconstruido.v1','conecta.v8-profile-backup'].forEach(k=>localStorage.removeItem(k));
        feedback('Dados locais antigos removidos deste navegador.');
      }catch{feedback('Não foi possível acessar o armazenamento local.');}
      return;
    }
    if(!requireAccount())return;
    if(target.disabled)return;
    target.disabled=true;
    const oldText=target.textContent;
    target.textContent='Aguarde...';
    try{
      const backend=currentBackend();
      if(target.hasAttribute('data-privacy-export')){
        const data=await backend.exportMyData();
        const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'});
        const url=URL.createObjectURL(blob);
        const a=document.createElement('a');a.href=url;a.download='conecta-meus-dados.json';
        document.body.appendChild(a);a.click();a.remove();
        setTimeout(()=>URL.revokeObjectURL(url),1000);
        feedback('Arquivo gerado neste navegador. Guarde-o em local privado. Se precisar de uma cópia integral, solicite atendimento.');
      }else{
        const kind=target.dataset.privacyRequest;
        if(kind==='deletion'&&!confirm('Registrar uma solicitação de exclusão? A conta e os dados NÃO serão apagados automaticamente. O responsável terá que processar o pedido.'))return;
        if(!backend.requestPrivacy)throw Error('Conexão com o Firebase não está pronta.');
        await backend.requestPrivacy(kind);
        feedback(kind==='deletion'?'Pedido de exclusão registrado para atendimento manual. Sua conta ainda está ativa.':'Pedido de acesso registrado para atendimento manual.');
      }
    }catch(e){feedback('Não foi possível concluir: '+(e?.message||'verifique o Firebase e a confirmação de e-mail.'))}
    finally{if(target.isConnected){target.disabled=false;target.textContent=oldText}}
  });
})();

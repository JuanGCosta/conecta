/* Central de privacidade — UI de acesso, solicitações e exclusão da conta (V47). */
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
      <p class="v35-privacy-contact">Contato de suporte e privacidade: <a href="mailto:conectacontato@outlook.com">conectacontato@outlook.com</a></p>
      ${!logged?'<div class="v34-privacy-notice">Entre com uma conta e confirme seu e-mail para acessar os recursos abaixo.</div>':''}
      <div class="v34-privacy-section"><h3>Baixar dados disponíveis</h3><p>Gere um arquivo JSON com seu perfil, contato privado, favoritos, pedidos, trabalhos, conversas e alguns outros registros associados à conta. Uma cópia integral pode precisar de atendimento adicional.</p><button type="button" data-privacy-export>Baixar meus dados</button></div>
      <div class="v34-privacy-section"><h3>Solicitar uma cópia completa</h3><p>Registre uma solicitação de acesso para conferência e atendimento pelo responsável do Conecta.</p><button type="button" data-privacy-request="access">Solicitar meus dados</button></div>
      <div class="v34-privacy-section"><h3>Limpar dados antigos deste navegador</h3><p>Remove somente os dados locais de versões antigas do Conecta. Isso não apaga os dados da sua conta no Firebase nem a sessão de login.</p><button type="button" data-privacy-clear-local>Limpar dados antigos</button></div>
      <div class="v34-privacy-section danger"><h3>Excluir minha conta</h3><p>Apaga de forma definitiva sua conta, perfil, telefone, trabalhos, pedidos, propostas, favoritos e as avaliações que você fez ou recebeu. Nas conversas, seu nome passa a aparecer como "Usuário removido" e a conversa é encerrada; as mensagens continuam visíveis para a outra pessoa. <strong>Não é possível desfazer.</strong></p><button type="button" data-privacy-delete-account>Excluir minha conta</button></div>
      <div class="v34-privacy-notice">Antes do lançamento público, o responsável precisa divulgar sua identidade e um canal externo de contato para atender solicitações sem acesso à conta.</div>
      <p id="v34PrivacyFeedback" class="v34-privacy-feedback" role="status" aria-live="polite"></p>
    </section>`;
    if(typeof modal==='function')modal(html);
  }
  function feedback(t){const e=$('#v34PrivacyFeedback');if(e)e.textContent=t;else if(typeof notify==='function')notify(t)}
  function openDeleteAccount(){
    if(typeof modal!=='function')return;
    modal(`<section class="v34-privacy-modal" aria-labelledby="v47DeleteHeading">
      <span class="v34-overline">Exclusão definitiva</span>
      <h2 id="v47DeleteHeading">Excluir minha conta</h2>
      <p>Seu perfil, telefone, trabalhos, pedidos, propostas, favoritos e avaliações serão apagados. Nas conversas, seu nome será trocado por "Usuário removido". Se quiser guardar uma cópia, use antes o botão "Baixar meus dados" na Central de Privacidade.</p>
      <form id="v47DeleteAccountForm" class="v34-privacy-section danger">
        <label>Sua senha<input type="password" name="password" required autocomplete="current-password"></label>
        <label>Digite <strong>EXCLUIR</strong> para confirmar<input type="text" name="confirm" required autocomplete="off"></label>
        <button type="submit">Excluir minha conta definitivamente</button>
        <button type="button" data-privacy-open>Cancelar</button>
      </form>
      <p id="v34PrivacyFeedback" class="v34-privacy-feedback" role="status" aria-live="polite"></p>
    </section>`);
  }
  const deleteProblem=e=>({
    'auth/wrong-password':'Senha incorreta.',
    'auth/invalid-credential':'Senha incorreta.',
    'auth/too-many-requests':'Muitas tentativas. Aguarde alguns minutos e tente de novo.',
    'auth/network-request-failed':'Sem conexão. Verifique sua internet e tente de novo.'
  }[e?.code] || 'Não foi possível concluir a exclusão. Nada foi perdido: tente de novo para terminar.');
  document.addEventListener('submit',async event=>{
    const form=event.target;
    if(form.id!=='v47DeleteAccountForm')return;
    event.preventDefault();
    if(form.elements.confirm.value.trim().toUpperCase()!=='EXCLUIR'){feedback('Digite EXCLUIR para confirmar.');return}
    const button=form.querySelector('button[type="submit"]');
    button.disabled=true;button.textContent='Excluindo...';
    try{
      const backend=currentBackend();
      if(!backend?.deleteAccount)throw Error('Conexão com o Firebase não está pronta.');
      await backend.deleteAccount(form.elements.password.value);
      if(typeof closeModal==='function')closeModal();
      if(typeof route==='function')route('home');
      if(typeof notify==='function')notify('Sua conta foi excluída. Obrigado por ter usado o Conecta.');
    }catch(e){
      console.warn('[Conecta] Exclusão de conta:',e?.code||e);
      feedback(deleteProblem(e));
      if(button.isConnected){button.disabled=false;button.textContent='Excluir minha conta definitivamente'}
    }
  });
  function requireAccount(){
    if(currentBackend()?.user?.emailVerified)return true;
    window.ConectaV9?.requireAuth?.('messages');return false;
  }
  document.addEventListener('click',async event=>{
    const target=event.target.closest('[data-privacy-open],[data-privacy-export],[data-privacy-request],[data-privacy-clear-local],[data-privacy-delete-account]');
    if(!target)return;
    event.preventDefault();
    if(target.hasAttribute('data-privacy-open')){openCenter();return;}
    // A exclusão vale também para contas sem e-mail confirmado: basta estar logado.
    if(target.hasAttribute('data-privacy-delete-account')){
      if(!currentBackend()?.user){window.ConectaV9?.requireAuth?.('messages');return}
      openDeleteAccount();return;
    }
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

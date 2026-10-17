/* Conecta V9: public catalog, protected profiles and private conversations. */
(function(){
  let user=null,realProfiles=[],threads=[],messages=[],activeChat=null,stopThreads=null,stopMessages=null,stopPros=null,pendingPro=null,authSerial=0,waitingSend=false,threadsBootstrapped=false,notificationAsked=false,soundEnabled=false,soundContext=null;
  const $ = s => document.querySelector(s);
  const backend = () => window.ConectaBackend;
  const configured = () => !!backend()?.configured && !!backend()?.subscribeAuth;
  const verified = () => !!user?.emailVerified;
  const currentUid = () => user?.uid;
  const demo = p => p.id?.startsWith('demo-');
  const safe = text => esc(text ?? '');
  const nick = value => String(value||'Usuário').trim().split(/\s+/).map(w=>w[0]).slice(0,2).join('').toUpperCase();
  const authProblem = e => ({
    'auth/email-already-in-use':'Este e-mail já possui uma conta. Tente entrar.',
    'auth/invalid-email':'Confira o e-mail informado.',
    'auth/weak-password':'Crie uma senha mais forte, com pelo menos 8 caracteres.',
    'auth/invalid-credential':'E-mail ou senha incorretos.',
    'auth/too-many-requests':'Muitas tentativas. Aguarde alguns minutos.',
    'auth/unauthorized-domain':'Adicione o domínio do site em Authentication > Settings > Authorized domains.',
    'permission-denied':'Acesso negado pelo Firestore. Confira se a conta confirmou o e-mail e se as regras foram publicadas.'
  }[e?.code] || e?.message || 'Não foi possível concluir a operação.');
  function showSetup(){modal(`<div class="auth-shell"><div class="auth-symbol">◈</div><span class="overline">CONTA CONECTA</span><h2>Ative o cadastro real</h2><p>A navegação da plataforma já é pública. Para criar contas e trocar mensagens entre computadores, é necessário conectar seu projeto Firebase.</p><div class="auth-notice">Configure <strong>firebase-config.js</strong>, ative Authentication e publique as regras do Firestore. As regras do Firestore e do Storage precisam ser publicadas no console do Firebase.</div><button class="btn btn-green" data-action="close-modal">Entendi</button></div>`)}
  function openAuth(mode='login'){
    if(!configured()){showSetup();return}
    if(user && !verified())mode='verify';
    if(user && verified() && mode!=='verify'){closeModal();return}
    if(mode==='verify'){
      modal(`<div class="auth-shell"><div class="auth-symbol">✉</div><span class="overline">SEGURANÇA CONECTA</span><h2>Confirme seu e-mail</h2><p>Enviamos um link de confirmação para <strong>${safe(user?.email)}</strong>. Confira sua caixa de entrada e também Spam ou Lixo eletrônico. Clique no link e volte aqui.</p><div class="auth-notice">Você pode explorar os serviços sem login, mas para publicar perfil ou conversar é necessário confirmar seu endereço.</div><button class="btn btn-green" data-action="auth-check">Já confirmei meu e-mail</button><div class="auth-inline"><button data-action="auth-resend">Reenviar e-mail</button><button data-action="auth-logout">Sair da conta</button></div><p id="authFeedback" class="auth-feedback" role="status"></p></div>`);return;
    }
    if(mode==='reset'){
      modal(`<div class="auth-shell"><div class="auth-symbol">✉</div><h2>Recuperar senha</h2><p>Enviaremos um link para você definir uma nova senha.</p><form id="resetAuthForm" class="auth-form"><label>E-mail<input name="email" type="email" required autocomplete="email" placeholder="voce@exemplo.com"></label><button type="submit" class="btn btn-green">Enviar link</button><p id="authFeedback" class="auth-feedback" role="status"></p></form><div class="auth-inline"><button data-auth-mode="login">Voltar ao login</button></div></div>`);return;
    }
    const create=mode==='register';
    modal(`<div class="auth-shell"><div class="auth-symbol">◈</div><span class="overline">BEM-VINDO AO CONECTA</span><h2>${create?'Crie sua conta':'Entre na sua conta'}</h2><p>${create?'Cadastre-se gratuitamente para conversar e, se desejar, oferecer seus serviços.':'Acesse suas mensagens e gerencie seu perfil profissional.'}</p><div class="auth-tabs"><button type="button" data-auth-mode="login" class="${!create?'active':''}">Entrar</button><button type="button" data-auth-mode="register" class="${create?'active':''}">Criar conta</button></div><form id="${create?'registerAuthForm':'loginAuthForm'}" class="auth-form">${create?'<label>Seu nome<input type="text" name="name" maxlength="70" minlength="2" required autocomplete="name" placeholder="Como podemos chamar você?"></label>':''}<label>E-mail<input type="email" name="email" required autocomplete="email" placeholder="voce@exemplo.com"></label><label>Senha<input type="password" name="password" minlength="${create?'8':'6'}" required autocomplete="${create?'new-password':'current-password'}" placeholder="${create?'Mínimo de 8 caracteres':'Sua senha'}"></label>${create?'<p class="auth-small">Enviaremos um e-mail para validar o endereço. Se não encontrar, confira Spam e Lixo eletrônico.</p>':''}<button type="submit" class="btn btn-green">${create?'Criar conta':'Entrar'}</button><p class="auth-feedback" id="authFeedback" role="status"></p></form><div class="auth-inline">${!create?'<button data-auth-mode="reset">Esqueci minha senha</button>':''}<span>Explorar profissionais é grátis e não exige login.</span></div></div>`);
  }
  function errorAtAuth(msg){const t=$('#authFeedback');if(t)t.textContent=msg;else notify(msg)}

  function playIncomingSound(){
    if(!soundEnabled || !soundContext)return;
    try{
      if(soundContext.state==='suspended')soundContext.resume().catch(()=>{});
      const now=soundContext.currentTime;
      [0,0.13].forEach((delay,i)=>{
        const tone=soundContext.createOscillator(),volume=soundContext.createGain();
        tone.type='sine';tone.frequency.setValueAtTime(i?880:660,now+delay);
        volume.gain.setValueAtTime(0.0001,now+delay);
        volume.gain.exponentialRampToValueAtTime(.09,now+delay+.016);
        volume.gain.exponentialRampToValueAtTime(.0001,now+delay+.20);
        tone.connect(volume);volume.connect(soundContext.destination);
        tone.start(now+delay);tone.stop(now+delay+.21);
      });
    }catch(err){console.warn('Som de mensagens indisponível:',err)}
  }
  async function toggleChatSound(){
    const buttons=[...document.querySelectorAll('[data-chat-sound]')];
    if(!buttons.length)return;
    if(!soundEnabled){
      try{
        const AudioConstructor=window.AudioContext||window.webkitAudioContext;
        if(!AudioConstructor)throw new Error('Este navegador não oferece áudio para notificações.');
        soundContext ||= new AudioConstructor();
        await soundContext.resume();
        soundEnabled=true;
        playIncomingSound(); // confirmação audível pelo toque, sem depender do navegador pedir permissão
        if('Notification' in window && Notification.permission==='default' && !notificationAsked){
          notificationAsked=true;
          try{await Notification.requestPermission()}catch{}
        }
      }catch(err){soundEnabled=false;notify('Não foi possível ativar o som: '+(err.message||'verifique o áudio do aparelho.'))}
    }else{soundEnabled=false}
    const label=soundEnabled?'Desativar som':'Ativar som';
    buttons.forEach(button=>{
      button.setAttribute('aria-pressed',String(soundEnabled));
      button.setAttribute('aria-label',label+' de novas mensagens');button.title=label+' de novas mensagens';
      const text=button.querySelector('.v28-sound-label');if(text)text.textContent=label;
    });
  }
  function lookupProfilePhoto(uid){
    if(!uid)return '';
    if(uid===currentUid() && state.profile?.photo)return state.profile.photo;
    const profile=realProfiles.find(p=>p.ownerUid===uid||p.id===uid);
    return profile?.photo||'';
  }
  function avatarHTML(person,cls){
    const photo=person?.photo?safe(person.photo):'';
    return `<span class="${cls}">${photo?`<img src="${photo}" alt="Foto de ${safe(person.name)}">`:safe(nick(person?.name))}</span>`;
  }
  function maybeNotifyThreads(nextThreads){
    if(!threadsBootstrapped){threadsBootstrapped=true;return;}
    const previous=new Map(threads.map(t=>[t.id,t]));
    nextThreads.forEach(t=>{
      if(t.lastSenderId===currentUid())return;
      const before=previous.get(t.id);
      const currTime=t.updatedAt?.toMillis?.()||0;
      const prevTime=before?.updatedAt?.toMillis?.()||0;
      // Não tocar no login inicial, em mudanças de status nem em eventos sem nova mensagem.
      if(!before || currTime<=prevTime || before.status!==t.status)return;
      const person=getDisplayPerson(t);
      playIncomingSound();
      if(!('Notification' in window)||Notification.permission!=='granted')return;
      if(document.visibilityState==='visible' && document.hasFocus())return;
      try{
        const note=new Notification(person.name||'Nova mensagem',{body:t.lastMessage||'Você recebeu uma mensagem no Conecta.',icon:'favicon.svg'});
        note.onclick=()=>{window.focus();const match=nextThreads.find(x=>x.id===t.id);if(match)chooseThread(match);note.close();};
      }catch{}
    });
  }
  function updateHeaders(){
    document.querySelectorAll('[data-action="auth-open"],[data-action="auth-logout"]').forEach(b=>{
      b.dataset.action=user&&verified()?'auth-logout':'auth-open';
      b.textContent=user&&verified()?'Sair':user?'Verificar e-mail':'Entrar';
    });
    const status=$('#cloudProfileStatus');if(status)status.textContent=!configured()?'Firebase não configurado':!user?'Entre para publicar':!verified()?'Confirme seu e-mail':state.profile?'Perfil publicado no Conecta':'Pronto para criar seu perfil';
    updateProfileUI();
  }
  function profilesForCatalog(){
    if(configured())return realProfiles.filter(p=>window.ConectaRegions?.isSJC(p.city) ?? p.city==='São José dos Campos').map(p=>({...p,id:p.ownerUid===currentUid()?'mine':'user:'+p.ownerUid,initials:nick(p.name),demo:false}));
    return [];
  }
  function requireAuth(reason){
    if(!configured()){showSetup();return false}
    if(!user){openAuth('login');return false}
    if(!verified()){openAuth('verify');return false}
    return true;
  }
  async function handleAuth(u){
    const serial=++authSerial;user=u;state.profile=null;activeChat=null;messages=[];threads=[];threadsBootstrapped=false;
    window.ConectaLaunch?.onAuth(u);
    if(stopThreads)stopThreads();stopThreads=null;
    if(stopMessages)stopMessages();stopMessages=null;
    updateHeaders();renderHome();renderExplore();
    if(!u)return;
    if(!u.emailVerified){openAuth('verify');return}
    try{
      const own=await backend().getOwnProfile();if(serial!==authSerial)return;
      state.profile=own?{...own,id:'mine'}:null;
      renderDashboard();renderHome();renderExplore();updateHeaders();
    }catch(e){notify('Não foi possível carregar seu perfil: '+authProblem(e))}
    if(serial!==authSerial)return;
    stopThreads=backend().subscribeThreads(list=>{maybeNotifyThreads(list);threads=list;if(activeChat){const current=threads.find(t=>t.id===activeChat.id);if(current)activeChat={...current,newConversation:false};}renderInbox()},e=>notify('Mensagens: '+authProblem(e)));
    if(pendingPro){const p=pendingPro;pendingPro=null;closeModal();startConversation(p)}
  }
  function refreshCatalog(){renderHome();renderExplore();if(currentPage==='professional')renderProfessional()}
  function onReady(){
    if(!configured()){state.profile=null;updateHeaders();refreshCatalog();return}
    const b=backend();
    if(b.error){notify(b.error);return}
    window.ConectaLaunch?.onReady(b);
    stopPros=b.subscribeProfiles(list=>{realProfiles=list;refreshCatalog()},e=>notify('Catálogo: '+authProblem(e)));
    b.subscribeAuth(handleAuth);
  }
  async function saveProfile(form){
    if(!requireAuth('profile'))return;
    const fields=form.elements;
    const data={name:fields.name.value.trim(),category:fields.category.value,city:fields.city.value.trim(),neighborhood:fields.neighborhood.value.trim(),phone:fields.phone.value.replace(/[^\d]/g,''),bio:fields.bio.value.trim(),photo:profileImage||'',cover:coverImage||''};
    if(!data.name||!data.category||!data.city){notify('Preencha os campos obrigatórios.');return}
    if(coverBusy){notify('Aguarde a foto de capa terminar de carregar.');return}if(data.photo.length>340000||data.cover.length>95000){notify('Uma das fotos ficou muito grande. Tente outra imagem.');return}
    const existed=!!state.profile?.name;
    const btn=$('#profileSubmit');btn.disabled=true;$('#profileSubmitText').textContent='Publicando...';
    try{
      await backend().saveProfile(data);
      state.profile={...data,ownerUid:currentUid(),id:'mine'};
      renderDashboard();renderHome();renderExplore();updateHeaders();
      notify(existed?'Alterações publicadas para todos!':'Perfil criado e publicado para todos!');
      if(typeof openOwnProfile==='function')openOwnProfile();
    }catch(e){notify('Não foi possível publicar: '+authProblem(e));renderDashboard()}
    finally{btn.disabled=false;updateHeaders()}
  }
  function getDisplayPerson(thread){
    const providerSide=thread.providerId===currentUid();
    const name=providerSide?thread.customerName:thread.providerName;
    const uid=providerSide?thread.customerId:thread.providerId;
    return {uid,name:name||'Usuário Conecta',subtitle:providerSide?'Cliente':'Profissional',photo:lookupProfilePhoto(uid)};
  }
  function renderThreads(){
    const list=$('#chatThreadList');if(!list)return;
    $('#chatThreadCount').textContent=threads.length;
    list.innerHTML=threads.length?threads.map(t=>{
      const p=getDisplayPerson(t);
      return `<button class="thread-item ${activeChat?.id===t.id?'selected':''}" data-thread="${safe(t.id)}">${avatarHTML(p,'thread-avatar')}<span class="thread-copy"><span class="thread-copy-top"><strong>${safe(p.name)}</strong><em>${safe(p.subtitle)}</em></span><small>${safe(t.lastMessage||'Conversa iniciada')}</small>${t.status==='pending'?`<span class="v15-thread-state">${t.providerId===currentUid()?'Solicitação recebida':'Aguardando autorização'}</span>`:''}${t.status==='declined'?'<span class="v15-thread-state declined">Contato não autorizado</span>':''}</span></button>`;
    }).join(''):'<div class="thread-empty"><span class="v11-thread-empty-icon">✉</span><strong>Nenhuma conversa ainda</strong><p>Encontre um profissional para iniciar sua primeira conversa.</p><button data-route="explore">Ver profissionais</button></div>';
  }
  function renderMessages(){
    const el=$('#chatMessages');if(!el)return;
    if(!activeChat){el.innerHTML='<div class="chat-intro"><span class="chat-intro-symbol">✉</span><span class="v11-empty-tag">SUA CONVERSA COMEÇA AQUI</span><strong>Um bom projeto começa com um olá.</strong><p>Encontre um profissional, tire suas dúvidas e combine os detalhes com segurança.</p><button data-route="explore">Explorar profissionais</button></div>';return}
    const name=getDisplayPerson(activeChat).name;
    el.innerHTML=messages.length?messages.map(m=>`<div class="bubble-line ${m.senderId===currentUid()?'own':''}"><div class="chat-bubble"><p>${safe(m.text)}</p></div></div>`).join(''):`<div class="chat-intro"><span class="chat-intro-symbol">✉</span><span class="v11-empty-tag">PRIMEIRA MENSAGEM</span><strong>Diga olá para ${safe(name)}</strong><p>Conte brevemente o que você precisa para começar.</p></div>`;
    el.scrollTop=el.scrollHeight;
  }
  function renderInbox(){
    if(!$('#chatThreadList'))return;
    renderThreads();
    const head=$('#chatHead'),input=$('#chatInput'),send=$('#chatSend');
    if(!activeChat){head.innerHTML=`<div class="chat-head-main">${avatarHTML({name:'Conecta'},'chat-person-icon')}<div class="chat-head-copy"><strong>Suas conversas</strong><small>Escolha uma conversa para começar</small></div></div>`}
    else {const person=getDisplayPerson(activeChat);head.innerHTML=`<div class="chat-head-main"><button class="v27-chat-back" type="button" data-chat-back aria-label="Voltar às conversas"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m14 6-6 6 6 6"/></svg><span>Voltar às conversas</span></button><button type="button" class="v28-sound-toggle v28-chat-sound-inline" data-chat-sound aria-pressed="${soundEnabled}" aria-label="${soundEnabled?'Desativar':'Ativar'} som de novas mensagens" title="${soundEnabled?'Desativar':'Ativar'} som de novas mensagens"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg><span class="v28-sound-label">${soundEnabled?'Desativar som':'Ativar som'}</span></button><div class="v28-chat-person-row">${avatarHTML(person,'chat-person-icon')}<div class="chat-head-copy"><strong title="${safe(person.name)}">${safe(person.name)}</strong><small>${safe(person.subtitle)}</small></div></div></div>`}
    const status=activeChat?.status || 'accepted';
    const isProvider=activeChat?.providerId===currentUid();
    const pendingCount=Math.max(1,Number(activeChat?.pendingCount||1));
    const remainingPending=Math.max(0,3-pendingCount);
    if(activeChat && status==='pending'){
      const info=isProvider?'Esta pessoa enviou mensagens iniciais. Autorize o contato para continuar conversando.':remainingPending>0?`Seu pedido de contato foi enviado. Você ainda pode enviar mais ${remainingPending} ${remainingPending===1?'mensagem':'mensagens'} antes da autorização.`:'Seu pedido de contato foi enviado. Aguarde a autorização do profissional para continuar.';
      head.insertAdjacentHTML('beforeend',`<div class="v15-contact-banner"><span>${safe(info)}</span>${isProvider?'<div class="v15-decision-actions"><button type="button" class="v15-accept" data-contact-decision="accepted">Aceitar contato</button><button type="button" class="v15-decline" data-contact-decision="declined">Recusar</button></div>':''}</div>`);
    }else if(activeChat && status==='declined'){
      head.insertAdjacentHTML('beforeend','<div class="v15-contact-banner declined">O pedido de contato foi recusado. Esta conversa está encerrada.</div>');
    }
    const allowed=!!activeChat && verified() && !waitingSend && (activeChat.newConversation || status==='accepted' || (status==='pending' && activeChat.customerId===currentUid() && remainingPending>0));
    input.disabled=send.disabled=!allowed;
    input.placeholder=activeChat && status==='pending'?(activeChat.customerId===currentUid() && remainingPending>0?`Você pode enviar mais ${remainingPending} ${remainingPending===1?'mensagem':'mensagens'} antes da autorização...`:'Aguardando autorização para continuar...'):activeChat && status==='declined'?'Conversa encerrada':'Escreva sua mensagem...';
    renderMessages();
  }
  function chooseThread(thread){
    document.body.classList.add('v27-chat-open');
    if(stopMessages)stopMessages();stopMessages=null;
    activeChat=thread;messages=[];renderInbox();
    stopMessages=backend().subscribeMessages(thread.id,list=>{messages=list;renderMessages()},e=>notify('Não foi possível carregar conversa: '+authProblem(e)));
    if(currentPage!=='inbox')route('inbox');
    setTimeout(()=>$('#chatInput')?.focus(),40);
  }
  function startConversation(p){
    if(!p||demo(p)){notify('Este perfil é ilustrativo e não recebe mensagens.');return}
    if(!requireAuth('messages')){pendingPro=p;return}
    if(p.ownerUid===currentUid()){notify('Este perfil pertence a você.');return}
    const id=`${currentUid()}_${p.ownerUid}`;
    const existing=threads.find(t=>t.id===id);
    if(existing){chooseThread(existing);return}
    if(stopMessages)stopMessages();stopMessages=null;
    document.body.classList.add('v27-chat-open');
    activeChat={id,providerId:p.ownerUid,customerId:currentUid(),providerName:p.name,customerName:user.displayName||'Cliente Conecta',newConversation:true};
    messages=[];route('inbox');renderInbox();setTimeout(()=>$('#chatInput')?.focus(),40);
  }
  async function sendChat(event){
    event.preventDefault();
    if(!activeChat||waitingSend||!requireAuth('messages'))return;
    if(!activeChat.newConversation && activeChat.status && activeChat.status!=='accepted'){
      const pendingCount=Math.max(1,Number(activeChat.pendingCount||1));
      if(activeChat.customerId===currentUid() && activeChat.status==='pending' && pendingCount<3){}
      else {window.ConectaUI?.dialog({title:'Aguarde a autorização',message:activeChat.status==='pending'?'Você já utilizou as 3 mensagens iniciais. Agora será possível continuar somente quando o profissional aceitar o contato.':'Esta conversa não pode receber novas mensagens.'});return;}
    }
    const input=$('#chatInput');const text=input.value.trim();if(!text)return;
    waitingSend=true;renderInbox();
    try{
      if(activeChat.newConversation){
        const id=await backend().sendMessage(activeChat.providerId,activeChat.providerName,text);
        activeChat={...activeChat,id,status:'pending',newConversation:false};
        if(stopMessages)stopMessages();
        stopMessages=backend().subscribeMessages(id,list=>{messages=list;renderMessages()},e=>notify(authProblem(e)));
      }else {const result=await backend().reply(activeChat,text);if(activeChat.status==='pending'&&result?.pendingCount)activeChat={...activeChat,pendingCount:result.pendingCount};}
      input.value='';
    }catch(e){notify('Falha ao enviar: '+authProblem(e))}
    finally{waitingSend=false;renderInbox();if(!input.disabled)input.focus()}
  }
  document.addEventListener('click',async e=>{
    const b=e.target.closest('[data-chat-sound],[data-chat-back],[data-chat-pro],[data-whatsapp-pro],[data-thread],[data-contact-decision],[data-auth-mode],[data-action="auth-open"],[data-action="auth-logout"],[data-action="auth-check"],[data-action="auth-resend"]');
    if(!b)return;
    if(b.hasAttribute('data-chat-sound')){toggleChatSound();return;}
    if(b.hasAttribute('data-chat-back')){document.body.classList.remove('v27-chat-open');return;}
    if(b.dataset.chatPro){startConversation(allPros().find(p=>p.id===b.dataset.chatPro));return}
    if(b.dataset.whatsappPro){
      if(!requireAuth('messages'))return;
      const p=allPros().find(x=>x.id===b.dataset.whatsappPro);
      if(!p?.ownerUid)return;
      try{
        const digits=String(await backend().getContact(p.ownerUid)).replace(/\D/g,'');
        if(!digits){notify('WhatsApp indisponível. Use o chat do Conecta.');return}
        const target=digits.startsWith('55')?digits:'55'+digits;
        const greeting=encodeURIComponent('Olá! Vim pelo Conecta e gostaria de saber mais sobre seus serviços.');
        modal(`<div class="auth-shell"><div class="auth-symbol">✉</div><span class="overline">CONTATO VERIFICADO</span><h2>Conversar com ${safe(p.name)}</h2><p>Você já está cadastrado. Agora pode abrir o WhatsApp do profissional ou optar pelo chat do Conecta.</p><a class="btn btn-green" href="https://wa.me/${target}?text=${greeting}" target="_blank" rel="noopener noreferrer">Abrir WhatsApp</a><button class="btn btn-chat-light" data-chat-pro="${safe(p.id)}">Preferir chat do Conecta</button></div>`)
      }catch(ex){notify('Não foi possível abrir o contato: '+authProblem(ex))}
      return;
    }
    if(b.dataset.contactDecision){
      if(!activeChat||activeChat.providerId!==currentUid()||activeChat.status!=='pending')return;
      const decision=b.dataset.contactDecision;
      if(!['accepted','declined'].includes(decision))return;
      b.disabled=true;
      try { await backend().decideContact(activeChat.id,decision);
        activeChat={...activeChat,status:decision};renderInbox();
        window.ConectaUI?.dialog({tone:decision==='accepted'?'success':'info',title:decision==='accepted'?'Contato autorizado':'Contato recusado',message:decision==='accepted'?'Vocês já podem conversar livremente pelo Conecta.':'O contato foi encerrado. A pessoa não poderá enviar novas mensagens nesta conversa.'});
      }catch(ex){notify('Não foi possível responder: '+authProblem(ex));b.disabled=false}
      return;
    }
    if(b.dataset.thread){const t=threads.find(x=>x.id===b.dataset.thread);if(t)chooseThread(t);return}
    if(b.dataset.authMode){openAuth(b.dataset.authMode);return}
    if(b.dataset.action==='auth-open'){openAuth();return}
    if(b.dataset.action==='auth-logout'){
      if(!configured())return showSetup();
      try{await backend().logout();closeModal();notify('Você saiu da sua conta.');if(currentPage==='inbox'||currentPage==='dashboard')route('home')}
      catch(ex){notify(authProblem(ex))}
      return;
    }
    if(b.dataset.action==='auth-resend'){try{await backend().sendVerification();errorAtAuth('Enviamos outro link para seu e-mail.')}catch(ex){errorAtAuth(authProblem(ex))}return}
    if(b.dataset.action==='auth-check'){
      try{
        const refreshed=await backend().refreshUser();
        if(!refreshed?.emailVerified){errorAtAuth('O endereço ainda não consta como confirmado. Confira o link do e-mail.');return}
        await handleAuth(refreshed);closeModal();notify('E-mail confirmado! Seja bem-vindo ao Conecta.');
      }catch(ex){errorAtAuth(authProblem(ex))}
    }
  });
  document.addEventListener('click',e=>{if(e.target.closest('.v19-tab[data-route="inbox"], .desktop-nav [data-route="inbox"], .navlink[data-route="inbox"]'))document.body.classList.remove('v27-chat-open');},true);
  document.addEventListener('submit',async e=>{
    const f=e.target;if(!['registerAuthForm','loginAuthForm','resetAuthForm','chatComposer'].includes(f.id))return;
    e.preventDefault();
    if(f.id==='chatComposer')return sendChat(e);
    if(!configured())return showSetup();
    const button=f.querySelector('button[type="submit"]');if(button)button.disabled=true;
    try{
      if(f.id==='registerAuthForm'){
        const registered=await backend().signup(f.elements.name.value,f.elements.email.value.trim(),f.elements.password.value);
        if(!user)user=registered;
        openAuth('verify');
      }else if(f.id==='loginAuthForm'){
        const loggedIn=await backend().login(f.elements.email.value.trim(),f.elements.password.value);
        if(loggedIn?.emailVerified){closeModal();notify('Bem-vindo de volta!')}
      }else{
        await backend().resetPassword(f.elements.email.value.trim());
        errorAtAuth('Se houver uma conta com esse e-mail, você receberá instruções para recuperar a senha.');
      }
    }catch(ex){errorAtAuth(authProblem(ex))}
    finally{if(button?.isConnected)button.disabled=false}
  });
  $('#chatComposer').addEventListener('submit',e=>{ /* handled by delegated submit above */ });
  // Prevent V8's locally stored profile from being shown as a published Firebase profile.
  if(state.profile){try{localStorage.setItem('conecta.v8-profile-backup',JSON.stringify(state.profile))}catch{}}
  state.profile=null;
  window.ConectaV9={profilesForCatalog,requireAuth,saveProfile,renderInbox,openAuth,startConversation};
  updateHeaders();
  if(backend()?.ready)onReady();
  else window.addEventListener('conecta-backend-ready',onReady,{once:true});
})();

/* Firebase adapter. Browser only: no secret keys; see firestore.rules. */
(function () {
  const c = window.CONECTA_FIREBASE_CONFIG || {};
  const backend = window.ConectaBackend = {
    configured: !!(c.apiKey && c.projectId && c.appId && c.authDomain),
    ready: false,
    error: null,
    user: null
  };
  function finished() {
    backend.ready = true;
    window.dispatchEvent(new Event('conecta-backend-ready'));
  }
  if (!backend.configured) {
    backend.error = 'Conecte seu projeto Firebase para ativar cadastro e mensagens reais.';
    finished();
    return;
  }
  (async () => {
    try {
      const v = '11.10.0';
      const [{initializeApp},authm,dbm] = await Promise.all([
        import(`https://www.gstatic.com/firebasejs/${v}/firebase-app.js`),
        import(`https://www.gstatic.com/firebasejs/${v}/firebase-auth.js`),
        import(`https://www.gstatic.com/firebasejs/${v}/firebase-firestore.js`)
      ]);
      const app = initializeApp(c);
      // App Check só é inicializado quando uma chave pública do site é configurada.
      // Ative a fiscalização no console APENAS após validar os dispositivos reais.
      const appCheckKey=String(window.CONECTA_APP_CHECK_SITE_KEY||'').trim();
      if(appCheckKey){
        try{
          const ac=await import(`https://www.gstatic.com/firebasejs/${v}/firebase-app-check.js`);
          ac.initializeAppCheck(app,{provider:new ac.ReCaptchaV3Provider(appCheckKey),isTokenAutoRefreshEnabled:true});
          backend.appCheckEnabled=true;
        }catch(e){console.warn('[Conecta] Não foi possível iniciar App Check:',e)}
      }
      const auth = authm.getAuth(app), db = dbm.getFirestore(app);
      auth.languageCode = 'pt-BR';
      const {collection, doc, getDoc, setDoc, updateDoc, getDocs, query, where, orderBy, limit, onSnapshot, serverTimestamp, writeBatch} = dbm;
      backend.subscribeAuth = callback => authm.onAuthStateChanged(auth, u => {backend.user=u;callback(u)}, err => {backend.error=err.message;callback(null)});
      // V47: mesma verificação de nomes reservados do firestore.rules, feita antes
      // de criar a conta para a pessoa não ficar com um nome que será recusado.
      const reservedName = name => String(name||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')
        .replace(/[@4]/g,'a').replace(/3/g,'e').replace(/[1!|]/g,'i').replace(/0/g,'o').replace(/[5$]/g,'s')
        .replace(/[^a-z]/g,'').match(/conecta|administrador|administracao|moderador|moderacao/);
      const reservedNameMessage = 'Esse nome lembra um nome oficial do Conecta e não pode ser usado. Use seu nome ou o nome do seu negócio.';
      backend.isReservedName = name => !!reservedName(name);
      backend.signup = async (name,email,password) => {
        if (reservedName(name)) throw Error(reservedNameMessage);
        const credential = await authm.createUserWithEmailAndPassword(auth,email,password);
        await authm.updateProfile(credential.user,{displayName:name.trim().slice(0,70)});
        await authm.sendEmailVerification(credential.user);
        return credential.user;
      };
      backend.login = async (email,password) => (await authm.signInWithEmailAndPassword(auth,email,password)).user;
      backend.logout = () => authm.signOut(auth);
      backend.sendVerification = () => authm.sendEmailVerification(auth.currentUser);
      backend.resetPassword = email => authm.sendPasswordResetEmail(auth,email);
      backend.refreshUser = async () => {
        if (!auth.currentUser) return null;
        await authm.reload(auth.currentUser);
        await auth.currentUser.getIdToken(true);
        backend.user=auth.currentUser;
        return auth.currentUser;
      };
      backend.getOwnProfile = async () => {
        if (!auth.currentUser) return null;
        const [snap,contact] = await Promise.all([
          getDoc(doc(db,'profiles',auth.currentUser.uid)),
          getDoc(doc(db,'contacts',auth.currentUser.uid))
        ]);
        return snap.exists() ? {...snap.data(),phone:contact.exists()?contact.data().phone:'',id:snap.id} : null;
      };
      backend.saveProfile = async data => {
        const u=auth.currentUser;
        if (!u?.emailVerified) throw Error('Confirme seu e-mail primeiro.');
        if (reservedName(data.name)) throw Error(reservedNameMessage);
        const {phone,...publicProfile}=data;
        const batch=writeBatch(db);
        batch.set(doc(db,'profiles',u.uid), {...publicProfile,hasWhatsapp:!!phone,ownerUid:u.uid,updatedAt:serverTimestamp()});
        batch.set(doc(db,'contacts',u.uid), {ownerUid:u.uid,phone:phone||'',updatedAt:serverTimestamp()});
        await batch.commit();
      };
      // Exclui a apresentação pública, telefone e portfólio do proprietário.
      // Não representa exclusão integral da conta: mensagens, pedidos,
      // avaliações e registros legais têm processo próprio de privacidade.
      backend.deleteProfile = async () => {
        const u=auth.currentUser;
        if (!u?.emailVerified) throw Error('Confirme seu e-mail primeiro.');
        const works=await getDocs(query(collection(db,'works'),where('ownerUid','==',u.uid),limit(451)));
        if(works.size>450)throw Error('Há muitos trabalhos para exclusão em lote. Contate o suporte.');
        const batch=writeBatch(db);
        works.docs.forEach(work=>batch.delete(work.ref));
        batch.delete(doc(db,'profiles',u.uid));
        batch.delete(doc(db,'contacts',u.uid));
        await batch.commit();
      };
      // V47: exclusão da conta pelo próprio usuário (LGPD). Apaga perfil, telefone,
      // portfólio, pedidos (com as propostas recebidas), propostas enviadas,
      // favoritos e avaliações feitas e recebidas. Nas conversas, troca o próprio
      // nome por "Usuário removido" e encerra a conversa. Por último, apaga o login.
      // Cada etapa pode ser repetida: se algo falhar no meio, basta tentar de novo.
      backend.deleteAccount = async password => {
        const u=auth.currentUser;
        if(!u)throw Error('Entre na sua conta para excluí-la.');
        await authm.reauthenticateWithCredential(u,authm.EmailAuthProvider.credential(u.email,password));
        if(u.emailVerified){
          const uid=u.uid;
          await u.getIdToken(true);
          const commitInChunks=async ops=>{
            for(let i=0;i<ops.length;i+=400){
              const batch=writeBatch(db);
              ops.slice(i,i+400).forEach(op=>op(batch));
              await batch.commit();
            }
          };
          const [sentOffers,chats,requests,favorites,works,received]=await Promise.all([
            getDocs(query(dbm.collectionGroup(db,'offers'),where('providerUid','==',uid))),
            getDocs(query(collection(db,'chats'),where('participants','array-contains',uid))),
            getDocs(query(collection(db,'requests'),where('ownerUid','==',uid))),
            getDocs(collection(db,'users',uid,'favorites')),
            getDocs(query(collection(db,'works'),where('ownerUid','==',uid))),
            getDocs(collection(db,'profiles',uid,'reviews'))
          ]);
          const ops=[];
          sentOffers.docs.forEach(d=>ops.push(b=>b.delete(d.ref)));
          // Avaliações feitas: só existem onde houve conversa aceita como cliente.
          chats.docs.filter(c=>c.data().customerId===uid)
            .forEach(c=>ops.push(b=>b.delete(doc(db,'profiles',c.data().providerId,'reviews',uid))));
          // As propostas de cada pedido saem antes do pedido (a regra consulta o dono do pedido).
          for(const r of requests.docs){
            (await getDocs(collection(r.ref,'offers'))).docs.forEach(o=>ops.push(b=>b.delete(o.ref)));
            ops.push(b=>b.delete(r.ref));
          }
          favorites.docs.forEach(d=>ops.push(b=>b.delete(d.ref)));
          works.docs.forEach(d=>ops.push(b=>b.delete(d.ref)));
          // O perfil sai no mesmo lote das avaliações recebidas: a regra só libera
          // apagá-las quando o perfil deixa de existir.
          ops.push(b=>b.delete(doc(db,'profiles',uid)));
          ops.push(b=>b.delete(doc(db,'contacts',uid)));
          received.docs.forEach(d=>ops.push(b=>b.delete(d.ref)));
          chats.docs.forEach(c=>{
            const own=c.data().customerId===uid?'customerName':'providerName';
            ops.push(b=>b.update(c.ref,{status:'removed',[own]:'Usuário removido',lastMessage:'Conversa encerrada.',lastSenderId:uid,updatedAt:serverTimestamp()}));
          });
          await commitInChunks(ops);
        }
        await authm.deleteUser(u);
      };
      backend.getContact = async uid => {
        if (!auth.currentUser?.emailVerified) throw Error('Confirme o e-mail primeiro.');
        const snap=await getDoc(doc(db,'contacts',uid));
        return snap.exists()?snap.data().phone:'';
      };
      backend.subscribeReviews = (providerId,success,failure) => onSnapshot(collection(db,'profiles',providerId,'reviews'),snap=>success(snap.docs.map(d=>({id:d.id,...d.data()}))),failure);
      backend.canReview = async providerId => {
        const u=auth.currentUser;
        if(!u?.emailVerified || !providerId || providerId===u.uid)return false;
        try{
          const snap=await getDoc(doc(db,'chats',`${u.uid}_${providerId}`));
          return snap.exists() && snap.data().customerId===u.uid && snap.data().providerId===providerId && snap.data().status==='accepted';
        }catch(e){return false}
      };
      const chatCooldownMs=3000;
      const assertChatCooldown = thread => {
        const last=thread?.updatedAt?.toMillis?.();
        if(Number.isFinite(last) && Date.now()-last < chatCooldownMs){
          throw Error('Aguarde 3 segundos entre mensagens para evitar spam.');
        }
      };
      backend.saveReview = async (providerId,rating,comment) => {
        const u=auth.currentUser;
        if (!u?.emailVerified) throw Error('Confirme seu e-mail primeiro.');
        if (!providerId||u.uid===providerId) throw Error('Você não pode avaliar seu próprio perfil.');
        if (!Number.isInteger(rating)||rating<1||rating>5) throw Error('Nota inválida.');
        if (!comment.trim()||comment.trim().length>500) throw Error('Escreva um comentário de até 500 caracteres.');
        if(!(await backend.canReview(providerId)))throw Error('Só é possível avaliar após o profissional aceitar a conversa pelo Conecta.');
        await u.getIdToken(true); // Atualiza o nome presente no token de autenticação.
        await setDoc(doc(db,'profiles',providerId,'reviews',u.uid),{
          authorUid:u.uid, authorName:(u.displayName||'Cliente Conecta').slice(0,70),
          rating, comment:comment.trim(), updatedAt:serverTimestamp()
        });
      };
      backend.subscribeProfiles = (success,failure) => onSnapshot(collection(db,'profiles'),snapshot => {
        success(snapshot.docs.map(d => ({...d.data(),id:d.id})))
      },failure);
      backend.subscribeThreads = (success,failure) => {
        const u=auth.currentUser;
        return onSnapshot(query(collection(db,'chats'),where('participants','array-contains',u.uid)),snap => {
          success(snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.updatedAt?.toMillis?.()||0)-(a.updatedAt?.toMillis?.()||0)));
        },failure);
      };
      backend.subscribeMessages = (threadId,success,failure) => {
        const ref=collection(db,'chats',threadId,'messages');
        return onSnapshot(query(ref,orderBy('createdAt','asc'),limit(100)),snapshot => {
          success(snapshot.docs.map(d=>({id:d.id,...d.data()})));
        },failure);
      };
      // First contact must NOT read an absent /chats document: Firestore rules
      // only allow a participant to read a chat that already exists.
      backend.sendMessage = async (providerId,providerName,text) => {
        const u=auth.currentUser;
        if (!u?.emailVerified) throw Error('Confirme seu e-mail para enviar mensagens.');
        if (!providerId || providerId===u.uid) throw Error('Você não pode conversar consigo mesmo.');
        const content=text.trim();
        if (!content || content.length>1000) throw Error('A mensagem deve conter de 1 a 1000 caracteres.');
        await u.getIdToken(true);
        const threadId=`${u.uid}_${providerId}`;
        const chatRef=doc(db,'chats',threadId);
        const messageData={senderId:u.uid,text:content,createdAt:serverTimestamp()};
        const batch=writeBatch(db);
        batch.set(chatRef,{
          customerId:u.uid, providerId, participants:[u.uid,providerId],
          customerName:(u.displayName||'Cliente Conecta').slice(0,70),
          providerName:providerName.slice(0,80),
          createdAt:serverTimestamp(),updatedAt:serverTimestamp(),status:'pending',pendingCount:1,
          lastMessage:content,lastSenderId:u.uid
        });
        batch.set(doc(db,'chats',threadId,'messages','intro'),messageData);
        try {
          await batch.commit();
        } catch(e) {
          // The chat can already exist if the inbox subscription had not arrived.
          // Only retry when it is a real conversation belonging to this account.
          if (!['permission-denied','already-exists'].includes(e?.code)) throw e;
          let existing;
          try { existing=await getDoc(chatRef); } catch { throw e; }
          const t=existing.data();
          if (!existing.exists() || t.customerId!==u.uid || t.providerId!==providerId ||
              !Array.isArray(t.participants) || !t.participants.includes(u.uid)) throw e;
          if (t.status==='removed') throw Error('Esta conversa foi encerrada porque a outra pessoa excluiu a conta.');
          if (t.status==='declined' || t.status==='blocked') throw Error(t.status==='blocked'?'Esta conversa foi bloqueada.':'Este contato foi recusado e está encerrado.');
          const retry=writeBatch(db);
          if (t.status==='pending') {
            const nextCount=Math.max(1,Number(t.pendingCount||1))+1;
            if (nextCount>3) throw Error('Você já utilizou as 3 mensagens iniciais. Aguarde a autorização do profissional.');
            retry.update(chatRef,{lastMessage:content,lastSenderId:u.uid,updatedAt:serverTimestamp(),pendingCount:nextCount});
            retry.set(doc(db,'chats',threadId,'messages',`pending-${nextCount}`),messageData);
            await retry.commit();
            return threadId;
          }
          retry.update(chatRef,{lastMessage:content,lastSenderId:u.uid,updatedAt:serverTimestamp()});
          retry.set(doc(collection(db,'chats',threadId,'messages')),messageData);
          await retry.commit();
        }
        return threadId;
      };
      backend.decideContact = async (threadId,decision) => {
        const u=auth.currentUser;
        if (!u?.emailVerified) throw Error('Confirme o e-mail para responder.');
        if (!['accepted','declined'].includes(decision)) throw Error('Ação inválida.');
        const ref=doc(db,'chats',threadId);
        const snap=await getDoc(ref);
        if(!snap.exists()||snap.data().providerId!==u.uid||snap.data().status!=='pending')
          throw Error('Este pedido não está aguardando sua autorização.');
        await updateDoc(ref,{status:decision,updatedAt:serverTimestamp()});
      };
      backend.setContactBlocked = async (threadId,shouldBlock) => {
        const u=ownVerified();
        const ref=doc(db,'chats',threadId);
        const snap=await getDoc(ref);
        if(!snap.exists())throw Error('Conversa não encontrada.');
        const t=snap.data();
        if(!Array.isArray(t.participants)||!t.participants.includes(u.uid))throw Error('Você não participa desta conversa.');
        if(shouldBlock){
          if((t.status||'accepted')!=='accepted')throw Error('Só é possível bloquear conversas autorizadas.');
          await updateDoc(ref,{status:'blocked',blockerId:u.uid,updatedAt:serverTimestamp()});
        }else{
          if(t.status!=='blocked'||t.blockerId!==u.uid)throw Error('Apenas quem bloqueou pode desbloquear a conversa.');
          await updateDoc(ref,{status:'accepted',blockerId:dbm.deleteField(),updatedAt:serverTimestamp()});
        }
      };
      backend.reply = async (thread,text) => {
        const u=auth.currentUser;
        if (!u?.emailVerified) throw Error('Confirme seu e-mail para responder.');
        const content=text.trim();
        if(!content || content.length>1000) throw Error('A mensagem deve ter de 1 a 1000 caracteres.');
        const threadRef=doc(db,'chats',thread.id);
        const snap=await getDoc(threadRef);
        if(!snap.exists()) throw Error('Conversa não encontrada.');
        const live={id:thread.id,...snap.data()};
        if(live.status==='accepted' || (live.status==='pending' && live.customerId===u.uid))assertChatCooldown(live);
        const batch=writeBatch(db);
        const messageRef=doc(collection(db,'chats',thread.id,'messages'));
        if(live.status==='accepted'){
          batch.update(threadRef,{updatedAt:serverTimestamp(),lastMessage:content,lastSenderId:u.uid});
          batch.set(messageRef,{senderId:u.uid,text:content,createdAt:serverTimestamp()});
          await batch.commit();
          return {status:'accepted'};
        }
        if(live.status==='pending' && live.customerId===u.uid){
          const nextCount=Math.max(1,Number(live.pendingCount||1))+1;
          if(nextCount>3) throw Error('Você já utilizou as 3 mensagens iniciais. Aguarde a autorização do profissional.');
          batch.update(threadRef,{updatedAt:serverTimestamp(),lastMessage:content,lastSenderId:u.uid,pendingCount:nextCount});
          batch.set(doc(db,'chats',thread.id,'messages',`pending-${nextCount}`),{senderId:u.uid,text:content,createdAt:serverTimestamp()});
          await batch.commit();
          return {status:'pending',pendingCount:nextCount};
        }
        if(live.status==='removed') throw Error('Esta conversa foi encerrada porque a outra pessoa excluiu a conta.');
        if(live.status==='declined' || live.status==='blocked') throw Error(live.status==='blocked'?'Esta conversa está bloqueada.':'Este contato foi recusado e está encerrado.');
        throw Error('Aguarde a autorização do contato.');
      };
      // V24: dados compartilhados e sincronizados entre contas/dispositivos.
      // Lançamento gratuito: imagens JPEG pequenas dentro dos próprios documentos
      // Firestore. Limite por foto e por publicação. Migrar para Storage quando escalar.
      const ownVerified = () => {
        if (!auth.currentUser?.emailVerified) throw Error('Entre e confirme seu e-mail para publicar.');
        return auth.currentUser;
      };
      const remoteDate = value => value?.toMillis?.() || (typeof value === 'number' ? value : 0);
      const cleanImage = src => typeof src === 'string' && src.length<=81000 && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(src);
      function checkPhotos(images,max=4) {
        if(!Array.isArray(images)||images.length>max||images.some(x=>!cleanImage(x)))throw Error('Escolha até quatro fotos pequenas. Aguarde a compressão terminar.');
        return images;
      }
      const deletePhotos=async()=>{}; // Sem objetos separados nesta versão gratuita.
      backend.subscribeRequests = (success,failure) => onSnapshot(
        query(collection(db,'requests'),orderBy('createdAt','desc'),limit(150)),
        snap=>success(snap.docs.map(d=>({id:d.id,...d.data(),created:remoteDate(d.data().createdAt)}))),failure
      );
      backend.createRequest = async (input,images=[]) => {
        const u=ownVerified(), ref=doc(collection(db,'requests'));
        await u.getIdToken(true);
        checkPhotos(images,4);
        let photos=[];
        try {
          photos=images;
          await setDoc(ref,{
            ownerUid:u.uid,owner:(u.displayName||'Cliente Conecta').trim().slice(0,70),
            title:input.title.trim(),category:input.category,city:input.city.trim(),
            description:input.description.trim(),photos,status:'open',createdAt:serverTimestamp(),updatedAt:serverTimestamp()
          });
          return ref.id;
        } catch(e) {if(photos.length)await deletePhotos('request-images',ref.id,photos.length);throw e}
      };
      backend.closeRequest = async requestId => {
        const u=ownVerified();
        const ref=doc(db,'requests',requestId);
        const snap=await getDoc(ref);
        if(!snap.exists()||snap.data().ownerUid!==u.uid)throw Error('Somente o dono pode encerrar este pedido.');
        if(snap.data().status!=='open')throw Error('Este pedido já foi encerrado.');
        await updateDoc(ref,{status:'closed',updatedAt:serverTimestamp()});
      };
      backend.deleteRequest = async record => {
        const u=ownVerified();
        if(record.ownerUid!==u.uid)throw Error('Você não pode excluir esse pedido.');
        // Remove proposals before deleting the parent (Firestore doesn't cascade).
        const offers=await getDocs(collection(db,'requests',record.id,'offers'));
        if(offers.size>450)throw Error('Existem muitas propostas neste pedido. Contate o suporte antes de excluir.');
        const batch=writeBatch(db);
        offers.docs.forEach(d=>batch.delete(d.ref));
        batch.delete(doc(db,'requests',record.id));
        await batch.commit();
        if(record.photos?.length)await deletePhotos('request-images',record.id,record.photos.length);
      };
      backend.subscribeWorks = (ownerUid,success,failure) => {
        if(!ownerUid)return ()=>{};
        return onSnapshot(query(collection(db,'works'),where('ownerUid','==',ownerUid),limit(100)),
          snap=>success(snap.docs.map(d=>({id:d.id,...d.data(),created:remoteDate(d.data().createdAt)})).sort((a,b)=>b.created-a.created)),failure);
      };
      backend.createWork = async (input,images=[]) => {
        const u=ownVerified();
        checkPhotos(images,4);
        if(!(await getDoc(doc(db,'profiles',u.uid))).exists())throw Error('Publique seu perfil profissional antes de adicionar trabalhos.');
        const ref=doc(collection(db,'works'));
        let photos=[];
        try {
          photos=images;
          await setDoc(ref,{ownerUid:u.uid,title:input.title.trim(),description:input.description.trim(),photos,createdAt:serverTimestamp()});
          return ref.id;
        }catch(e){if(photos.length)await deletePhotos('work-images',ref.id,photos.length);throw e}
      };
      backend.deleteWork = async record => {
        const u=ownVerified();
        if(record.ownerUid!==u.uid)throw Error('Você não pode excluir esse trabalho.');
        await dbm.deleteDoc(doc(db,'works',record.id));
        if(record.photos?.length)await deletePhotos('work-images',record.id,record.photos.length);
      };
      backend.subscribeOffers = (requestId,success,failure) => {
        ownVerified();
        return onSnapshot(collection(db,'requests',requestId,'offers'),snap=>success(snap.docs.map(d=>({id:d.id,...d.data()}))),failure);
      };
      backend.createOffer = async (requestId,message) => {
        const u=ownVerified(),content=String(message||'').trim();
        if(content.length<15||content.length>400)throw Error('A proposta deve ter de 15 a 400 caracteres.');
        const [job,profile]=await Promise.all([
          getDoc(doc(db,'requests',requestId)),getDoc(doc(db,'profiles',u.uid))
        ]);
        if(!job.exists()||job.data().status!=='open')throw Error('Este pedido não está mais disponível.');
        if(job.data().ownerUid===u.uid)throw Error('Você não pode responder ao próprio pedido.');
        if(!profile.exists())throw Error('Publique seu perfil profissional para enviar uma proposta.');
        await setDoc(doc(db,'requests',requestId,'offers',u.uid),{
          providerUid:u.uid,providerName:profile.data().name,message:content,createdAt:serverTimestamp()
        });
      };
      backend.subscribeFavorites = (success,failure) => {
        const u=ownVerified();
        return onSnapshot(collection(db,'users',u.uid,'favorites'),
          snap=>success(snap.docs.map(d=>'user:'+d.id)),failure);
      };
      // Data-rights request. This stores a request for manual administrative processing.
      backend.requestPrivacy = async kind => {
        const u=ownVerified();
        if(!['access','deletion'].includes(kind))throw Error('Solicitação inválida.');
        await setDoc(doc(db,'privacyRequests',u.uid),{
          ownerUid:u.uid,email:u.email,kind,status:'pending',createdAt:serverTimestamp()
        });
      };
      // Browser-side self-service copy of records accessible to the signed-in user.
      // It is not a claim that ALL retained records are exported. A full copy can be requested.
      backend.exportMyData = async () => {
        const u=ownVerified();
        const uid=u.uid;
        const [prof,contact,favorites,works,requests,chats,reviewedProfile] = await Promise.all([
          getDoc(doc(db,'profiles',uid)),
          getDoc(doc(db,'contacts',uid)),
          getDocs(collection(db,'users',uid,'favorites')),
          getDocs(query(collection(db,'works'),where('ownerUid','==',uid))),
          getDocs(query(collection(db,'requests'),where('ownerUid','==',uid))),
          getDocs(query(collection(db,'chats'),where('participants','array-contains',uid))),
          getDocs(collection(db,'profiles',uid,'reviews'))
        ]);
        const serialize = obj => JSON.parse(JSON.stringify(obj,(key,value)=>{
          if(value && typeof value.toDate==='function')return value.toDate().toISOString();
          return value;
        }));
        const rows=snaps=>snaps.docs.map(snap=>({id:snap.id,...serialize(snap.data())}));
        const threads=[];
        for(const thread of chats.docs){
          const msgs=await getDocs(collection(db,'chats',thread.id,'messages'));
          threads.push({id:thread.id,...serialize(thread.data()),messages:rows(msgs)});
        }
        const offers=[];
        for(const req of requests.docs){
          const reqOffers=await getDocs(collection(db,'requests',req.id,'offers'));
          offers.push({requestId:req.id,offers:rows(reqOffers)});
        }
        return {
          notice:'Cópia dos registros acessíveis nesta sessão. Não inclui necessariamente avaliações feitas em perfis de terceiros, registros de suporte ou dados eventualmente retidos em serviços externos. Solicite uma cópia completa na Central de Privacidade.',
          exportedAt:new Date().toISOString(),
          account:{uid,email:u.email,displayName:u.displayName,emailVerified:u.emailVerified},
          profile:prof.exists()?serialize(prof.data()):null,
          privateContact:contact.exists()?serialize(contact.data()):null,
          favorites:rows(favorites),works:rows(works),requests:rows(requests),
          proposalsReceived:offers,reviewsReceived:rows(reviewedProfile),chats:threads
        };
      };
      backend.setFavorite = async (providerUid,enabled) => {
        const u=ownVerified();
        if(!providerUid||providerUid===u.uid)throw Error('Não é possível salvar seu próprio perfil.');
        const ref=doc(db,'users',u.uid,'favorites',providerUid);
        if(enabled)await setDoc(ref,{createdAt:serverTimestamp()});
        else await dbm.deleteDoc(ref);
      };
      finished();
    } catch (e) {
      backend.error='Não foi possível inicializar o Firebase: '+e.message;
      finished();
    }
  })();
})();

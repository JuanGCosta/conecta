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
      const auth = authm.getAuth(app), db = dbm.getFirestore(app);
      auth.languageCode = 'pt-BR';
      const {collection, doc, getDoc, setDoc, updateDoc, getDocs, query, where, orderBy, limit, onSnapshot, serverTimestamp, writeBatch} = dbm;
      backend.subscribeAuth = callback => authm.onAuthStateChanged(auth, u => {backend.user=u;callback(u)}, err => {backend.error=err.message;callback(null)});
      backend.signup = async (name,email,password) => {
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
        const {phone,...publicProfile}=data;
        const batch=writeBatch(db);
        batch.set(doc(db,'profiles',u.uid), {...publicProfile,hasWhatsapp:!!phone,ownerUid:u.uid,updatedAt:serverTimestamp()});
        batch.set(doc(db,'contacts',u.uid), {ownerUid:u.uid,phone:phone||'',updatedAt:serverTimestamp()});
        await batch.commit();
      };
      backend.getContact = async uid => {
        if (!auth.currentUser?.emailVerified) throw Error('Confirme o e-mail primeiro.');
        const snap=await getDoc(doc(db,'contacts',uid));
        return snap.exists()?snap.data().phone:'';
      };
      backend.subscribeReviews = (providerId,success,failure) => onSnapshot(collection(db,'profiles',providerId,'reviews'),snap=>success(snap.docs.map(d=>({id:d.id,...d.data()}))),failure);
      backend.saveReview = async (providerId,rating,comment) => {
        const u=auth.currentUser;
        if (!u?.emailVerified) throw Error('Confirme seu e-mail primeiro.');
        if (!providerId||u.uid===providerId) throw Error('Você não pode avaliar seu próprio perfil.');
        if (!Number.isInteger(rating)||rating<1||rating>5) throw Error('Nota inválida.');
        if (!comment.trim()||comment.trim().length>500) throw Error('Escreva um comentário de até 500 caracteres.');
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
        const threadId=`${u.uid}_${providerId}`;
        const chatRef=doc(db,'chats',threadId);
        const messageData={senderId:u.uid,text:content,createdAt:serverTimestamp()};
        const batch=writeBatch(db);
        batch.set(chatRef,{
          customerId:u.uid, providerId, participants:[u.uid,providerId],
          customerName:(u.displayName||'Cliente Conecta').slice(0,70),
          providerName:providerName.slice(0,80),
          createdAt:serverTimestamp(),updatedAt:serverTimestamp(),status:'pending',
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
          if (t.status==='pending') throw Error('Aguarde o profissional aceitar sua primeira mensagem.');
          if (t.status==='declined') throw Error('Este contato foi recusado e está encerrado.');
          const retry=writeBatch(db);
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
      backend.reply = async (thread,text) => {
        const u=auth.currentUser;
        if (!u?.emailVerified) throw Error('Confirme seu e-mail para responder.');
        const content=text.trim();
        if(!content || content.length>1000) throw Error('A mensagem deve ter de 1 a 1000 caracteres.');
        if(thread.status && thread.status!=='accepted') throw Error('Aguarde a autorização do contato.');
        const threadRef=doc(db,'chats',thread.id);
        const batch=writeBatch(db);
        batch.update(threadRef,{updatedAt:serverTimestamp(),lastMessage:content,lastSenderId:u.uid});
        batch.set(doc(collection(db,'chats',thread.id,'messages')),{senderId:u.uid,text:content,createdAt:serverTimestamp()});
        await batch.commit();
      };
      // V24: dados compartilhados e sincronizados entre contas/dispositivos.
      const storageModule = await import(`https://www.gstatic.com/firebasejs/${v}/firebase-storage.js`);
      const storage = storageModule.getStorage(app);
      const ownVerified = () => {
        if (!auth.currentUser?.emailVerified) throw Error('Entre e confirme seu e-mail para publicar.');
        return auth.currentUser;
      };
      const remoteDate = value => value?.toMillis?.() || (typeof value === 'number' ? value : 0);
      const cleanImage = src => typeof src === 'string' && src.startsWith('data:image/jpeg;base64,');
      async function uploadPhotos(group,id,images) {
        const u = ownVerified();
        const saved=[];
        try {
          for (let i=0; i<images.length; i++) {
            if (!cleanImage(images[i]) || images[i].length>900000) throw Error('Uma das fotos é inválida ou muito grande.');
            const path=`${group}/${u.uid}/${id}/${i}.jpg`;
            const file=storageModule.ref(storage,path);
            await storageModule.uploadString(file,images[i],'data_url',{contentType:'image/jpeg'});
            saved.push(file);
          }
          return {urls:await Promise.all(saved.map(file=>storageModule.getDownloadURL(file))),saved};
        } catch(e) {
          await Promise.allSettled(saved.map(file=>storageModule.deleteObject(file)));
          throw e;
        }
      }
      const deletePhotos = async (group,id,count) => {
        const u=ownVerified();
        await Promise.allSettled(Array.from({length:count},(_,i)=>storageModule.deleteObject(storageModule.ref(storage,`${group}/${u.uid}/${id}/${i}.jpg`))));
      };
      backend.subscribeRequests = (success,failure) => onSnapshot(
        query(collection(db,'requests'),orderBy('createdAt','desc'),limit(150)),
        snap=>success(snap.docs.map(d=>({id:d.id,...d.data(),created:remoteDate(d.data().createdAt)}))),failure
      );
      backend.createRequest = async (input,images=[]) => {
        const u=ownVerified(), ref=doc(collection(db,'requests'));
        if(images.length>4)throw Error('No máximo quatro fotos.');
        let photos=[];
        try {
          if(images.length) photos=(await uploadPhotos('request-images',ref.id,images)).urls;
          await setDoc(ref,{
            ownerUid:u.uid,owner:(u.displayName||'Cliente Conecta').trim().slice(0,70),
            title:input.title.trim(),category:input.category,city:input.city.trim(),
            description:input.description.trim(),photos,status:'open',createdAt:serverTimestamp(),updatedAt:serverTimestamp()
          });
          return ref.id;
        } catch(e) {if(photos.length)await deletePhotos('request-images',ref.id,photos.length);throw e}
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
        if(images.length>6)throw Error('No máximo seis fotos.');
        if(!(await getDoc(doc(db,'profiles',u.uid))).exists())throw Error('Publique seu perfil profissional antes de adicionar trabalhos.');
        const ref=doc(collection(db,'works'));
        let photos=[];
        try {
          if(images.length)photos=(await uploadPhotos('work-images',ref.id,images)).urls;
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

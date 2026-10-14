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
          createdAt:serverTimestamp(),updatedAt:serverTimestamp(),
          lastMessage:content,lastSenderId:u.uid
        });
        batch.set(doc(collection(db,'chats',threadId,'messages')),messageData);
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
          const retry=writeBatch(db);
          retry.update(chatRef,{lastMessage:content,lastSenderId:u.uid,updatedAt:serverTimestamp()});
          retry.set(doc(collection(db,'chats',threadId,'messages')),messageData);
          await retry.commit();
        }
        return threadId;
      };
      backend.reply = async (thread,text) => {
        const u=auth.currentUser;
        if (!u?.emailVerified) throw Error('Confirme seu e-mail para responder.');
        const content=text.trim();
        if(!content || content.length>1000) throw Error('A mensagem deve ter de 1 a 1000 caracteres.');
        const threadRef=doc(db,'chats',thread.id);
        const batch=writeBatch(db);
        batch.update(threadRef,{updatedAt:serverTimestamp(),lastMessage:content,lastSenderId:u.uid});
        batch.set(doc(collection(db,'chats',thread.id,'messages')),{senderId:u.uid,text:content,createdAt:serverTimestamp()});
        await batch.commit();
      };
      finished();
    } catch (e) {
      backend.error='Não foi possível inicializar o Firebase: '+e.message;
      finished();
    }
  })();
})();

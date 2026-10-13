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
      backend.sendMessage = async (providerId,providerName,text) => {
        const u=auth.currentUser;
        if (!u?.emailVerified) throw Error('Confirme seu e-mail para enviar mensagens.');
        if (!providerId || providerId===u.uid) throw Error('Você não pode conversar consigo mesmo.');
        const content=text.trim();
        if (!content || content.length>1000) throw Error('A mensagem deve conter de 1 a 1000 caracteres.');
        const threadId=`${u.uid}_${providerId}`;
        const chatRef=doc(db,'chats',threadId);
        const existing=await getDoc(chatRef);
        const batch=writeBatch(db);
        if (existing.exists()) {
          if (existing.data().customerId!==u.uid) throw Error('Esta conversa pertence a outro usuário.');
          batch.update(chatRef,{lastMessage:content,lastSenderId:u.uid,updatedAt:serverTimestamp()});
        } else {
          batch.set(chatRef,{
            customerId:u.uid, providerId,participants:[u.uid,providerId],
            customerName:(u.displayName||'Cliente Conecta').slice(0,70),providerName:providerName.slice(0,80),
            createdAt:serverTimestamp(),updatedAt:serverTimestamp(),lastMessage:content,lastSenderId:u.uid
          });
        }
        batch.set(doc(collection(db,'chats',threadId,'messages')),{senderId:u.uid,text:content,createdAt:serverTimestamp()});
        await batch.commit();
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

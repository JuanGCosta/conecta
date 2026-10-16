/* Conecta V24: realtime marketplace, synced profiles and favorites. */
(function(){
  'use strict';
  let backend=null,ready=false,authUid=null,stopRequests=null,stopOwnWorks=null,
      stopProfileWorks=null,stopFavorites=null,detailUid=null;
  let worksByOwner=new Map(),stopOffers=new Map();
  function ui(){return window.ConectaV24Hooks}
  function message(context,error){
    console.error('[Conecta]',context,error);
    window.ConectaUI?.notify?.(`${context}: ${error?.message||'Confira o Firebase.'}`);
  }
  function end(listener){try{listener?.()}catch{}}
  function resetSession(){
    end(stopOwnWorks);end(stopFavorites);end(stopProfileWorks);
    stopOwnWorks=stopFavorites=stopProfileWorks=null;
    for(const stop of stopOffers.values())end(stop);stopOffers.clear();
    detailUid=null;worksByOwner.clear();ui()?.reset();
  }
  const launch=window.ConectaLaunch={
    onReady(b){
      if(ready)return;
      ready=true;backend=b;
      if(!b.subscribeRequests){message('Pedidos','A sincronização do Firestore não foi inicializada.');return}
      stopRequests=b.subscribeRequests(list=>ui()?.requests(list),err=>message('Não foi possível carregar pedidos',err));
    },
    watchOwnRequests(requests){
      if(!authUid||!backend?.subscribeOffers)return;
      const allowed=new Set(requests.filter(r=>r.ownerUid===authUid).map(r=>r.id));
      for(const [id,stop] of stopOffers){if(!allowed.has(id)){end(stop);stopOffers.delete(id)}}
      for(const id of allowed){
        if(stopOffers.has(id))continue;
        const uid=authUid;
        try {stopOffers.set(id,backend.subscribeOffers(id,list=>{
          if(uid===authUid)ui()?.offers(id,list)
        },err=>message('Não foi possível carregar propostas',err)))}
        catch(err){message('Erro ao acompanhar propostas',err)}
      }
    },
    onAuth(user){
      authUid=user?.emailVerified?user.uid:null;
      resetSession();
      ui()?.ownerRequests();
      if(!authUid||!backend?.subscribeWorks)return;
      const uid=authUid;
      stopOwnWorks=backend.subscribeWorks(uid,list=>{
        if(uid!==authUid)return;
        worksByOwner.set(uid,list);ui()?.works(list);
      },err=>message('Não foi possível carregar seu portfólio',err));
      if(backend.subscribeFavorites){
        stopFavorites=backend.subscribeFavorites(list=>{
          if(uid===authUid)ui()?.favorites(list);
        },err=>message('Não foi possível carregar seus favoritos',err));
      }
    },
    observeWorks(uid){
      if(!uid||!backend?.subscribeWorks)return;
      if(uid===detailUid)return;
      end(stopProfileWorks);stopProfileWorks=null;
      detailUid=uid;
      if(uid===authUid)return;
      stopProfileWorks=backend.subscribeWorks(uid,list=>{
        if(detailUid!==uid)return;
        worksByOwner.set(uid,list);
        if(document.body.dataset.page==='professional')window.renderProfessional?.();
      },err=>message('Não foi possível carregar os trabalhos publicados',err));
    },
    worksFor(uid){return worksByOwner.get(uid)||[]}
  };
})();

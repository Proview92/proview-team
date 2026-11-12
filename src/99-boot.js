(function boot(){
  try{ applyColors() }catch(e){} try{ applyDense() }catch(e){} try{ const th=localStorage.getItem(KEY+'-theme'); if(th)document.documentElement.setAttribute('data-theme',th); const c=localStorage.getItem(KEY+'-cur'); if(c&&localStorage.getItem(c))CUR=c }catch(e){}
  load();
  syncInit().then(()=>{ closeStale(); U.page=defaultPage(); render(); syncTitle() }).catch(()=>{});
})();

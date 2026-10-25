/* Website identity gates both iframe and direct-engine entry; no guest boot. */
(function(root){
 const M=root.Meowcha=root.Meowcha||{},allowed=new Set(['game_boot_failed','asset_load_failed','audio_failed','save_sync_failed','run_submit_failed','leaderboard_failed','session_expired']);
 M.diagnostics=[];
 M.report=function(event){
  if(!allowed.has(event))return;
  M.diagnostics.push({event,at:Date.now()});if(M.diagnostics.length>30)M.diagnostics.shift();
  // Fixed event vocabulary only: never capture tokens, names, payloads or URLs.
  if(root.dispatchEvent&&root.CustomEvent)root.dispatchEvent(new CustomEvent('meowcha-diagnostic',{detail:{event}}));
 };
 const S=M.Session={owner:null,blocked:true,checking:null};
 function localUser(){try{return JSON.parse(localStorage.getItem('oasis_user')||'null');}catch(_){return null;}}
 S.gate=function(kind='locked'){
  document.body.dataset.session=kind;
  let gate=document.getElementById('meowchaSessionGate');
  if(!gate){gate=document.createElement('section');gate.id='meowchaSessionGate';gate.setAttribute('role','dialog');gate.setAttribute('aria-modal','true');document.body.appendChild(gate);}
  gate.innerHTML='<div class="session-card"><h1>MEOW-CHA • Tiên môn</h1><p role="status">'+
   (kind==='error'?'Chưa kết nối được với tiên môn. Đạo quả cục bộ vẫn được giữ.':'Phiên đăng nhập cần được xác nhận. Đạo quả được giữ riêng cho tài khoản của bạn.')+
   '</p><a href="/?login=true&amp;returnTo=%2Fgames%2Fmeowcha" target="_top">Đăng nhập IELTS Oasis</a><button type="button" id="sessionRetry">Tôi đã đăng nhập • Tiếp tục</button><a href="/games" target="_top">Trở về Tiên Giới</a></div>';
  gate.querySelector('#sessionRetry').onclick=async()=>{if(M.bootFailed){root.location.reload();return;}if(await S.authorize())document.dispatchEvent(new Event('meowcha-session-ready'));};
 };
 S.expire=function(kind='locked'){
  const alreadyBlocked=S.blocked;S.blocked=true;
  S.gate(kind);
  if(!alreadyBlocked){
   const app=M.app;
   S.wasPaused=!!app?.gameState.isPaused;
   if(app){
    if(app.gameState.currentScene==='BATTLE'){
     if(app.ui)app.ui.setPause(true);else app.gameState.isPaused=true;
     app.saveSystem?.saveGame(app.gameState.activeSlotId||1,app.gameState);
    }
    app.audio?.silenceAll();
   }
   M.report('session_expired');
  }
 };
 S.authorize=async function(){
  if(S.checking)return S.checking;
  S.checking=(async()=>{
   const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),10000);
   try{
    const token=localStorage.getItem('oasis_token'),headers=token?{Authorization:'Bearer '+token}:{};
    const response=await fetch('/api/meowcha/session',{headers,credentials:'same-origin',signal:controller.signal});
    if(response.status===401||response.status===403){S.expire();return false;}
    if(!response.ok)throw new Error('session');
    const body=await response.json(),user=body.data;
    if(!user||!user.id)throw new Error('identity');
    if(S.owner&&String(S.owner)!==String(user.id)){S.expire();root.location.reload();return false;}
    const wasBlocked=S.blocked;
    if(!S.owner||wasBlocked){
      const profile=await fetch('/api/meowcha/profile',{headers,credentials:'same-origin',signal:controller.signal});
      if(profile.status===401||profile.status===403){S.expire();return false;}
      if(!profile.ok)throw new Error('profile');
      S.profile=(await profile.json()).data;
    }
    localStorage.setItem('oasis_user',JSON.stringify(user));S.owner=String(user.id);S.blocked=false;
    document.body.dataset.session='ready';document.getElementById('meowchaSessionGate')?.remove();
    if(M.app&&wasBlocked){
     await M.app.saveSystem.syncWithBackend();
     if(M.app.audio.soundEnabled)M.app.audio.startZenGuqin();
     if(!S.wasPaused&&M.app.gameState.currentScene==='BATTLE')M.app.ui.setPause(false);
    }
    if(!S.timer)S.timer=setInterval(()=>S.authorize(),60000);
    return true;
   }catch(_){S.expire('error');return false;}finally{clearTimeout(timer);S.checking=null;}
  })();return S.checking;
 };
 root.addEventListener('storage',event=>{
  if(!S.owner||!['oasis_token','oasis_user',null].includes(event.key))return;
  const user=localUser();
  if(!user||String(user.id)!==S.owner||!localStorage.getItem('oasis_token'))S.expire();
  else S.authorize();
 });
 root.addEventListener('pageshow',()=>{if(S.owner)S.authorize();});
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&S.owner)S.authorize();});
})(window);

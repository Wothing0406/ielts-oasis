/* Lobby-only weekly edict, compact race status and a separate history view. */
(function(root){
 const M=root.Meowcha,UI=M.UIManager.prototype,esc=M.ui.escape;
 const num=value=>Number(value||0).toLocaleString('vi-VN');
 const names={OVERALL:'Tổng Đạo',DIRECT:'Trực Diện',CLOZE:'Ngộ Đạo',AUDIO:'Thính Âm'};
 M.raceCountdown=function(period,offset=0){
  let seconds=Math.max(0,Math.floor((Date.parse(period.season_ends_at)-(Date.now()+offset))/1000));
  const days=Math.floor(seconds/86400);seconds%=86400;const hours=Math.floor(seconds/3600);seconds%=3600;
  const pad=n=>String(n).padStart(2,'0');return days+' ngày '+pad(hours)+':'+pad(Math.floor(seconds/60))+':'+pad(seconds%60);
 };
 const timed=async(save,path,options={})=>{
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
  try{return await save.request('/api/meowcha/'+path,{headers:save.getAuthHeaders(),...options,signal:controller.signal});}finally{clearTimeout(timer);}
 };
 UI.raceStorageKey=function(kind){return 'meowcha_'+kind+':'+this.saveSystem.owner;};
 UI.refreshWeeklyRace=function(){
  if(this._raceRequest)return this._raceRequest;
  if(!this.getLoggedInUser().isLoggedIn||M.Session?.blocked)return Promise.resolve();
  this._raceRequest=(async()=>{
   try{
    const response=await timed(this.saveSystem,'race-state?deck_id='+encodeURIComponent(this.state.activeDeckId||'oxford_5000'));
    if(!response.ok)return;const body=await response.json(),data=body.data;if(!data?.period)return;
    this.weeklyRace=data;this.raceOffset=Date.parse(data.period.server_now)-Date.now();
    this.renderLobbyRace();this.updateRacePrefs();
    if(!this.raceClockTimer)this.raceClockTimer=setInterval(()=>this.renderLobbyRace(),1000);
    const week=data.period.season_id;
    if(data.self?.rank<=10&&localStorage.getItem(this.raceStorageKey('top10_toast'))!==week){
     localStorage.setItem(this.raceStorageKey('top10_toast'),week);this.showStatus('Đạo hữu đã tiến vào Thiên Bảng Top 10!');
    }
    if(!data.recap_seen&&localStorage.getItem(this.raceStorageKey('recap_seen'))===week){this.persistRecapSeen(week);return;}
    const modalOpen=[...document.querySelectorAll('.meowcha-modal-overlay')].some(node=>getComputedStyle(node).display!=='none');
    if(!data.recap_seen&&data.recap_ready&&this.state.currentScene==='LOBBY'&&!modalOpen)this.showWeeklyRecap(data);
   }catch(_){/* Next lobby refresh retries; never overwrite a save or synthesize a rank. */}
  })().finally(()=>{this._raceRequest=null;});return this._raceRequest;
 };
 UI.refreshWeeklyHonors=function(){return this.refreshWeeklyRace();};
 UI.bankWeeklyRun=async function(){
  if(this._bankingRun)return false;
  const state=this.state;
  if(state.currentScene!=='LOBBY'){this.showStatus('Trở về sảnh để chốt đạo quả tuần.');return false;}
  if(state.wordsSlain<=(state.baselineWords||0)){this.showStatus('Chưa có đạo quả mới để chốt.');return false;}
  this._bankingRun=true;
  try{
   if(!(await this.saveSystem.submitRun(state))){this.showStatus('Chưa chốt được điểm. Ván và tiến trình vẫn được giữ để thử lại.');return false;}
   const score=state.score,words=state.wordsSlain;
   state.resetRunMetrics();state.baselineScore=score;state.baselineWords=words;state.combo=0;state.maxCombo=0;
   this.saveSystem.startRun(state);this.saveSystem.saveGame(state.activeSlotId||1,state);
   await this.saveSystem.flushCloudSaves();this.updateHUD();this.updateLobbyButtons?.();
   this.showStatus('Đã chốt đạo quả. Tu Vi, cảnh giới, máu và kỹ năng vẫn được giữ.');
   await this.refreshWeeklyRace();this.loadLeaderboardFromAPI();return true;
  }finally{this._bankingRun=false;}
 };
 UI.renderLobbyRace=function(){
  const data=this.weeklyRace,banner=document.getElementById('lobbyRaceBanner');if(!data||!banner)return;
  banner.hidden=false;const own=data.self;
  const score=own?'#'+own.rank+' • '+num(own.score)+' Tu Vi tuần':'Hoàn tất ván mới để khai bảng';
  const gap=data.score_gap!=null?' • Cách hạng trên '+num(data.score_gap):'';
  banner.querySelector('.lobby-race-score').textContent=score+gap;
  banner.querySelector('.lobby-race-clock').textContent='Còn '+M.raceCountdown(data.period,this.raceOffset);
  banner.onclick=()=>{this.boardHall='OVERALL';this.boardPeriod='WEEKLY';this.showPantheonModal();};
 };
 UI.updateRacePrefs=function(){
  const node=document.getElementById('hallDiscordPreference');if(!node||!this.weeklyRace)return;
  node.checked=!!this.weeklyRace.discord_enabled;node.disabled=!this.weeklyRace.discord_linked;
  node.title=this.weeklyRace.discord_linked?'Bot gửi một DM khi bạn đạt Top 10 tuần.':'Đăng nhập web bằng Discord để liên kết tài khoản.';
  if(!this.weeklyRace.discord_linked){const status=document.getElementById('hallPreferenceStatus');if(status)status.textContent='Đăng nhập web bằng Discord để liên kết.';}
 };
 UI.setRaceDiscordPreference=async function(enabled){
  const node=document.getElementById('hallDiscordPreference'),status=document.getElementById('hallPreferenceStatus');if(node)node.disabled=true;
  try{const response=await timed(this.saveSystem,'race-preference',{method:'POST',body:JSON.stringify({enabled})});if(!response.ok)throw new Error();
   if(this.weeklyRace)this.weeklyRace.discord_enabled=enabled;if(status)status.textContent=enabled?'Đã bật DM vinh danh Top 10.':'Đã tắt DM vinh danh.';
  }catch(_){if(status)status.textContent='Chưa lưu được tùy chọn. Hãy thử lại.';}finally{this.updateRacePrefs();}
 };
 UI.persistRecapSeen=async function(week){
  try{const response=await timed(this.saveSystem,'recap/seen',{method:'POST',body:JSON.stringify({season_id:week})});
   if(response.ok&&this.weeklyRace?.period.season_id===week)this.weeklyRace.recap_seen=true;
  }catch(_){/* Per-account local marker suppresses repeats; server ack retries on reconnect. */}
 };
 function overlay(id,title){
  let node=document.getElementById(id);if(node)node.remove();node=document.createElement('section');node.id=id;node.className='meowcha-modal-overlay weekly-race-overlay';node.style.display='flex';
  node.setAttribute('role','dialog');node.setAttribute('aria-modal','true');node.setAttribute('aria-label',title);
  node.innerHTML='<div class="modal-content-box weekly-race-paper"><button type="button" class="btn-modal-close weekly-close" aria-label="Đóng">×</button><h2>'+esc(title)+'</h2><div class="weekly-race-body"></div></div>';
  document.body.appendChild(node);return node;
 }
 UI.showWeeklyRecap=function(data){
  if(this.weeklyRecapNode&&this.weeklyRecapNode.isConnected)return;
  const node=overlay('weeklyRecap','THIÊN ĐẠO BAN CHIẾU');this.weeklyRecapNode=node;
  const awards=data.awards.filter(p=>!p.assisted),best=awards.slice().sort((a,b)=>a.rank-b.rank||Object.keys(names).indexOf(a.hall)-Object.keys(names).indexOf(b.hall))[0];
  const winners=data.previous_top3,top=winners.map((row,i)=>'<div class="weekly-winner"><img alt="Tiên Hữu" data-weekly-avatar="'+i+'"><strong>#'+row.rank+' '+esc(row.player_name)+'</strong><span>'+num(row.score)+' Tu Vi</span></div>').join('');
  const reward=best?.reward?.label?'<span class="weekly-award-reward">Phần thưởng: '+esc(best.reward.label)+' • hiệu lực đến mùa kế tiếp</span>':'';
  const title=best?.title?'<strong class="weekly-award-title">'+esc(best.title)+' • '+esc(best.specialty||'')+'</strong>'+reward:'';
  const own=best?'Đạo hữu xếp hạng #'+best.rank+' • '+num(best.score)+' Tu Vi tuần • '+esc(best.highest_realm||data.career?.highest_realm||''):
   'Thiên bảng tuần mới đã khai mở. Mỗi trận luyện tập đều là một bước tiến!';
  node.querySelector('.weekly-race-body').innerHTML='<p class="weekly-edict-subtitle">PHONG THẦN TUẦN TRƯỚC</p><div class="weekly-winners">'+(top||'<p>Thiên bảng mới đang chờ những chiến tích đầu tiên.</p>')+'</div>'+title+'<p>'+own+'</p><div class="weekly-recap-actions"><button type="button" class="sword-talisman-cta" id="btnClaimWeeklyTitle"><span class="sword-cta-content"><span class="sword-cta-main">'+(best?.title?'NHẬN DANH HIỆU':'TIẾP TỤC TU LUYỆN')+'</span></span></button><button type="button" class="btn-xianxia-seal" id="btnRecapPantheon">XEM PHONG THẦN</button></div>';
  node.querySelectorAll('[data-weekly-avatar]').forEach(image=>this.setUserAvatar(image,winners[Number(image.dataset.weeklyAvatar)].avatar_url));
  const week=data.period.season_id;let closed=false;
  const close=(board=false)=>{if(closed)return;closed=true;node.remove();this.weeklyRecapNode=null;
   localStorage.setItem(this.raceStorageKey('recap_seen'),week);this.persistRecapSeen(week);document.removeEventListener('keydown',escape);
   if(board){this.boardPeriod='WEEKLY';this.showPantheonModal();}
  };
  const escape=event=>{if(event.key==='Escape'){event.stopPropagation();close();}};
  node.querySelector('.weekly-close').onclick=()=>close();node.querySelector('#btnClaimWeeklyTitle').onclick=()=>close();node.querySelector('#btnRecapPantheon').onclick=()=>close(true);
  document.addEventListener('keydown',escape);M.applyDesignSystem?.(node);node.querySelector('#btnClaimWeeklyTitle').focus();
 };
 UI.showSeasonHistory=async function(){
  const node=overlay('weeklyHistory','LỊCH SỬ PHONG THẦN'),body=node.querySelector('.weekly-race-body');body.textContent='Đang thỉnh chiến tích…';
  node.querySelector('.weekly-close').onclick=()=>node.remove();
  try{const response=await timed(this.saveSystem,'season-history');if(!response.ok)throw new Error();const result=await response.json();
   body.innerHTML=result.data.map(season=>'<details class="weekly-history-entry"><summary>Phong Thần tuần '+esc(season.season_id)+'</summary><p>'+season.top3.map(r=>'#'+r.rank+' '+esc(r.player_name)+' • '+num(r.score)+' Tu Vi').join('<br>')+'</p><p>'+season.awards.filter(a=>!a.assisted).map(a=>esc(names[a.hall])+' #'+a.rank+' • '+num(a.score)+' Tu Vi'+(a.title?' • '+esc(a.title)+' ['+esc(a.specialty)+']':'')).join('<br>')+'</p></details>').join('')||'<p>Chưa có mùa đã chốt. Kỷ lục cá nhân vẫn được giữ.</p>';
  }catch(_){body.textContent='Chưa tải được lịch sử. Đóng và thử lại khi có kết nối.';}M.applyDesignSystem?.(node);
 };
})(typeof window!=='undefined'?window:globalThis);

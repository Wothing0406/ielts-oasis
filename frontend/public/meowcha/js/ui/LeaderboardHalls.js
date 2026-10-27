/* Each hall owns its columns, podium metric and saved personal record. */
(function(root){
 const M=root.Meowcha,UI=M.UIManager.prototype,esc=M.ui.escape;
 const num=v=>v==null?'Chưa lưu':Number(v).toLocaleString('vi-VN');
 const pct=v=>v==null?'Chưa lưu':num(v)+'%';
 const names={OVERALL:'Tổng Đạo',DIRECT:'Trực Diện',CLOZE:'Ngộ Đạo',AUDIO:'Thính Âm'};
 const configs={
  OVERALL:{title:'Tổng Đạo • Kỷ lục tu luyện',description:'Vĩnh viễn giữ kỷ lục cá nhân; bảng tuần cập nhật từ checkpoint đã đồng bộ, kể cả khi chưa tử trận. Đạo Hạnh là chỉ số tham khảo.',
   columns:['Hạng','Tiên Hữu','Cảnh Giới Cao Nhất','Kỷ Lục','Đạo Hạnh','Tổng Tu Vi','Sở Trường'],values:r=>[num(r.score),num(r.dao_hanh),num(r.total_score),names[r.strongest_mode]||'Chưa lưu'],hero:r=>num(r.score)+' Tu Vi'},
  DIRECT:{title:'Kiếm Đạo Điện • Trực Diện',description:'Xếp theo kỷ lục điểm Trực Diện. Bằng điểm xét độ chính xác, liên trảm rồi WPM.',
   columns:['Hạng','Tiên Hữu','Cảnh Giới Cao Nhất','Kỷ Lục','Kiếm Tốc','Kiếm Chuẩn','Liên Trảm'],values:r=>[num(r.score),num(r.wpm)+' WPM',pct(r.accuracy),num(r.max_combo)],hero:r=>num(r.score)+' Tu Vi'},
  CLOZE:{title:'Ngộ Đạo Điện • Gợi nhớ',description:'Xếp theo kỷ lục điểm Ngộ Đạo. Ngộ Tính là độ chính xác; Nhất Ngộ là tỷ lệ từ hoàn tất không sai, không hint và không hỗ trợ.',
   columns:['Hạng','Tiên Hữu','Cảnh Giới Cao Nhất','Kỷ Lục','Ngộ Tính','Nhất Ngộ','Hint'],values:r=>[num(r.score),pct(r.accuracy),pct(r.first_success_rate),num(r.hints_used)],hero:r=>num(r.score)+' Tu Vi'},
  AUDIO:{title:'Thính Âm Điện • Nghe chính tả',description:'Xếp theo kỷ lục điểm Thính Âm. Nhất Thính là tỷ lệ hoàn tất không sai và không nghe lại trước đáp án. IPA hiện sau khi trảm.',
   columns:['Hạng','Tiên Hữu','Cảnh Giới Cao Nhất','Kỷ Lục','Thính Lực','Nhất Thính','Nghe Lại'],values:r=>[num(r.score),pct(r.accuracy),pct(r.first_success_rate),num(r.replay_count)],hero:r=>num(r.score)+' Tu Vi'},

 };
 M.HALLS=configs;
 UI.showPantheonModal=function(){
  if(!this.modalPantheon)return;
  let nav=this.modalPantheon.querySelector('.hall-navigation');
  if(!nav){
   const hero=document.getElementById('pantheonPodium');
   nav=document.createElement('div');nav.className='hall-navigation';
   nav.innerHTML='<div class="hall-scope-row"><strong class="hall-control-label">KỲ XẾP HẠNG</strong><div class="hall-periods" role="group" aria-label="Chọn kỳ xếp hạng"><button type="button" data-period="WEEKLY"><span>Thiên Bảng</span><small>Tuần này</small></button><button type="button" data-period="ALL_TIME"><span>Phong Thần</span><small>Vĩnh viễn</small></button></div><span id="hallClock" role="status"></span></div><div class="hall-mode-row"><strong class="hall-control-label">PHÁP MÔN</strong><div class="hall-tabs" role="tablist" aria-label="Phong Thần điện">'+Object.keys(configs).map(key=>'<button type="button" role="tab" id="hall-tab-'+key+'" data-hall="'+key+'" aria-controls="pantheonRankList" aria-selected="false">'+names[key]+'</button>').join('')+'</div><label class="hall-assistance"><input id="boardAssisted" type="checkbox"><span>Có hỗ trợ</span></label></div>';
   hero.before(nav);
   const description=document.createElement('p');description.className='hall-description';description.id='hallDescription';nav.after(description);
   const rewards=document.createElement('div');rewards.className='hall-weekly-rewards';rewards.id='hallWeeklyRewards';rewards.setAttribute('role','note');
   rewards.innerHTML='<strong>THƯỞNG DANH DỰ TUẦN</strong><span>#1 Kim Miện + khung Phong Thần • #2–3 khung Tam Giáp • #4–10 danh hiệu Thiên Bảng</span><small>Mỹ phẩm đến mùa kế tiếp, không cộng chỉ số.</small>';
   description.after(rewards);
   nav.querySelectorAll('[data-hall]').forEach(button=>{
    button.onclick=()=>this.selectHall(button.dataset.hall);
    button.onkeydown=event=>{
     if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
     event.preventDefault();const buttons=[...nav.querySelectorAll('[data-hall]')],index=buttons.indexOf(button);
     const next=event.key==='Home'?0:event.key==='End'?buttons.length-1:(index+(event.key==='ArrowRight'?1:buttons.length-1))%buttons.length;
     buttons[next].focus();this.selectHall(buttons[next].dataset.hall);
    };
   });
   nav.querySelector('#boardAssisted').onchange=()=>this.loadLeaderboardFromAPI();
   nav.querySelectorAll('[data-period]').forEach(button=>button.onclick=()=>{this.boardPeriod=button.dataset.period;this.loadLeaderboardFromAPI();});
   const secondary=document.createElement('div');secondary.className='hall-secondary-actions';
   secondary.innerHTML='<button type="button" id="btnBankWeeklyRun">CHỐT ĐẠO QUẢ TUẦN</button><button type="button" id="btnHallHistory">LỊCH SỬ PHONG THẦN</button><label class="hall-discord-preference"><input type="checkbox" id="hallDiscordPreference"><span>Vinh danh Discord</span></label><span id="hallPreferenceStatus" role="status"></span>';
   (this.modalPantheon.querySelector('.pantheon-footer-bar')||description).after(secondary);
   secondary.querySelector('#btnHallHistory').onclick=()=>this.showSeasonHistory?.();
   secondary.querySelector('#btnBankWeeklyRun').onclick=()=>this.bankWeeklyRun?.();
   secondary.querySelector('#hallDiscordPreference').onchange=event=>this.setRaceDiscordPreference?.(event.target.checked);
  }
  this.modalPantheon.style.display='flex';this.boardPeriod=['WEEKLY','ALL_TIME'].includes(this.boardPeriod)?this.boardPeriod:'WEEKLY';
  clearInterval(this.boardClockTimer);clearInterval(this.boardPollTimer);
  this.boardClockTimer=setInterval(()=>this.updateHallClock(),1000);
  this.boardPollTimer=setInterval(()=>this.loadLeaderboardFromAPI(),25000);
  this.refreshWeeklyRace?.();this.selectHall(this.boardHall||'OVERALL');
 };
 UI.hidePantheonModal=function(){if(this.modalPantheon)this.modalPantheon.style.display='none';clearInterval(this.boardClockTimer);clearInterval(this.boardPollTimer);};
 UI.selectHall=function(hall){
  this.boardHall=configs[hall]?hall:'OVERALL';
  const config=configs[this.boardHall];this.modalPantheon.dataset.hall=this.boardHall;
  this.modalPantheon.querySelectorAll('[data-hall][role="tab"]').forEach(button=>{
   const active=button.dataset.hall===this.boardHall;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;
  });
  const title=this.modalPantheon.querySelector('.modal-title');if(title)title.textContent=config.title;
  const champion=this.modalPantheon.querySelector('#podiumCard1 .podium-crown span');
  if(champion)champion.textContent=({OVERALL:'Vạn Pháp Đạo Tôn',DIRECT:'Kiếm Đạo Chân Nhân',CLOZE:'Ngộ Đạo Chân Nhân',AUDIO:'Thiên Nhĩ Chân Nhân'})[this.boardHall];
  const desc=this.modalPantheon.querySelector('.hall-description');if(desc)desc.textContent=config.description;
  const header=this.modalPantheon.querySelector('.pantheon-table-header');if(header)header.innerHTML=config.columns.map(c=>'<span role="columnheader">'+esc(c)+'</span>').join('');
  this.modalPantheon.style.setProperty('--hall-cols',config.columns.length);
  const list=document.getElementById('pantheonRankList');if(list){list.setAttribute('role','tabpanel');list.setAttribute('aria-labelledby','hall-tab-'+this.boardHall);}
  this.loadLeaderboardFromAPI();
 };
 UI.updatePantheonSelfStats=function(){
  const user=this.getLoggedInUser(),avatar=document.getElementById('pantheonSelfAvatar'),label=document.getElementById('pantheonSelfName');
  this.setUserAvatar(avatar,user.avatar);if(label)label.textContent=user.name;
  const panel=this.pantheonPlayerSelfStats;if(!panel)return;
  const row=this.boardSelf,config=configs[this.boardHall||'OVERALL'],career=this.boardMeta?.career;
  const record=career?' • Kỷ lục cá nhân: '+num(career.highest_tuvi)+' Tu Vi • '+career.highest_realm:'';
  const state=row?.provisional?' • Tạm tính từ checkpoint; thoát game vẫn giữ hạng.':'';
  panel.textContent=row?'Hạng #'+row.rank+' • '+config.columns.slice(3).map((label,i)=>label+': '+config.values(row)[i]).join(' • ')+record+state:
   (user.isLoggedIn?'Chưa có checkpoint hợp lệ trong kỳ này.':'Đăng nhập để xem hạng cá nhân.')+record;
 };
 UI.loadLeaderboardFromAPI=async function(){
  const list=document.getElementById('pantheonRankList');if(!list)return;
  const request=(this.boardRequest||0)+1;this.boardRequest=request;
  const mode=this.boardHall||'OVERALL';this.boardSelf=null;this.boardMeta=null;this.renderPantheonLeaderboard([]);
  this.updateHallClock();
  list.setAttribute('aria-busy','true');list.innerHTML='<div class="board-message" role="status">Đang thỉnh Bảng Phong Thần…</div>';
  this.boardAbort?.abort();const controller=new AbortController();this.boardAbort=controller;let timer;
  try{
   await this.saveSystem.syncCareerRecord?.();
   const synced=await this.saveSystem.submitCheckpoint?.(this.state);
   if(this.boardRequest!==request)return;
   this.boardSyncWarning=!synced&&!this.state.runFinished&&this.state.activeElapsedMs>=1000&&this.state.wordsSlain>(this.state.baselineWords||0);
   timer=setTimeout(()=>controller.abort(),8000);
   const assisted=!!this.modalPantheon.querySelector('#boardAssisted')?.checked;
   const params=new URLSearchParams({limit:'10',deck_id:this.state.activeDeckId,assisted:String(assisted)});
   params.set('hall',mode);params.set('scope',this.boardPeriod==='ALL_TIME'?'ALL_TIME':'WEEKLY');
   const response=await fetch('/api/meowcha/halls?'+params,{signal:controller.signal,headers:this.saveSystem.getAuthHeaders()});
   if(!response.ok)throw new Error('HTTP '+response.status);
   const result=await response.json();if(!result.success||!Array.isArray(result.data))throw new Error('Invalid hall');
   if(this.boardRequest!==request)return;
   this.boardMeta=result.meta||{};this.boardSelf=result.meta?.self||null;this.updateHallClock();this.updateRacePrefs?.();
   this.renderPantheonLeaderboard(result.data);
   if(!result.data.length){
     list.innerHTML='<div class="board-message" role="status">'+(this.boardPeriod==='WEEKLY'?'Tuần mới đã mở. Gõ ít nhất một từ và đồng bộ checkpoint để ghi tên; không cần cố ý tử trận.':'Chưa có kỷ lục đã đồng bộ ở điện này. Kỷ lục cũ chưa rõ pháp môn được giữ ở Tổng Đạo Vĩnh viễn.')+'</div>';
   }
  }catch(error){
   M.report?.('leaderboard_failed');
   if(this.boardRequest!==request)return;
   this.boardSelf=null;this.renderPantheonLeaderboard([]);
   list.innerHTML='<div class="board-message" role="alert">Chưa tải được Bảng Phong Thần. Kiểm tra kết nối rồi thử lại.</div><button class="btn-xianxia-seal" id="boardRetry">Thỉnh bảng lại</button>';
   list.querySelector('#boardRetry').onclick=()=>this.loadLeaderboardFromAPI();
  }finally{
   clearTimeout(timer);if(this.boardRequest===request)list.setAttribute('aria-busy','false');
   if(M.applyDesignSystem)M.applyDesignSystem(this.modalPantheon);
  }
 };
 UI.updateHallClock=function(){
  const period=this.boardPeriod||'WEEKLY';
  if(this.modalPantheon){this.modalPantheon.dataset=this.modalPantheon.dataset||{};this.modalPantheon.dataset.period=period;}
  this.modalPantheon?.querySelectorAll('[data-period]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.period===period)));
  const node=document.getElementById('hallClock');if(!node)return;
  const desc=this.modalPantheon?.querySelector('.hall-description');
  if(desc)desc.textContent=configs[this.boardHall||'OVERALL'].description+(this.boardSyncWarning?' Điểm hiện tại chưa đồng bộ.':'');
  const rewards=document.getElementById('hallWeeklyRewards');if(rewards)rewards.hidden=period==='ALL_TIME';
  const info=this.boardMeta?.period;if(!info){node.textContent='Đang thỉnh Thiên Bảng…';return;}
  if(this._clockStamp!==info.server_now){this._clockStamp=info.server_now;this._clockOffset=Date.parse(info.server_now)-Date.now();}
  const title=this.modalPantheon.querySelector('.modal-title');
  if(title)title.textContent=(period==='ALL_TIME'?'PHONG THẦN VĨNH VIỄN':'THIÊN BẢNG TUẦN '+info.season_number)+' • '+names[this.boardHall||'OVERALL'].toUpperCase();
  if(period==='ALL_TIME'){node.textContent='Kỷ lục Tu Vi và cảnh giới cao nhất • không reset';return;}
  node.textContent='Còn '+(M.raceCountdown?M.raceCountdown(info,this._clockOffset):'…')+' • Chốt thứ Hai 00:00 (VN)';
  if(Date.parse(info.season_ends_at)<=Date.now()+(this._clockOffset||0)&&this._rolloverRequested!==info.week){this._rolloverRequested=info.week;this.loadLeaderboardFromAPI();this.refreshWeeklyRace?.();}
 };
 UI.renderPantheonLeaderboard=function(data){
  const list=document.getElementById('pantheonRankList');if(!list)return;
  if(list.classList)list.classList.toggle('has-hall-rows',data.length>0);
  const config=configs[this.boardHall||'OVERALL'];
  for(let rank=1;rank<=3;rank++){
   const item=data[rank-1];
   for(const [part,text] of [['Name',item?item.player_name:'Đang chờ vị thứ'],['Score',item?config.hero(item):'Chưa có thành tích'],['Realm',item?item.realm:'']]){
    const el=document.getElementById('podium'+part+rank);if(el)el.textContent=text;
   }
   const avatar=document.getElementById('podiumAvatar'+rank),empty=document.getElementById('podiumPlaceholder'+rank);
   if(avatar){avatar.style.display=item?'block':'none';if(item)this.setUserAvatar(avatar,item.avatar_url);}
   if(empty)empty.style.display=item?'none':'block';
  }
   list.innerHTML=data.map((row,index)=>'<div class="pantheon-row" role="row"><span role="cell">#'+(row.rank||index+1)+(row.provisional?' <small class="hall-provisional">TẠM</small>':'')+'</span><span class="hall-player" role="cell">'+
   '<img class="user-row-avatar" alt="" data-avatar-index="'+index+'"><span>'+esc(row.player_name||'Tiên Hữu')+'</span></span><span role="cell">'+esc(row.realm||'Luyện Khí Kỳ')+'</span>'+
   config.values(row).map(value=>'<span role="cell">'+esc(value)+'</span>').join('')+'</div>').join('');
  if(list.querySelectorAll)list.querySelectorAll('[data-avatar-index]').forEach(image=>this.setUserAvatar(image,data[Number(image.dataset.avatarIndex)].avatar_url));
  this.updatePantheonSelfStats();
 };
})(typeof window!=='undefined'?window:globalThis);

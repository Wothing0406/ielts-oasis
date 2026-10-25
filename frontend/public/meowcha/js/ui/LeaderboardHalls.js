/* Each hall owns its columns, podium metric and saved personal record. */
(function(root){
 const M=root.Meowcha,UI=M.UIManager.prototype,esc=M.ui.escape;
 const num=v=>v==null?'Chưa lưu':Number(v).toLocaleString('vi-VN');
 const pct=v=>v==null?'Chưa lưu':num(v)+'%';
 const names={OVERALL:'Tổng Đạo',DIRECT:'Trực Diện',CLOZE:'Ngộ Đạo',AUDIO:'Thính Âm',LEGACY:'Lưu Trữ'};
 const configs={
  OVERALL:{title:'Tổng Đạo • Tam pháp đồng tu',description:'Đủ ba pháp môn mới xếp hạng. Đạo Hạnh tối đa 300, ưu tiên đồng đều: 40% pháp môn thấp nhất + 60% trung bình, quy về thang 300.',
   columns:['Hạng','Tiên Hữu','Cảnh Giới','Đạo Hạnh','Tổng Tu Vi','Pháp Môn Sở Trường'],values:r=>[num(r.dao_hanh),num(r.total_score),names[r.strongest_mode]||'Chưa lưu'],hero:r=>num(r.dao_hanh)+' Đạo Hạnh'},
  DIRECT:{title:'Kiếm Đạo Điện • Trực Diện',description:'Xếp theo Kiếm Tốc (WPM), rồi Kiếm Chuẩn, Liên Trảm và Đạo Quả. Chỉ lấy ván Trực Diện đã hoàn tất.',
   columns:['Hạng','Tiên Hữu','Cảnh Giới','Kiếm Tốc','Kiếm Chuẩn','Liên Trảm','Đạo Quả'],values:r=>[num(r.wpm)+' WPM',pct(r.accuracy),num(r.max_combo),num(r.score)],hero:r=>num(r.wpm)+' WPM'},
  CLOZE:{title:'Ngộ Đạo Điện • Gợi nhớ',description:'Ngộ Tính là độ chính xác khi gõ đáp án qua nghĩa. Nhất Ngộ là tỷ lệ từ hoàn tất không sai, không hint thêm và không hỗ trợ; từ rơi tính chưa đạt.',
   columns:['Hạng','Tiên Hữu','Cảnh Giới','Ngộ Tính','Nhất Ngộ','Hint','Đạo Quả'],values:r=>[pct(r.accuracy),pct(r.first_success_rate),num(r.hints_used),num(r.score)],hero:r=>pct(r.accuracy)+' Ngộ Tính'},
  AUDIO:{title:'Thính Âm Điện • Nghe chính tả',description:'Thính Lực là độ chính xác khi gõ từ đã nghe. Nhất Thính là tỷ lệ hoàn tất không sai và không nghe lại trước đáp án. IPA hiện sau khi trảm.',
   columns:['Hạng','Tiên Hữu','Cảnh Giới','Thính Lực','Nhất Thính','Nghe Lại','Đạo Quả'],values:r=>[pct(r.accuracy),pct(r.first_success_rate),num(r.replay_count),num(r.score)],hero:r=>pct(r.accuracy)+' Thính Lực'},
  LEGACY:{title:'Lưu Trữ • Chiến tích cũ',description:'Dữ liệu cũ không có nguồn pháp môn hoặc số đo học tập đầy đủ; không gán lại vào ba điện mới.',
   columns:['Hạng','Tiên Hữu','Cảnh Giới','Tu Vi','Số Từ','WPM cũ'],values:r=>[num(r.score),num(r.words_slain),num(r.wpm)],hero:r=>num(r.score)+' Tu Vi'}
 };
 M.HALLS=configs;
 UI.showPantheonModal=function(){
  if(!this.modalPantheon)return;
  let nav=this.modalPantheon.querySelector('.hall-navigation');
  if(!nav){
   nav=document.createElement('div');nav.className='hall-navigation';
   nav.innerHTML='<div class="hall-tabs" role="tablist" aria-label="Phong Thần điện">'+Object.keys(configs).map(key=>
    '<button type="button" role="tab" id="hall-tab-'+key+'" data-hall="'+key+'" aria-controls="pantheonRankList" aria-selected="false">'+names[key]+'</button>').join('')+'</div>'+
    '<label class="hall-assistance"><input id="boardAssisted" type="checkbox"> Có hỗ trợ <span>(mặc định không hỗ trợ)</span></label>';
   const hero=document.getElementById('pantheonPodium');hero.parentNode.insertBefore(nav,hero);
   const description=document.createElement('p');description.className='hall-description';description.id='hallDescription';nav.after(description);
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
  }
  this.modalPantheon.style.display='flex';
  this.selectHall(this.boardHall||'OVERALL');
 };
 UI.hidePantheonModal=function(){if(this.modalPantheon)this.modalPantheon.style.display='none';};
 UI.selectHall=function(hall){
  this.boardHall=configs[hall]?hall:'OVERALL';
  const config=configs[this.boardHall];this.modalPantheon.dataset.hall=this.boardHall;
  this.modalPantheon.querySelectorAll('[data-hall][role="tab"]').forEach(button=>{
   const active=button.dataset.hall===this.boardHall;button.setAttribute('aria-selected',String(active));button.tabIndex=active?0:-1;
  });
  const title=this.modalPantheon.querySelector('.modal-title');if(title)title.textContent=config.title;
  const champion=this.modalPantheon.querySelector('#podiumCard1 .podium-crown span');
  if(champion)champion.textContent=({OVERALL:'Vạn Pháp Đạo Tôn',DIRECT:'Kiếm Tốc Chân Nhân',CLOZE:'Ngộ Đạo Chân Nhân',AUDIO:'Thiên Nhĩ Chân Nhân',LEGACY:'Chí Tôn Kim Miện'})[this.boardHall];
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
  const row=this.boardSelf,mode=this.boardHall||'OVERALL',config=configs[mode];
  if(!row){panel.textContent=user.isLoggedIn?'Chưa có thành tích đã hoàn tất trong điện này.':'Đăng nhập để xem hạng và thành tích riêng của tài khoản.';return;}
  panel.textContent=(mode==='OVERALL'&&!row.eligible?'Chưa hoàn tất Tam Pháp Đồng Tu • '+(row.complete_modes||[]).length+'/3 pháp môn':'Hạng #'+row.rank)+' • '+config.columns.slice(3).map((label,i)=>label+': '+config.values(row)[i]).join(' • ')+
    (mode==='OVERALL'?' • '+row.completed_runs+' trận • '+num(row.words_slain)+' từ':'');
 };
 UI.loadLeaderboardFromAPI=async function(){
  const list=document.getElementById('pantheonRankList');if(!list)return;
  const request=(this.boardRequest||0)+1;this.boardRequest=request;
  const mode=this.boardHall||'OVERALL';this.boardSelf=null;this.renderPantheonLeaderboard([]);
  list.setAttribute('aria-busy','true');list.innerHTML='<div class="board-message" role="status">Đang thỉnh Bảng Phong Thần…</div>';
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000);
  try{
   const assisted=!!this.modalPantheon.querySelector('#boardAssisted')?.checked;
   const params=new URLSearchParams({limit:'25',deck_id:this.state.activeDeckId,assisted:String(assisted)});
   params.set(mode==='LEGACY'?'game_mode':'hall',mode);
   const response=await fetch('/api/meowcha/'+(mode==='LEGACY'?'leaderboard':'halls')+'?'+params,{signal:controller.signal,headers:this.saveSystem.getAuthHeaders()});
   if(!response.ok)throw new Error('HTTP '+response.status);
   const result=await response.json();if(!result.success||!Array.isArray(result.data))throw new Error('Invalid hall');
   if(this.boardRequest!==request)return;
   this.boardSelf=result.meta?.self||null;
   if(mode==='LEGACY'){const user=this.getLoggedInUser();this.boardSelf=result.data.find(row=>user.id&&String(row.user_id)===String(user.id))||null;}
   this.renderPantheonLeaderboard(result.data);
   if(!result.data.length){
    list.innerHTML='<div class="board-message" role="status">Chưa có trận hoàn tất ở điện này. Chiến tích cũ nằm trong Lưu Trữ.</div>';
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
  list.innerHTML=data.map((row,index)=>'<div class="pantheon-row" role="row"><span role="cell">#'+(row.rank||index+1)+'</span><span class="hall-player" role="cell">'+
   '<img class="user-row-avatar" alt="" data-avatar-index="'+index+'"><span>'+esc(row.player_name||'Tiên Hữu')+'</span></span><span role="cell">'+esc(row.realm||'Luyện Khí Kỳ')+'</span>'+
   config.values(row).map(value=>'<span role="cell">'+esc(value)+'</span>').join('')+'</div>').join('');
  if(list.querySelectorAll)list.querySelectorAll('[data-avatar-index]').forEach(image=>this.setUserAvatar(image,data[Number(image.dataset.avatarIndex)].avatar_url));
  this.updatePantheonSelfStats();
 };
})(typeof window!=='undefined'?window:globalThis);

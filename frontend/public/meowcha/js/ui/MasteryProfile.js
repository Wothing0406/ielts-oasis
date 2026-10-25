(function(root){
 const M=root.Meowcha,UI=M.UIManager.prototype,original=UI.showProfileModal,esc=M.ui.escape;
 UI.showProfileModal=function(...args){
  original.apply(this,args);
  let section=this.modalProfile.querySelector('#profileTamPhap');
  if(!section){section=document.createElement('section');section.id='profileTamPhap';section.className='mc-mastery';this.modalProfile.querySelector('.profile-body-layout').after(section);}
  section.innerHTML='<h3>Tam Pháp Đồng Tu</h3><p role="status">Đang thỉnh thành tích đã hoàn tất…</p>';
  const request=this._masteryRequest=(this._masteryRequest||0)+1;
  this.saveSystem.request('/api/meowcha/profile',{headers:this.saveSystem.getAuthHeaders()}).then(async response=>{
   if(!response.ok)throw new Error('profile');
   const result=await response.json(),data=result.data?.tam_phap;
   if(this._masteryRequest!==request||!data)return;
   const labels={DIRECT:['Trực Diện','broadsword'],CLOZE:['Ngộ Đạo','lotus-flower'],AUDIO:['Thính Âm','ringing-bell']};
   const pct=n=>n==null?'Chưa lưu':Number(n).toLocaleString('vi-VN')+'%';
   section.innerHTML='<h3>Tam Pháp Đồng Tu</h3><div class="mc-mastery-paths">'+Object.entries(labels).map(([key,[name,icon]])=>{
    const mode=data.modes[key],r=mode.best;
    return '<article>'+M.pixelIcon(icon)+'<h4>'+name+'</h4><p>'+(!r?'Chưa có ván hoàn tất':
     key==='DIRECT'?'Kiếm Tốc: '+esc(r.wpm??'Chưa lưu')+' WPM<br>Kiếm Chuẩn: '+pct(r.accuracy)+'<br>Vô Thương Trảm: '+esc(r.max_perfect_streak??'Chưa lưu'):
     (key==='CLOZE'?'Ngộ Tính: ':'Thính Lực: ')+pct(r.accuracy)+'<br>'+(key==='CLOZE'?'Nhất Ngộ: ':'Nhất Thính: ')+pct(r.first_success_rate))+
     '</p><small>Thành thạo '+mode.level+'/5 • '+mode.words+' từ</small></article>';
   }).join('')+'</div><p class="mc-mastery-total">Đạo Hạnh: '+esc(data.dao_hanh)+' / '+esc(data.scale)+' • '+
    (data.complete?'Đã hoàn tất Tam Pháp Đồng Tu':'Chưa hoàn tất Tam Pháp Đồng Tu • Chưa xếp hạng Tổng Đạo')+'</p>';
  }).catch(()=>{if(this._masteryRequest===request)section.innerHTML='<h3>Tam Pháp Đồng Tu</h3><p role="status">Chưa lấy được thành tích. Đóng rồi mở lại hồ sơ để thử lại.</p>';});
 };
})(window);

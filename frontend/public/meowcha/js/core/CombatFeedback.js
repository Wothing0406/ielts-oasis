/* Short, readable combat cues. No learning metrics, scoring or audio ownership here. */
(function(root){
 const M=root.Meowcha=root.Meowcha||{};
 const cues={backspace:['Chữ đúng đã xuất kiếm • phím sai không lưu vào từ',0,0,1.8],wrong:['Lệch kiếm • thử lại',2.8,25,.5],
   impact:['Ma thạch chạm kết giới',5,[35,35,65],.7],
   shield:['Linh thuẫn đỡ đòn',3,30,.5],
   cloud:['Ma vân • gõ đúng 2 từ để tịnh hóa',3.5,[20,35,20],1.8],
   clear:['Ma vân tiêu tán',0,15,1],stun:['Choáng • đang định thần',4,[30,30,55],.5],
   recover:['Đã định thần',0,12,.6],complete:['Trảm thành công',2,15,.35]};
 M.prefersReducedMotion=()=>!!root.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
 M.combatFeedback=function(state,type){
   const cue=cues[type];if(!cue)return;
   state.combatCue={type,label:cue[0],remaining:cue[3]};
   if(!M.prefersReducedMotion())state.screenShake=Math.max(state.screenShake||0,cue[1]);
   if(M.Device?.info.isTouchDevice&&root.navigator?.vibrate&&!M.prefersReducedMotion()){
    try{root.navigator.vibrate(cue[2]);}catch(_){}
   }
 };
 M.updateCombatFeedback=function(state,dt){
   const cue=state.combatCue;if(cue)cue.remaining=Math.max(0,cue.remaining-dt);
   const node=root.document?.getElementById('battleFeedback');if(!node)return;
   const text=state.isStunned?'Choáng • đang định thần':cue?.remaining>0?cue.label:'KẾT GIỚI • BẢO VỆ TIÊN MÔN';
   if(node.textContent!==text)node.textContent=text;
   node.dataset.cue=state.isStunned?'stun':cue?.remaining>0?cue.type:'ready';
 };
})(typeof window!=='undefined'?window:globalThis);

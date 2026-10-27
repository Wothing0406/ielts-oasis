/* One bounded typing budget. No compounded score/realm/combo speed multipliers. */
(function(root){
 const M=root.Meowcha=root.Meowcha||{};
 M.difficultyBudget=function({score=0,realm=0,mode='DIRECT',word='',humanWpm=40,slowFactor=1}={}){
  score=Math.max(0,Number(score)||0);realm=Math.max(0,Math.min(4,Number(realm)||0));
  const pressure=1-Math.exp(-score/22000),offset=mode==='AUDIO'?2.5:mode==='CLOZE'?1.5:0;
  const adaptation=humanWpm<25?1.10:humanWpm<40?1.05:humanWpm<60?1:humanWpm<80?.95:.90;
  const base=16.5-pressure*9.2-realm*.10;
  const lengthBonus=Math.min(3.5,Math.max(0,String(word).length-5)*.4);
  const talentBonus=Math.min(2,Math.max(0,1-(Number(slowFactor)||1))*4);
  const targetTime=Math.max(7+offset,base*adaptation+offset)+lengthBonus+talentBonus;
  const labels=['Nhẹ','Ổn Định','Cao','Cực Cao','Chí Cảnh'];
  const band=score>=100000?4:score>=30000?3:score>=15000?2:score>=2500?1:0;
  return {version:2,targetTime,pressure,label:labels[band],band,minimum:7+offset};
 };
 M.wordFitsBudget=function(options){
  const budget=M.difficultyBudget(options),wpm=Math.max(20,options.humanWpm||40);
  return String(options.word||'').length*12/wpm<=budget.targetTime+1.3;
 };
})(typeof window!=='undefined'?window:globalThis);

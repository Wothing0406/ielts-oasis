/* Runtime cutout animation of existing artwork. No generated video or replacement art. */
(function(root){
 const M=root.Meowcha=root.Meowcha||{};
 const rigs=[
  {bounds:[64,154,296,325],head:[124,151,114,85],neck:233,faceX:180,eyes:[]},
  {bounds:[25,47,335,327],head:[113,43,126,124],neck:163,faceX:174,fur:'#DDF5FA',eyes:[[141,114,23,15],[183,114,24,15]]},
  {bounds:[73,110,288,330],head:[131,140,98,84],neck:220,faceX:179,fur:'#E6BF89',eyes:[[151,185,17,12],[182,185,17,12]]},
  {bounds:[48,110,313,330],head:[134,131,95,101],neck:228,faceX:180,fur:'#BE8645',eyes:[[154,167,19,12],[183,167,19,12]]},
  {bounds:[83,113,278,330],head:[153,151,66,63],neck:210,faceX:185,fur:'#E6D9B8',eyes:[[172,178,10,7],[186,178,10,7]]}
 ];
 M.CHARACTER_RIGS=rigs;
 M.actorMotion=function(time,realm=0,reduced=false){
  if(reduced)return {bob:0,nod:0,breath:1,blink:0};
  const t=Math.max(0,time)+realm*.37,cycle=t%3.7;
  const blink=cycle>2.9&&cycle<3.12?Math.sin((cycle-2.9)/.22*Math.PI):0;
  return {bob:Math.sin(t*2.5)*3,nod:Math.sin(t*1.7)*.035,breath:1+Math.sin(t*2.5)*.025,blink};
 };
 M.drawActorFrame=function(ctx,frame,{x,y,size,realm=0,time=0,state='IDLE',reduced=false}){
  if(!frame?.img)return false;
  const rig=rigs[Math.min(4,Math.max(0,realm))],motion=M.actorMotion(time,realm,reduced);
  const sx=state==='IDLE'&&frame.isSheet?0:frame.sx||0,sy=frame.sy||0,sw=frame.sw||360,sh=frame.sh||360;
  ctx.save();ctx.translate(x,y);ctx.scale(size/360,size/360);ctx.imageSmoothingEnabled=false;
  if(state!=='IDLE'||reduced){ctx.drawImage(frame.img,sx,sy,sw,sh,0,0,360,360);ctx.restore();return true;}
  const [hx,hy,hw,hh]=rig.head;
  // Keep halos and floating weapons intact; only the head is a separate cutout.
  ctx.save();ctx.beginPath();ctx.rect(0,0,360,360);ctx.rect(hx,hy,hw,hh-4);ctx.clip('evenodd');
  ctx.drawImage(frame.img,sx,sy,sw,sh,0,0,360,360);ctx.restore();
  ctx.save();ctx.translate(rig.faceX,rig.neck);ctx.rotate(motion.nod);ctx.scale(1,motion.breath);ctx.translate(-rig.faceX,-rig.neck);
  ctx.drawImage(frame.img,sx+hx,sy+hy,hw,hh,hx,hy,hw,hh);
  if(motion.blink>.05)for(const [ex,ey,ew,eh] of rig.eyes){
    // Local eyelids leave the brow, face, mouth and outline of the authored sprite intact.
    const cover=eh*motion.blink*.52;ctx.fillStyle=rig.fur;
    ctx.fillRect(ex,ey,ew,cover);ctx.fillRect(ex,ey+eh-cover,ew,cover);
    if(motion.blink>.9){ctx.strokeStyle='#29443D';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(ex+2,ey+eh/2);ctx.quadraticCurveTo(ex+ew/2,ey+eh/2+2,ex+ew-2,ey+eh/2);ctx.stroke();}
  }
  ctx.restore();ctx.restore();return true;
 };
 M.drawLobbyActors=function(app){
  const canvas=root.document?.getElementById('lobbyActorCanvas');if(!canvas||!app.animator)return;
  const stage=canvas.parentElement,rect=stage.getBoundingClientRect();if(rect.width<=0||rect.height<=0)return;
  const ratio=Math.min(2,root.devicePixelRatio||1),w=Math.round(rect.width*ratio),h=Math.round(rect.height*ratio);
  if(canvas.width!==w)canvas.width=w;if(canvas.height!==h)canvas.height=h;
  const ctx=canvas.getContext('2d');if(!ctx)return;
  ctx.setTransform(ratio,0,0,ratio,0,0);ctx.clearRect(0,0,rect.width,rect.height);
  const realm=Math.min(4,Math.max(0,app.gameState.realmIdx)),rig=rigs[realm];
  const frame=app.animator.getCharacterFrame(realm,'IDLE');if(!frame)return;
  const reduced=!!root.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const time=app.animator.motionTime||0,motion=M.actorMotion(time,realm,reduced);
  const height=parseFloat(root.getComputedStyle(stage).getPropertyValue('--lobby-hero-height'))||104;
  const size=height*360/(rig.bounds[3]-rig.bounds[1]),feet=rect.height-24;
  M.drawActorFrame(ctx,frame,{x:rect.width/2-(rig.bounds[0]+rig.bounds[2])/720*size,y:feet-rig.bounds[3]/360*size+motion.bob,size,realm,time,reduced});
  canvas.dataset.realm=String(realm);canvas.dataset.frame=String(frame.frameIndex);canvas.dataset.motion=time.toFixed(2);
  const poster=root.document.getElementById('lobbyCatImg');if(poster&&!poster.hidden)poster.hidden=true;
  const companion=stage.querySelector('.lobby-companion');
  if(companion?.complete&&companion.naturalWidth){
   ctx.save();ctx.translate(rect.width/2+103,feet-39+(reduced?0:Math.sin(time*2.1+1)*4));ctx.rotate(reduced?0:Math.sin(time*1.6)*.045);
   ctx.drawImage(companion,-31,-42,62,84);ctx.restore();companion.style.visibility='hidden';
  }
 };
})(typeof window!=='undefined'?window:globalThis);

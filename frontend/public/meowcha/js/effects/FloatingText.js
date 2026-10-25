/* Authored pixel paper for learning rewards; restrained shards and returning Qi. */
(function(root) {
  class FloatingText {
    constructor(assets = {}) { this.assets = assets; this.clear(); }
    clear() { this.texts=[]; this.bursts=[]; this.expOrbs=[]; this.celestialBanner=null; }
    add(x,y,text,color='#E5BE72',size=18,vy=-1.6) {
      this.texts.push({x,y,text,color,size,vy,alpha:1});
      if(this.texts.length>12) this.texts.shift();
    }
    addCelestialEdict(canvasW,title,content,type='warning') {
      this.celestialBanner={title,content,type,life:3.2,maxLife:3.2};
    }
    addInSituBurst(x,y,item) {
      // Only one readable reward at a time; previous words remain in the learning altar.
      this.bursts=[{x,y,word:item.word,ipa:item.ipa||'',meaning:item.meaning||'',
        points:item.points||0,life:2.4,maxLife:2.4}];
    }
    addExpOrb(x,y,targetX,targetY,points=100) {
      this.expOrbs.push({x,y,startX:x,startY:y,targetX,targetY,points,t:0});
    }
    update(dt=.016,onExpArrived) {
      if(this.celestialBanner && (this.celestialBanner.life-=dt)<=0) this.celestialBanner=null;
      for(const t of this.texts) { t.y+=t.vy*dt*60; t.alpha-=dt*1.2; }
      this.texts=this.texts.filter(t=>t.alpha>0);
      for(const b of this.bursts) b.life-=dt;
      this.bursts=this.bursts.filter(b=>b.life>0);
      for(const orb of this.expOrbs) {
        orb.t=Math.min(1,orb.t+dt*1.4);
        const t=orb.t, inv=1-t;
        orb.x=inv*inv*orb.startX+2*inv*t*(orb.startX+35)+t*t*orb.targetX;
        orb.y=inv*inv*orb.startY+2*inv*t*(orb.startY-50)+t*t*orb.targetY;
        if(t>=1 && onExpArrived) onExpArrived(orb.points);
      }
      this.expOrbs=this.expOrbs.filter(o=>o.t<1);
    }
    paper(ctx,x,y,w,h) {
      const paper=this.assets.ivory_scroll;
      if(paper && paper.loaded) {
        ctx.imageSmoothingEnabled=false;
        ctx.drawImage(paper.img,x-w/2,y-h/2,w,h);
      } else { ctx.fillStyle='#F5E7C7'; ctx.fillRect(x-w*.45,y-h*.35,w*.9,h*.65); }
    }
    fit(ctx,text,width) {
      let out=String(text||'');
      while(out.length>1 && ctx.measureText(out).width>width) out=out.slice(0,-1);
      return out===text ? out : out.slice(0,-1)+'…';
    }
    draw(ctx) {
      ctx.save(); ctx.shadowBlur=0; ctx.textAlign='center'; ctx.textBaseline='middle';
      const w=ctx.canvas.width, h=ctx.canvas.height, small=w<600;
      if(this.celestialBanner) {
        const b=this.celestialBanner, width=Math.min(w-20,590), height=small?100:90;
        const x=w/2, y=small?134:114;
        ctx.globalAlpha=Math.min(1,b.life/.35,(b.maxLife-b.life)*5);
        this.paper(ctx,x,y,width,height);
        ctx.fillStyle='#20332D'; ctx.font="bold "+(small?12:15)+"px 'Be Vietnam Pro',sans-serif";
        ctx.fillText(this.fit(ctx,b.title,width*.77),x,y-8);
        ctx.font=(small?10:12)+"px 'Be Vietnam Pro',sans-serif";
        ctx.fillText(this.fit(ctx,b.content,width*.77),x,y+13);
      }
      for(const b of this.bursts) {
        ctx.save();
        const age=b.maxLife-b.life;
        ctx.globalAlpha=Math.min(1,age*7,b.life/.35);
        const width=Math.min(small?300:330,w-16), height=small?112:120;
        const M=root.Meowcha || {}, layout=M.getBattleLayout ? M.getBattleLayout(ctx.canvas) : {catY:h*.8};
        // Rewards sit below the next falling word and above the character/HUD.
        const x=small?w/2:Math.max(width/2+8,w-width/2-30);
        const y=Math.max(150,Math.min(h-height/2-65,layout.catY-108));
        this.paper(ctx,x,y,width,height);
        ctx.fillStyle='#20332D'; ctx.font="800 "+(small?18:20)+"px 'Be Vietnam Pro',sans-serif";
        ctx.fillText(this.fit(ctx,b.word,width*.72),x,y-16);
        ctx.fillStyle='#37665C'; ctx.font="12px 'Be Vietnam Pro',sans-serif";
        ctx.fillText(this.fit(ctx,b.ipa,width*.75),x,y+3);
        ctx.fillStyle='#614734'; ctx.font="12px 'Be Vietnam Pro',sans-serif";
        ctx.fillText(this.fit(ctx,b.meaning,width*.75),x,y+20);
        ctx.fillStyle='#597C62'; ctx.font="bold 11px 'Be Vietnam Pro',sans-serif";
        ctx.fillText('+'+b.points+' Tu Vi',x,y+36);
        ctx.restore();
      }
      ctx.globalAlpha=1;
      for(const orb of this.expOrbs) { ctx.fillStyle='#E5BE72'; ctx.fillRect(Math.round(orb.x)-2,Math.round(orb.y)-2,4,4); }
      for(const t of this.texts) {
        ctx.globalAlpha=t.alpha; ctx.fillStyle=t.color; ctx.font='bold '+t.size+"px 'Be Vietnam Pro',sans-serif";
        ctx.fillText(this.fit(ctx,t.text,w-30),Math.max(15,Math.min(w-15,t.x)),t.y);
      }
      ctx.restore();
    }
    drawSideSpeechBubble(ctx,x,y,text) {
      if(!text) return;
      ctx.save(); ctx.font="italic 12px 'Be Vietnam Pro',sans-serif";
      const width=Math.min(ctx.canvas.width-24,ctx.measureText(text).width+32);
      this.paper(ctx,x,y-18,width+16,66);
      ctx.fillStyle='#20332D'; ctx.textAlign='center';ctx.textBaseline='middle';
      ctx.fillText(this.fit(ctx,text,width*.78),x,y-18);ctx.restore();
    }
  }
  root.Meowcha=root.Meowcha||{};root.Meowcha.FloatingText=FloatingText;
})(typeof window!=='undefined'?window:globalThis);

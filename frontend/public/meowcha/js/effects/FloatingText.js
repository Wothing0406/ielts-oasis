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
      const duration=({DIRECT:2,CLOZE:2.8,AUDIO:3.6}[item.gameMode]||2.6)+(item.readingBonus||0);
      this.bursts=[{x,y,word:item.word,ipa:item.ipa||'',type:item.type||'',meaning:item.meaning||'',
        points:item.points||0,life:duration,maxLife:duration}];
    }
    hasBlockingReward(){return this.bursts.some(b=>b.life>0);}
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
    paper(ctx,x,y,w,h,compact=false) {
      const paper=this.assets.ivory_scroll;
      if(paper && paper.loaded) {
        ctx.fillStyle='#F5E7C7';ctx.fillRect(x-w*.4,y-h*.29,w*.8,h*.58);
        ctx.imageSmoothingEnabled=false;
        if(compact)ctx.drawImage(paper.img,0,paper.img.height*.10,paper.img.width,paper.img.height*.72,x-w/2,y-h/2,w,h);
        else ctx.drawImage(paper.img,x-w/2,y-h/2,w,h);
      } else { ctx.fillStyle='#F5E7C7'; ctx.fillRect(x-w*.45,y-h*.35,w*.9,h*.65); }
    }
    fit(ctx,text,width) {
      let out=String(text||'');
      while(out.length>1 && ctx.measureText(out).width>width) out=out.slice(0,-1);
      return out===text ? out : out.slice(0,-1)+'…';
    }
    wrap(ctx, value, maxWidth) {
      const lines = []; let line = '';
      for (const character of Array.from(String(value || ''))) {
        if (line && ctx.measureText(line + character).width > maxWidth) { lines.push(line); line = ''; }
        line += character;
      }
      if (line) lines.push(line);
      return lines.length ? lines : [''];
    }
    getBurstLayout(ctx, burst) {
      const field=root.Meowcha.battleLayout||{};
      const fieldWidth=field.fieldWidth||ctx.canvas.width;
      const width = Math.min(fieldWidth - 24, fieldWidth < 600 ? 246 : 292);
      ctx.font = "13px 'Be Vietnam Pro',sans-serif";
      const ipaLines = this.wrap(ctx, burst.ipa && burst.ipa !== '/.../' ? burst.ipa : 'Chưa có phiên âm trong bộ từ này', width * .76);
      ctx.font = "800 18px 'Be Vietnam Pro',sans-serif";
      const wordLines = this.wrap(ctx, burst.word, width * .72);
      ctx.font = "12px 'Be Vietnam Pro',sans-serif";
      const M = root.Meowcha;
      const meaningLines = M.wrapLearningText ? M.wrapLearningText(ctx, burst.meaning, width * .75) : this.wrap(ctx, burst.meaning, width * .75);
      const textHeight = 13 + (burst.type?14:0) + meaningLines.length * 15 + ipaLines.length * 16 + wordLines.length * 20;
      const height = Math.max(112, (textHeight + 18) / .80);
      const half = height / 2,top=(M.battleLayout?.hudBottom||76)+8;
      return { width, height, ipaLines, wordLines, meaningLines, textHeight,
        x:Math.max(width/2 + 8, Math.min(fieldWidth - width/2 - 8, burst.x)),
        y:Math.max(half + top, Math.min((field.defenseY||ctx.canvas.height-104) - half - 8, burst.y)) };
    }
    draw(ctx) {
      ctx.save(); ctx.shadowBlur=0; ctx.textAlign='center'; ctx.textBaseline='middle';
      const w=ctx.canvas.width, h=ctx.canvas.height, small=w<600;
      if(this.celestialBanner && !this.bursts.length && !['cloud','lightning'].includes(this.celestialBanner.type)) {
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
        const layout = this.getBurstLayout(ctx, b);
        const {x,y,width,height,ipaLines,wordLines,meaningLines} = layout;
        this.paper(ctx,x,y,width,height,true);
        let textY = y - layout.textHeight/2 + 9;
        ctx.fillStyle='#20332D'; ctx.font="800 18px 'Be Vietnam Pro',sans-serif";
        for (const line of wordLines) { ctx.fillText(line,x,textY); textY += 20; }
        ctx.fillStyle='#37665C'; ctx.font="13px 'Be Vietnam Pro',sans-serif";
        for (const line of ipaLines) { ctx.fillText(line,x,textY); textY += 16; }
        ctx.fillStyle='#614734'; ctx.font="12px 'Be Vietnam Pro',sans-serif";
        if(b.type){ctx.fillText(b.type,x,textY);textY+=14;}
        for(const line of meaningLines) { ctx.fillText(line,x,textY+2); textY+=15; }
        ctx.fillStyle='#597C62'; ctx.font="bold 11px 'Be Vietnam Pro',sans-serif";
        ctx.fillText('+'+b.points+' Tu Vi',x,textY+3);
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
      const width=Math.min(ctx.canvas.width-24,340,ctx.measureText(text).width+48);
      const wrap=root.Meowcha.wrapLearningText;
      const lines=wrap?wrap(ctx,text,width*.76):this.wrap(ctx,text,width*.76);
      const height=Math.max(66,(lines.length*16+12)/.58);
      x=Math.max(width/2+8,Math.min(ctx.canvas.width-width/2-8,x));
      this.paper(ctx,x,y-18,width,height);
      ctx.fillStyle='#20332D'; ctx.textAlign='center';ctx.textBaseline='middle';
      lines.forEach((line,index)=>ctx.fillText(line,x,y-18+(index-(lines.length-1)/2)*16));ctx.restore();
    }
  }
  root.Meowcha=root.Meowcha||{};root.Meowcha.FloatingText=FloatingText;
})(typeof window!=='undefined'?window:globalThis);

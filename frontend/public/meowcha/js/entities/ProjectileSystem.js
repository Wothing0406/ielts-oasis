/* Authored per-realm sprite attacks. Gameplay input never waits for a projectile. */
(function(root) {
  class ProjectileSystem {
    constructor(assets, animator = null) {
      this.assets = assets || {}; this.animator = animator; this.time = 0;
      this.projectiles = []; this.skyStrikes = []; this.shockwaves = []; this.muzzleFlashes = [];
    }
    clear() {
      this.projectiles = []; this.skyStrikes = []; this.shockwaves = []; this.muzzleFlashes = [];
    }
    spawn(fromX, fromY, targetX, targetY, realmIdx = 0, color = '#70B998') {
      const realm = Math.min(4, Math.max(0, realmIdx));
      const angle = Math.atan2(targetY-fromY, targetX-fromX);
      const duration = Math.min(.32, Math.max(.15, Math.hypot(targetX-fromX,targetY-fromY)/2200));
      this.projectiles.push({x:fromX,y:fromY,startX:fromX,startY:fromY,targetX,targetY,
        realmIdx:realm,color,angle,duration,elapsed:0,trail:[],birthTime:performance.now()});
      if (this.animator) this.animator.spawnVFXClip(`char_r${realm}_muzzle_sheet`,
        fromX + Math.cos(angle)*14, fromY + Math.sin(angle)*14,
        {frames:4,frameW:256,frameH:160,fps:24,size:54,rotation:angle+Math.PI,color});
    }
    spawnShockwave(x,y,color='#E7BC68',realmIdx=0) {
      if (this.animator) this.animator.spawnVFXClip(`char_r${realmIdx}_hit_sheet`,x,y,
        {frames:4,frameW:256,frameH:256,fps:24,size:68,color});
      this.shockwaves.push({x,y,color,life:.18});
    }
    spawnSkyStrike(x,y,realmIdx=0) {
      // Reserved for active skills: layered authored slashes, no full-height beam.
      this.skyStrikes.push({x,y,realmIdx,life:.35});
      if (this.animator) this.animator.spawnVFXClip(`vfx_slash_r${realmIdx}_sheet`,x,y,
        {frames:6,frameW:128,frameH:128,fps:22,size:150,color:'#E7BC68'});
    }
    update(dt=.016,onHit) {
      this.time += dt;
      for (let i=this.projectiles.length-1;i>=0;i--) {
        const p=this.projectiles[i];
        p.elapsed += dt;
        const t=Math.min(1,p.elapsed/p.duration);
        p.x=p.startX+(p.targetX-p.startX)*t; p.y=p.startY+(p.targetY-p.startY)*t;
        p.trail.unshift({x:p.x,y:p.y}); p.trail.length=Math.min(p.trail.length,4);
        if(t>=1) {
          this.spawnShockwave(p.targetX,p.targetY,p.color,p.realmIdx);
          if(onHit) onHit(p);
          this.projectiles.splice(i,1);
        }
      }
      this.shockwaves=this.shockwaves.filter(s=>(s.life-=dt)>0);
      this.skyStrikes=this.skyStrikes.filter(s=>(s.life-=dt)>0);
    }
    drawSprite(ctx,p) {
      const sheet=this.assets[`char_r${p.realmIdx}_projectile_sheet`];
      const single=this.assets[`char_r${p.realmIdx}_projectile`];
      const asset=sheet&&sheet.loaded&&sheet.img?sheet:single&&single.loaded&&single.img?single:null;
      if(asset) {
        const image=asset.img, frames=asset===sheet?4:1;
        const frameW=(image.naturalWidth||image.width)/frames;
        const frameH=image.naturalHeight||image.height;
        const frame=Math.floor(p.elapsed*20)%frames;
        const width=p.isUltimate?96:72, height=width*frameH/frameW;
        ctx.save();ctx.translate(p.x,p.y);
        // Realms 0–1 point left; golden lotus, thunder and dragon masters point right.
        ctx.rotate(p.angle+(p.realmIdx < 2 ? Math.PI : 0));ctx.imageSmoothingEnabled=false;
        ctx.drawImage(image,frame*frameW,0,frameW,frameH,-width/2,-height/2,width,height);
        ctx.restore();return;
      }
      const fallback=this.assets['char_r'+p.realmIdx+'_sword']||this.assets.prop_bamboo_sword;
      if(fallback&&fallback.loaded&&fallback.img) {
        const image=fallback.img, height=42, width=height*(image.naturalWidth||image.width)/(image.naturalHeight||image.height);
        ctx.save();ctx.translate(p.x,p.y);ctx.rotate(p.angle+1.32);ctx.imageSmoothingEnabled=false;
        ctx.drawImage(image,-width/2,-height/2,width,height);ctx.restore();
      } else {
        // A few Qi pixels while art loads; never draw a long line as a replacement.
        ctx.fillStyle=p.color;ctx.fillRect(p.x-3,p.y-3,6,6);
        if(root.Meowcha&&root.Meowcha.debug&&!this.warnedMissing) {
          console.warn('[Meowcha VFX] Missing projectile sprites');this.warnedMissing=true;
        }
      }
    }
    draw(ctx) {
      ctx.save();
      for(const p of this.projectiles) {
        for(let i=1;i<p.trail.length;i++) {
          const q=p.trail[i];ctx.globalAlpha=(1-i/p.trail.length)*.55;
          ctx.fillStyle=p.color;ctx.fillRect(q.x-1,q.y+(i%2?3:-3),3,3);
        }
        ctx.globalAlpha=1;this.drawSprite(ctx,p);
        if(p.realmIdx===1) {
          ctx.save();ctx.translate(-Math.sin(p.angle)*9,Math.cos(p.angle)*9);
          ctx.globalAlpha=.65;this.drawSprite(ctx,p);ctx.restore();
        }
      }
      ctx.restore();
    }
  }
  root.Meowcha=root.Meowcha||{};root.Meowcha.ProjectileSystem=ProjectileSystem;
})(typeof window!=='undefined'?window:globalThis);

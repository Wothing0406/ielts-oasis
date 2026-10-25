/* Authored atlas coordinates shared by navigation, learning modes and skills. */
(function(root) {
  const M=root.Meowcha=root.Meowcha||{};
  const positions={'winged-sword':0,'energy-sword':0,'katana':0,'shield':1,'dragon-shield':1,
    'scroll-unfurled':2,'meditation':7,'pagoda':7,'ringing-bell':3,'windchimes':3,'asian-lantern':3,
    cauldron:4,'round-potion':4,'health-potion':4,'yin-yang':5,'broadsword':6,'fast-arrow':0,'lotus-flower':7,'spinning-sword':0,'spinning-blades':6,'dragon-head':1,'dragon-orb':1,'flying-dagger':0,'paper-crane':7};
  M.pixelIcon=function(name,className='') {
    const i=positions[name]===undefined?7:positions[name], col=i%4,row=Math.floor(i/4);
    return '<span aria-hidden="true" class="pixel-icon '+className+'" style="background-position:'+(col*100/3)+'% '+(row*100)+'%"></span>';
  };
  M.installPixelArt=function() {
    document.querySelectorAll('.windchime-icon-svg').forEach((old,i)=>{
      const holder=document.createElement('span');
      holder.innerHTML=M.pixelIcon(['scroll-unfurled','broadsword','lotus-flower','ringing-bell','scroll-unfurled'][i]||'lotus-flower');
      const icon=holder.firstElementChild;
      if(old.id) icon.id=old.id;
      old.replaceWith(icon);
    });
    document.querySelectorAll('.setup-mode-card').forEach(card=>{
      const el=card.querySelector('.setup-card-icon-art');
      if(el) el.innerHTML=M.pixelIcon({DIRECT:'winged-sword',CLOZE:'scroll-unfurled',AUDIO:'ringing-bell'}[card.dataset.mode]);
    });
    document.querySelectorAll('.pill-icon').forEach((element,index)=>{
      element.innerHTML=M.pixelIcon(index===0?'cauldron':'scroll-unfurled');
    });
    M.replacePixelImages(document);
    if (!M.pixelObserver && typeof MutationObserver !== 'undefined') {
      const mount = document.getElementById('gameAppWrapper');
      if (mount) {
        M.pixelObserver = new MutationObserver(records => {
          for (const record of records) for (const added of record.addedNodes) {
            if (added.nodeType === 1) M.replacePixelImages(added);
          }
        });
        M.pixelObserver.observe(mount, {childList:true, subtree:true});
      }
    }
  };
  M.replacePixelImages = function(container) {
    const images = container.matches && container.matches('img[src*="/assets/svg/"]') ? [container] :
      Array.from(container.querySelectorAll('img[src*="/assets/svg/"]'));
    for (const old of images) {
      const name = (old.getAttribute('src') || '').split('/').pop().replace('.svg','');
      if (positions[name] === undefined) continue;
      const holder = document.createElement('span');
      holder.innerHTML = M.pixelIcon(name, old.className || '');
      const icon = holder.firstElementChild;
      if (old.id) icon.id = old.id;
      const size = Math.min(64, Math.max(16, Number(old.getAttribute('width')) || parseFloat(getComputedStyle(old).width) || 24));
      icon.style.setProperty('--icon-size', size + 'px');
      old.replaceWith(icon);
    }
  };
})(typeof window!=='undefined'?window:globalThis);

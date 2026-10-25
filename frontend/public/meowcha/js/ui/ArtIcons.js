/* Authored atlas coordinates shared by navigation, learning modes and skills. */
(function(root) {
  const M=root.Meowcha=root.Meowcha||{};
  const positions={'winged-sword':0,'energy-sword':0,'katana':0,'shield':1,'dragon-shield':1,
    'scroll-unfurled':2,'meditation':7,'pagoda':7,'ringing-bell':3,'windchimes':3,'asian-lantern':3,
    cauldron:4,'round-potion':4,'health-potion':4,'yin-yang':5,'broadsword':6,'fast-arrow':0,'lotus-flower':7};
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
    document.querySelectorAll('img[src*="/assets/svg/"]').forEach(old=>{
      const name=(old.getAttribute('src')||'').split('/').pop().replace('.svg','');
      if(positions[name]===undefined) return;
      const holder=document.createElement('span');holder.innerHTML=M.pixelIcon(name,old.className||'');
      const icon=holder.firstElementChild;if(old.id)icon.id=old.id;old.replaceWith(icon);
    });
  };
})(typeof window!=='undefined'?window:globalThis);

/* Shared semantic UI kit. Gameplay IDs and event handlers stay on their original nodes. */
(function(root) {
  const M=root.Meowcha=root.Meowcha||{};
  const escape=value=>String(value==null?'':value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const stats={health:'cauldron',speed:'scroll-unfurled',cultivation:'yin-yang',combo:'broadsword',accuracy:'shield',listening:'ringing-bell',words:'scroll-unfurled',time:'lotus-flower',assistance:'shield'};
  M.ui={
    stat(kind,label,value,id='') {
      return `<div class="mc-stat mc-stat--${escape(kind)}"><span class="mc-stat-icon">${M.pixelIcon(stats[kind]||'lotus-flower')}</span><dl class="mc-stat-copy"><dt>${escape(label)}</dt><dd${id?' id="'+escape(id)+'"':''}>${escape(value)}</dd></dl></div>`;
    },
    escape
  };
  const panels={
    ceremonial:'.modal-content-box,.xianxia-breakthrough-box',
    parchment:'.compact-stat-pills,#typingPracticeStats,.vocab-card,.save-slot-card,.profile-stats-panel,.mc-results',
    jade:'.board-filters,.setup-journey-panel,.setup-journey-info,.monolith-card,.srs-auto-notice-box,.setup-srs-banner,.jade-comm-slab',
    wood:'.sect-hud-left-dock,.sect-hud-right-dock,.profile-talents-section'
  };
  const actions={
    hero:'.sword-talisman-cta:not(.change-mode),#btnResumeGame,#btnSetupContinue,#btnSetupStartFresh[data-sword-primary="true"],#btnRebirth',
    secondary:'.sword-talisman-cta.change-mode,.btn-linh-ngo,.btn-slot-load,.btn-slot-save,.btn-slot-new,.btn-xianxia-seal:not(#btnResumeGame),#btnSetupStartFresh:not([data-sword-primary="true"]),#btnQuitToLobby,#btnReturnLobbyGameOver,.btn-confirm-cancel',
    utility:'.btn-modal-close,.hud-btn,.hud-talisman-btn,.btn-pronounce-speaker,.vault-tab-btn,.mode-pill-btn,.kb-key,.active-skill-btn,.mc-utility',
    danger:'.sword-talisman-restart,.btn-slot-del,.btn-confirm-accept'
  };
  function matches(scope,selector) {
    const nodes=Array.from(scope.querySelectorAll(selector));
    if(scope.matches&&scope.matches(selector))nodes.unshift(scope);
    return nodes;
  }
  M.applyDesignSystem=function(scope=document) {
    for(const [kind,selector] of Object.entries(panels)) for(const node of matches(scope,selector)) node.dataset.uiPanel=kind;
    for(const [kind,selector] of Object.entries(actions)) for(const node of matches(scope,selector)) node.dataset.uiAction=kind;
    for(const node of matches(scope,'.modal-content-box')) {
      node.tabIndex=0;
      const modal=node.closest('.meowcha-modal-overlay');
      if(modal) { modal.setAttribute('role','dialog');modal.setAttribute('aria-modal','true'); }
    }
    for(const node of matches(scope,'.profile-stat-row')) {
      if(node.dataset.uiStat)continue;
      const types=['cultivation','cultivation','words','accuracy','speed','health'];
      const index=Array.from(node.parentNode.children).indexOf(node);
      const label=node.querySelector('.stat-lbl');if(label)label.textContent=['Tu Vi','Kỷ Lục','Từ Đã Luyện','Chính Xác','Kiếm Tốc','Khí Huyết'][index]||'Tu Vi';
      node.dataset.uiStat=types[index]||'cultivation';
      const icon=document.createElement('span');icon.className='mc-stat-icon';icon.innerHTML=M.pixelIcon(stats[node.dataset.uiStat]);node.prepend(icon);
    }
    for(const node of matches(scope,'.stat-pill'))node.dataset.uiStat=node.classList.contains('jade-pill-hp')?'health':'speed';
  };
  M.installDesignSystem=function() {
    M.applyDesignSystem();
    if(typeof MutationObserver==='undefined'||M.designObserver)return;
    M.designObserver=new MutationObserver(records=>{
      const scopes=new Set();
      for(const record of records)for(const node of record.addedNodes) {
        if(node.nodeType!==1)continue;
        const scope=node.parentElement||node;
        if(scope.closest('.meowcha-modal-overlay,.lobby-cta-sword-area,.lobby-top-actions,.battle-active-skills-bar'))scopes.add(scope);
      }
      for(const scope of scopes)M.applyDesignSystem(scope);
    });
    M.designObserver.observe(document.body,{childList:true,subtree:true});
  };
})(typeof window!=='undefined'?window:globalThis);

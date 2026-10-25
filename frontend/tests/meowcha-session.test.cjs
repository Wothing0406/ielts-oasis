const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const base=path.join(__dirname,'../public/meowcha/js');
function session(){
 const values=new Map(),nodes=new Map(),listeners={},calls={save:0,pause:0,silence:0,reload:0,sync:0};
 let reply={id:11,username:'Account A'},status=200;
 const storage={getItem:k=>values.get(k)||null,setItem:(k,v)=>values.set(k,String(v)),removeItem:k=>values.delete(k)};
 const document={body:{dataset:{},appendChild(n){nodes.set(n.id,n);}},
  getElementById:id=>nodes.get(id),createElement(){return {setAttribute(){},querySelector(){return {};},remove(){nodes.delete(this.id);}};},
  addEventListener(type,fn){listeners[type]=fn;}};
 const box={console,document,localStorage:storage,AbortController,Date,Set,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}},
  Event:class{},dispatchEvent(){},addEventListener(type,fn){listeners[type]=fn;},
  setTimeout:()=>1,clearTimeout(){},setInterval:()=>1,location:{reload(){calls.reload++;}},
  fetch:async()=>({status,ok:status===200,json:async()=>({data:reply})})};
 box.window=box;vm.createContext(box);vm.runInContext(fs.readFileSync(path.join(base,'core/Session.js'),'utf8'),box);
 return {box,S:box.Meowcha.Session,storage,document,listeners,calls,setReply(user,code=200){reply=user;status=code;},install(){
  const app=box.Meowcha.app={gameState:{currentScene:'BATTLE',isPaused:false,runId:'same-run',activeSlotId:2},
   ui:null,
   saveSystem:{saveGame(){calls.save++;},async syncWithBackend(){calls.sync++;}},audio:{play(){},pauseVoice(){},silenceAll(){calls.silence++;}}};
  vm.runInContext(fs.readFileSync(path.join(base,'ui/UIManager.js'),'utf8'),box);
  const pause=box.Meowcha.UIManager.prototype.setPause;
  app.ui={state:app.gameState,audio:app.audio,modalPause:null,setPause(v){calls.pause++;pause.call(this,v);}};
  return app;
 }};
}
test('anonymous entry remains locked without an engine; server identity replaces stale client claims',async()=>{
 const r=session();r.setReply(null,401);assert.equal(await r.S.authorize(),false);
 assert.equal(r.document.body.dataset.session,'locked');assert.equal(r.box.Meowcha.app,undefined);
 r.storage.setItem('oasis_user',JSON.stringify({id:99,username:'forged'}));r.setReply({id:11,username:'Server A'});
 assert.equal(await r.S.authorize(),true);assert.equal(r.S.owner,'11');
 assert.equal(JSON.parse(r.storage.getItem('oasis_user')).username,'Server A');
});
test('expiry snapshots and silences once; same-account reauth resumes the same run, while periodic checks preserve manual pause',async()=>{
 const r=session();await r.S.authorize();const app=r.install();
 r.setReply(null,401);await r.S.authorize();await r.S.authorize();
 assert.equal(app.gameState.isPaused,true);assert.equal(r.calls.save,1);assert.equal(r.calls.silence,1);
 r.setReply({id:11});await r.S.authorize();assert.equal(app.gameState.runId,'same-run');assert.equal(app.gameState.isPaused,false);
 app.gameState.isPaused=true;const paused=r.calls.pause;await r.S.authorize();assert.equal(r.calls.pause,paused);assert.equal(app.gameState.isPaused,true);
});
test('account switching hides old UI and reloads rather than reusing the previous account engine',async()=>{
 const r=session();await r.S.authorize();r.install();r.setReply({id:12,username:'B'});
 assert.equal(await r.S.authorize(),false);assert.equal(r.calls.reload,1);assert.equal(r.S.owner,'11');assert.equal(r.S.blocked,true);
});
test('an old save owner cannot upload a snapshot with the next account token or cookie session',async()=>{
 const r=session();r.storage.setItem('oasis_user',JSON.stringify({id:11}));r.storage.setItem('oasis_token','test-a');
 // SaveSystem needs only its existing empty-slot initialization environment.
 r.box.performance=performance;r.box.crypto=require('node:crypto').webcrypto;
 vm.runInContext(fs.readFileSync(path.join(base,'data/RealmsData.js'),'utf8'),r.box);
 vm.runInContext(fs.readFileSync(path.join(base,'core/SaveSystem.js'),'utf8'),r.box);
 const save=new r.box.Meowcha.SaveSystem();await r.S.authorize();
 r.storage.setItem('oasis_user',JSON.stringify({id:12}));r.storage.setItem('oasis_token','test-b');
 assert.equal(save.hasSession(),false);assert.equal(save.getAuthHeaders().Authorization,undefined);
 await assert.rejects(save.request('/api/meowcha/save-snapshots/1',{method:'POST'}),/Session unavailable/);
});
test('return-to-game accepts only the internal game path for either login callback',()=>{
 const ts=require('../node_modules/typescript'),source=fs.readFileSync(path.join(__dirname,'../utils/meowchaReturn.ts'),'utf8');
 const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
 for(const requested of ['/games/meowcha','//evil.example','https://evil.example','/games/meowcha?token=secret','javascript:alert(1)']){
  const values=new Map(),box={exports:{},URLSearchParams,window:{location:{search:'?returnTo='+encodeURIComponent(requested)}},
   sessionStorage:{getItem:k=>values.get(k),setItem:(k,v)=>values.set(k,v),removeItem:k=>values.delete(k)}};
  vm.runInNewContext(code,box);box.exports.rememberMeowchaReturn();
  assert.equal(box.exports.consumeMeowchaReturn(),requested==='/games/meowcha'?requested:null);assert.equal(values.size,0);
 }
});

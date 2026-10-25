const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
function audioRuntime(){
 const timers=new Map();let tid=0,cancelled=0;const clips=[],spoken=[];
 const param=()=>({value:1,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(v){this.value=v;}});
 const node=()=>({gain:param(),frequency:param(),threshold:param(),ratio:param(),connect(){},disconnect(){},start(){},stop(){}});
 class Context{constructor(){this.state='running';this.currentTime=0;this.destination={};}createGain(){return node();}createOscillator(){return node();}createDynamicsCompressor(){return node();}resume(){this.state='running';return Promise.resolve();}}
 class Audio{constructor(url){this.url=url;clips.push(this);}play(){return Promise.resolve();}pause(){}}
 const localStorage={getItem(){return null;},setItem(){}};
 const synth={paused:false,getVoices:()=>[{lang:'en-US'}],speak:u=>spoken.push(u),resume(){},cancel(){cancelled++;}};
 const box={AudioContext:Context,Audio,URL,Promise,localStorage,speechSynthesis:synth,SpeechSynthesisUtterance:class{constructor(text){this.text=text;}},
 document:{addEventListener(){}},setTimeout(fn){timers.set(++tid,fn);return tid;},clearTimeout(id){timers.delete(id);}};
 box.window=box;vm.createContext(box);vm.runInContext(fs.readFileSync(path.join(__dirname,'../public/meowcha/js/core/AudioManager.js'),'utf8'),box);
 const manager=new box.Meowcha.AudioManager();
 return {manager,clips,spoken,timers,box,cancelled:()=>cancelled};
}
test('20 consecutive word voices finish serially while BGM and SFX remain independent',async()=>{
 const r=audioRuntime(),a=r.manager;a.startZenGuqin();await Promise.resolve();
 assert.equal(a.zenMusicPlaying,true);
 for(let i=0;i<20;i++){a.playWord({word:'WORD'+i,audio_url:'/audio/word'+i+'.mp3'});a.play('explosion');a.play('chime');}
 assert.equal(r.clips.length,1);assert.equal(a.voiceQueue.length,19);assert.equal(r.cancelled(),0);
 for(let i=0;i<20;i++){assert.ok(r.clips[i].onended);r.clips[i].onended();}
 assert.equal(a.getStatus().voiceCompleted,20);assert.equal(a.getStatus().voiceActive,false);
 assert.equal(a.getStatus().bgm,true);assert.equal(a.musicNodes.length,2);assert.equal(a.getStatus().sfxPlayed,40);
 assert.equal(a.sfx.gain.value,.18);assert.equal(a.bgm.gain.value,.7);
});
test('MP3 errors fall back once and stale rejection cannot interrupt the next voice',async()=>{
 const r=audioRuntime(),a=r.manager;a.playWord({word:'CAT',audio_url:'/bad.mp3'});const stale=r.clips[0].onerror;
 stale();stale();assert.equal(r.spoken.length,1);assert.equal(r.spoken[0].text,'CAT');
 a.playWord({word:'DOG',audio_url:'/dog.mp3'});r.spoken[0].onend();stale();
 assert.equal(r.spoken.length,1);assert.equal(r.clips.length,2);r.clips[1].onended();
 assert.equal(a.getStatus().voiceCompleted,2);assert.equal(a.getStatus().voiceFallbacks,1);
});
test('mute blocks every channel, stale callbacks and interruption recovery cannot unmute',async()=>{
 const r=audioRuntime(),a=r.manager;a.startZenGuqin();await Promise.resolve();
 a.playWord({word:'CAT',audio_url:'/cat.mp3'});const stale=r.clips[0].onerror;
 assert.equal(a.toggleSound(),false);stale();a.unlockAudioContext();a.recover();a.play('explosion');a.playWord({word:'DOG'});
 await Promise.resolve();assert.equal(a.getStatus().bgm,false);assert.equal(a.getStatus().voiceActive,false);
 assert.equal(r.spoken.length,0);assert.equal(r.clips.length,1);
 assert.equal(a.toggleSound(),true);await Promise.resolve();assert.equal(a.getStatus().bgm,true);
});
test('suspended and closed contexts recover without duplicate drones or a delayed cleanup race',async()=>{
 const r=audioRuntime(),a=r.manager;a.startZenGuqin();await Promise.resolve();
 a.ctx.state='suspended';a.recover();await Promise.resolve();assert.equal(a.musicNodes.length,2);
 a.stopZenGuqin();a.startZenGuqin();await Promise.resolve();assert.equal(a.musicNodes.length,2);
 const old=a.ctx;old.state='closed';a.recover();await Promise.resolve();assert.notEqual(a.ctx,old);
 assert.equal(a.getStatus().bgm,true);assert.equal(a.musicNodes.length,2);
 a.silenceAll();assert.equal(a.musicNodes.length,0);assert.equal(a.getStatus().voicePending,0);
});

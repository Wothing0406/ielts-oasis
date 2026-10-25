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
test('missing Oxford audio uses the existing website TTS service before OS speech',async()=>{
 const r=audioRuntime(),a=r.manager;r.box.AbortController=AbortController;
 let requests=0;r.box.fetch=async()=>{requests++;return {ok:true,json:async()=>({audio_url:'/static/jade.mp3'})};};
 a.playWord({word:'JADE'});
 await new Promise(resolve=>setImmediate(resolve));
 assert.equal(r.clips[0].src,'https://localhost/static/jade.mp3');assert.equal(r.spoken.length,0);
 r.clips[0].onended();a.playWord({word:'JADE'});await new Promise(resolve=>setImmediate(resolve));
 assert.equal(requests,1);r.clips[0].onended();assert.equal(a.stats.voiceCompleted,2);
});

test('late media fallback gets a full fresh speech deadline',()=>{
 const r=audioRuntime(),a=r.manager;a.playWord({word:'GARDEN',audio_url:'/late.mp3'});
 const before=a.voiceJob.timer;r.clips[0].onerror();
 assert.notEqual(a.voiceJob.timer,before);assert.equal(r.timers.has(before),false);
 r.spoken[0].onend();assert.equal(a.stats.voiceCompleted,1);assert.equal(a.stats.voiceFailed,0);
});

test('semantic input, collision and shield cues are distinct',()=>{
 const r=audioRuntime(),a=r.manager;
 for(const event of ['type_correct','wrong_key','meteor_impact','shield_hit','shield_break','player_hurt'])a.play(event);
 assert.equal(a.eventCounts.wrong_key,1);assert.equal(a.eventCounts.meteor_impact,1);
 assert.equal(a.eventCounts.shield_hit,1);assert.equal(a.eventCounts.player_hurt,1);
 a.play('hurt');assert.equal(a.eventCounts.player_hurt,2);
});

test('completion voice waits for the slash and mute cancels pending pronunciation',()=>{
 const r=audioRuntime(),a=r.manager;a.playWordCompletion({word:'JADE',audio_url:'/jade.mp3'});
 assert.equal(a.getStatus().voiceActive,false);
 assert.equal(a.eventCounts.word_slash,1);assert.equal(a.eventCounts.meteor_crack,1);
 const timer=[...a.completionTimers][0];r.timers.get(timer)();assert.equal(a.getStatus().voiceActive,true);
 a.playWordCompletion({word:'TEA',audio_url:'/tea.mp3'});assert.equal(a.completionTimers.size,1);
 a.toggleSound();assert.equal(a.completionTimers.size,0);assert.equal(a.voiceJob,null);
});

test('pause holds pronunciation and resumes the same voice without restarting BGM',async()=>{
 const r=audioRuntime(),a=r.manager;a.startZenGuqin();await Promise.resolve();
 a.pauseVoice(true);a.playWord({word:'MOON',audio_url:'/moon.mp3'});
 assert.equal(a.voiceQueue.length,1);assert.equal(r.clips.length,0);
 a.pauseVoice(false);assert.equal(r.clips.length,1);const job=a.voiceJob;
 a.pauseVoice(true);a.pauseVoice(false);assert.equal(a.voiceJob,job);assert.equal(r.clips.length,1);
 assert.equal(a.musicNodes.length,2);r.clips[0].onended();assert.equal(a.stats.voiceCompleted,1);
});

test('explicit enable on a fresh or muted browser starts all channels without toggling off',async()=>{
 const r=audioRuntime(),a=r.manager;
 a.enableSound();await Promise.resolve();assert.equal(a.soundEnabled,true);assert.equal(a.zenMusicPlaying,true);
 assert.equal(a.master.gain.value,.85);assert.equal(a.sfx.gain.value,.5);assert.ok(a.stats.sfxPlayed>0);
 a.toggleSound();assert.equal(a.soundEnabled,false);
 a.enableSound();await Promise.resolve();assert.equal(a.zenMusicPlaying,true);assert.equal(a.soundEnabled,true);
});
test('20 consecutive word voices finish serially while BGM and SFX remain independent',async()=>{
 const r=audioRuntime(),a=r.manager;a.startZenGuqin();await Promise.resolve();
 assert.equal(a.zenMusicPlaying,true);
 for(let i=0;i<20;i++){a.playWord({word:'WORD'+i,audio_url:'/audio/word'+i+'.mp3'});a.play('explosion');a.play('chime');}
 assert.equal(r.clips.length,1);assert.equal(a.voiceQueue.length,19);assert.equal(r.cancelled(),0);
 for(let i=0;i<20;i++){assert.equal(r.clips[0].src,'https://localhost/audio/word'+i+'.mp3');assert.ok(r.clips[0].onended);r.clips[0].onended();}
 assert.equal(r.clips.length,1);
 assert.equal(a.getStatus().voiceCompleted,20);assert.equal(a.getStatus().voiceActive,false);
 assert.equal(a.getStatus().bgm,true);assert.equal(a.musicNodes.length,2);assert.equal(a.getStatus().sfxPlayed,40);
 assert.equal(a.sfx.gain.value,.5);assert.equal(a.bgm.gain.value,.8);
});
test('MP3 errors fall back once and stale rejection cannot interrupt the next voice',async()=>{
 const r=audioRuntime(),a=r.manager;a.playWord({word:'CAT',audio_url:'/bad.mp3'});const stale=r.clips[0].onerror;
 stale();stale();assert.equal(r.spoken.length,1);assert.equal(r.spoken[0].text,'CAT');
 a.playWord({word:'DOG',audio_url:'/dog.mp3'});r.spoken[0].onend();stale();
 assert.equal(r.spoken.length,1);assert.equal(r.clips.length,1);assert.equal(r.clips[0].src,'https://localhost/dog.mp3');r.clips[0].onended();
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

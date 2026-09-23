import { createShakeDetector } from './shake-detector.js';

export function setupShake({onShake,onRestore}){
  const toggle=document.getElementById('shake-toggle'),status=document.getElementById('shake-status');
  const restore=document.getElementById('restore-petals'),demo=document.getElementById('shake-demo');
  const detector=createShakeDetector();
  let enabled=false,pending=false,received=false,timer=null,lastDrop=-Infinity;
  const announce=message=>{status.textContent=message;};
  function drop(){
    if(document.hidden||performance.now()-lastDrop<1400)return;
    const result=onShake();
    if(result>0){lastDrop=performance.now();restore.disabled=false;announce('花瓣随风飘落 · 可继续摇晃');}
    else if(result===-1)announce('等花朵盛放后，再摇一摇');
    else announce('留一些花瓣吧，点恢复可再体验');
  }
  function motion(event){
    if(document.hidden)return;
    const valid=v=>v&&[v.x,v.y,v.z].every(Number.isFinite);
    const vector=valid(event.acceleration)?event.acceleration:event.accelerationIncludingGravity;
    if(!valid(vector))return;
    if(!received){received=true;clearTimeout(timer);announce('已开启 · 轻摇手机，花瓣会飘落');}
    if(detector.sample(vector,performance.now()))drop();
  }
  function disable(){
    enabled=false;clearTimeout(timer);detector.reset();window.removeEventListener('devicemotion',motion);
    toggle.setAttribute('aria-pressed','false');toggle.textContent='开启摇一摇';
  }
  toggle.addEventListener('click',async()=>{
    if(pending)return;
    if(enabled){disable();announce('摇晃已关闭');return;}
    if(!window.isSecureContext){announce('请打开 HTTPS 线上网址体验摇晃；也可点按落花');return;}
    if(!window.DeviceMotionEvent){announce('当前浏览器不支持摇晃，可点按落花');return;}
    pending=true;toggle.disabled=true;
    try{
      // Must run directly inside this button click for iPhone permission prompts.
      if(typeof DeviceMotionEvent.requestPermission==='function'){
        const permission=await DeviceMotionEvent.requestPermission();
        if(permission!=='granted'){announce('未获运动权限，可点按落花或在浏览器设置中允许');return;}
      }
      enabled=true;received=false;detector.reset();window.addEventListener('devicemotion',motion,{passive:true});
      toggle.textContent='关闭摇一摇';toggle.setAttribute('aria-pressed','true');announce('请轻摇手机，等待运动信号…');
      timer=setTimeout(()=>{if(!received){disable();announce('未收到运动信号，可换用 Safari / Chrome，或点按落花');}},5000);
    }catch{disable();announce('无法启用运动权限，可点按落花');}
    finally{pending=false;toggle.disabled=false;}
  });
  demo.addEventListener('click',drop);
  function restored(){restore.disabled=true;lastDrop=-Infinity;detector.reset();announce(enabled?'花瓣已恢复 · 可以继续摇晃':'花瓣已恢复');}
  restore.addEventListener('click',()=>{onRestore();restored();});
  document.addEventListener('visibilitychange',()=>detector.reset());
  window.addEventListener('pagehide',disable);
  return {restored};
}

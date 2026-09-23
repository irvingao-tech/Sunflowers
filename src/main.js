import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { addStudioLighting } from './lighting.js';
import { buildArtwork } from './artwork.js';
import { START_PROGRESS, DEFAULT_SPEED, advancePlayback, turnAngle, smoothstep as ease } from './animation.js';
import './style.css';
import { setupMusic } from './music.js';
import { createFallingPetals } from './falling-petals.js';
import { setupShake } from './shake.js';

const music=setupMusic();

const $=id=>document.getElementById(id),stage=$('stage');
const dialog=$('reference-dialog');
$('reference').onclick=()=>dialog.showModal();$('close-dialog').onclick=()=>dialog.close();
dialog.addEventListener('click',e=>{if(e.target===dialog){const r=dialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)dialog.close();}});
let renderer;
try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'});}
catch{$('loading').textContent='当前浏览器无法显示三维画面，请使用支持 WebGL 的浏览器。你仍可查看原画。';}
if(renderer)init();
function init(){
  const lowPower=matchMedia('(max-width:700px),(max-width:1000px) and (pointer:coarse)').matches;
  if(lowPower)stage.querySelector('.stage-hint').textContent='双击播放 · 拖动旋转 · 双指缩放';
  renderer.setPixelRatio(lowPower?1:Math.min(devicePixelRatio,1.75));renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1;
  stage.appendChild(renderer.domElement);renderer.domElement.setAttribute('aria-label','向日葵三维场景，拖动旋转，滚轮或双指缩放');
  const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(32,1,.1,100);
  addStudioLighting(scene,renderer,lowPower);
  const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enablePan=false;
  controls.minDistance=8;controls.maxDistance=18;controls.minPolarAngle=.4;controls.maxPolarAngle=1.8;controls.autoRotateSpeed=.7;
  let progress=1,playing=false,speed=DEFAULT_SPEED,elapsed=0,sequence=null,turnStart=0,manualRotate=false;
  function resetCamera(){camera.position.set(0,3.05,12.5);controls.target.set(0,2.85,0);controls.update();}
  resetCamera();
  const {flowers,bouquet}=buildArtwork(scene,lowPower);
  const fallingPetals=createFallingPetals(scene,flowers,lowPower);
  const shake=setupShake({
    onShake:()=>progress<.9||dialog.open?-1:fallingPetals.release(),
    onRestore:()=>fallingPetals.reset()
  });
  function restorePetals(){fallingPetals.reset();shake.restored();}
  const reducedMotion=lowPower||matchMedia('(prefers-reduced-motion: reduce)').matches;
  const phases=[['初见绿意','一点新绿，悄悄探出陶瓶。<br/>阳光下，故事才刚刚开始。','萌芽'],['向光生长','花茎向上，绿叶渐渐舒展。<br/>每一寸生长，都朝着光的方向。','生长'],['静候花开','花瓣舒展，迎向左上方的光。<br/>静候整束向日葵盛放。','含苞'],['向阳盛放','金黄、赭褐与橄榄绿交织。<br/>盛放与低垂，在同一刻相遇。','盛放']];
  function updateUI(){const n=progress<.45?1:progress<.76?2:3;$('phase-name').textContent=phases[n][0];$('phase-description').innerHTML=phases[n][1];$('phase-number').textContent=`0${n+1}`;$('progress-label').textContent=sequence?.turn>0?`盛放 · 旋转 ${Math.round(sequence.turn*360)}°`:`${Math.round(progress*100)}% · ${phases[n][2]}`;$('progress').value=progress*100;}
  function setPlaying(value){playing=value;$('play').textContent=playing?'Ⅱ':'▶';$('play').setAttribute('aria-label',playing?'暂停生长动画':'播放生长动画');}
  function stopAutoRotate(){manualRotate=false;$('rotate').setAttribute('aria-pressed','false');}
  function cancelSequence(){if(sequence)bouquet.rotation.y=turnStart;sequence=null;}
  function startPlayback(){
    if(!sequence){
      if(progress>=1)progress=START_PROGRESS;
      restorePetals();
      sequence={progress,turn:0,done:false};turnStart=bouquet.rotation.y;
    }
    stopAutoRotate();controls.enableDamping=false;controls.update();controls.enableDamping=true;
    setPlaying(true);updateUI();
  }
  $('play').onclick=()=>{
    if(playing){setPlaying(false);return;}
    startPlayback();
  };
  function seek(value){restorePetals();cancelSequence();progress=Math.max(START_PROGRESS,Math.min(1,value));setPlaying(false);stopAutoRotate();updateUI();}
  $('progress').oninput=e=>seek(Number(e.target.value)/100);
  document.querySelectorAll('[data-progress]').forEach(button=>button.onclick=()=>seek(Number(button.dataset.progress)/100));
  $('speed').onclick=()=>{speed=speed===1?2:speed===2?.5:1;$('speed').textContent=`${speed}×`;};
  $('rotate').onclick=()=>{setPlaying(false);sequence=null;manualRotate=!manualRotate;$('rotate').setAttribute('aria-pressed',String(manualRotate));updateUI();};
  $('reset').onclick=()=>{restorePetals();setPlaying(false);sequence=null;bouquet.rotation.y=0;stopAutoRotate();resetCamera();updateUI();};
  controls.addEventListener('start',()=>{setPlaying(false);stopAutoRotate();});
  let tapStart=null,lastTap=0;
  function activateArtwork(){void music.play();if(!playing)startPlayback();}
  renderer.domElement.addEventListener('pointerdown',event=>{if(event.isPrimary)tapStart={x:event.clientX,y:event.clientY};});
  renderer.domElement.addEventListener('pointermove',event=>{if(tapStart&&Math.hypot(event.clientX-tapStart.x,event.clientY-tapStart.y)>8)tapStart=null;});
  renderer.domElement.addEventListener('pointercancel',()=>{tapStart=null;});
  renderer.domElement.addEventListener('pointerup',event=>{
    if(!lowPower||!event.isPrimary||!tapStart)return;
    tapStart=null;const now=performance.now();
    if(now-lastTap<350){lastTap=0;activateArtwork();}else lastTap=now;
  });
  renderer.domElement.addEventListener('click',event=>{
    if(lowPower){event.stopPropagation();return;}
    if(!tapStart)return;tapStart=null;activateArtwork();
  });
  function resize(){const w=stage.clientWidth,h=stage.clientHeight;renderer.setSize(w,h);camera.aspect=w/h;camera.fov=Math.max(32,THREE.MathUtils.radToDeg(2*Math.atan(3.35/(12.5*camera.aspect))));camera.updateProjectionMatrix();}
  new ResizeObserver(resize).observe(stage);resize();$('loading').remove();updateUI();
  let last=0,previousFrame=0;
  renderer.setAnimationLoop(time=>{
    if(lowPower&&time-previousFrame<1000/30)return;previousFrame=time;
    const dt=Math.min((time-last)/1000,.25);last=time;if(document.hidden)return;elapsed+=dt;
    if(playing&&sequence){
      sequence=advancePlayback(sequence,dt,speed);progress=sequence.progress;
      bouquet.rotation.y=turnStart+turnAngle(sequence.turn);
      if(sequence.done){bouquet.rotation.y=turnStart;sequence=null;setPlaying(false);}
      updateUI();
    }else if(manualRotate){bouquet.rotation.y=(bouquet.rotation.y+dt*.25)%(Math.PI*2);}
    flowers.forEach((f,i)=>{
      const p=Math.max(0,progress-f.delay*(1-progress));
      const growth=.055+.945*ease(0,.49,p);f.root.scale.set(.4+growth*.6,growth,.4+growth*.6);
      f.head.scale.setScalar(.18+.82*ease(.2,.64,p));
      const bloom=ease(.45,.98,p);f.disk.scale.setScalar(.18+.82*bloom);f.disk.visible=p>.36&&!f.hideDisk;
      f.bud.scale.setScalar(Math.max(.001,1-bloom));f.bud.visible=bloom<.98;
      f.petals.forEach(({hinge,offset,curl})=>{const opened=ease(.43+offset,.96+offset*.2,p);hinge.rotation.x=1.47*(1-opened)+curl*opened;hinge.scale.setScalar(.2+.8*ease(.3,.79,p));});
      f.leaves.forEach((leaf,k)=>leaf.scale.setScalar(ease(.04+k*.07,.4+k*.04,p)));
      f.root.rotation.z=reducedMotion?0:Math.sin(elapsed*.7+i*1.4)*.004*growth;
    });
    fallingPetals.update(dt);
    controls.update();renderer.render(scene,camera);
  });
  renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();setPlaying(false);const warning=document.createElement('p');warning.id='loading';warning.textContent='三维画面已暂停，请刷新页面重新加载。';stage.appendChild(warning);});
}

import musicUrl from '../music/vincent .m4a?url';

export function setupMusic(){
  const button=document.getElementById('music-toggle');
  const audio=document.createElement('audio');
  audio.src=musicUrl;audio.loop=true;audio.preload='metadata';audio.volume=.35;
  audio.setAttribute('aria-hidden','true');document.body.appendChild(audio);
  let pending=false;
  function update(){
    const active=!audio.paused;
    button.setAttribute('aria-pressed',String(active));
    button.setAttribute('aria-label',active?'暂停背景音乐':'播放背景音乐');
    button.title=active?'暂停背景音乐 · Vincent':'播放背景音乐 · Vincent';
    button.textContent=active?'♫ 音乐开':'♫ 音乐关';
  }
  function removeAutoStart(){
    document.removeEventListener('pointerdown',firstGesture);
    document.removeEventListener('keydown',firstKey);
  }
  async function start(){
    removeAutoStart();if(pending)return;pending=true;
    try{await audio.play();}
    catch(error){
      update();
      if(error.name!=='NotAllowedError'&&error.name!=='AbortError'){
        button.title='音乐暂时无法播放，点击重试';button.textContent='♫ 重试音乐';
      }
    }finally{pending=false;}
  }
  function firstGesture(event){if(!button.contains(event.target))void start();}
  function firstKey(event){if((event.key==='Enter'||event.key===' ')&&!button.contains(event.target))void start();}
  button.addEventListener('click',()=>{removeAutoStart();if(audio.paused)void start();else audio.pause();});
  audio.addEventListener('playing',update);audio.addEventListener('pause',update);
  audio.addEventListener('error',()=>{update();button.title='音乐暂时无法播放，点击重试';button.textContent='♫ 重试音乐';});
  document.addEventListener('pointerdown',firstGesture);
  document.addEventListener('keydown',firstKey);
  update();
}

import musicUrl from '../music/vincent .m4a?url';

export function setupMusic(){
  const button=document.getElementById('music-toggle');
  const audio=document.createElement('audio');
  // Do not make a phone download and decode a 3.8 MB audio file while WebGL is starting.
  // The source is attached on the first explicit playback gesture instead.
  audio.loop=true;audio.autoplay=false;audio.playsInline=true;audio.preload='none';audio.volume=.35;
  audio.setAttribute('aria-hidden','true');document.body.appendChild(audio);
  let pending=false,userPaused=false;
  function update(){
    const active=!audio.paused;
    button.setAttribute('aria-pressed',String(active));
    button.setAttribute('aria-label',active?'暂停背景音乐':'播放背景音乐');
    button.title=active?'暂停背景音乐 · Vincent':'播放背景音乐 · Vincent';
    button.textContent=active?'♫ 音乐开':'♫ 音乐关';
  }
  function removeAutoStart(){
    document.removeEventListener('click',firstGesture);
    document.removeEventListener('keydown',firstKey);
  }
  async function start(){
    if(userPaused||pending||!audio.paused)return;pending=true;
    try{
      if(!audio.src){audio.src=musicUrl;audio.load();}
      await audio.play();removeAutoStart();
    }
    catch(error){
      update();
      if(error.name!=='NotAllowedError'&&error.name!=='AbortError'){
        button.title='音乐暂时无法播放，点击重试';button.textContent='♫ 重试音乐';
      }
    }finally{pending=false;}
  }
  function firstGesture(event){if(!button.contains(event.target))void start();}
  function firstKey(event){if((event.key==='Enter'||event.key===' ')&&!button.contains(event.target))void start();}
  button.addEventListener('click',event=>{event.stopPropagation();if(audio.paused){userPaused=false;void start();}else{userPaused=true;removeAutoStart();audio.pause();}});
  audio.addEventListener('playing',update);audio.addEventListener('pause',update);
  audio.addEventListener('error',()=>{update();button.title='音乐暂时无法播放，点击重试';button.textContent='♫ 重试音乐';});
  document.addEventListener('click',firstGesture);
  document.addEventListener('keydown',firstKey);
  update();
  return {play:start};
}

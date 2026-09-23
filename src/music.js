import musicUrl from '../music/vincent .m4a?url';

export function setupMusic(){
  const button=document.getElementById('music-toggle');
  const audio=document.createElement('audio');
  audio.src=musicUrl;audio.loop=true;audio.preload='none';audio.volume=.35;audio.playsInline=true;
  audio.setAttribute('aria-hidden','true');document.body.appendChild(audio);
  let pending=false;
  function update(){
    const active=!audio.paused;
    button.setAttribute('aria-pressed',String(active));
    button.setAttribute('aria-label',active?'暂停背景音乐':'播放背景音乐');
    button.title=active?'暂停背景音乐 · Vincent':'播放背景音乐 · Vincent';
    button.textContent=active?'♫ 暂停音乐':'♫ 播放音乐';
  }
  async function start(){
    if(pending)return;pending=true;button.textContent='♫ 加载中…';
    try{await audio.play();}
    catch(error){
      update();
      if(error.name!=='AbortError')button.title='音乐暂时无法播放，请点击重试';
    }finally{pending=false;}
  }
  button.addEventListener('click',()=>{if(audio.paused)void start();else audio.pause();});
  audio.addEventListener('playing',update);audio.addEventListener('pause',update);
  audio.addEventListener('error',()=>{update();button.title='音乐暂时无法播放，请点击重试';button.textContent='♫ 重试音乐';});
  if('mediaSession'in navigator&&'MediaMetadata'in window)navigator.mediaSession.metadata=new MediaMetadata({title:'Vincent',album:'Sunflowers'});
  update();
}

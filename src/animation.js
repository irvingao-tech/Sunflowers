export const DURATION = 10;
export const START_PROGRESS = .35;
export const DEFAULT_SPEED = 2;
export const TURN_DURATION = 6;
export function smoothstep(a,b,value) { const t=Math.max(0,Math.min(1,(value-a)/(b-a)));return t*t*(3-2*t); }
export function advanceProgress(progress, seconds, speed) { return Math.min(1,Math.max(START_PROGRESS,progress)+seconds*speed/DURATION); }
export function turnAngle(turn) { return smoothstep(0,1,turn)*Math.PI*2; }
export function advancePlayback(state,seconds,speed) {
  let remaining=Math.max(0,seconds)*speed;
  let progress=Math.max(START_PROGRESS,state.progress),turn=state.turn;
  const growthTime=(1-progress)*DURATION;
  if(remaining<growthTime){progress+=remaining/DURATION;remaining=0;}
  else {progress=1;remaining-=growthTime;}
  if(progress===1)turn=Math.min(1,turn+remaining/TURN_DURATION);
  return {progress,turn,done:turn===1};
}

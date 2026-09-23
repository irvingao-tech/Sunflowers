export const DURATION = 10;
export const BLOOM_START = .45;
export function smoothstep(a,b,value) { const t=Math.max(0,Math.min(1,(value-a)/(b-a)));return t*t*(3-2*t); }
export function advanceProgress(progress, seconds, speed) { return Math.min(1,progress+seconds*speed/DURATION); }
export function orbitAngle(progress) { return smoothstep(BLOOM_START,1,progress)*Math.PI*2; }
export function orbitPosition(radius,height,startAngle,angle,target) {
  return {x:target.x+Math.sin(startAngle+angle)*radius,y:height,z:target.z+Math.cos(startAngle+angle)*radius};
}

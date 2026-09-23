// High-pass acceleration over time removes gravity without depending on sensor FPS.
export function createShakeDetector(){
  let previous=null,baseline=null,impulse=null,lastTrigger=-Infinity;
  return {
    reset(){previous=null;baseline=null;impulse=null;lastTrigger=-Infinity;},
    sample(vector,time){
      if(!vector||![vector.x,vector.y,vector.z,time].every(Number.isFinite))return false;
      const current={x:vector.x,y:vector.y,z:vector.z,time};
      const before=previous;previous=current;
      if(!before||time-before.time>500||time<=before.time){baseline={...vector};impulse=null;return false;}
      const alpha=Math.exp(-(time-before.time)/350);
      for(const axis of ['x','y','z'])baseline[axis]=alpha*baseline[axis]+(1-alpha)*vector[axis];
      if(time-lastTrigger<1400)return false;
      const delta={x:current.x-baseline.x,y:current.y-baseline.y,z:current.z-baseline.z};
      const magnitude=Math.hypot(delta.x,delta.y,delta.z);
      if(magnitude<10)return false;
      if(impulse){
        const gap=time-impulse.time;
        const direction=(delta.x*impulse.x+delta.y*impulse.y+delta.z*impulse.z)/(magnitude*impulse.magnitude);
        if(gap>=60&&gap<=650&&direction<-.25){lastTrigger=time;impulse=null;return true;}
        if(gap<60)return false;
      }
      impulse={...delta,magnitude,time};return false;
    }
  };
}

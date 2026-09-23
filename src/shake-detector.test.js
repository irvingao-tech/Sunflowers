import test from 'node:test';
import assert from 'node:assert/strict';
import { createShakeDetector } from './shake-detector.js';
const v=x=>({x,y:0,z:9.8});
test('gravity, gentle movement and invalid readings do not trigger',()=>{
  const d=createShakeDetector();
  for(let t=0;t<2000;t+=20)assert.equal(d.sample(v(Math.sin(t/500)),t),false);
  assert.equal(d.sample({x:null,y:null,z:null},2100),false);
  assert.equal(d.sample({x:NaN,y:0,z:0},2200),false);
});
test('opposite shake impulses trigger once and respect cooldown',()=>{
  const d=createShakeDetector();d.sample(v(0),0);
  assert.equal(d.sample(v(18),100),false);
  assert.equal(d.sample(v(-18),200),true);
  assert.equal(d.sample(v(18),300),false);
  assert.equal(d.sample(v(-18),400),false);
  d.sample(v(0),1500);d.sample(v(18),1600);
  assert.equal(d.sample(v(-18),1700),true);
});
test('slow tilt, a lone bump and stale data do not combine into a shake',()=>{
  const d=createShakeDetector();d.sample(v(0),0);d.sample(v(18),100);
  assert.equal(d.sample(v(-18),900),false);
  d.reset();assert.equal(d.sample(v(-20),1000),false);
  assert.equal(d.sample(v(0),1010),false);
});
test('smooth repeated shakes trigger across common sensor frame rates',()=>{
  for(const fps of [30,60,100]){
    const d=createShakeDetector();let triggered=0;
    for(let t=0;t<900;t+=1000/fps)if(d.sample(v(18*Math.sin(t/1000*Math.PI*8)),t))triggered++;
    assert.equal(triggered,1,`${fps} Hz`);
  }
});

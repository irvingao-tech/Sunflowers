import test from 'node:test';
import assert from 'node:assert/strict';
import { advanceProgress, orbitAngle, orbitPosition } from './animation.js';

test('playback completes in 10 seconds at 1x and 5 seconds at 2x',()=>{
  assert.equal(advanceProgress(0,5,1),.5);
  assert.equal(advanceProgress(0,10,1),1);
  assert.equal(advanceProgress(0,5,2),1);
  assert.equal(advanceProgress(.9,10,1),1);
});
test('orbit stays still during growth and completes exactly one turn during bloom',()=>{
  assert.equal(orbitAngle(0),0);
  assert.equal(orbitAngle(.45),0);
  assert.ok(Math.abs(orbitAngle(.725)-Math.PI)<1e-12);
  assert.equal(orbitAngle(1),2*Math.PI);
});
test('horizontal orbit preserves elevation and radius, returning to the starting view',()=>{
  const target={x:1,y:2,z:-1},r=12.5,height=3.05,start=.6;
  const first=orbitPosition(r,height,start,0,target);
  for(let i=0;i<=100;i++){
    const p=orbitPosition(r,height,start,orbitAngle(i/100),target);
    assert.equal(p.y,height);
    assert.ok(Math.abs(Math.hypot(p.x-target.x,p.z-target.z)-r)<1e-10);
  }
  const last=orbitPosition(r,height,start,orbitAngle(1),target);
  assert.ok(Math.hypot(last.x-first.x,last.z-first.z)<1e-10);
});

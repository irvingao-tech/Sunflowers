import test from 'node:test';
import assert from 'node:assert/strict';
import {START_PROGRESS,DEFAULT_SPEED,advancePlayback,turnAngle} from './animation.js';
const initial=()=>({progress:START_PROGRESS,turn:0,done:false});
test('growth begins at 02 and completes before rotation starts',()=>{
  assert.equal(DEFAULT_SPEED,2);
  const halfway=advancePlayback(initial(),1,2);
  assert.equal(halfway.progress,.55);assert.equal(halfway.turn,0);
  const bloomed=advancePlayback(initial(),3.25,2);
  assert.equal(bloomed.progress,1);assert.equal(bloomed.turn,0);assert.equal(bloomed.done,false);
});
test('full bloom holds during one full turn, then stops at the original orientation',()=>{
  const halfway=advancePlayback(initial(),4.75,2);
  assert.equal(halfway.progress,1);assert.equal(halfway.turn,.5);
  assert.ok(Math.abs(turnAngle(halfway.turn)-Math.PI)<1e-12);
  const done=advancePlayback(initial(),6.25,2);
  assert.equal(done.done,true);assert.equal(done.turn,1);
  assert.equal(turnAngle(done.turn),2*Math.PI);
  assert.deepEqual(advancePlayback(done,100,2),done);
});
test('frame boundaries, pauses and speed changes preserve sequential playback',()=>{
  let split=advancePlayback(initial(),3,2);
  const paused=advancePlayback(split,0,2);assert.deepEqual(paused,split);
  split=advancePlayback(split,.25,2);
  split=advancePlayback(split,6,1);
  assert.deepEqual(split,advancePlayback(initial(),6.25,2));
});

'use strict';

function setup(){
  createCanvas(400, 400);
  noLoop();
}

function draw(){
  background(220);
  strokeWeight(1.0);
  stroke(0);
  line(100, 100, 200, 200);
  translate(200, 200);
  let v = createVector(200 - 100, 200 - 100);
  rotate(v.heading());
  line(0, 0, -15, 7);
}



// allにキー入力の状況が送られるようにするとかそんな感じかなぁ。
// キー押しっぱなしとかはOKみたいだし。

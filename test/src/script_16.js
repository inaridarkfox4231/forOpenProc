'use strict';

function setup(){
  createCanvas(400, 400);
  colorMode(HSB, 100);
}

function draw(){
  background(80, 100, 100);
  fill(0, 100, 100);
  noStroke();
  ellipse(100, 100, 100, 100);
  push();
  strokeWeight(1.0);
  stroke(0);
  line(100, 100, 200, 200);
  translate(200, 200);
  let v = createVector(200 - 100, 200 - 100);
  rotate(v.heading());
  line(0, 0, -15, 7);
  pop();
  fill(0, 0, 0, 40);
  rect(70, 70, 300, 300); // これをかぶせればいいんかな
}



// allにキー入力の状況が送られるようにするとかそんな感じかなぁ。
// キー押しっぱなしとかはOKみたいだし。

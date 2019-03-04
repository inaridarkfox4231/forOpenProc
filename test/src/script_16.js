'use strict';
let c;

function setup(){
  createCanvas(200, 200);
  c = color(255, 0, 0);
}

function draw(){
  background(c);
  if(keyIsDown(65)){ c = color(0, 0, 255); }
  else{ c = color(255, 0, 0); }
}



// allにキー入力の状況が送られるようにするとかそんな感じかなぁ。
// キー押しっぱなしとかはOKみたいだし。

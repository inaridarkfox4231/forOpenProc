'use strict';
// フェードインとフェードアウト
let bgColor;
let alphaControl = 125;

function setup(){
  createCanvas(200, 200);
  bgColor = color(255);
}

function draw(){
  background(220); // 青が完全に消えると灰色が現れる
  fill('red');
  noStroke();
  rect(100, 100, 20, 20)
  alphaControl = 125 + 125 * sin(frameCount / 30);
  bgColor.setAlpha(alphaControl);
  background(bgColor); // 白で隠して、白で表示して。こんなことできるんだ。すげー。
  stroke(0);
  noFill();
  ellipse(100, 100, 20, 20);
}

// だからたとえば白でおおいかくしてその間にさしかえて～とかできるよ

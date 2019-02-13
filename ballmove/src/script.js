'use strict';
// 十字キーでボール動かす感じ
let x, y;
let bg;

function setup(){
  createCanvas(200, 200);
  bg = createGraphics(200, 200);
  bg.line(100, 50, 100, 150);
  bg.line(50, 100, 150, 100);
  bg.ellipse(100, 100, 10, 10);
  bg.ellipse(100, 50, 10, 10);
  bg.ellipse(100, 150, 10, 10);
  bg.ellipse(50, 100, 10, 10);
  bg.ellipse(150, 100, 10, 10);
  x = 50;
  y = 100;
  noStroke();
  fill(0, 0, 255);
}

function draw(){
  image(bg, 0, 0);
  ellipse(x, y, 15, 15);
}

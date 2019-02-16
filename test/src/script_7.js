// くるくる回るやつ
'use strict';
let t = 10;
let x;

let px;
let py;
let vy;

function setup(){
  createCanvas(400, 400);
  rectMode(CENTER);
  px = 0;
  py = 0;
  vy = -2;
}
/*
function draw(){
  // くるくるまわる
  background(220);
  translate(200, 200);
  t++;
  x = 430 / (2 * t);
  if(Math.floor(x) % 2 === 1){ fill('gray'); }else{ fill('blue'); } // 灰色から青に変わる
  applyMatrix(sin(PI * x), 0, 0, 1, 0, 0);
  rect(0, 0, 40, 40);
  if(t >= 430){ noLoop(); }
}*/
function draw(){
  // はがれて落ちる
  background(220);
  translate(200, 200);
  vy += 0.1;
  px += 1;
  py += vy;
  rect(px, py, 20, 20);
  if(py > 220){ noLoop(); }
}

// たとえば2つグラフィックを用意しておいて
// こっちに変えてくださいってなったらこれ使う感じ（？）

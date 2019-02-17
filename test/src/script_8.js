// くるくる回る（用意した画像）
'use strict';
let t = 10;

let grs = [];

function setup(){
  createCanvas(400, 400);
  let img1 = createGraphics(40, 40);
  img1.fill(0, 0, 244);
  img1.noStroke();
  img1.triangle(20, 20, 0, 40, 40, 40);
  grs.push(img1);
  let img2 = createGraphics(40, 40);
  img2.fill(244, 0, 0);
  img2.noStroke();
  img2.quad(10, 0, 20, 10, 10, 20, 0, 10);
  grs.push(img2);
}

function draw(){
  // くるくるまわる
  background(220);
  translate(200, 200);
  t++;
  let x = 270 / (2 * t);
  applyMatrix(sin(PI * x), 0, 0, 1, 0, 0);
  if(Math.floor(x) % 2 === 1){ image(grs[0], -20, -20); }else{ image(grs[1], -20, -20); } // img1→img2と変化
  if(t >= 54){ noLoop(); }
}

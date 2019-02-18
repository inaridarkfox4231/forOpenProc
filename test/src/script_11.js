// スパイラル
'use strict';

function setup(){
  createCanvas(400, 400);
  noLoop();
}

function draw(){
  background(220);
  drawGraph();
}

function drawGraph(){
  let points = [];
  let q = 18; // 距離を15くらいで割って整数取ると良さそう
  for(let cnt = 0; cnt < 300; cnt++){
    let t = cnt / 300
    points.push(createVector(t * 300 + 20 * (cos(q * PI * t) - 1) + 50, 100 + 20 * sin(q * PI * t)));
  }
  beginShape();
  noFill();
  for(let p of points){
    curveVertex(p.x, p.y);
  }
  endShape();
}

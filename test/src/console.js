'use strict';

function setup(){
  createCanvas(200, 200);
  noLoop();
}

function draw(){
  console.log(map(23, 0, 100, 0, 50)); // 0----23---------100 → 0----??------50 の??を返す。そんだけ。11.5です。
  console.log(map(23, 0, 100, 50, 0)); // 逆にすると38.5ですね。同じ。そういうことです。
  // 0を50に、100を0に。同じ割合で、じゃあ23はどこに？
}

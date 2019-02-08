'use strict';
// mapの実験
// 矢印の実験
// circleFlowの実験

let b, v1, v2, v3;

function setup(){
  createCanvas(400, 400);
  b = createVector(300, 100);
  v1 = createVector(50, 50);
  v2 = createVector(0, -40);
  v3 = createVector(-40, -50);
  noLoop();
}

function draw(){
  background(230);
  console.log(map(23, 0, 100, 0, 50)); // 0----23---------100 → 0----??------50 の??を返す。そんだけ。11.5です。
  console.log(map(23, 0, 100, 50, 0)); // 逆にすると38.5ですね。同じ。そういうことです。
  // 0を50に、100を0に。同じ割合で、じゃあ23はどこに？
  drawArrow(b, v1, 'red');
  drawArrow(b, v2, 'blue');
  drawArrow(b, v3);
  ellipse(100, 100, 10, 10);
  ellipse(100, 200, 10, 10);
  let from = createVector(100, 100);
  let to = createVector(100, 200);
  drawFlow(from, to, 5, 'green'); // 10は直径なので半分にしないといけないのです
  ellipse(120, 180, 10, 10);
  ellipse(70, 240, 10, 10);
  drawFlow_co(120, 180, 70, 240, 5, 'red'); // テスト成功。次。
  ellipse(200, 350, 5, 5);
  ellipse(100, 250, 10, 10);
  ellipse(300, 250, 10, 10);
}
function drawArrow(base, vec, myColor = 'black'){
  push();
  stroke(myColor); // 色付き矢印
  strokeWeight(1.5);
  fill(myColor);
  translate(base.x, base.y); // ちなみにbaseは矢印の根本です
  line(0, 0, vec.x, vec.y); // vecは矢印のベクトルです
  rotate(vec.heading()); // これによりvecがx軸画面で右方向になるように回転しますね
  let arrowSize = 7; // 矢印の大きさ（底辺から頂点までの距離）
  translate(vec.mag() - arrowSize, 0); // 矢印の根元に原点を持ってくる
  triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
  pop();
}
function drawFlow(from, to, diff, myColor = 'black'){
  // fromは始点、toは終点、diffは位置を示すサークルの半径
  push();
  stroke(myColor); // 色付き矢印
  strokeWeight(1.5);
  fill(myColor);
  translate(from.x, from.y); // fromの根元にもってくる
  let directionVector = p5.Vector.sub(to, from); // 方向ベクトル
  let d = directionVector.mag();
  rotate(directionVector.heading()); // 回転でfrom→toがx軸右方向になるようにする
  line(diff, 0, d - diff, 0);
  let arrowSize = 7; // 矢印の大きさ（底辺から頂点までの距離）
  translate(d - diff - arrowSize, 0); // 矢印の根元に原点を持ってくる
  triangle(0, arrowSize / 2, 0, -arrowSize / 2, arrowSize, 0);
  pop();
}

// 座標ベース
function drawFlow_co(x1, y1, x2, y2, diff, myColor = 'black'){
  let from = createVector(x1, y1);
  let to = createVector(x2, y2);
  drawFlow(from, to, diff, myColor);
}

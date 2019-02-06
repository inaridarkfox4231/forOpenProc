// 項目をタッチして選ぶやつのテスト
// ボタンの枠を消してみたりとかしたい
// ・・んだけど、その前にparentで実験
let cnv;

function setup(){
  cnv = createCanvas(400, 400);
  cnv.parent("myCanvas"); // parentにidを入れるとこれで入るんだよ～
  noLoop();
}

function draw(){
  let points = [];
  for(let i = 0; i < 400; i++){
    points.push(createVector(i, 200 + 100 * sin(i * PI / 40)));
  }
  strokeWeight(1.0);
  beginShape();
  points.forEach(function(point){
    curveVertex(point.x, point.y);
  })
  endShape();
}

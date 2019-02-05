// classに連番を付ける。
// 思っていたより簡単でしたね・・・・
let circles = [];

function setup(){
  createCanvas(200, 200);
  addCircle(20, 20, 20);
  addCircle(100, 100, 20);
  addCircle(20, 100, 40);
  addCircle(100, 100, 60);
  addCircle(140, 130, 70);
}

function draw(){
  background(220);
  drawCircles();
  noLoop();
}

function drawCircles(){
  circles.forEach(function(c){
    c.draw();
    console.log(c.index);
  })
}

function addCircle(x, y, r){
  circles.push(new circle(x, y, r));
}

class circle{
  constructor(x, y, r){
    this.x = x;
    this.y = y;
    this.r = r;
    this.index = circle.index++;
  }
  draw(){
    ellipse(this.x, this.y, this.r, this.r);
  }
}

circle.index = 0; // クラス変数を0で初期化して、あとはconstructorで1ずつ増やしていくだけ。簡単なんだ。うーん。。
// 何かワナがありそうだけど・・

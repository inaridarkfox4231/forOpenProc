// エラトステネスのふるいを可視化したい
'use strict';
let tileGraphics = [];

function setup(){
  createCanvas(400, 400);
  loadTileGraphics();
}

function draw(){
  background(220);
}

function loadTileGraphics(){
  let aroundColors = [color(195), color(244, 125, 132), color(148, 154, 226)];
  let bodyColors = [color(127), color(237, 28, 36), color(63, 72, 204)];
  for(let i = 0; i < 3; i++){
    let img = createGraphics(20, 20);
    img.background(aroundColors[i]);
    img.noStroke();
    img.fill(bodyColors[i]);
    img.rect(1, 1, 18, 18);
    img.stroke(255);
    img.line(17, 2, 17, 2);
    img.line(17, 4, 17, 10);
    tileGraphics.push(img);
  }
}

class tile{
  constructor(n){
    // nは1～400で、それに相当するタイルを・・
    this.x = (n % 20) * 20;
    this.y = Math.floor(n / 20);
    this.grId = 0; // はいいろ
    this.state = spin; // スピンしながら登場
    this.myCounter = new counter(); // 動画用
  }
  update(){

  }
  draw(){
    image(tileGraphics[this.grId], this.x, this.y); // 常にこれ実行する感じ
  }
}

class spinFlow{
  constructor(){
    
  }
  action(cnt, grId){

  }
}

class fallFlow{

}

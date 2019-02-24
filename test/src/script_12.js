'use strict';
let s;

class colorSquare{
  constructor(){
    this.myColor = color(0, 100, 100);
    this.pos = createVector(0, 0);
  }
  update(){
    this.pos.set(mouseX, mouseY);
  }
  draw(){
    translate(this.pos.x, this.pos.y);
    noStroke();
    fill(this.myColor);
    rect(-10, -10, 20, 20);
  }
}

function setup(){
  createCanvas(200, 200);
  colorMode(HSB);
  s = new colorSquare();
}

function draw(){
  background(0, 20, 100);
  s.update();
  s.draw();
}

function keyTyped(){
  if(key === 'a'){
    let a = saturation(s.myColor);
    s.myColor = color(0, a - 1, 100);
  }
  if(key === 'b'){
    let b = hue(s.myColor);
    s.myColor = color(b + 1, 100, 100);
  }
}
// colorをactorでいじればいろいろ面白いことができるようになるはず。

'use strict';
let artan = 0;

function setup(){
  createCanvas(200, 200);
  noLoop();
}

function draw(){
  background(220); // 青が完全に消えると灰色が現れる
  if(frameCount % 30 === 0){


  }
}

function keyTyped(){
  if(key === 'a'){ console.log(atan((mouseY - 100) / (mouseX - 100))); }
  if(key === 'b'){ console.log(atan2((mouseY - 100), (mouseX - 100))); }
}

// だからたとえば白でおおいかくしてその間にさしかえて～とかできるよ

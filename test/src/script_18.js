'use strict';
let index;
let indexMax = 5;

function setup(){
  createCanvas(600, 600);
  index = 0;
  //noLoop();
}

function mouseClicked(){
  if(mouseX < 180 || mouseX > 420){ return; }
  if(mouseY < 220 || mouseY > 300){ return; }
  if(mouseY < 240){ index += 1; if(index === indexMax){ index = 0; } }
  if(mouseY > 280){ index -= 1; if(index < 0){ index = indexMax - 1; } }
}

function draw(){
  background(60);
  fill(255);
  textSize(40);
  text("PAUSE", 240, 120);
  textSize(20);
  text("CURRENT PATTERN:" + " " + index.toString(), 180, 180);
  text('NEXT PATTERN (CLICK)', 180, 240);
  text('PREVIOUS PATTERN (CLICK)', 180, 300);
}

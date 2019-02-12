// animation.
'use strict';

let anim = [];

function preload(){
  anim.push(loadImage('./assets/right_1.png'));
  anim.push(loadImage('./assets/right_2.png'));
}

function setup(){ createCanvas(200, 200); }

function draw(){
  background(230);
  image(anim[Math.floor((frameCount % 60) / 30)], 100, 100);
}

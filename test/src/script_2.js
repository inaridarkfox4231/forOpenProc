// SandyBackgroundのテスト
'use strict';
//const IDEAL_FRAME_RATE = 60;
//let currentBackground;
let sandyBG;
let black, gray;

function setup(){
  createCanvas(100, 100);
  //textFont(loadFont("Georgia", 14, true));
  //frameRate(60);
  //colorMode(HSB, 360, 100, 100, 100);
  //background(0, 0, 100);
  //currentBackground = new SandyBackground();
  sandyBG = createGraphics(100, 100);
  black = color(0, 0, 15);
  gray = color(0, 0, 70);
  setSandyBG();
  noLoop();
}

function draw(){
  //currentBackground.display();
  //drawSandy();
  image(sandyBG, 0, 0);
  //background(190, 190, 230);
}

function setSandyBG(){
  sandyBG.loadPixels();
  for(let x = 0; x < 200; x++){
    for(let y = 0; y < 200; y++){
      sandyBG.pixels[x + y * 200] = Math.floor(random(235, 255));
    }
  }
  sandyBG.updatePixels();
}

/*
class AbstractBackground{
  AbstractBackground(){}
  display(){}
}

class SandyBackground extends AbstractBackground{
  constructor(hueParameter = 0, saturationParameter = 0, minBrightness = 95, maxBrightness = 100, xSize = width, ySize = height){
    super();
    this.graphics = createGraphics(xSize, ySize);
    //this.graphics.beginDraw();
    this.graphics.loadPixels();
    for(let x = 0; x < xSize; x++){
      for(let y = 0; y < ySize; y++){
        this.graphics.pixels[x + y * ySize] = color(hueParameter, saturationParameter, random(minBrightness, maxBrightness));
        //this.graphics.pixels[x + y * ySize] = color(0, 0, 0);
        //console.log(this.graphics.pixels[x + y * ySize]);
      }
    }
    this.graphics.updatePixels();
    console.log(this.graphics);
    //this.graphics.endDraw();
  }
  display(){
    image(this.graphics, 0, 0);
  }
}*/

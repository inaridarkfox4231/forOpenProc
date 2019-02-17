'use strict';
// color Slider.
let colorSlider;

function setup(){
  createCanvas(500, 500);
  colorMode(HSB, 100);
  colorSlider = new mySlider();
  colorSlider.initialize();

}

function draw(){
  image(colorSlider.base, 0, 0);
  colorSlider.update();
  colorSlider.display();
  let c = colorSlider.getColor();
  fill(c);
  rect(100, 50, 300, 300);
}

class mySlider{
  constructor(){
    this.x = 0;
    this.y = 0;
    this.base = createGraphics(500, 500);
  }
  initialize(){
    this.base.background(220);
    this.base.strokeWeight(1.0);
    this.base.line(50, 50, 50, 350);
    this.base.line(100, 400, 400, 400);
    this.base.ellipse(50, 50, 10, 10);
    this.base.ellipse(50, 350, 10, 10);
    this.base.ellipse(100, 400, 10, 10);
    this.base.ellipse(400, 400, 10, 10);
  }
  update(){
    this.x = constrain(mouseX - 100, 0, 300);
    this.y = constrain(mouseY - 50, 0, 300);
  }
  getColor(){ return color(Math.floor(this.x / 3), Math.floor(this.y / 3), 100); }
  display(){
    push();
    fill(0);
    rect(100 + this.x - 5, 400 - 10, 10, 20);
    rect(50 - 10, 50 + this.y - 5, 20, 10);
    textSize(20);
    text("H:" + Math.floor(this.x / 3), 100, 460);
    text("S:" + Math.floor(this.y / 3), 200, 460);
    pop();
  }
}

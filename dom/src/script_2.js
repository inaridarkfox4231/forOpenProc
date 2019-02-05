// スライダー！
'use strict';

var slider;
var myCanvas;
function setup() {
  myCanvas = createCanvas(400, 400);
  console.log(myCanvas);
  slider = createSlider(0, 255, 100);
  slider.position(10, 10);
  slider.style('width', '80px');
}

function draw() {
  var val = slider.value();
  background(val);
}

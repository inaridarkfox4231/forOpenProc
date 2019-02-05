// ボタン！
'use strict';
var button;
var button2;
var button_hover;

function setup() {
  createCanvas(400, 400);
  background(0);
  button = createButton('click me');
  button.position(20, 20);

  button.mousePressed(changeBG);
  button.style('width', '100px');
  button.style('height', '50px');
  button.style('font-size', '20px');
  button.style('border-radius', '10px');
  button.style('background-color', 'blue');
  button.mouseOver(hover); // hoverしたときのcss処理
  button.mouseOut(unhover); // hoverを外したときのcss処理
  // こだわりすぎると混乱しそうなのでほどほどに・・・
  // とりあえずクリックで
  button2 = createButton('fight');
  button2.position(20, 100);
  button2.style('background-color', '#ccc');
  button2.style('border', '0px');
  button2.style('width', '70px');
  button2.style('height', '40px');
  button2.style('font-size', '24px');
}

function changeBG() {
  var val = random(255);
  background(val);
}

function hover(){
  if(button_hover){ return; }
  button.style('background-color', 'red');
  button_hover = true;
}
function unhover(){
  if(!button_hover){ return; }
  button.style('background-color', 'blue');
  button_hover = false;
}

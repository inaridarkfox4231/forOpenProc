'use strict';
let myColor;
// A, B, C, D: 65, 66, 67, 68
// E, F, G, H: 69, 70, 71, 72
let x, y, z, w;

function setup(){
  createCanvas(200, 200);
  myColor = color(0, 0, 0, 0);
  x = 0;
  y = 0;
  z = 0;
  w = 0;
}

// f, g, h, jで上げて、
// c, v, b, nで下げる。分かりやすいね。

function draw(){
  background(255);
  if(keyIsDown(70)){ x += 1; if(x > 255){ x = 255; } }
  else if(keyIsDown(67)){ x -= 1; if(x < 0){ x = 0; }}
  else if(keyIsDown(71)){ y += 1; if(y > 255){ y = 255; } }
  else if(keyIsDown(86)){ y -= 1; if(y < 0){ y = 0; } }
  else if(keyIsDown(72)){ z += 1; if(z > 255){ z = 255; } }
  else if(keyIsDown(66)){ z -= 1; if(z < 0){ z = 0; } }
  else if(keyIsDown(74)){ w += 1; if(w > 255){ w = 255; } }
  else if(keyIsDown(78)){ w -= 1; if(w < 0){ w = 0; } }
  myColor = color(x, y, z, w);
  fill(myColor);
  rect(50, 50, 100, 100);
  fill(0);
  text(x, 20, 20);
  text(y, 60, 20);
  text(z, 100, 20);
  text(w, 140, 20);
  fill(100, 100, 100, 100);
  ellipse(200, 200, 200, 200);
}

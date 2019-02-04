// color variation.

let colors = []; // 0 to 119.

let circles = [];

function setup(){
  createCanvas(400, 400);
  colorLoad();
  noStroke();
  angleMode(DEGREES);
}

function draw(){
  background(240);
  if(frameCount % 10 === 0){ createCircle(); }
  circles.forEach(function(c){ c.update(); c.draw(); })
  killCircle();
}

function createCircle(){
  if(circles.length > 20){ return; }
  let c = new circle();
  circles.push(c);
}

function killCircle(){
  for(let i = 0; i < circles.length; i++){
    if(circles[i].dead){ circles.splice(i, 1); }
  }
}

class circle{
  constructor(){
    this.x = width / 2;
    this.y = height / 2;
    this.color = colors[circle.colorCode];
    this.angle = circle.angle;
    this.speed = random(2, 5);
    this.radius = random(20, 30);
    this.dead = false; // alive.
    circle.angle = (circle.angle + 10) % 360;
    circle.colorCode = (circle.colorCode + Math.floor(random(1, 5))) % 120;
  }
  update(){
    this.x += this.speed * cos(this.angle);
    this.y += this.speed * sin(this.angle);
    if(this.x < 0 || this.x > width || this.y < 0 || this.y > height){
      this.dead = true; // dead.
    }
  }
  draw(){
    push();
    fill(this.color);
    ellipse(this.x, this.y, this.radius, this.radius);
    pop();
  }
}

circle.angle = 0; // adds 10 per frame.
circle.colorCode = 0; // adds 1 to 5 per frame.

// R,G,B Arrays（creep on the cube.）
function colorLoad(){
  let col_R = [];
  let col_G = [];
  let col_B = [];
  for(i = 0; i <= 120; i++){
    col_R.push(0), col_G.push(0), col_B.push(0);
  }
  col_R[0] = 215, col_G[0] = 15, col_B[0] = 205;
  for(i = 1; i <= 20; i++){
    col_R[i] = 225 - 10 * i,    col_G[i] = 15,                col_B[i] = 215;
    col_R[i + 20] = 15,         col_G[i + 20] = 5 + 10 * i,   col_B[i + 20] = 215;
    col_R[i + 40] = 15,         col_G[i + 40] = 215,          col_B[i + 40] = 225 - 10 * i;
    col_R[i + 60] = 5 + 10 * i, col_G[i + 60] = 215,          col_B[i + 60] = 15;
    col_R[i + 80] = 215,        col_G[i + 80] = 225 - 10 * i, col_B[i + 80] = 15;
    col_R[i + 100] = 215,       col_G[i + 100] = 15,          col_B[i + 100] = 15 + 10 * i;
  }
  // use 0 to 119 values.
  for(let i = 0; i < 120; i++){ colors.push(color(col_R[i], col_G[i], col_B[i])); }
}

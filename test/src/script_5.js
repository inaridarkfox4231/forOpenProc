// カラーバリエーション

// R,G,Bの配列（色で長さを表現するのに使う）（立方体の辺の上を移動する感じ）
let colors = [];
let colorNormal = [];
let colorEasing = []; // グラデーション用

function setup(){
  createCanvas(360, 400);
  colorLoad();
  calcNormal();
  calcEasing();
  noStroke();
  noLoop();
}

function draw(){
  for(let i = 0; i < 120; i++){
    fill(colors[i]);
    rect(i * 3, 0, 3, 50);
  }
  for(let i = 0; i < 120; i++){
    fill(color(colorNormal[i], colorNormal[i], colorEasing[i]));
    rect(i * 3, 50, 3, 50);
  }
  for(let i = 0; i < 120; i++){
    fill(color(colorNormal[i], colorEasing[i], colorNormal[i]));
    rect(i * 3, 100, 3, 50);
  }
  for(let i = 0; i < 120; i++){
    fill(color(colorEasing[i], colorNormal[i], colorNormal[i]));
    rect(i * 3, 150, 3, 50);
  }
  for(let i = 0; i < 120; i++){
    fill(color(colorNormal[i], colorNormal[i], 255));
    rect(i * 3, 200, 3, 50);
  }
  for(let i = 0; i < 120; i++){
    fill(color(255, colorNormal[i], colorNormal[i]));
    rect(i * 3, 250, 3, 50);
  }
  for(let i = 0; i < 120; i++){
    fill(color(colorNormal[i], 255, colorNormal[i]));
    rect(i * 3, 300, 3, 50);
  }
  for(let i = 0; i < 120; i++){
    fill(color(255, 200 + Math.floor((i / 120) * 55), colorNormal[i]));
    rect(i * 3, 350, 3, 50);
  }
}

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
  // 実際には0~119を使う
  for(let i = 0; i < 120; i++){ colors.push(color(col_R[i], col_G[i], col_B[i])); }
}

function calcNormal(){
  // 直線補間
  for(let i = 0; i < 120; i++){
    let y = Math.floor(map(i, 0, 120, 0, 255));
    console.log(y);
    colorNormal.push(y);
  }
}

function calcEasing(){
  // とりあえず3乗でやってみる
  // y = (255^3 + (x - 255)^3) / 255^2.
  for(let i = 0; i < 120; i++){
    let x = map(i, 0, 120, 0, 255);
    let y = Math.floor((pow(255, 3) + pow((x - 255), 3)) / pow(255, 2));
    console.log(y);
    colorEasing.push(y);
  }
}

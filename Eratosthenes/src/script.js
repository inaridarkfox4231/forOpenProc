// エラトステネスのふるいを可視化したい
'use strict';
let tileGraphics = [];

function setup(){
  createCanvas(400, 400);
  loadTileGraphics();
}

function draw(){
  background(220);
}

// タイルの画像を用意する
function loadTileGraphics(){
  let aroundColors = [color(195), color(244, 125, 132), color(148, 154, 226)];
  let bodyColors = [color(127), color(237, 28, 36), color(63, 72, 204)];
  for(let i = 0; i < 3; i++){
    let img = createGraphics(20, 20);
    img.background(aroundColors[i]);
    img.noStroke();
    img.fill(bodyColors[i]);
    img.rect(1, 1, 18, 18);
    img.stroke(255);
    img.line(17, 2, 17, 2);
    img.line(17, 4, 17, 10);
    tileGraphics.push(img);
  }
}

// 簡素なものでいいです
class counter{
  constructor(){
    this.t = 0; // 時間のイメージ
    this.limit = 0;
    this.isOn = false;
  }
  getCnt(){ return this.t; }
  getState(){ return this.isOn; }
  setting(lim){
    this.t = 0;
    this.limit = lim;
    this.isOn = true;
  }
  step(){
    this.t++;
    if(this.t > this.limit){ this.isOn = false; }
  }
}

// actor-hub-flow-entityの枠組み（AHFE-System)

// タイルです(というかactorです)
class tile{
  constructor(n){
    // nは1～400で、それに相当するタイルを・・
    this.x = (n % 20) * 20;
    this.y = Math.floor(n / 20);
    this.grId = 0; // はいいろ
    this.state; // 最初はhub
    this.is_prime; // 素数？
    this.myCounter = new counter(); // 動画用
  }
  is_correct(){ return this.is_prime; }
  action(){
    if(!this.myCounter.getState()){ return; } // timerOffのときは何もしない。
    this.myCounter.step();
    this.state.action(this);
    if(!this.myCounter.getState()){ this.state.convert(this); } // カウントが終わったらconvert.
  }
  draw(id){
    image(tileGraphics[id], this.x, this.y); // 常にこれ実行する感じ
  }
}

class stableHub{
  constructor(){
    this.nextFlow = [];
  }
  registFlow(f){
    this.nextFlow.push(f);
  }
  convert(_tile){
    // _tileが何かしら持っててそれによって、っていうんならそういうプログラムの時にやればいいので。
    if(this.nextFlow.length === 0){ return; }
    _tile.state = this.nextFlow[0];
    _tile.state.setting(_tile);
  }
  action(_tile){
    _tile.draw(_tile.grId);
  }
}

class judgeHub{
  constructor(){
    this.nextFlow = [];
  }
  registFlow(f){
    this.nextFlow.push(f);
  }
  convert(_tile){
    if(this.nextFlow.length === 0){ return; }
    if(_tile.is_correct()){ _tile.state = this.nextFlow[0]; }
    _tile.state = this.nextFlow[1]; // 正しいときは0へ、間違ってる時は1へ。いわゆる仕分関数みたいな？
    _tile.state.setting(_tile);
  }
  action(_tile){
    _tile.draw(_tile.grId);
  }
}

class spinFlow{
  constructor(h){
    this.outHub = h;
  }
  convert(_tile){
    _tile.state = this.outHub;
  }
  setting(_tile){
    _tile.myCounter(420);
  }
  action(_tile, cnt){
    // cntは1~420を想定している（1からスタート）
    // カウンターを進める、停止、は、tileの仕事。この子はカウントを元にくるくるをするだけ。役割分担。
    translate(_tile.x, _tile.y);
    let x = 430 / (2 * (10 + cnt));
    applyMatrix(sin(2 * PI * x), 0, 0, 1, 0, 0);
    if(Math.floor(x) % 2 === 1){ draw(_tile.grId); }else{ draw(_tile.grId); }
  }
  complete(_tile){
    // 終わったら画像のidを進める
    this.convert(_tile);
    _tile.grId += 1;
  }
}

class fallFlow{
  constructor(h){
    this.outHub = h;
  }
  convert(_tile){
    _tile.state = this.outHub;
  }
  setting(_tile){
    _tile.myCounter.setting(170); // 多分このくらい？（計算しろ）
  }
  action(_tile, cnt){
    // 落ちるモーション
    // 落ちきったら切る感じ。
    _tile.x += 1;
    _tile.y += (cnt - 40) / 16;  // 微分
    _tile.draw(_tile.grId);
  }
  complete(_tile){
    // 終わったら・・
    this.convert(_tile);
  }
}

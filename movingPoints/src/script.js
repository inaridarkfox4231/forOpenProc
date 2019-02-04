'use strict';
let graph; // graphのグローバルクラスをひとつだけ用意する

let points = []; // 点の集合

function setup(){
  createCanvas(400, 400);
  graph = new graphData();
  loadData();   // グラフ作る
  setPoints(); // 点を置く
  graph.makeGraph() // グラフ生成する
}

function draw(){
  background(220);
  image(graph.graphic, 0, 0);
  points.forEach(function(p){
    p.update();
    p.draw();
  })
}

function loadData(){
  // グラフを作りましょう
  //graph.loadEdges([40, 40, 120, 120], [40, 120, 40, 120]);
  //graph.loadSegments([0, 2, 3, 1, 0, 2], [2, 3, 1, 0, 3, 1])
  let pentaX = [];
  let pentaY = [];
  for(let k = 0; k < 5; k++){
    pentaX.push(200 + 100 * sin(2 * PI * k / 5));
    pentaY.push(200 - 100 * cos(2 * PI * k / 5));
  }
  graph.loadEdges(pentaX, pentaY);
  graph.loadSegments([0, 1, 2, 3, 4, 0, 1, 2, 3, 4], [1, 2, 3, 4, 0, 2, 3, 4, 0, 1]);
}

function setPoints(){
  // とりあえず点をたくさん作りましょう
  generatePoint(0, 1, 2, 'red');
  generatePoint(1, 2, 2, 'blue');
  generatePoint(2, 3, 2, 'green');
  generatePoint(3, 4, 2, 'orange');
  generatePoint(4, 0, 2, 'black');
  /*generatePoint(0, 1, 1, 'red');
  generatePoint(0, 2, 3, 'blue');
  generatePoint(3, 1, 2, 'green');
  generatePoint(0, 3, 3, 'orange');
  generatePoint(1, 2, 2, 'purple');
  generatePoint(2, 3, 3, color(100, 120, 140));*/
}

function generatePoint(startIndex, goalIndex, speed, color){
  points.push(new point(graph.edges[startIndex], graph.edges[goalIndex], speed, color))
}

class counter{
  constructor(){
    this.count = 0;
    this.isOn = false; // 動いてる時trueでそれ以外false
    this.limit;
    this.increaseValue;
  }
  cnt(){ return this.count; }
  setCounter(lim, incVal){
    this.count = 0;
    this.limit = lim;
    this.increaseValue = incVal; // 1フレーム当たりの差分
    this.isOn = true; // 起動
  }
  increase(){
    if(this.isOn){
      this.count += this.increaseValue;
      // この仕様変更により、increaseValueでlimitが割り切れなくても、
      // もっというとincreaseValueが小数とかでもちゃんとedgeで方向が変化するようになった（さっき知った）
      if(this.count > this.limit){ this.isOn = false; }
    }
    return this.isOn;
  }
}

// グラフのデータ色々（グラフ自体の描画とか・・頂点や辺の追加と削除もここで行う）
class graphData{
  constructor(){
    this.edges = [];
    this.segments = [];
    this.graphic = createGraphics(width, height);
  }
  addEdge(x, y){
    // 同じ頂点は追加できないようにしたいけどな・・(バリデーション)
    this.edges.push(new edge(x, y));
    console.log(x, y);
  }
  getEdgeIndex(edge){
    for(let i = 0; i < this.edges.length; i++){
      if(this.edges[i].index === edge.index){ return i; }
    }
    return -1;
  }
  addSegment(e1, e2){
    let e1Index = this.getEdgeIndex(e1);
    let e2Index = this.getEdgeIndex(e2);
    if(e1Index < 0 || e2Index < 0){ return; } // 存在しない場合
    let newSegment = new segment(e1, e2); // 新しいsegmentができました
    this.segments.push(newSegment);
    e1.addSegment(newSegment); // リストの更新（忘れてた。。。）
    e2.addSegment(newSegment);
  }
  getSegmentIndex(e1, e2){
    for(let i = 0; i < this.segments.length; i++){
      let s = this.segments[i];
      if(s.start.index === e1.index && s.goal.index === e2.index){ return i; }
      if(s.start.index === e2.index && s.goal.index === e1.index){ return i; }
    }
    return -1;
  }
  getSegment(e1, e2){
    let segmentIndex = this.getSegmentIndex(e1, e2);
    if(segmentIndex < 0){ return None; }
    let s = this.segments[segmentIndex];
    return s;
  }
  loadEdges(edgeDataX, edgeDataY){
    // edgeDataX, edgeDataYは頂点のx座標リスト、y座標リスト
    for(let i = 0; i < edgeDataX.length; i++){ this.addEdge(edgeDataX[i], edgeDataY[i]); }
  }
  loadSegments(e1Data, e2Data){
    // e1Dataの点からe2Dataの点に線を引くイメージ(indexの配列)
    for(let i = 0; i < e1Data.length; i++){ this.addSegment(this.edges[e1Data[i]], this.edges[e2Data[i]]); }
  }
  makeGraph(){
    // edgeとsegmentのデータからグラフを生成
    this.segments.forEach(function(s){
      this.graphic.line(s.start.x, s.start.y, s.goal.x, s.goal.y);
    }, this)
    this.edges.forEach(function(e){
      this.graphic.ellipse(e.x, e.y, 10, 10);
    }, this)
  }
  // そのうちアクティブに追加できるようにしたいけどね
  // そうなるとedge固有のindexとか連番じゃなくなったりする可能性があるから区別してる
}

class point{
  constructor(e1, e2, speed, color){
    this.segment = graph.getSegment(e1, e2); // e1からe2に向かう点を生成する
    // moveFlagはthis.segmentのstartとe1を比べるだけでいいよね？
    this.moveFlag = (this.segment.start.index === e1.index ? true : false);
    this.position = createVector(0, 0); // 初期位置
    if(this.moveFlag){
      this.position.set(this.segment.start.x, this.segment.start.y); // from start
    }else{
      this.position.set(this.segment.goal.x, this.segment.goal.y); // from goal
    }
    this.color = color;
    this.speed = speed;
    this.posCounter = new counter(); // セルフカウンター
    this.posCounter.setCounter(this.segment.interval, this.speed); // 初期設定
  }
  setting(){
    // step1: this.segmentとthis.moveFlagの情報から現在のedgeが分かる
    // step2: そのedgeにconvertしてもらうと次のsegmentが手に入る
    // step3: 次のsegmentのstartのedgeのindexと現在のedgeのindexを比較することで次のmoveFlagを得る
    // step4: あとはposCounterにセットするだけ。
    let currentEdge = (this.moveFlag ? this.segment.goal : this.segment.start);
    let nextSegment = currentEdge.convert(this.segment);
    //console.log(currentEdge);
    //console.log(nextSegment);
    this.moveFlag = (nextSegment.start.index === currentEdge.index ? true : false);
    this.segment = nextSegment;
    this.posCounter.setCounter(this.segment.interval, this.speed);
  }
  update(){
    if(this.posCounter.increase()){
      this.segment.calcPos(this.position, this.posCounter.cnt(), this.moveFlag) // フラグで方向指示
    }else{
      this.setting(); // カウンターがfalseになったら次のsegmentを探す(edgeが自動的に指定してくれる)
    }
  }
  draw(){
    push();
    fill(this.color);
    noStroke();
    ellipse(this.position.x, this.position.y, 10, 10);
    pop();
  }
}

class edge{
  constructor(x, y){
    this.index = edge.index++;
    this.x = x;
    this.y = y;
    this.connected = []; // つながってるsegmentのリスト
    this.multiple = 0; // つながってるsegmentの個数
    this.diff = 1; // 次のsegmentを指定するときにいくつずらすか（デフォルトは1）
  }
  getIndex(segment){
    // 与えられたsegmentが手持ちのconnectedリストの何番目なのかを返す
    for(let i = 0; i < this.multiple; i++){
      if(this.connected[i].index === segment.index){ return i; }
    }
    return -1;
  }
  addSegment(segment){
    // segmentの追加
    this.connected.push(segment);
    this.multiple++;
  }
  deleteSegment(segment){
    // segmentの削除
    let correctIndex = this.getIndex(segment);
    if(correctIndex < 0){ return; } // みつからないとき
    this.connected.splice(correctIndex, 1); // 該当するsegmentを削除
  }
  convert(segment){
    // 次のsegmentを指定
    let currentIndex = this.getIndex(segment);
    if(currentIndex < 0){ return; } // みつからないとき
    let nextIndex = (currentIndex + this.diff) % this.multiple; // this.diffだけずらしていく
    console.log(nextIndex);
    return this.connected[nextIndex]; // 次なるsegmentを返す
  }
}

class segment{
  constructor(e1, e2){ // やっぱエッジで作らないとsettingで積む
    this.index = segment.index++;
    this.start = e1; // 一応向き付き（どっちからどっちへも行ける）
    this.goal = e2;
    this.interval = Math.sqrt((e1.x - e2.x) * (e1.x - e2.x) + (e1.y - e2.y) * (e1.y - e2.y)); // 距離でいい
  }
  calcPos(position, cnt, flag){
    let value = cnt / this.interval; // 順方向
    if(!flag){ value = 1 - value; }  // 逆方向
    let vx = this.start.x + (this.goal.x - this.start.x) * value;
    let vy = this.start.y + (this.goal.y - this.start.y) * value;
    if(cnt >= this.interval){
      if(flag){
        vx = this.goal.x; vy = this.goal.y; // 順方向
      }else{
        vx = this.start.x; vy = this.start.y; // 逆方向
      }
    }
    position.set(vx, vy);
  }
}

edge.index = 0; // 頂点の連番
segment.index = 0; // 辺の連番

// クリックでバリエーションを変化させるとか？

'use strict';
let edgeData = [];
let segmentData = [];
let intersectionData = [];
let intervalData = [];
let edges = []; // ベクトルの集合
let graph;
const EDGE_NUM = 4;
const SEGMENT_NUM = 4;

let points = []; // 点の集合

function setup(){
  createCanvas(200, 200);
  graph = createGraphics(200, 200);
  loadGraph();
  points.push(new point(0, 1, color('blue')));
  points.push(new point(1, 2, color('red')));
  points.push(new point(2, 1, color('green')));
  points[0].setting();
  points[1].setting();
  points[2].setting();
}

function draw(){
  background(240);
  image(graph, 0, 0);
  points.forEach(function(p){
    p.update();
    p.draw();
  })
}

function loadGraph(){
  // とりあえず4つのエッジと4本の辺
  edgeData = [[40, 40], [160, 40], [40, 160], [160, 160]];
  console.log(edgeData);
  segmentData = [[0, 1], [1, 3], [0, 2], [2, 3]];
  let preData = [[1, 0, 2], [2, 0, 1],[0, 1, 3], [3, 1, 0], [0, 2, 3], [3, 2, 0], [2, 3, 1], [1, 3, 2], [0, 0, 1], [1, 1, 3], [2, 2, 0], [3, 3, 2]]; // スタート直後の進む方向も入れとく
  preData.forEach(function(data){
    intersectionData[data[0] * EDGE_NUM + data[1]] = data[2]; // ハッシュ化
  })
  // ↑[i, j, k]としてiからjに来たとき次はkみたいな
  //console.log(edgeData[0]);
  for(let i = 0; i < edgeData.length; i++){
    let v = createVector(edgeData[i][0], edgeData[i][1]);
    console.log(v);
    edges.push(v);
  }
  segmentData.forEach(function(data){ // 面倒だから全部120で
    intervalData[data[0] * EDGE_NUM + data[1]] = 120;
    intervalData[data[1] * EDGE_NUM + data[0]] = 120;
  })
  segmentData.forEach(function(data){
    graph.line(edgeData[data[0]][0], edgeData[data[0]][1], edgeData[data[1]][0], edgeData[data[1]][1]);
  })
  graph.fill(255);
  edgeData.forEach(function(data){
    graph.ellipse(data[0], data[1], 10, 10);
  })
  graph.noFill();
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
      if(this.count > this.limit){ this.isOn = false; }
    }
    return this.isOn;
  }
}
// カウンターを派生させて無限ループとか表現できるようにできたりするかも（カウントリセットするかどうかをオプション化）
// 簡単なのはthis.loop = true/false だけれど

// pointはどこかのedgeに出現して、その直後にsegmentをintersection経由で与えられて
// 動き始める感じ。
class point{
  constructor(index, speed, color){
    this.startIndex = index;
    this.endIndex = index;
    this.position = createVector(edges[index].x, edges[index].y); // edgeの位置からスタート
    this.speed = speed; // 1~5くらいを想定
    this.posCounter = new counter();
    this.segment;
    this.color = color;
  }
  // constructorに初期のスタートとゴールのindex渡して1回目のsettingをconstructorで行うのもあり
  // そうすれば反対方向に移動させたりできるでしょ、あるいはもっと処理を分割する。
  setting(){
    let nextEdgeIndex = intersectionData[this.startIndex * EDGE_NUM + this.endIndex];
    this.startIndex = this.endIndex;
    this.endIndex = nextEdgeIndex;
    let itv = intervalData[this.startIndex * EDGE_NUM + this.endIndex];
    this.segment = new segment(edges[this.startIndex], edges[this.endIndex], itv);
    this.posCounter.setCounter(itv, this.speed);
  }
  update(){
    if(this.posCounter.increase()){
      this.segment.calcPos(this.position, this.posCounter.cnt())
    }else{
      this.setting(); // カウンターがfalseになったら次のsegmentを探す
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

class segment{
  constructor(e1, e2, itv){
    this.start = e1;
    this.end = e2;
    this.interval = itv;
  }
  calcPos(position, cnt){
    let vx = this.start.x + (this.end.x - this.start.x) * (cnt / this.interval);
    let vy = this.start.y + (this.end.y - this.start.y) * (cnt / this.interval);
    if(cnt === this.interval){ vx = this.end.x; vy = this.end.y; }
    position.set(vx, vy);
  }
}

function keyTyped(){
  console.log(p.position);
  console.log(edges[0]);
}

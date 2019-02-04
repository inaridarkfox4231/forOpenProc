'use strict';
let graph; // graphのグローバルクラスをひとつだけ用意する

let points = []; // 点の集合

function setup(){
  createCanvas(200, 200);
  graph = new graphData();
  graph.loadGraph();
  graph.makeGraphic();
  points.push(new point(0, 1, color('blue')));
  points.push(new point(1, 2, color('red')));
  points.push(new point(2, 1, color('green')));
  points.push(new point(7, 2, color('black')));
}

function draw(){
  background(240);
  image(graph.graphic, 0, 0);
  points.forEach(function(p){
    p.update();
    p.draw();
  })
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
      // ここに if(this.count > this.limit){ this.count = this.limit; }を挟むと
      // this.limitのときにもtrueで実行されるようになるけどoptionだね
      // この仕様変更により、increaseValueでlimitが割り切れなくても、
      // もっというとincreaseValueが小数とかでもちゃんとedgeで方向が変化するようになった（さっき知った）
      if(this.count > this.limit){ this.isOn = false; }
    }
    return this.isOn;
  }
}
// カウンターを派生させて無限ループとか表現できるようにできたりするかも（カウントリセットするかどうかをオプション化）

class graphData{
  constructor(){
    this.edges = [];
    console.log(this.edges);
    this.segments = [];
    this.graphic = createGraphics(width, height);
  }
  loadGraph(){
    let edgeData = [[40, 40], [160, 40], [160, 160], [40, 160]]; // 0 baseで頂点の集合
    let inData = [[3, 7], [0, 6], [1, 5], [2, 4]]; // 各頂点に集まる辺のindex
    let outData = [[0, 4], [1, 7], [2, 6], [3, 5]]; // 出ていく方-
    for(let index = 0; index < edgeData.length; index++){
      //console.log(this.edges);
      this.edges.push(new edge(index, edgeData[index][0], edgeData[index][1], inData[index]));
      this.edges[index].setConvertData(outData[index]);
    }
    let itvData = [[0, 1, 120], [1, 2, 120], [2, 3, 120], [3, 0, 120], [0, 3, 120], [3, 2, 120], [2, 1, 120], [1, 0, 120]]; // 各辺のどの頂点から・・ってのといわゆるcoverに必要なvalue
    for(let index = 0; index < itvData.length; index++){
      let data = itvData[index];
      this.segments.push(new segment(index, this.edges[data[0]], this.edges[data[1]], data[2]));
    }
  }
  makeGraphic(){
    let lineData = [[0, 1], [1, 2], [2, 3], [3, 0]]; // 辺のデータ
    for(let i = 0; i < lineData.length; i++){
      let e1 = this.edges[lineData[i][0]];
      let e2 = this.edges[lineData[i][1]];
      this.graphic.line(e1.x, e1.y, e2.x, e2.y);
    }
    for(let index = 0; index < this.edges.length; index++){
      let e = this.edges[index];
      this.graphic.ellipse(e.x, e.y, 10, 10);
    }
  }
  getEdge(index){ return this.edges[index]; }
  getSegment(index){ return this.segments[index]; }
}

// pointはsegmentIndexを与えられてそこからスタートするイメージ
class point{
  constructor(segmentIndex, speed, color){
    this.segment = graph.getSegment(segmentIndex); // indexとグラフの情報からsegmentを取得
    this.position = createVector(this.segment.start.x, this.segment.start.y); // 初期位置
    this.color = color;
    this.speed = speed;
    this.posCounter = new counter(); // セルフカウンター
    this.posCounter.setCounter(this.segment.interval, this.speed); // 初期設定
  }
  setting(){
    // segmentのendであるedgeによりinのsegmentIndexをoutのsegmentIndexに更新
    let outSegmentIndex = this.segment.end.convertIndex(this.segment.index);
    this.segment = graph.getSegment(outSegmentIndex);
    this.posCounter.setCounter(this.segment.interval, this.speed);
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

// まずデータからedgeを作り、次にedgeを元にしてitvDataからsegmentを生成する
class edge{
  constructor(i, x, y, inArray){
    this.index = i;
    this.x = x;
    this.y = y;
    this.in = inArray; // 入ってくるsegmentのindex番号
    this.convert = []; // segmentの変更を司る
  }
  setConvertData(outArray){
    for(let k = 0; k < this.in.length; k++){
      this.convert[this.in[k]] = outArray[k]; // というわけで、inとoutという2つの配列から作ると。
    } // これを使うと、outとして新しいsetを渡すことでconvertの仕様を変更できるようになる。
  }
  convertIndex(inSegmentIndex){ // inSegment → outSegment
    return this.convert[inSegmentIndex];
  }
}

// startからendまでitvカウントで到達
class segment{
  constructor(i, e1, e2, itv){
    this.index = i;
    this.start = e1;
    this.end = e2;
    this.interval = itv;
  }
  calcPos(position, cnt){
    let vx = this.start.x + (this.end.x - this.start.x) * (cnt / this.interval);
    let vy = this.start.y + (this.end.y - this.start.y) * (cnt / this.interval);
    if(cnt >= this.interval){ vx = this.end.x; vy = this.end.y; }
    position.set(vx, vy);
  }
}

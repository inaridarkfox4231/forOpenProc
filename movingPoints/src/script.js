'use strict';
let graph; // graphのグローバルクラスをひとつだけ用意する

function setup(){
  createCanvas(400, 400);
  graph = new graphData();
  addSquareVariation();   // variation[0]
  addPentagonVariation(); // variation[1]
  addHexagonVariation();  // variation[2]
  graph.loadData();   // 頂点、辺、点の配置
  graph.createGraph() // グラフ生成する
}

function draw(){
  image(graph.graphic, 0, 0);
  graph.updatePoints();
  graph.drawPoints();
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
      // もっというとincreaseValueが小数とかでもちゃんとedgeで方向が変化する
      if(this.count > this.limit){ this.isOn = false; }
    }
    return this.isOn;
  }
}

function addSquareVariation(){
  let a0 = [100, 200, 300, 300, 300, 200, 100, 100];
  let a1 = [100, 100, 100, 200, 300, 300, 300, 200];
  let a2 = [0, 1, 2, 3, 4, 5, 6, 7, 1, 2, 0, 7];
  let a3 = [1, 2, 3, 4, 5, 6, 7, 0, 6, 5, 3, 4];
  let a4 = [0, 0, 0];
  let a5 = [1, 3, 7];
  let a6 = [2, 3, 4];
  let a7 = ['red', 'blue', 'green'];
  graph.variations.push(new variation(a0, a1, a2, a3, a4, a5, a6, a7));
}

function addPentagonVariation(){
  let a0 = [];
  let a1 = [];
  for(let k = 0; k < 5; k++){
    a0.push(200 + 100 * sin(2 * PI * k / 5));
    a1.push(200 - 100 * cos(2 * PI * k / 5));
  }
  let a2 = [0, 1, 2, 3, 4, 0, 1, 2, 3, 4];
  let a3 = [1, 2, 3, 4, 0, 2, 3, 4, 0, 1];
  let a4 = [0, 0, 0, 0];
  let a5 = [1, 2, 3, 4];
  let a6 = [2, 3, 4, 3];
  let a7 = ['red', 'green', 'blue', 'orange'];
  graph.variations.push(new variation(a0, a1, a2, a3, a4, a5, a6, a7));
}

function addHexagonVariation(){
  let a0 = [200];
  let a1 = [200];
  for(let k = 0; k < 6; k++){
    a0.push(200 - 100 * sin(PI * k / 3));
    a1.push(200 - 100 * cos(PI * k / 3));
  }
  let a2 = [0, 0, 0, 0, 0, 0, 1, 2, 3, 4, 5, 6];
  let a3 = [1, 2, 3, 4, 5, 6, 2, 3, 4, 5, 6, 1];
  let a4 = [0, 0, 0, 0, 0, 0];
  let a5 = [1, 2, 3, 4, 5, 6];
  let a6 = [2, 2.5, 3, 3.5, 4, 4.5];
  let a7 = ['red', 'blue', 'green', 'orange', 'brown', 'black'];
  graph.variations.push(new variation(a0, a1, a2, a3, a4, a5, a6, a7));
}

// グラフのデータ色々（グラフ自体の描画とか・・頂点や辺の追加と削除もここで行う）
class graphData{
  constructor(){
    this.edges = []; // 各々の頂点と・・
    this.segments = []; // 頂点の間の辺、というかもっと抽象化して「つながり」
    this.points = []; // その上を走るactorのようなもの
    this.graphic = createGraphics(width, height); // 点とその間のつながりを表現する実体・・クラスにすべきかなぁ
    // ここ↑をクラスにすることにより、その、つまり、骨組み（skeleton?）・・あー、なるほど・・
    // 骨組みでひとつのクラスにするべきなんだ。で、actor達も、実体としてのグラフィックもクラスにしないとあれ。
    // actorの集まり・・Troupeみたいな？そういうクラスをだね・・pointsの代わりにね・・
    this.graphic.background(220); // ここもgraphicは別で色々・・
    this.variations = []; // variation. // 骨組みの実体化としてのバリエーション
    this.currentVariationIndex = 0; // 最初は0番
  }
  addEdge(x, y){
    // 同じ頂点は追加できないようにしたいけど・・(バリデーション)
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
  deleteGraph(){
    // データのクリア
    this.edges = [];
    this.segments = [];
    this.points = [];
    this.graphic.background(220);
  }
  generatePoint(startIndex, goalIndex, speed, color){
    this.points.push(new point(this.edges[startIndex], this.edges[goalIndex], speed, color));
  }
  loadData(){
    // データロード
    let vn = this.variations[this.currentVariationIndex];
    this.loadEdges(vn.edgeX, vn.edgeY);
    this.loadSegments(vn.segStart, vn.segGoal);
    for(let i = 0; i < vn.pointStartIndex.length; i++){
      this.generatePoint(vn.pointStartIndex[i], vn.pointGoalIndex[i], vn.pointSpeeds[i], vn.pointColors[i]);
    }
  }
  createGraph(){
    // edgeとsegmentのデータからグラフを生成
    this.segments.forEach(function(s){
      this.graphic.line(s.start.x, s.start.y, s.goal.x, s.goal.y);
    }, this)
    this.edges.forEach(function(e){
      this.graphic.ellipse(e.x, e.y, 10, 10);
    }, this)
  }
  updatePoints(){
    this.points.forEach(function(p){ p.update(); })
  }
  drawPoints(){
    this.points.forEach(function(p){ p.draw(); })
  }
  // そのうちアクティブに追加できるようにしたい
  // そうなるとedge固有のindexとか連番じゃなくなったりする可能性があるから区別してる
  loadNextVariation(){
    // 次のバリエーションに変更
    this.deleteGraph();
    this.currentVariationIndex = (this.currentVariationIndex + 1) % this.variations.length;
    this.loadData();
    this.createGraph();
  }
}

class point{
  constructor(e1, e2, speed, color){
    this.index = point.index++;
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
    this.diff = 1; // diffをデフォルトに戻す
  }
  convert(segment){
    // 次のsegmentを指定
    let currentIndex = this.getIndex(segment);
    if(currentIndex < 0){ return; } // みつからないとき
    //let nextIndex = (currentIndex + this.diff) % this.multiple; // this.diffだけずらしていく
    // ランダム化してみる
    let nextIndex = currentIndex;
    if(this.multiple > 1){
      nextIndex = (currentIndex + randInt(this.multiple - 1) + 1) % this.multiple;
    }
    return this.connected[nextIndex]; // 次なるsegmentを返す
  }
}

// 0~n-1のどれか
function randInt(n){
  return Math.floor(random(n));
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

class variation{
  // グラフのバリエーションをクラスで管理
  constructor(a0, a1, a2, a3, a4, a5, a6, a7){
    this.edgeX = [];
    this.edgeY = [];
    this.segStart = [];
    this.segGoal = [];
    this.pointStartIndex = [];
    this.pointGoalIndex = [];
    this.pointSpeeds = [];
    this.pointColors = [];
    a0.forEach(function(eX){ this.edgeX.push(eX); }, this);
    a1.forEach(function(eY){ this.edgeY.push(eY); }, this);
    a2.forEach(function(sS){ this.segStart.push(sS); }, this);
    a3.forEach(function(sG){ this.segGoal.push(sG); }, this);
    a4.forEach(function(pSI){ this.pointStartIndex.push(pSI); }, this);
    a5.forEach(function(pGI){ this.pointGoalIndex.push(pGI); }, this);
    a6.forEach(function(pS){ this.pointSpeeds.push(pS); }, this);
    a7.forEach(function(pC){ this.pointColors.push(pC); }, this);
  }
}

point.index = 0; // なんか役に立つかもしれないから点の連番
edge.index = 0; // 頂点の連番
segment.index = 0; // 辺の連番

// クリックでバリエーションを変化させるとか？
// クリア→データロード→点配置をクリックするたびにやるとか
// あるいは選べるようにしても面白そうね

function mouseClicked(){
  graph.loadNextVariation(); // 別のバリエーションが現れる
}

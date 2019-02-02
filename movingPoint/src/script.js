'use strict';
let graph;
let intersectionData;
const EDGE_NUM = 4;
const SEGMENT_NUM = 4;

function setup(){
  createCanvas(200, 200);
  graph = createGraphics(200, 200);
  loadGraph();
}

function draw(){
  background(210, 210, 240);
  image(graph, 0, 0);
}

function loadGraph(){
  // とりあえず4つのエッジと4本の辺
  let edgeDataX = [40, 160, 40, 160];
  let edgeDataY = [40, 40, 160, 160];
  let segmentData = [[0, 1], [1, 3], [0, 2], [2, 3]];
  let iData = [];
  for(let i = 0; i < EDGE_NUM; i++){
    iData[i] = [];
  }
  segmentData.forEach(function(segment){ // 面倒だから全部120で
    iData[segment[0]][segment[1]] = 120;
    iData[segment[1]][segment[0]] = 120;
  })
  segmentData.forEach(function(segment){
    graph.line(edgeDataX[segment[0]], edgeDataY[segment[0]], edgeDataX[segment[1]], edgeDataY[segment[1]]);
  })
  graph.fill(255);
  for(let i = 0; i < EDGE_NUM; i++){
    graph.ellipse(edgeDataX[i], edgeDataY[i], 10, 10);
  }
  graph.noFill();
}

// pointはどこかのedgeに出現して、その直後にsegmentをintersection経由で与えられて
// 動き始める感じ。
class point{
  constructor(edge, speed){
    this.offset = edge.v // edgeを示すベクトルがオフセット
    this.speed = speed; // 1~5くらいを想定
  }
}

class intersection{

}

class segment{
  constructor(start, end, interval){
    // start, endは始点と終点を示す位置ベクトル,intervalは通過にかかる総カウント（1フレームあたり1進む場合のフレーム所要値）
  }
}

class edge{
  constructor(v){
    this.v = v; // 位置ベクトル
  }
}

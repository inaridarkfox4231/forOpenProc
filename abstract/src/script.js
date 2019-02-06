// abstract graph.
let myEntity;
let sp;
let fl;

function setup(){
  createCanvas(200, 200);
  noLoop();
  sp = new spot();
  fl = new flow();
}

function draw(){
}

class state{
  // actorに持たせるspotもしくはflowです
  constructor(){
    this.type;
    this.span; // 経過
  }
  convert(){} // 次のstateを返す感じかな・・
  static getClass(){}
}

class spot extends state{
  constructor(){
    super();
    this.type = 'spot';
    this.index = spot.index++;
    this.span = 0; // デフォルトは0.
    this.inFlow = [];   // 入ってくるflow
    this.outFlow = [];  // 出ていくflow
  }
  convert(currentStateIndex){
    // 何かしらのflowを指定するの。
    return undefined;
  }
  action(){} // なんかする？（くるくる回るとか（意味わかんないよ））
}

class flow extends state{
  constructor(){
    super();
    this.type = 'flow';
    this.index = flow.index++;
    this.span = 0; // 経過span（場合によってはspot間の距離だったり時間的な隔たり）
    this.from;  // 始点となる対象
    this.to;    // 終点となる対象
  }
  convert(currentStateIndex){
    // 何かしらのspotを指定するの。
    //return this.to; // まあ、toを返すんよね（矢印のイメージ）圏論かよ
    return undefined;
  }
  action(){} // なんかする？（位置を返すとか）
}

spot.index = 0;
flow.index = 0;

class actor{
  constructor(){
    this.index = actor.index++;
    this.state; // spotもしくはflow
    this.selfCounter = new counter();
    this.speed = 1; // 経過スピード
  }
  setting(){
    // convertって書けばflowの場合は普通にtoを返すしspotの場合は普通に計算結果を返す。
    this.state = this.state.convert(this.state.index); // spotが次のflowを返す（計算用にindexを渡す）
    this.selfCounter.setting(this.state.span, this.speed); // spanはあのコードだとspotは0だけども
  }
  update(){
    if(!this.selfCounter.progress()){
      this.setting(); return; // superで再利用
    }
    // 何かしらのアクション
  }
  execute(){} // たとえばcircleとかだったらここでdrawなどをする。
  // drawの他にも色々やる可能性。だからexecuteでまとめて書く感じ・・かなぁ（抽象化難しい）
}

actor.index = 0;

class counter{
  constructor(){
    // カウンター
    this.cnt = 0;
    this.isOn = false;
    this.limit;
    this.increaseValue; // 増分
  }
  getCnt(){ return this.cnt; }
  setting(lim, diff, startCnt = 0){
    // startCntは省略した場合0が入る感じで
    this.cnt = startCnt;
    this.limit = lim;
    this.increaseValue = diff;
    this.isOn = true;
  }
  progress(){
    if(this.isOn){
      this.cnt += this.increaseValue;
      if(this.cnt > this.limit){ this.isOn = false; } // limitを超えたら停止
    }
    return this.isOn;
  }
}

class skeleton{
  // 骨組み。
  constructor(){
    this.spots = [];
    this.flows = [];
  }
  addSpot(){}
  deleteSpot(){}
  addFlow(){}
  deleteFlow(){}
  createConnection(){} // 繋がりを生成する（どのflowがどのspotからどのspotへ、とかそういうの）
}

// そろそろ具体化したいけどね・・これじゃわけわかんないよ
class entity{
  constructor(){
    this.field; // なにかしらのskeleton.
    this.troop = []; // actorの集団（？？）
  }
  addActor(){}
  deleteActor(){}
}

// ひとつの具体化

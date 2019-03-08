// sorting Machine.
'use strict';

function setup(){
  createGraphics(960, 640);
}

function draw(){

}

// 簡単なカウンター
// 使い方：limitを設定、あとはstepで進んで行く。getCntで直接カウントを取得。
// 進め方はdiffで指定できる。getProgressを使うとlimitが確定している場合に進捗の値（0～1）を取得できる。
class counter{
  constructor(){
    this.cnt = 0;
    this.limit = -1; // limit復活(-1かあるいは正の数を取る)
  }
  getCnt(){ return this.cnt; }
  getProgress(){ // 進捗
    if(this.limit < 0){ return this.cnt; }
    if(this.cnt >= this.limit){ return 1; }
    return this.cnt / this.limit;
  }
  reset(limit){
    this.cnt = 0;
    this.limit = limit;
  }
  step(diff = 1){ // diffは正の値が前提
    this.cnt += diff;
  }
}

// はじめに
// よく考えたら通し番号もう使ってないや。いらね・・
class flow{
  constructor(){
    this.convertList = [];
  }
  addFlow(_flow){ this.convertList.push(_flow); }
  initialize(_actor){} // flowの内容に応じて様々な初期化を行います
  execute(_actor){ _actor.setState(COMPLETED); } // COMPLETEDにするための条件を記述
  convert(_actor){
    let n = this.convertList.length;
    if(n === 0){ _actor.setFlow(undefined); _actor.inActivate(); } // non-Activeにすることでエラーを防ぎます。
    else{ _actor.setFlow(this.convertList[randomInt(n)]); }
  }
  render(gr){} // グラフィックへの何かしらの貼り付け
}

class actor{
  constructor(f = undefined){
    this.currentFlow = f; // 実行中のフロー
    this.timer = new counter(); // カウンター
    this.isActive = false; // updateを実行するか否かを意味する変数
    this.state = IDLE; // 状態変数
  }
  activate(){ this.isActive = true; } // IDLEかつnon-Activeの状態でこれをやると直ちにflowを開始する
  inActivate(){ this.isActive = false; } // 仕組みになっていてシンプルかつ強力なシステムを構築する
  setState(newState){ this.state = newState; } // stateをチェンジする
  setFlow(newFlow){ this.currentFlow = newFlow; } // flowをセットする
  update(){
    if(!this.isActive){ return; }
    if(this.state === IDLE){
      this.idleAction();
    }else if(this.state === IN_PROGRESS){
      this.in_progressAction();
    }else if(this.state === COMPLETED){
      this.completedAction();
    } // これが基本。ここをいろいろカスタマイズする。
  }
  idleAction(){ this.currentFlow.initialize(this); this.setState(IN_PROGRESS); }
  in_progressAction(){ this.currentFlow.execute(this); } // いつCOMPLETEDするかはflowが決める（当然）
  completedAction(){ this.currentFlow.convert(this); this.setState(IDLE); } // convertで次のflowが与えられる
  render(gr){}
}

class sortingMachine extends actor{
  constructor(){
    this.items = [];
    this.carrier = [];
    this.
  }
}

class preparation extends flow{
  constructor(){}
}

class sorting extends flow{
  constructor(){}
}

// 運搬する荷物
class item extends actor{
  constructor(){}
}

// 運搬ルート
class constantFlow extends flow{
  constructor(){}
}

// sortHub. メインフロー。リストを持っており、それに従ってconvert先を決める
class sortHub extends flow{
  constructor(){}
}

// itemListの画像とか更新処理がひとまとめになったクラス
class itemSheet{
  constructor(itemIdList, numList){
    this.itemIdList = itemIdList;
    this.numList = numList;
    this.graphic = createGraphics(90, 40 * itemList.length); // 長さはitemの個数による
  }
  getIndex(itemId){
    let i;
    for(i = 0; i < this.itemList.length; i++){
      if(itemId === this.itemList[i]){ break; }
    }
    return i;
  }
  update(itemId, newNum){
    let index = this.getIndex(itemId);
    this.graphic.push();
    this.graphic.fill(0);
    this.graphic.noStroke();
    this.graphic.rect(40, 40 * index, 50, 40);
    this.graphic.fill(100);
    this.graphic.textSize(20);
    this.graphic.text(randomInt(200), 40, 28 + 40 * index);
    this.graphic.pop();
  }
}

// 落ちる。loadingへの接続を持っており、何かしらの値を渡す
class falling extends flow{
  constructor(){}
}

// ここに商品が入って、一定以上になると運ばれてまたnon-Activeに戻ってってのを繰り返す。
class cargo extends actor{
  constructor(){}
}

// 積んでる途中
class loading extends flow{
  constructor(){}
}

// 運んでる
class conveyor extends flow{
  constructor(){}
}

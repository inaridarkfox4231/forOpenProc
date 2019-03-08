// sorting Machine.
'use strict';
let machine;

function setup(){
  createGraphics(960, 640);
  machine = new sortingMachine();
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
  constructor(f = undefined){
    super(f);
    this.items = [];
    this.usedItems = []; // 使われたら一時的にここに入れて、そのあとでitemsに戻す。
    this.carrier = [];
  }
  recycle(_actor){
    this.usedItems.push(_actor);
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
  constructor(x, y, itemIdList, numList){
    super();
    this.x = x; // シートの表示位置
    this.y = y;
    this.sheet = new itemSheet(itemIdList, numList);
  }
  convert(_actor){
    let index = this.sheet.getIndex(_actor.itemId);
    if(index < 0){ _actor.currentFlow = this.convertList[0]; return; } // スルーなら0.
    let currentNum = this.sheet.numList[index];
    if(currentNum === 0){
      _actor.currentFlow = this.convertList[0]; // リストにあるけど0の場合
    }else{
      this.sheet.update(index, currentNum - 1); // リストの更新処理
      _actor.currentFlow = this.convertList[1]; // そのまま落ちるなら1.
    }
  }
  render(gr, x, y){
    gr.image(this.sheet.graphic, x, y);
  }
}

// itemListの画像とか更新処理がひとまとめになったクラス
class itemSheet{
  constructor(itemIdList, numList){
    this.itemIdList = itemIdList;
    this.numList = numList;
    this.graphic = createGraphics(90, 40 * itemList.length); // 長さはitemの個数による
    this.createSheet();
  }
  createSheet(){
    this.graphic.colorMode(HSB, 100);
    this.graphic.background(0);
    for(let index = 0; index < this.itemIdList.length; index++){
      createSubSheet(index);
    }
  }
  createSubSheet(index){
    let id = itemIdList[index];
    this.graphic.image(getGraphic(id % 7, Math.floor(id / 8)), 0, 40 * index);
    this.graphic.fill(100);
    this.graphic.textSize(20);
    this.graphic.text(this.numList[index], 40, 28 + 40 * index);
  }
  getIndex(itemId){
    let len = this.itemIdList.length - 1;
    while(len >= 0){
      if(itemId === this.itemIdList[len]){ break; }
      len--;
    }
    return len; // 見つからないなら-1を返す、の実装
  }
  update(index, newNum){
    this.numList[index] = newNum;
    this.createSubSheet(index);
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

function getGraphic(myColorId, figureId){
  let gr = createGraphics(40, 40);
  gr.colorMode(HSB, 100);
  // 形のバリエーションは個別のプログラムでやってね
  let myColor = color(hueSet[myColorId], 100, 100);
  gr.clear();
  gr.push();
  gr.noStroke();
  gr.fill(myColor);
  if(figureId === 0){
    // 正方形
    gr.rect(10, 10, 20, 20);
    gr.fill(255);
    gr.rect(15, 15, 2, 5);
    gr.rect(23, 15, 2, 5);
  }else if(figureId === 1){
    // 星型
    let outer = rotationSeq(0, -12, 2 * PI / 5, 5, 20, 20);
    let inner = rotationSeq(0, 6, 2 * PI / 5, 5, 20, 20);
    for(let i = 0; i < 5; i++){
      let k = (i + 2) % 5;
      let l = (i + 3) % 5;
      gr.quad(outer[i].x, outer[i].y, inner[k].x, inner[k].y, 20, 20, inner[l].x, inner[l].y);
    }
    gr.fill(255);
    gr.rect(15, 17, 2, 5);
    gr.rect(23, 17, 2, 5);
  }else if(figureId === 2){
    // 三角形
    gr.triangle(20, 20 - 24 / Math.sqrt(3), 32, 20 + (12 / Math.sqrt(3)), 8, 20 + (12 / Math.sqrt(3)));
    gr.fill(255);
    gr.rect(15, 17, 2, 5);
    gr.rect(23, 17, 2, 5);
  }else if(figureId === 3){
    // ひしがた
    gr.quad(28, 20, 20, 20 - 10 * Math.sqrt(3), 12, 20, 20, 20 + 10 * Math.sqrt(3));
    gr.fill(255);
    gr.rect(15, 17, 2, 5);
    gr.rect(23, 17, 2, 5);
  }else if(figureId === 4){
    // 六角形
    gr.quad(32, 20, 26, 20 - 6 * Math.sqrt(3), 14, 20 - 6 * Math.sqrt(3), 8, 20);
    gr.quad(32, 20, 26, 20 + 6 * Math.sqrt(3), 14, 20 + 6 * Math.sqrt(3), 8, 20);
    gr.fill(255);
    gr.rect(15, 17, 2, 5);
    gr.rect(23, 17, 2, 5);
  }else if(figureId === 5){
    // なんか頭ちょろってやつ
    gr.ellipse(20, 20, 20, 20);
    gr.triangle(20, 20, 20 - 5 * Math.sqrt(3), 15, 20, 0);
    gr.fill(255);
    gr.rect(15, 17, 2, 5);
    gr.rect(23, 17, 2, 5);
  }else if(figureId === 6){
    // 逆三角形
    gr.triangle(20, 20 + 24 / Math.sqrt(3), 32, 20 - (12 / Math.sqrt(3)), 8, 20 - (12 / Math.sqrt(3)));
    gr.fill(255);
    gr.rect(15, 17, 2, 5);
    gr.rect(23, 17, 2, 5);
  }else if(figureId === 7){
    // デフォルト用の円形
    gr.ellipse(20, 20, 20, 20);
    gr.fill(255);
    gr.rect(15, 17, 2, 5);
    gr.rect(23, 17, 2, 5);
  }
  gr.pop();
  return gr;
}

function rotationSeq(x, y, angle, n, centerX = 0, centerY = 0){
  // (x, y)をangleだけ0回～n-1回回転させたもののセットを返す(中心はオプション、デフォルトは0, 0)
  let array = [];
  let vec = createVector(x, y);
  array.push(createVector(x + centerX, y + centerY));
  for(let k = 1; k < n; k++){
    vec.set(vec.x * cos(angle) - vec.y * sin(angle), vec.x * sin(angle) + vec.y * cos(angle));
    array.push(createVector(vec.x + centerX, vec.y + centerY));
  }
  return array;
}

function randomInt(n){
  // 0, 1, ..., n-1のどれかを返す
  return Math.floor(random(n));
}

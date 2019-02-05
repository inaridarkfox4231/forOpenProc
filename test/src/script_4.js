// forEachをクラス内で使う実験
// thisを渡せ→無事解決

let t;

function setup(){
  t = new test(10);
  noLoop();
}

function draw(){
  t.output();
}

class test{
  constructor(n){
    this.array = [];
    for(let i = 0; i < n; i++){ this.array.push(i); }
    this.index = 100;
  }
  output(){
    this.array.forEach(function(x){
      console.log(this);
      console.log(x);
      console.log(this.index);
    }, this) // ←ここを }) にしてthisをなくすと中のthisがエラーになるのです
    // 文脈上thisはclass testを、というかインスタンスを指して欲しい、そういうときこのように書く。
  }
}

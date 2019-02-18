'use strict';

class dummy{
  constructor(n){
    this.n = n;
  }
  getN(){ return this.n; }
}

function setup(){
  let p = [];
  for(let i = 0; i < 20; i++){ p.push(new dummy(i)); }
  let q = [p[0], p[1], p[2]];
  console.log(p[0].n);
  q[0].n = 188;
  console.log(p[0].n);
  let dm = new dummy(5);
  let a = triv;
  console.log(a(dm));
}

function draw(){

}

function triv(_dummy){
  return _dummy.getN();
}

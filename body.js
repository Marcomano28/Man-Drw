let dt = [];
let p, v, a, tg, pt;
let f, rd, dc, sz, mrc, w, h;
let vx,fs,ll,lr,hl,hr = [];

let na, nb;
let r1, rr, n;
let sh, tm;
class body {
    constructor(s) {
       this.sz = s;
        this.p = createVector(width / 2, height / 2 - 2 * this.sz, -height / 2);
        this.v = createVector(0, 0, 0);
        this.a = createVector(0, 0, 0);
        this.tg = createVector(0, 0, 0);
        this.pt = createVector(0, 0, 0);
        this.dt = [];
        this.f = 0;
        this.rd = 0;
        this.dc = 0;
        
        this.mrc = 0;
        this.w = 0;
        this.h = 0;
        this.vx = [];
        this.fs = [1];
        this.ll = [1];
        this.lr = [1];
        this.hl = [1];
        this.hr = [1];
        this.na = createVector(0, 0, 0);
        this.nb = createVector(0, 0, 0);
        this.r1 = 0;
        this.rr = 0;
        this.n = 0;
        this.sh = 0;
        this.tm = 0;
  
  this.fs = [new ft(), new ft(), new ft()];
  this.ll = [new lg(), new lg(), new lg()];
  this.lr = [new lg(), new lg(), new lg()];
  this.hl = [new lg(), new lg(), new lg()];
  this.hr = [new lg(), new lg(), new lg()];
  rectMode(CENTER);
  this.dc = 0.8;
  this.vx = [createVector(0, 0, 0), createVector(0, 0, 0), createVector(0, 0, 0), createVector(0, 0, 0)];
  this.w = 40;
  this.h = 30;
}
 update() {
  this.n = noise(frameCount);
  this.mrc = map(constrain(this.v.x, 0, 25), 0, 25, 1.3, 3.0);
  this.na = createVector(px(1.52 * this.mrc, 10) - 340, py(1.42 + this.mrc, 10) -250, pz(0.39 + this.mrc, 10) + 50).add(this.p);
  this.nb = createVector(px(0.61 * this.mrc, 10) + 200, py(0.81 + this.mrc, 10) - 450, pz(0.59 + this.mrc, 10) + 50).add(this.p);
  this.tg.set(mouseX - width / 2, constrain(mouseY - height / 2, height / 2 - this.sz * 3.2 + map(constrain(this.v.mag(), 0, 15), 0, 15, -this.sz * 0.2, this.sz * 0.2), height / 2 - this.sz * 1.5),
    constrain(mouseY - height / 2, -height / 2 - this.sz * 3 + map(constrain(this.v.mag(), 0, 15), 0, 15, -this.sz * 0.7, this.sz * 0.7), -height / 2 - this.sz * 1.6));
  this.a = p5.Vector.sub(this.tg, this.p);
  this.f = this.a.mag();
  this.a.normalize();
  this.a.mult(this.f * 0.02);
  this.v.add(this.a);
  this.p.add(this.v);
  this.v.mult(this.dc);
  rd = map(constrain(this.v.x, -25, 25), -25, 25, -PI * 0.2, PI * 0.2);
  for (let i = 0; i < 2; i++) {
    this.dt[i] = [];
    for (let j = 0; j < 2; j++) {
        this.dt[i][j] = [];
      for (let k = 0; k < 2; k++) {
        this.dt[i][j][k] = createVector(this.sz * (i - 0.5), 2 * this.sz * (j - 0.5), this.sz / 3 * (k - 0.5));
        this.dt[i][j][k].rotate(this.rd);
        this.dt[i][j][k].add(this.p);
      }
    }
  }

  for (let i = 0; i < this.ll.length; i++) {
    this.ll[i] = new lg(it(this.dt[0][1][0], this.dt[0][1][1], 0.5), 1);
    this.lr[i] = new lg(it(this.dt[1][1][0], this.dt[1][1][1], 0.5), 0);
    this.hl[i] = new lg(it(this.dt[0][0][0], this.dt[0][0][1], 0.5), 0);
    this.hr[i] = new lg(it(this.dt[1][0][0], this.dt[1][0][1], 0.5), 1);
  }

  if (frameCount == 1) {
    for (let i = 0; i < 1; i++) {
      this.fs[i].fl.set(it(this.dt[0][1][0], this.dt[0][1][1], 0.5).x + random(15, 45), height / 2, it(this.dt[0][1][0], this.dt[0][1][1], 0.5).z + random(-220, -180));
      this.fs[i].fr.set(it(this.dt[1][1][0], this.dt[1][1][1], 0.5).x + random(-45, -15), height / 2, it(this.dt[1][1][0], this.dt[1][1][1], 0.5).z + random(-220, -180));
      this.fs[i].hl.set(na);
      this.fs[i].hr.set(nb);
    }
  }
  for (let i = 0; i < 1; i++) {
    this.fs[i].up(it(this.dt[0][1][0], this.dt[0][1][1], 0.5).x, it(this.dt[1][1][0], this.dt[1][1][1], 0.5).x, it(this.dt[0][1][0], this.dt[0][1][1], 0.5).z, it(this.dt[1][1][0], this.dt[1][1][1], 0.5).z, this.v.mag());
  }

  for (let i = 0; i < this.ll.length; i++) {
    this.ll[i].up(this.fs[i].fl);
    this.lr[i].up(this.fs[i].fr);
    this.hl[i].up(this.na);
    this.hr[i].up(this.nb);
  }
}
shw() {
  
    let hh = map(this.v.x + n, 0, 15, 0, h);
    stroke(255, 200);
    strokeWeight(1);
  
    for (let i = 0; i < 2; i++) {
      for (let j = 0; j < 2; j++) {
        for (let k = 0; k < 2; k++) {
          if (k < 1) line(this.dt[i][j][k].x, this.dt[i][j][k].y, this.dt[i][j][k].z, this.dt[i][j][k + 1].x, this.dt[i][j][k + 1].y, this.dt[i][j][k + 1].z);
          if (j < 1) line(this.dt[i][j][k].x, this.dt[i][j][k].y, this.dt[i][j][k].z, this.dt[i][j + 1][k].x, this.dt[i][j + 1][k].y, this.dt[i][j + 1][k].z);
          if (i < 1) line(this.dt[i][j][k].x, this.dt[i][j][k].y, this.dt[i][j][k].z, this.dt[i + 1][j][k].x, this.dt[i + 1][j][k].y, this.dt[i + 1][j][k].z);
        }
      }
    }
  
    noStroke();
    fill(255);
    this.pt = createVector(this.p.x, this.p.y - 200, this.p.z);
    let rrd = map(constrain(this.v.x, -25, 25), -25, 25, -PI * 0.04, PI * 0.04);
  
    push();
    translate(this.pt.x, this.pt.y - 50, this.pt.z-20);
    rotateX(rrd);
    sphere(70);
    pop();
  
    push();
    translate(this.pt.x + 35, this.pt.y - 50, this.pt.z + 55);
  
    if (this.n < 0.3) {
      this.r1 = map(constrain(t, 0, 4), 1, 4, this.rr, 0);
    } else {
      this.r1 = this.rr;
    }
  
    noStroke();
    fill(255);
    sphere(14);
    pop();
  
    push();
    translate(this.pt.x - 30, this.pt.y - 50, this.pt.z + 55);
    fill(255);
    sphere(14);
    pop();
  
    push();
    translate(this.pt.x + 42, this.pt.y - 45, this.pt.z + 67);
    fill(0);
    sphere(4);
    pop();
  
    push();
    translate(this.pt.x - 32, this.pt.y - 45, this.pt.z + 67);
    fill(0);
    sphere(4);
    pop();
  
    push();
    this.vx[0].set(-w * 0.5, -hh * 0.5);
    this.vx[1].set(w * 0.5, -hh * 0.5);
    this.vx[2].set(w * 0.5, hh * 0.5);
    this.vx[3].set(-w * 0.5, hh * 0.5);
    beginShape();
    translate(this.pt.x + 10, this.pt.y, this.pt.z + 53);
    //rotateX(-0.7);
    strokeWeight(3);
    stroke(0);
    fill(220);
    for (let i = 0; i < this.vx.length; i++) {
      vertex(this.vx[i].x, this.vx[i].y, this.vx[i].z);
    }
    endShape(CLOSE);
    pop();
  
    for (let i = 0; i < 1; i++) {
      this.ll[i].shw();
      this.lr[i].shw();
      this.hl[i].shw();
      this.hr[i].shw();
    }
  }
  
}
function it(a, b, r) {
  return createVector(a.x * r + b.x * (1 - r), a.y * r + b.y * (1 - r), a.z * r + b.z * (1 - r));
}
function px(mr, tr) {
    let x = 1251 + mr * cos(TWO_PI * t / tr);
    let y = mr * sin(TWO_PI * t / tr);
    return 120 * noise(x, y);
  }
  
  function py(mr, tr) {
    let x = 1151 + mr * cos(TWO_PI * t / tr);
    let y = mr * sin(TWO_PI * t / tr);
    return 320 * noise(x, y);
  }
  
  function pz(mr, tr) {
    let x = 1241 + mr * cos(TWO_PI * t / tr);
    let y = mr * sin(TWO_PI * t / tr);
    return 70 * noise(x, y);
  }
  


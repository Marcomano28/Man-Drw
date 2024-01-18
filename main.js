let sk1 = (p) => {
  let b;
  let t = 0;
  let num = 200;
  let maxSprings = 8;
  let numSprings = 0;
  let sprs = new Array(maxSprings + 1);
  let elementLength = 15;
  let collideRad = 27;
  let collideK = 0.025;
  let collideC = 0.2;
  let k = 0.025;
  let c = 0.2;
  let I = 100;
  let kw = 20.0;
  let cw = 0.02;
  let gravity = 0.00001;
  let iterations = 75;
  let drawing = false;
  let cleared = true;
  let tieX = new Array(5).fill(0);
  let tieY = new Array(5).fill(0);
  let tieLength = 20;
  let canvas;
  let x = 10;
  let y = 10;
  let body_size = 90;
  p.setup = () => {
    canvas = p.createCanvas(720, 500, p.WEBGL);
    canvas.parent("micanvas");
    canvas.position(x, y);
    b = new body(body_size);
    p.rectMode(p.CENTER);
    // tie = new Tie(p.width / 2, p.height / 2, 40);
  };
  function dragSegment(i, xin, yin) {
    let dx = xin - tieX[i];
    let dy = yin - tieY[i];
    let angle = p.atan2(dy, dx);
    tieX[i] = xin - p.cos(angle) * tieLength;
    tieY[i] = yin - p.sin(angle) * tieLength + 1.5;
    p.push();
    p.translate(
      tieX[i],
      tieY[i] + body_size * 0.8,
      -p.width / 2 - body_size * 0.5
    );
    p.rotate(angle);
    p.stroke(255, 50);
    p.strokeWeight(2);
    p.line(0, 0, tieLength, 0);
    p.pop();
  }
  p.draw = () => {
    p.background(0);
    p.lights();
    t = p.frameCount * 0.01;
    p.stroke(180, 180, 180, 80);
    p.noFill();
    p.strokeWeight(4);
    p.rect(40, -70, 580, 350);
    for (let k = 0; k < tieLength; k++) {
      dragSegment(0, b.vx[0].x + body_size * 0.5, b.head_pos.y);
      for (let i = 0; i < tieX.length - 1; i++) {
        dragSegment(i + 1, tieX[i], tieY[i]);
      }
    }
    if (numSprings > 0) {
      let whichOnes = numSprings;
      if (drawing) {
        whichOnes = numSprings - 1;
      }
      for (let i = 1; i <= iterations; i++) {
        for (let j = 1; j <= whichOnes; j++) {
          sprs[j].internalForces();
        }
        if (numSprings > 1 && !(numSprings === 2 && drawing === true)) {
          collisions(whichOnes);
        }
        for (let j = 1; j <= whichOnes; j++) {
          sprs[j].advect();
        }
      }
    }
    if (numSprings > 0) {
      for (let j = 1; j <= numSprings; j++) {
        sprs[j].draw();
      }
    }
    if (drawing) {
      sprs[numSprings].penDrag();
    }
    b.update();
    b.show();
  };
  p.mouseDragged = () => {
    if (drawing) {
      sprs[numSprings].penDrag();
    }
  };
  p.mousePressed = () => {
    if (!drawing) {
      if (p.mouseButton === p.CENTER) {
        if (maxSprings >= numSprings + 1) {
          numSprings++;
          sprs[numSprings] = new Spring();
          sprs[numSprings].penDown();
          drawing = true;
        }
      }
    }
    if (drawing) {
      if (p.mouseButton === p.LEFT) {
        sprs[numSprings].penUp();
        drawing = false;
      }
    }
  };
  p.keyPressed = () => {
    if (p.key === "a") {
      if (drawing) {
        sprs[numSprings].penUp();
        drawing = false;
      }
    }
    if (p.key === "c") {
      if (numSprings > 0) {
        numSprings -= 1;
      }
    }
    if (!drawing) {
      if (p.key === "d") {
        if (maxSprings >= numSprings + 1) {
          numSprings++;
          sprs[numSprings] = new Spring();
          sprs[numSprings].penDown();
          drawing = true;
        }
      }
      if (p.key === "f") {
        if (numSprings > 0) {
          for (let j = 1; j <= numSprings; j++) {
            let g = sprs[j].testGrab();
          }
        }
      }
    }
  };
  class body {
    constructor(size) {
      this.bdy_size = size;
      this.position = p.createVector(
        p.width / 2,
        p.height / 2 - 2 * this.bdy_size,
        -p.height / 2
      );
      this.velocity = p.createVector(0, 0, 0);
      this.aceleration = p.createVector(0, 0, 0);
      this.target = p.createVector(0, 0, 0);
      this.head_pos = p.createVector(0, 0, 0);
      this.dt = [];
      this.vx = [
        p.createVector(),
        p.createVector(),
        p.createVector(),
        p.createVector(),
      ];
      this.force = 0;
      this.dc = 0;
      this.mrc = 0;
      this.rd = 0;
      this.fs = [1];
      this.legL = [1];
      this.legR = [1];
      this.handL = [1];
      this.handR = [1];
      this.handR_mov = p.createVector(0, 0, 0);
      this.handL_mov = p.createVector(0, 0, 0);
      this.nwL = p.createVector();
      this.nwR = p.createVector();
      this.pupilPL = p.createVector();
      this.pupilPR = p.createVector();
      this.r1 = 0;
      this.rr = 0;
      this.n = 0;
      this.sh = 0;
      this.tm = 0;
      this.foots = [new Foot(), new Foot(), new Foot()];
      this.decay = 0.8;
    }
    update() {
      this.n = p.noise(t);
      this.mrc = p.map(p.constrain(this.velocity.x, 0, 25), 0, 25, 1.3, 3.0);
      this.handR_mov = p
        .createVector(
          pointX(1.52 * this.mrc, 40) - this.bdy_size * 2.5,
          pointY(1.42 + this.mrc, 40) - this.bdy_size * 2.7,
          pointZ(0.39 + this.mrc, 10) + this.bdy_size * 0.2
        )
        .add(this.position);
      this.handL_mov = p
        .createVector(
          pointX(0.61 * this.mrc, 10) + this.bdy_size * 1.0,
          pointY(0.81 + this.mrc, 10) - this.bdy_size * 4.3,
          pointZ(0.59 + this.mrc, 10) + this.bdy_size * 0.2
        )
        .add(this.position);
      let osc = p.constrain(this.velocity.mag(), 0, 15);
      this.target.set(
        p.mouseX - p.width / 2,
        p.constrain(
          p.mouseY - p.height / 2,
          p.height / 2 -
            this.bdy_size * 2.8 +
            p.map(osc, 0, 15, -this.bdy_size * 0.2, this.bdy_size * 0.2),
          p.height / 2 - this.bdy_size * 1
        ),
        p.constrain(
          p.mouseY - p.height / 2,
          -p.height / 2 -
            this.bdy_size * 3 +
            p.map(osc, 0, 15, -this.bdy_size * 0.7, this.bdy_size * 0.7),
          -p.height / 2 - this.bdy_size * 0.7
        )
      );
      this.vx[0].set(-this.bdy_size * 0.45, -this.bdy_size * 1, 0);
      this.vx[1].set(-this.bdy_size * 0.45, this.bdy_size * 0.8, 0);
      this.vx[2].set(this.bdy_size * 0.45, this.bdy_size * 0.8, 0);
      this.vx[3].set(this.bdy_size * 0.45, -this.bdy_size * 1, 0);

      this.aceleration = p5.Vector.sub(this.target, this.position);
      this.force = this.aceleration.mag();
      this.aceleration.normalize();
      this.aceleration.mult(this.force * 0.02);
      this.velocity.add(this.aceleration);
      this.position.add(this.velocity);
      this.velocity.mult(this.decay);
      this.rad = p.map(
        p.constrain(this.velocity.x, -25, 25),
        -25,
        25,
        -p.PI * 0.2,
        p.PI * 0.2
      );
      for (let i = 0; i < this.vx.length; i++) {
        this.vx[i].rotate(this.rad);
        this.vx[i].add(this.position);
      }

      if (p.frameCount == 1) {
        for (let i = 0; i < 1; i++) {
          this.foots[i].footL.set(
            this.vx[2].x + p.random(15, 45),
            p.height / 2,
            this.vx[2].z
          );
          this.foots[i].footR.set(
            this.vx[1].x + p.random(-45, -15),
            p.height / 2,
            this.vx[1].z
          );
          this.foots[i].handL.set(this.handR_mov);
          this.foots[i].handR.set(this.handL_mov);
        }
      }
      for (let i = 0; i < this.legL.length; i++) {
        this.legL[i] = new Leg(this.vx[1], 1);
        this.legR[i] = new Leg(this.vx[2], 0);
        this.handL[i] = new Leg(this.vx[0], 0);
        this.handR[i] = new Leg(this.vx[3], 1);
      }
      for (let i = 0; i < 1; i++) {
        this.foots[i].up(
          this.vx[1].x,
          this.vx[2].x,
          this.vx[1].z,
          this.vx[2].z,
          this.velocity.mag()
        );
      }
      for (let i = 0; i < this.legL.length; i++) {
        this.legL[i].up(this.foots[i].footL);
        this.legR[i].up(this.foots[i].footR);
        this.handL[i].up(this.handR_mov);
        this.handR[i].up(this.handL_mov);
      }
    }
    show() {
      p.beginShape();
      p.stroke(255, 200);
      p.strokeWeight(2);
      for (let i = 0; i < this.vx.length; i++) {
        p.vertex(this.vx[i].x, this.vx[i].y, this.vx[i].z);
      }
      p.endShape(p.CLOSE);
      p.noStroke();
      p.fill(255);
      this.head_pos = p.createVector(
        this.position.x,
        this.position.y - this.bdy_size * 1.8,
        this.position.z
      );
      let rrd = p.map(
        p.constrain(this.velocity.x, -25, 25),
        -25,
        25,
        -p.PI * 0.04,
        p.PI * 0.04
      );
      p.push();
      p.translate(
        this.head_pos.x,
        this.head_pos.y,
        this.head_pos.z - this.bdy_size * 0.03
      );
      p.rotateX(rrd);
      p.sphere(this.bdy_size * 0.45, 10, 10);
      p.pop();

      if (this.n < 0.5) {
        this.r1 = p.map(p.constrain(t, 0, 128), 1, 18, this.rr, 0);
      } else {
        this.r1 = this.rr;
      }
      let mouthx = p.map(p.constrain(pointX(1.7, 10.9), 0, 120), 0, 120, 0, 45);
      let mouthy = p.map(p.constrain(pointY(4.7, 10.2), 0, 120), 90, 10, 0, 15);
      p.push();
      p.translate(
        this.head_pos.x,
        this.head_pos.y + this.bdy_size * 0.21,
        this.head_pos.z + this.bdy_size * 0.4
      );
      p.strokeWeight(1);
      p.stroke(0);
      p.fill(255, 220, 120);
      p.ellipse(0, 0, mouthx, mouthy);
      p.pop();
      p.push();
      p.translate(
        this.head_pos.x + this.bdy_size * 0.18,
        this.head_pos.y - this.bdy_size * 0.07,
        this.head_pos.z + this.bdy_size * 0.4
      );
      p.noStroke();
      p.fill(255);
      p.sphere(this.bdy_size * 0.11, 6, 6);
      p.pop();
      p.push();
      p.translate(
        this.head_pos.x - this.bdy_size * 0.18,
        this.head_pos.y - this.bdy_size * 0.07,
        this.head_pos.z + this.bdy_size * 0.4
      );
      p.fill(255);
      p.sphere(this.bdy_size * 0.11, 6, 6);
      p.pop();
      this.pupilPL.set(
        this.head_pos.x + this.bdy_size * 0.13,
        this.head_pos.y - this.bdy_size * 0.03,
        this.head_pos.z + this.bdy_size * 0.48
      );
      this.pupilPR.set(
        this.head_pos.x - this.bdy_size * 0.25,
        this.head_pos.y - this.bdy_size * 0.03,
        this.head_pos.z + this.bdy_size * 0.48
      );
      this.nwL = p5.Vector.sub(this.pupilPL, this.handL_mov);
      this.nwR = p5.Vector.sub(this.pupilPR, this.handL_mov);
      this.nwL.normalize();
      this.nwL.setMag(9);
      this.nwR.normalize();
      this.nwR.setMag(9);
      p.push();
      p.translate(
        this.pupilPL.x - this.nwL.x,
        this.pupilPL.y - this.nwL.y,
        this.pupilPL.z - this.nwL.z
      );
      p.fill(0);
      p.sphere(this.bdy_size * 0.045, 4, 4);
      p.pop();
      p.push();
      p.translate(
        this.pupilPR.x - this.nwR.x,
        this.pupilPR.y - this.nwR.y,
        this.pupilPR.z - this.nwR.z
      );
      p.fill(0);
      p.sphere(this.bdy_size * 0.045, 4, 4);
      p.pop();
      for (let i = 0; i < 1; i++) {
        this.legL[i].shw();
        this.legR[i].shw();
        this.handL[i].shw();
        this.handR[i].shw();
      }
    }
  }
  function pointX(mr, tr) {
    let x = 1251 + mr * p.cos((p.TWO_PI * t) / tr);
    let y = mr * p.sin((p.TWO_PI * t) / tr);
    return 120 * p.noise(x, y);
  }
  function pointY(mr, tr) {
    let x = 1151 + mr * p.cos((p.TWO_PI * t) / tr);
    let y = mr * p.sin((p.TWO_PI * t) / tr);
    return 420 * p.noise(x, y);
  }
  function pointZ(mr, tr) {
    let x = 1241 + mr * p.cos((p.TWO_PI * t) / tr);
    let y = mr * p.sin((p.TWO_PI * t) / tr);
    return 70 * p.noise(x, y);
  }
  class Leg {
    constructor(v, m) {
      this.vs = v;
      this.vm = p.createVector(0, 0, 0);
      this.ve = p.createVector(0, 0, 0);
      this.l = 1.3 * body_size;
      this.md = m;
    }
    up(tg) {
      let df = p5.Vector.sub(tg, this.vs);
      let d = df.mag();
      if (d >= 2 * this.l) {
        df.mult(this.l / d);
        this.vm.set(this.vs.x + df.x, this.vs.y + df.y, this.vs.z + df.z);
        this.ve.set(this.vm.x + df.x, this.vm.y + df.y, this.vm.z + df.z);
      } else {
        this.ve.set(tg.x, tg.y, tg.z);
        if (this.md == 0) {
          df.set(df.y, -df.x, df.z);
        } else {
          df.set(-df.y, df.x, df.z);
        }
        df.mult(p.sqrt(p.sq(this.l) - p.sq(d * 0.5)) / d);
        this.vm.set(
          (this.vs.x + this.ve.x) * 0.5 + df.x,
          (this.vs.y + this.ve.y) * 0.5 + df.y,
          (this.vs.z + this.ve.z) * 0.5 + df.z
        );
      }
    }
    shw() {
      p.stroke(255, 120);
      p.strokeWeight(4);
      p.line(this.vs.x, this.vs.y, this.vs.z, this.vm.x, this.vm.y, this.vm.z);
      p.stroke(255, 100, 0, 180);
      p.line(this.ve.x, this.ve.y, this.ve.z, this.vm.x, this.vm.y, this.vm.z);
    }
  }
  class Foot {
    constructor() {
      this.footL = p.createVector(0, 0, 0);
      this.footR = p.createVector(0, 0, 0);
      this.handL = p.createVector(0, 0, 0);
      this.handR = p.createVector(0, 0, 0);
      this.l = 0;
      this.legL = 0;
      this.h = 0;
      this.lx = 0;
      this.rx = 0;
      this.lz = 0;
      this.rz = 0;
      this.fs = 0;
      this.tl = false;
      this.tr = false;
      this.trn = true;
    }
    up(xl, xr, zl, zr, vm) {
      if (this.trn) {
        if (!this.tl && this.footL.x - xl < -150) {
          this.tl = true;
          this.l = xl - this.footL.x + p.random(-100, 10);
          this.h = p.abs(this.l * p.random(0.4, 0.6));
          this.lx = this.footL.x;
          this.fs = 0;
        } else if (!this.tl && this.footL.x - xl > 25) {
          this.tl = true;
          this.l = xl - this.footL.x - p.random(25, 125);
          this.h = p.abs(this.l * p.random(0.4, 0.6));
          this.lx = this.footL.x;
          this.fs = 0;
        }
        if (this.tl) {
          this.stpl(this.footL, this.l, this.ll, this.h, vm);
        }
      } else {
        if (!this.tr && this.footR.x - xr > 150) {
          this.tr = true;
          this.l = xr - this.footR.x + p.random(-10, 100);
          this.h = p.abs(this.l * p.random(0.4, 0.6));
          this.rx = this.footR.x;
          this.fs = 0;
        } else if (!this.tr && this.footR.x - xr < -25) {
          this.tr = true;
          this.l = xr - this.footR.x + p.random(25, 125);
          this.h = p.abs(this.l * p.random(0.4, 0.6));
          this.rx = this.footR.x;
          this.fs = 0;
        }
        if (this.tr) {
          this.stpr(this.footR, this.l, this.ll, this.h, vm);
        }
      }
    }
    stpl(n, l, ll, h, vm) {
      let it = p.map(p.constrain(vm, 0, 15), 0, 15, 0.25, 0.75);
      this.fs = p.lerp(this.fs, p.PI, it);
      n.x = this.lx + (l * this.fs) / p.PI;
      n.y = p.sin(this.fs) * -h + p.height / 2 + 80;
      if (this.fs >= p.PI - 0.01) {
        this.fs = p.PI;
        this.tl = false;
        this.trn = !this.trn;
      }
    }
    stpr(n, l, ll, h, vm) {
      let it = p.map(p.constrain(vm, 0, 15), 0, 15, 0.25, 0.75);
      this.fs = p.lerp(this.fs, p.PI, it);
      n.x = this.rx + (l * this.fs) / p.PI;
      n.y = p.sin(this.fs) * -h + p.height / 2 + 80;
      if (this.fs >= p.PI - 0.01) {
        this.fs = p.PI;
        this.tr = false;
        this.trn = !this.trn;
      }
    }
  }
  class Spring {
    constructor() {
      this.numUsed = 0;
      this.dp = 0;
      this.X = [];
      this.dX = [];
      this.V = [];
      this.F = [];
      this.phi = [];
      this.omega = [];
      this.tork = [];
      this.closed = false;
      this.clr = p.color(
        p.int(p.random(0, 255)),
        p.int(p.random(0, 255)),
        p.int(p.random(0, 255))
      );
      this.boundBox = new AABB();
      this.hold = false;
      this.held = 0;

      for (let i = 0; i < num; i++) {
        this.X[i] = p.createVector();
        this.V[i] = p.createVector();
        this.F[i] = p.createVector();
        this.dX[i] = p.createVector();
      }
    }

    internalForces() {
      for (let i = 0; i <= this.numUsed; i++) {
        this.F[i].y += gravity;
      }
      let ione = 1;
      if (this.closed) {
        ione = 0;
      }
      for (let i = ione; i <= this.numUsed; i++) {
        let linked = i - 1;
        if (i === 0) {
          linked = this.numUsed;
        }
        const io = p.createVector(p.cos(this.phi[i]), p.sin(this.phi[i]));
        const jo = p.createVector(-p.sin(this.phi[i]), p.cos(this.phi[i]));
        const delta = p5.Vector.sub(this.X[i], this.X[linked]);
        const deltaPrime = p.createVector();
        deltaPrime.x = delta.x * io.x + delta.y * io.y;
        deltaPrime.y = delta.x * jo.x + delta.y * jo.y;
        const ddX = p5.Vector.sub(deltaPrime, this.dX[linked]);
        const GPrime = p5.Vector.mult(ddX, -k);
        const G = p.createVector();
        G.x = GPrime.x * io.x + GPrime.y * jo.x;
        G.y = GPrime.x * io.y + GPrime.y * jo.y;
        G.sub(p5.Vector.mult(p5.Vector.sub(this.V[i], this.V[linked]), c));
        this.F[i].add(G);
        this.F[linked].sub(G);

        const curl = delta.cross(G);
        const Gw = (this.phi[i] - this.phi[linked]) * kw;
        const dW = (this.omega[i] - this.omega[linked]) * cw;
        if (i !== 0) {
          this.tork[i] -= Gw + curl.z - dW;
          this.tork[linked] += Gw - curl.z - dW;
        } else {
          const closedMult = 0.5;
          this.tork[i] -= closedMult * Gw + curl.z - dW;
          this.tork[linked] += closedMult * Gw - curl.z - dW;
        }
      }

      for (let i = 0; i <= this.numUsed; i++) {
        if (this.X[i].x < -p.width / 2 - 30) {
          this.F[i].x +=
            ((-this.X[i].x + p.width / 2 - 30) * k) / 2 - this.V[i].x * c;
          this.F[i].y -= (this.V[i].y * c) / 3;
        }
        if (this.X[i].x > p.width / 2 + 150) {
          this.F[i].x -=
            (this.X[i].x - p.width / 2 + 150) * k + this.V[i].x * c;
          this.F[i].y -= (this.V[i].y * c) / 3;
        }
        if (this.X[i].y < -p.height / 2 - 20) {
          this.F[i].y +=
            (-this.X[i].y + p.height / 2 - 20) * k - this.V[i].y * c;
          this.F[i].x -= (this.V[i].x * c) / 3;
        }
        if (this.X[i].y > p.height / 2 - 90) {
          this.F[i].y -=
            (this.X[i].y - p.height / 2 + 90) * k + this.V[i].y * c;
          this.F[i].x -= (this.V[i].x * c) / 3;
        }
      }

      if (this.hold) {
        const M = p.createVector();
        M.x = b.handL_mov.x;
        M.y = b.handL_mov.y;
        const fromMouse = p5.Vector.sub(this.X[this.held], M);
        this.F[this.held].sub(p5.Vector.mult(fromMouse, k));
        this.F[this.held].sub(p5.Vector.mult(this.V[this.held], c));
      }
    }

    advect() {
      for (let i = 0; i <= this.numUsed; i++) {
        this.V[i].add(this.F[i]);
        this.F[i].x = 0;
        this.F[i].y = 0;
        this.X[i].add(this.V[i]);
        this.omega[i] += this.tork[i] / I;
        this.tork[i] = 0;
        this.phi[i] += this.omega[i];
        this.omega[i] *= 0.999;
        if (i > 0) {
          this.phi[i] = p.constrain(
            this.phi[i],
            this.phi[i - 1] - p.PI / 2,
            this.phi[i - 1] + p.PI / 2
          );
        }
        this.omega[i] = p.constrain(this.omega[i], -p.PI / 56, p.PI / 56);
      }
    }
    draw() {
      p.stroke(this.clr, 220);
      p.strokeWeight(2);
      if (!this.closed) {
        p.noFill();
      } else {
        p.fill(this.clr, 100);
      }
      p.beginShape();
      for (let i = 0; i <= this.numUsed; i++) {
        p.vertex(this.X[i].x, this.X[i].y, this.X[i].z - 450 - this.dp);
      }
      if (!this.closed) {
        p.endShape();
      } else {
        p.endShape(p.CLOSE);
      }
    }
    penDown() {
      this.numUsed = 0;
      this.X[this.numUsed].x = b.handL_mov.x;
      this.X[this.numUsed].y = b.handL_mov.y;
      this.V[this.numUsed].x = 0;
      this.V[this.numUsed].y = 0;
      this.penDrag();
    }
    penDrag() {
      const mouseVect = p.createVector(b.handL_mov.x + 25, b.handL_mov.y - 35);
      mouseVect.sub(this.X[this.numUsed]);
      const tempDatum = p.createVector(
        this.X[this.numUsed].x,
        this.X[this.numUsed].y
      );
      const numNew = p.floor(mouseVect.mag() / elementLength);
      if (numNew > 0) {
        const mMag = mouseVect.mag();
        mouseVect.normalize();
        for (let i = 1; i <= numNew; i++) {
          const interp = p5.Vector.add(
            tempDatum,
            p5.Vector.mult(mouseVect, (i / numNew) * mMag)
          );
          this.makeNode(interp.x, interp.y);
        }
      }
    }
    makeNode(x, y) {
      if (this.numUsed < num - 1) {
        this.numUsed++;
        this.X[this.numUsed].x = x;
        this.X[this.numUsed].y = y;
        this.V[this.numUsed].x = 0;
        this.V[this.numUsed].y = 0;
        this.dX[this.numUsed - 1] = p5.Vector.sub(
          this.X[this.numUsed],
          this.X[this.numUsed - 1]
        );
      }
    }
    penUp() {
      this.dX[this.numUsed] = p5.Vector.sub(this.X[0], this.X[this.numUsed]);
      if (this.dX[this.numUsed].mag() < 80) {
        this.closed = true;
        this.dp = p.random(
          -this.dX[this.numUsed].mag() / 2,
          this.dX[this.numUsed].mag() / 2
        );
      } else {
        this.closed = false;
      }
      this.drawing = false;
      this.cleared = false;
    }

    testGrab() {
      for (let i = 0; i <= numUsed; i++) {
        let M = p.createVector();
        M.x = b.nb.x;
        M.y = b.nb.y;
        let fromMouse = p5.Vector.sub(X[i], M);
        if (fromMouse.mag() < 5) {
          this.hold = true;
          this.held = i;
        }
      }
      let val = false;
      if (hold == true) {
        val = true;
      }
      return val;
    }
  }
  function collisions(whichOnes) {
    for (let i = 1; i <= whichOnes; i++) {
      generateAABB(sprs[i]);
    }
    for (let i = 2; i <= whichOnes; i++) {
      for (let j = 1; j < i; j++) {
        handleAABBtests(sprs[i].boundBox, sprs[j].boundBox);
      }
    }
  }
  class AABB {
    constructor(ax, ay, bx, by, isP, dex, prnt, bi, tch) {
      this.A = p.createVector(ax, ay);
      this.B = p.createVector(bx, by);
      this.isParent = isP;
      this.index = dex;
      this.parent = prnt;
      this.rick = bi;
      this.james = tch;
    }
  }
  function testAABB(C, D) {
    let val = false;
    if (C.A.x < D.B.x && C.B.x > D.A.x) {
      if (C.A.y < D.B.y && C.B.y > D.A.y) {
        val = true;
      }
    }
    return val;
  }
  function mergeAABB(C, D) {
    let ax = D.A.x < C.A.x ? D.A.x : C.A.x;
    let ay = D.A.y < C.A.y ? D.A.y : C.A.y;
    let bx = D.B.x > C.B.x ? D.B.x : C.B.x;
    let by = D.B.y > C.B.y ? D.B.y : C.B.y;
    return new AABB(ax, ay, bx, by, true, 0, null, C, D);
  }
  function generateAABB(spr) {
    let aabbs = new Array(spr.numUsed + 1);
    for (let i = 0; i <= spr.numUsed; i++) {
      aabbs[i] = new Array(11);
      aabbs[i][0] = new AABB(
        spr.X[i].x - collideRad,
        spr.X[i].y - collideRad,
        spr.X[i].x + collideRad,
        spr.X[i].y + collideRad,
        false,
        i,
        spr,
        null,
        null
      );
    }
    let level = 0;
    let numMerged = spr.numUsed + 1;
    while (numMerged > 1) {
      let remainder = numMerged % 2;
      numMerged = (numMerged + remainder) / 2;
      for (let i = 0; i < numMerged; i++) {
        if (remainder === 1 && i === numMerged - 1) {
          aabbs[i][level + 1] = aabbs[i * 2][level];
        } else {
          aabbs[i][level + 1] = mergeAABB(
            aabbs[i * 2][level],
            aabbs[i * 2 + 1][level]
          );
        }
      }
      level++;
    }
    spr.boundBox = aabbs[0][level];
  }
  function handleAABBtests(C, D) {
    if (testAABB(C, D)) {
      if (C.isParent && D.isParent) {
        handleAABBtests(C.rick, D.rick);
        handleAABBtests(C.james, D.rick);
        handleAABBtests(C.rick, D.james);
        handleAABBtests(C.james, D.james);
      } else if (!C.isParent && D.isParent) {
        handleAABBtests(C, D.rick);
        handleAABBtests(C, D.james);
      } else if (C.isParent && !D.isParent) {
        handleAABBtests(C.rick, D);
        handleAABBtests(C.james, D);
      } else if (!C.isParent && !D.isParent) {
        let dx = p5.Vector.sub(C.parent.X[C.index], D.parent.X[D.index]);
        let dxMag = dx.mag();
        if (dxMag < collideRad) {
          let Fmag = collideK * (collideRad - dxMag);
          dx.normalize();
          C.parent.F[C.index].add(dx.copy().mult(Fmag));
          D.parent.F[D.index].sub(dx.copy().mult(Fmag));
        }
      }
    }
  }
};
let sketchRun = false;
let mysketch;
document.getElementById("start-button").addEventListener("click", function () {
  if (!sketchRun) {
    this.textContent = "Stop";
    document.getElementById("start_image").style.display = "none";
    document.getElementById("text").style.display = "none";
    document.getElementById("micanvas").style.display = "block";
    mysketch = new p5(sk1, "micanvas");
    sketchRun = true;
  } else {
    this.textContent = "Start";
    document.getElementById("start_image").style.display = "block";
    document.getElementById("text").style.display = "flex";
    mysketch.remove();
    sketchRun = false;
  }
});

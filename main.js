let sk1 = (p) => {
  let b;
  let t = 0;
  let num = 200;
  let maxSprings = 8;
  let numSprings = 0;
  let sprs = new Array(maxSprings + 1);
  let elementLength = 15;
  let collideRad = 3;
  let collideK = 0.025;
  let collideC = 0.02;
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
  let gridSize = 50;
  let spatialGrid = {};
  let lastFrameTime = 0;
  const targetFrameRate = 60;
  const frameInterval = 1000 / targetFrameRate;

  // ── OPTIMIZACIÓN 1: Pool de vectores con tamaño pre-reservado ──────────────
  const POOL_SIZE = 64;
  const vectorPool = [];
  for (let i = 0; i < POOL_SIZE; i++) vectorPool.push({ x: 0, y: 0, z: 0 });

  // Vectores temporales reutilizables para hot paths (evita GC)
  const _tmp = { x: 0, y: 0, z: 0 };
  const _io  = { x: 0, y: 0 };
  const _jo  = { x: 0, y: 0 };
  const _delta    = { x: 0, y: 0 };
  const _dPrime   = { x: 0, y: 0 };
  const _ddX      = { x: 0, y: 0 };
  const _GPrime   = { x: 0, y: 0 };
  const _G        = { x: 0, y: 0 };
  const _fromMouse= { x: 0, y: 0 };
  const _mouseVect= { x: 0, y: 0 };
  const _interp   = { x: 0, y: 0 };

  // ── OPTIMIZACIÓN 2: Clave numérica para spatialGrid en lugar de string ─────
  // Asumimos coordenadas en [-2000, 2000]; offset 40 celdas para negativos
  const GRID_OFFSET = 40;
  const GRID_COLS   = 100;
  function getGridKey(gx, gy) {
    return (gy + GRID_OFFSET) * GRID_COLS + (gx + GRID_OFFSET);
  }

  // ── OPTIMIZACIÓN 3: deltaTime calculado UNA vez por frame en draw() ────────
  let frameDeltaTime = 1 / 60;
  let lastPhysicsTime = 0;

  function getVector() {
    const v = vectorPool.pop();
    if (v) { v.x = 0; v.y = 0; v.z = 0; return v; }
    return p.createVector();
  }
  function releaseVector(vector) {
    vector.set(0, 0, 0);
    vectorPool.push(vector);
  }

  p.setup = () => {
    canvas = p.createCanvas(720, 500, p.WEBGL);
    canvas.parent("micanvas");
    canvas.position(x, y);
    b = new body(body_size);
    p.rectMode(p.CENTER);
  };

  function dragSegment(i, xin, yin) {
    let dx = xin - tieX[i];
    let dy = yin - tieY[i];
    let angle = p.atan2(dy, dx);
    let ca = p.cos(angle);
    let sa = p.sin(angle);
    tieX[i] = xin - ca * tieLength;
    tieY[i] = yin - sa * tieLength + 1.5;
    p.push();
    p.translate(tieX[i], tieY[i] + body_size * 0.7, -p.width / 2 - body_size * 0.5);
    p.rotate(angle);
    p.stroke(255, 150);
    p.strokeWeight(12);
    p.line(0, 0, tieLength, 0);
    p.pop();
  }

  p.draw = () => {
    const currentTime = performance.now();
    const elapsed = currentTime - lastFrameTime;
    if (elapsed < frameInterval) return;
    lastFrameTime = currentTime - (elapsed % frameInterval);

    // ── OPTIMIZACIÓN 3b: deltaTime global para este frame ──────────────────
    frameDeltaTime = Math.min((currentTime - lastPhysicsTime) / 1000, 0.05);
    lastPhysicsTime = currentTime;

    p.background(0);
    p.lights();
    t = p.frameCount * 0.01;

    p.stroke(180, 180, 180, 80);
    p.noFill();
    p.strokeWeight(4);
    p.rect(40, -70, 580, 350);

    // Tie segments (sin closures innecesarias)
    dragSegment(0, b.vx[0].x + body_size * 0.4, b.head_pos.y);
    for (let i = 0; i < tieX.length - 1; i++) {
      dragSegment(i + 1, tieX[i], tieY[i]);
    }

    if (numSprings > 0) {
      const whichOnes = drawing ? numSprings - 1 : numSprings;

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

      p.push();
      for (let j = 1; j <= numSprings; j++) {
        sprs[j].draw();
      }
      p.pop();
    }

    if (drawing) sprs[numSprings].penDrag();

    b.update();
    b.show();
  };

  p.mouseDragged = () => {
    if (drawing) sprs[numSprings].penDrag();
  };

  p.mousePressed = () => {
    if (!drawing && maxSprings >= numSprings + 1) {
      numSprings++;
      sprs[numSprings] = new Spring();
      sprs[numSprings].penDown();
      drawing = true;
    }
  };

  p.keyPressed = () => {
    if (p.keyCode === 32) {
      if (drawing) { sprs[numSprings].penUp(); drawing = false; }
    }
    if (p.key === "c") { if (numSprings > 0) numSprings--; }
    if (p.key === "f") {
      for (let j = 1; j <= numSprings; j++) sprs[j].testGrab();
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  class body {
    constructor(size) {
      this.bdy_size = size;
      this.position   = p.createVector(p.width / 2, p.height / 2 - 2 * size, -p.height / 2);
      this.velocity   = p.createVector(0, 0, 0);
      this.aceleration= p.createVector(0, 0, 0);
      this.target     = p.createVector(0, 0, 0);
      this.head_pos   = p.createVector(0, 0, 0);
      this.vx = [p.createVector(), p.createVector(), p.createVector(), p.createVector()];
      this.force = 0;
      this.mrc = 0;
      this.handR_mov = p.createVector(0, 0, 0);
      this.handL_mov = p.createVector(0, 0, 0);
      this.nwL = p.createVector();
      this.nwR = p.createVector();
      this.pupilPL = p.createVector();
      this.pupilPR = p.createVector();
      this.r1 = 0; this.rr = 0; this.n = 0;
      this.foots = [new Foot(), new Foot(), new Foot()];
      this.decay = 0.8;
      this.legL = [1]; this.legR = [1];
      this.handL = [1]; this.handR = [1];
      this.rad = 0;
      this.dt = [];
      this.fs = [1];
      this.sh = 0; this.tm = 0;
    }

    update() {
      this.n   = p.noise(t);
      this.mrc = p.map(p.constrain(this.velocity.x, 0, 25), 0, 25, 1.3, 3.0);

      this.handR_mov.set(
        pointX(1.52 * this.mrc, 40) - this.bdy_size * 2.5 + this.position.x,
        pointY(1.42 + this.mrc, 40) - this.bdy_size * 2.7 + this.position.y,
        pointZ(0.39 + this.mrc, 10) + this.bdy_size * 0.2 + this.position.z
      );
      this.handL_mov.set(
        pointX(0.61 * this.mrc, 10) + this.bdy_size * 1.0 + this.position.x,
        pointY(0.81 + this.mrc, 10) - this.bdy_size * 4.3 + this.position.y,
        pointZ(0.59 + this.mrc, 10) + this.bdy_size * 0.2 + this.position.z
      );

      let osc = p.constrain(this.velocity.mag(), 0, 15);
      this.target.set(
        p.mouseX - p.width / 2,
        p.constrain(
          p.mouseY - p.height / 2,
          p.height / 2 - this.bdy_size * 2.8 + p.map(osc, 0, 15, -this.bdy_size * 0.2, this.bdy_size * 0.2),
          p.height / 2 - this.bdy_size * 1
        ),
        p.constrain(
          p.mouseY - p.height / 2,
          -p.height / 2 - this.bdy_size * 3 + p.map(osc, 0, 15, -this.bdy_size * 0.7, this.bdy_size * 0.7),
          -p.height / 2 - this.bdy_size * 0.7
        )
      );

      this.vx[0].set(-this.bdy_size * 0.45, -this.bdy_size * 1, 0);
      this.vx[1].set(-this.bdy_size * 0.45,  this.bdy_size * 0.8, 0);
      this.vx[2].set( this.bdy_size * 0.45,  this.bdy_size * 0.8, 0);
      this.vx[3].set( this.bdy_size * 0.45, -this.bdy_size * 1, 0);

      this.aceleration.set(
        this.target.x - this.position.x,
        this.target.y - this.position.y,
        this.target.z - this.position.z
      );
      this.force = this.aceleration.mag();
      this.aceleration.normalize();
      this.aceleration.mult(this.force * 0.02);
      this.velocity.add(this.aceleration);
      this.position.add(this.velocity);
      this.velocity.mult(this.decay);

      this.rad = p.map(p.constrain(this.velocity.x, -25, 25), -25, 25, -p.PI * 0.2, p.PI * 0.2);
      for (let i = 0; i < 4; i++) {
        this.vx[i].rotate(this.rad);
        this.vx[i].add(this.position);
      }

      if (p.frameCount === 1) {
        this.foots[0].footL.set(this.vx[2].x + p.random(15, 45), p.height / 2, this.vx[2].z);
        this.foots[0].footR.set(this.vx[1].x + p.random(-45, -15), p.height / 2, this.vx[1].z);
        this.foots[0].handL.set(this.handR_mov);
        this.foots[0].handR.set(this.handL_mov);
      }

      this.legL[0]  = new Leg(this.vx[1], 1);
      this.legR[0]  = new Leg(this.vx[2], 0);
      this.handL[0] = new Leg(this.vx[0], 0);
      this.handR[0] = new Leg(this.vx[3], 1);

      this.foots[0].up(this.vx[1].x, this.vx[2].x, this.vx[1].z, this.vx[2].z, this.velocity.mag());

      this.legL[0].up(this.foots[0].footL);
      this.legR[0].up(this.foots[0].footR);
      this.handL[0].up(this.handR_mov);
      this.handR[0].up(this.handL_mov);
    }

    show() {
      p.beginShape();
      p.stroke(255, 200);
      p.strokeWeight(2);
      for (let i = 0; i < 4; i++) p.vertex(this.vx[i].x, this.vx[i].y, this.vx[i].z);
      p.endShape(p.CLOSE);

      p.noStroke();
      p.fill(255);
      this.head_pos.set(this.position.x, this.position.y - this.bdy_size * 1.8, this.position.z);

      let rrd = p.map(p.constrain(this.velocity.x, -25, 25), -25, 25, -p.PI * 0.04, p.PI * 0.04);
      p.push();
      p.translate(this.head_pos.x, this.head_pos.y, this.head_pos.z - this.bdy_size * 0.03);
      p.rotateX(rrd);
      p.sphere(this.bdy_size * 0.45, 10, 10);
      p.pop();

      let mouthx = p.map(p.constrain(pointX(1.7, 10.9), 0, 120), 0, 120, 0, 45);
      let mouthy = p.map(p.constrain(pointY(4.7, 10.2), 0, 120), 90, 10, 0, 15);
      p.push();
      p.translate(this.head_pos.x, this.head_pos.y + this.bdy_size * 0.21, this.head_pos.z + this.bdy_size * 0.4);
      p.strokeWeight(1); p.stroke(0); p.fill(255, 220, 120);
      p.ellipse(0, 0, mouthx, mouthy);
      p.pop();

      // Ojos (izquierdo y derecho sin push/pop redundantes)
      const eyeOffsets = [this.bdy_size * 0.18, -this.bdy_size * 0.18];
      for (let i = 0; i < 2; i++) {
        p.push();
        p.translate(this.head_pos.x + eyeOffsets[i], this.head_pos.y - this.bdy_size * 0.07, this.head_pos.z + this.bdy_size * 0.4);
        p.noStroke(); p.fill(255);
        p.sphere(this.bdy_size * 0.11, 6, 6);
        p.pop();
      }

      this.pupilPL.set(this.head_pos.x + this.bdy_size * 0.13, this.head_pos.y - this.bdy_size * 0.03, this.head_pos.z + this.bdy_size * 0.48);
      this.pupilPR.set(this.head_pos.x - this.bdy_size * 0.25, this.head_pos.y - this.bdy_size * 0.03, this.head_pos.z + this.bdy_size * 0.48);

      // ── OPTIMIZACIÓN: reusar nwL/nwR sin p5.Vector.sub (evita new) ────────
      this.nwL.set(this.pupilPL.x - this.handL_mov.x, this.pupilPL.y - this.handL_mov.y, this.pupilPL.z - this.handL_mov.z);
      this.nwR.set(this.pupilPR.x - this.handL_mov.x, this.pupilPR.y - this.handL_mov.y, this.pupilPR.z - this.handL_mov.z);
      this.nwL.normalize(); this.nwL.setMag(9);
      this.nwR.normalize(); this.nwR.setMag(9);

      p.push();
      p.translate(this.pupilPL.x - this.nwL.x, this.pupilPL.y - this.nwL.y, this.pupilPL.z - this.nwL.z);
      p.fill(0); p.sphere(this.bdy_size * 0.045, 4, 4);
      p.pop();
      p.push();
      p.translate(this.pupilPR.x - this.nwR.x, this.pupilPR.y - this.nwR.y, this.pupilPR.z - this.nwR.z);
      p.fill(0); p.sphere(this.bdy_size * 0.045, 4, 4);
      p.pop();

      this.legL[0].shw(); this.legR[0].shw();
      this.handL[0].shw(); this.handR[0].shw();
    }
  }

  function pointX(mr, tr) {
    const theta = (p.TWO_PI * t) / tr;
    return 120 * p.noise(1251 + mr * p.cos(theta), mr * p.sin(theta));
  }
  function pointY(mr, tr) {
    const theta = (p.TWO_PI * t) / tr;
    return 420 * p.noise(1151 + mr * p.cos(theta), mr * p.sin(theta));
  }
  function pointZ(mr, tr) {
    const theta = (p.TWO_PI * t) / tr;
    return 70 * p.noise(1241 + mr * p.cos(theta), mr * p.sin(theta));
  }

  class Leg {
    constructor(v, m) {
      this.vs = v;
      this.vm = p.createVector(0, 0, 0);
      this.ve = p.createVector(0, 0, 0);
      this.l  = 1.3 * body_size;
      this.md = m;
    }
    up(tg) {
      const dfx = tg.x - this.vs.x;
      const dfy = tg.y - this.vs.y;
      const dfz = tg.z - this.vs.z;
      const d = Math.sqrt(dfx * dfx + dfy * dfy + dfz * dfz);
      const l = this.l;
      if (d >= 2 * l) {
        const sc = l / d;
        this.vm.set(this.vs.x + dfx * sc, this.vs.y + dfy * sc, this.vs.z + dfz * sc);
        this.ve.set(this.vm.x + dfx * sc, this.vm.y + dfy * sc, this.vm.z + dfz * sc);
      } else {
        this.ve.set(tg.x, tg.y, tg.z);
        let ex = this.md === 0 ?  dfy : -dfy;
        let ey = this.md === 0 ? -dfx :  dfx;
        const sc2 = Math.sqrt(l * l - (d * 0.5) * (d * 0.5)) / d;
        this.vm.set(
          (this.vs.x + this.ve.x) * 0.5 + ex * sc2,
          (this.vs.y + this.ve.y) * 0.5 + ey * sc2,
          (this.vs.z + this.ve.z) * 0.5 + dfz * sc2
        );
      }
    }
    shw() {
      p.stroke(255, 120); p.strokeWeight(4);
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
      this.l = 0; this.h = 0;
      this.lx = 0; this.rx = 0;
      this.lz = 0; this.rz = 0;
      this.fs = 0;
      this.tl = false; this.tr = false;
      this.trn = true;
    }
    up(xl, xr, zl, zr, vm) {
      if (this.trn) {
        if (!this.tl && (this.footL.x - xl < -150 || this.footL.x - xl > 25)) {
          this.tl = true;
          this.l  = xl - this.footL.x + (this.footL.x - xl < -150 ? p.random(-100, 10) : -p.random(25, 125));
          this.h  = p.abs(this.l * p.random(0.4, 0.6));
          this.lx = this.footL.x;
          this.fs = 0;
        }
        if (this.tl) this.stpl(this.footL, this.l, this.h, vm);
      } else {
        if (!this.tr && (this.footR.x - xr > 150 || this.footR.x - xr < -25)) {
          this.tr = true;
          this.l  = xr - this.footR.x + (this.footR.x - xr > 150 ? p.random(-10, 100) : p.random(25, 125));
          this.h  = p.abs(this.l * p.random(0.4, 0.6));
          this.rx = this.footR.x;
          this.fs = 0;
        }
        if (this.tr) this.stpr(this.footR, this.l, this.h, vm);
      }
    }
    stpl(n, l, h, vm) {
      let it = p.map(p.constrain(vm, 0, 15), 0, 15, 0.25, 0.75);
      this.fs = p.lerp(this.fs, p.PI, it);
      n.x = this.lx + (l * this.fs) / p.PI;
      n.y = p.sin(this.fs) * -h + p.height / 2 + 80;
      if (this.fs >= p.PI - 0.01) { this.fs = p.PI; this.tl = false; this.trn = !this.trn; }
    }
    stpr(n, l, h, vm) {
      let it = p.map(p.constrain(vm, 0, 15), 0, 15, 0.25, 0.75);
      this.fs = p.lerp(this.fs, p.PI, it);
      n.x = this.rx + (l * this.fs) / p.PI;
      n.y = p.sin(this.fs) * -h + p.height / 2 + 80;
      if (this.fs >= p.PI - 0.01) { this.fs = p.PI; this.tr = false; this.trn = !this.trn; }
    }
  }

  class Spring {
    constructor() {
      this.numUsed = 0;
      this.dp = 0;
      // ── OPTIMIZACIÓN: usar p5.Vectors propios (más rápido que plain objects en p5) ─
      this.X  = new Array(num).fill(null).map(() => p.createVector());
      this.dX = new Array(num).fill(null).map(() => p.createVector());
      this.V  = new Array(num).fill(null).map(() => p.createVector());
      this.F  = new Array(num).fill(null).map(() => p.createVector());
      this.phi   = new Float32Array(num);
      this.omega = new Float32Array(num);
      this.tork  = new Float32Array(num);
      this.closed = false;
      this.clr = p.color(p.int(p.random(255)), p.int(p.random(255)), p.int(p.random(255)));
      this.hold = false;
      this.held = 0;
    }

    internalForces() {
      // ── OPTIMIZACIÓN: usar frameDeltaTime global (una sola llamada performance.now por frame) ──
      const dt = frameDeltaTime;
      const grav = gravity * dt;
      const nu = this.numUsed;

      for (let i = 0; i <= nu; i++) {
        this.F[i].y += grav;
      }

      const ione = this.closed ? 0 : 1;
      for (let i = ione; i <= nu; i++) {
        const linked = (i === 0) ? nu : i - 1;
        const phi_i = this.phi[i];
        const cosPhi = Math.cos(phi_i);
        const sinPhi = Math.sin(phi_i);

        // io = (cos, sin), jo = (-sin, cos)
        const Xi = this.X[i], Xl = this.X[linked];
        // delta = X[i] - X[linked]
        const dX = Xi.x - Xl.x, dY = Xi.y - Xl.y;
        // deltaPrime in local frame
        const dpX = dX * cosPhi  + dY * sinPhi;
        const dpY = dX * (-sinPhi) + dY * cosPhi;

        const dXl = this.dX[linked];
        // ddX = deltaPrime - dX[linked]
        const ddXx = dpX - dXl.x, ddXy = dpY - dXl.y;

        // GPrime = -k * ddX
        const gpX = -k * ddXx, gpY = -k * ddXy;

        // G = rotate GPrime back + damping
        const Vi = this.V[i], Vl = this.V[linked];
        const Gx = gpX * cosPhi + gpY * (-sinPhi) - c * (Vi.x - Vl.x);
        const Gy = gpX * sinPhi  + gpY * cosPhi   - c * (Vi.y - Vl.y);

        this.F[i].x   += Gx; this.F[i].y   += Gy;
        this.F[linked].x -= Gx; this.F[linked].y -= Gy;

        // Torque: curl = delta × G  (z component)
        const curlZ = dX * Gy - dY * Gx;
        const Gw  = (phi_i - this.phi[linked]) * kw;
        const dW  = (this.omega[i] - this.omega[linked]) * cw;

        if (i !== 0) {
          this.tork[i]      -= Gw + curlZ - dW;
          this.tork[linked] += Gw - curlZ - dW;
        } else {
          this.tork[i]      -= 0.5 * Gw + curlZ - dW;
          this.tork[linked] += 0.5 * Gw - curlZ - dW;
        }
      }

      // Boundary forces
      const hw = p.width / 2, hh = p.height / 2;
      for (let i = 0; i <= nu; i++) {
        const fi = this.F[i], vi = this.V[i], xi = this.X[i];
        if (xi.x < -hw - 30) {
          fi.x += (-xi.x + hw - 30) * k * 0.5 - vi.x * c;
          fi.y -= vi.y * c / 3;
        }
        if (xi.x > hw + 150) {
          fi.x -= (xi.x - hw + 150) * k + vi.x * c;
          fi.y -= vi.y * c / 3;
        }
        if (xi.y < -hh - 20) {
          fi.y += (-xi.y + hh - 20) * k - vi.y * c;
          fi.x -= vi.x * c / 3;
        }
        if (xi.y > hh - 90) {
          fi.y -= (xi.y - hh + 90) * k + vi.y * c;
          fi.x -= vi.x * c / 3;
        }
      }

      if (this.hold) {
        const mx = b.handL_mov.x, my = b.handL_mov.y;
        const fh = this.F[this.held], xh = this.X[this.held], vh = this.V[this.held];
        fh.x -= (xh.x - mx) * k + vh.x * c;
        fh.y -= (xh.y - my) * k + vh.y * c;
      }
    }

    advect() {
      const halfPi = p.PI / 2;
      const piOver56 = p.PI / 56;
      const nu = this.numUsed;
      for (let i = 0; i <= nu; i++) {
        const vi = this.V[i], fi = this.F[i], xi = this.X[i];
        vi.x += fi.x; vi.y += fi.y;
        fi.x = 0;    fi.y = 0;
        xi.x += vi.x; xi.y += vi.y;

        this.omega[i] += this.tork[i] / I;
        this.tork[i] = 0;
        this.phi[i] += this.omega[i];
        this.omega[i] *= 0.999;

        if (i > 0) {
          const prev = this.phi[i - 1];
          if (this.phi[i] < prev - halfPi) this.phi[i] = prev - halfPi;
          else if (this.phi[i] > prev + halfPi) this.phi[i] = prev + halfPi;
        }
        if (this.omega[i] < -piOver56) this.omega[i] = -piOver56;
        else if (this.omega[i] > piOver56) this.omega[i] = piOver56;
      }
    }

    draw() {
      p.stroke(this.clr, 220);
      p.strokeWeight(2);
      if (!this.closed) p.noFill();
      else p.fill(this.clr, 100);

      p.beginShape();
      const z = -450 - this.dp;
      for (let i = 0; i <= this.numUsed; i++) {
        p.vertex(this.X[i].x, this.X[i].y, z);
      }
      this.closed ? p.endShape(p.CLOSE) : p.endShape();
    }

    penDown() {
      this.numUsed = 0;
      this.X[0].x = b.handL_mov.x;
      this.X[0].y = b.handL_mov.y;
      this.V[0].set(0, 0, 0);
      this.penDrag();
    }

    penDrag() {
      const mx = b.handL_mov.x + 25, my = b.handL_mov.y - 35;
      const cx = this.X[this.numUsed].x, cy = this.X[this.numUsed].y;
      const dvx = mx - cx, dvy = my - cy;
      const mag = Math.sqrt(dvx * dvx + dvy * dvy);
      const numNew = Math.floor(mag / elementLength);
      if (numNew > 0) {
        const nx = dvx / mag, ny = dvy / mag;
        for (let i = 1; i <= numNew; i++) {
          const f = (i / numNew) * mag;
          this.makeNode(cx + nx * f, cy + ny * f);
        }
      }
    }

    makeNode(x, y) {
      if (this.numUsed < num - 1) {
        this.numUsed++;
        const n = this.numUsed;
        this.X[n].x = x; this.X[n].y = y;
        this.V[n].set(0, 0, 0);
        this.dX[n - 1].set(x - this.X[n - 1].x, y - this.X[n - 1].y, 0);
      }
    }

    penUp() {
      const dx = this.X[0].x - this.X[this.numUsed].x;
      const dy = this.X[0].y - this.X[this.numUsed].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      this.dX[this.numUsed].set(dx, dy, 0);
      if (dist < 80) {
        this.closed = true;
        this.dp = p.random(-dist / 2, dist / 2);
      } else {
        this.closed = false;
      }
    }

    testGrab() {
      const mx = b.handL_mov.x, my = b.handL_mov.y;
      for (let i = 0; i <= this.numUsed; i++) {
        const dx = this.X[i].x - mx, dy = this.X[i].y - my;
        if (dx * dx + dy * dy < 25) { // 5² = 25
          this.hold = true;
          this.held = i;
          return true;
        }
      }
      return false;
    }

    destroy() {
      // No usar vectorPool aquí ya que usamos p5.Vectors
    }
  }

  // ── OPTIMIZACIÓN: spatialGrid con Map de enteros ───────────────────────────
  function updateSpatialGrid() {
    spatialGrid = new Map();
    for (let i = 1; i <= numSprings; i++) {
      for (let j = 0; j <= sprs[i].numUsed; j++) {
        const gx = Math.floor(sprs[i].X[j].x / gridSize);
        const gy = Math.floor(sprs[i].X[j].y / gridSize);
        const key = getGridKey(gx, gy);
        if (!spatialGrid.has(key)) spatialGrid.set(key, []);
        spatialGrid.get(key).push({ springIndex: i, pointIndex: j });
      }
    }
  }

  function collisions(whichOnes) {
    updateSpatialGrid();
    const collideRadSq = collideRad * collideRad;

    spatialGrid.forEach((points) => {
      const len = points.length;
      for (let i = 0; i < len; i++) {
        for (let j = i + 1; j < len; j++) {
          const p1 = points[i], p2 = points[j];
          if (p1.springIndex === p2.springIndex) continue;

          const X1 = sprs[p1.springIndex].X[p1.pointIndex];
          const X2 = sprs[p2.springIndex].X[p2.pointIndex];
          const dx = X1.x - X2.x, dy = X1.y - X2.y;
          const distSq = dx * dx + dy * dy;

          if (distSq < collideRadSq && distSq > 0) {
            const dist = Math.sqrt(distSq);
            const Fmag = collideK * (collideRad - dist);
            const nx = (dx / dist) * Fmag, ny = (dy / dist) * Fmag;
            sprs[p1.springIndex].F[p1.pointIndex].x += nx;
            sprs[p1.springIndex].F[p1.pointIndex].y += ny;
            sprs[p2.springIndex].F[p2.pointIndex].x -= nx;
            sprs[p2.springIndex].F[p2.pointIndex].y -= ny;
          }
        }
      }
    });
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

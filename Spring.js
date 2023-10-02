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
      this.clr = color(int(random(0, 255)), int(random(0, 255)), int(random(0, 255)));
      this.boundBox = new AABB();
      this.hold = false;
      this.held = 0;
  
      for (let i = 0; i < num; i++) {
        this.X[i] = createVector();
        this.V[i] = createVector();
        this.F[i] = createVector();
        this.dX[i] = createVector();
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
        const io = createVector(cos(this.phi[i]), sin(this.phi[i]));
        const jo = createVector(-sin(this.phi[i]), cos(this.phi[i]));
        const delta = p5.Vector.sub(this.X[i], this.X[linked]);
        const deltaPrime = createVector();
        deltaPrime.x = delta.x * io.x + delta.y * io.y;
        deltaPrime.y = delta.x * jo.x + delta.y * jo.y;
        const ddX = p5.Vector.sub(deltaPrime, this.dX[linked]);
        const GPrime = p5.Vector.mult(ddX, -k);
        const G = createVector();
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
        if (this.X[i].x < -width / 2) {
          this.F[i].x += (-this.X[i].x + width / 2) * k / 2 - this.V[i].x * c;
          this.F[i].y -= this.V[i].y * c / 3;
        }
        if (this.X[i].x > width / 2 + 200) {
          this.F[i].x -= (this.X[i].x - width / 2 + 200) * k + this.V[i].x * c;
          this.F[i].y -= this.V[i].y * c / 3;
        }
        if (this.X[i].y < -height / 2 - 200) {
          this.F[i].y += (-this.X[i].y + height / 2 - 200) * k - this.V[i].y * c;
          this.F[i].x -= this.V[i].x * c / 3;
        }
        if (this.X[i].y > height / 2 - 140) {
          this.F[i].y -= (this.X[i].y - height / 2 + 140) * k + this.V[i].y * c;
          this.F[i].x -= this.V[i].x * c / 3;
        }
      }
  
      if (this.hold) {
        const M = createVector();
        M.x = b.nb.x;
        M.y = b.nb.y;
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
          this.phi[i] = constrain(this.phi[i], this.phi[i - 1] - PI / 2, this.phi[i - 1] + PI / 2);
        }
        this.omega[i] = constrain(this.omega[i], -PI / 56, PI / 56);
      }
    }
  
    draw() {
      stroke(this.clr, 220);
      strokeWeight(2);
      if (!this.closed) {
        noFill();
      } else {
        fill(this.clr, 100);
      }
      beginShape();
      for (let i = 0; i <= this.numUsed; i++) {
        vertex(this.X[i].x, this.X[i].y, this.X[i].z - 450 - this.dp);
      }
      if (!this.closed) {
        endShape();
      } else {
        endShape(CLOSE);
      }
    }
  
    penDown() {
      this.numUsed = 0;
      this.X[this.numUsed].x = b.nb.x;
      this.X[this.numUsed].y = b.nb.y;
      this.V[this.numUsed].x = 0;
      this.V[this.numUsed].y = 0;
      this.penDrag();
    }
  
    penDrag() {
        const mouseVect = createVector(b.nb.x, b.nb.y);
        mouseVect.sub(this.X[this.numUsed]);
        const tempDatum = createVector(this.X[this.numUsed].x, this.X[this.numUsed].y);
        const numNew = floor(mouseVect.mag() / elementLength);
        if (numNew > 0) {
          const mMag = mouseVect.mag();
          mouseVect.normalize();
          for (let i = 1; i <= numNew; i++) {
            const interp = p5.Vector.add(tempDatum, p5.Vector.mult(mouseVect, (i / numNew) * mMag));
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
          this.dX[this.numUsed - 1] = p5.Vector.sub(this.X[this.numUsed], this.X[this.numUsed - 1]);
        }
      }
      penUp() {
        this.dX[this.numUsed] = p5.Vector.sub(this.X[0], this.X[this.numUsed]);
        if (this.dX[this.numUsed].mag() < 80) {
          this.closed = true;
          this.dp = random(-this.dX[this.numUsed].mag() / 2, this.dX[this.numUsed].mag() / 2);
        } else {
          this.closed = false;
        }
        this.drawing = false;
        this.cleared = false;
      }
      
       testGrab() {
        for (let i = 0; i <= numUsed; i++) {
          let M = createVector();
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
      
    
    
  
class ft {
    constructor() {
      this.fl = createVector(0, 0, 0);
      this.fr = createVector(0, 0, 0);
      this.hl = createVector(0, 0, 0);
      this.hr = createVector(0, 0, 0);
      this.l = 0;
      this.ll = 0;
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
        if (!this.tl && this.fl.x - xl < -150) {
          this.tl = true;
          this.l = (xl - this.fl.x) + random(-100, 10);
          this.h = abs(this.l * random(0.4, 0.6));
          this.lx = this.fl.x;
          this.fs = 0;
        } else if (!this.tl && this.fl.x - xl > 25) {
          this.tl = true;
          this.l = (xl - this.fl.x) - random(25, 125);
          this.h = abs(this.l * random(0.4, 0.6));
          this.lx = this.fl.x;
          this.fs = 0;
        }
        if (this.tl) {
          this.stpl(this.fl, this.l, this.ll, this.h, vm);
        }
      } else {
        if (!this.tr && this.fr.x - xr > 150) {
          this.tr = true;
          this.l = (xr - this.fr.x) + random(-10, 100);
          this.h = abs(this.l * random(0.4, 0.6));
          this.rx = this.fr.x;
          this.fs = 0;
        } else if (!this.tr && this.fr.x - xr < -25) {
          this.tr = true;
          this.l = (xr - this.fr.x) + random(25, 125);
          this.h = abs(this.l * random(0.4, 0.6));
          this.rx = this.fr.x;
          this.fs = 0;
        }
        if (this.tr) {
          this.stpr(this.fr, this.l, this.ll, this.h, vm);
        }
      }
    }
  
    stpl(n, l, ll, h, vm) {
      let it = map(constrain(vm, 0, 15), 0, 15, 0.25, 0.75);
      this.fs = lerp(this.fs, PI, it);
      n.x = this.lx + l * this.fs / PI;
      n.y = sin(this.fs) * -h + height / 2;
      if (this.fs >= PI - 0.01) {
        this.fs = PI;
        this.tl = false;
        this.trn = !this.trn;
      }
    }
  
    stpr(n, l, ll, h, vm) {
      let it = map(constrain(vm, 0, 15), 0, 15, 0.25, 0.75);
      this.fs = lerp(this.fs, PI, it);
      n.x = this.rx + l * this.fs / PI;
      n.y = sin(this.fs) * -h + height / 2;
      if (this.fs >= PI - 0.01) {
        this.fs = PI;
        this.tr = false;
        this.trn = !this.trn;
      }
    }
  }
  
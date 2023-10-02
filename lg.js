let vs, vm, ve, l, md;
class lg {
  
    constructor(v, m) {
      this.vs = v;
      this.vm = createVector(0, 0, 0);
      this.ve = createVector(0, 0, 0);
      this.l = 160;
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
  
        df.mult(sqrt(sq(this.l) - sq(d * 0.5)) / d);
        this.vm.set((this.vs.x + this.ve.x) * 0.5 + df.x, (this.vs.y + this.ve.y) * 0.5 + df.y, (this.vs.z + this.ve.z) * 0.5 + df.z);
      }
    }
  
    shw() {
      stroke(255, 120);
      strokeWeight(4);
      line(this.vs.x, this.vs.y, this.vs.z, this.vm.x, this.vm.y, this.vm.z);
      stroke(255, 100, 0, 180);
      line(this.ve.x, this.ve.y, this.ve.z, this.vm.x, this.vm.y, this.vm.z);
    }
  }
  
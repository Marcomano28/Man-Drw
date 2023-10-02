class AABB {
    constructor(ax, ay, bx, by, isP, dex, prnt, bi, tch) {
      this.A = createVector(ax, ay);
      this.B = createVector(bx, by);
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
    let ax = (D.A.x < C.A.x) ? D.A.x : C.A.x;
    let ay = (D.A.y < C.A.y) ? D.A.y : C.A.y;
    let bx = (D.B.x > C.B.x) ? D.B.x : C.B.x;
    let by = (D.B.y > C.B.y) ? D.B.y : C.B.y;
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
        false, i, spr, null, null
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
          aabbs[i][level + 1] = mergeAABB(aabbs[i * 2][level], aabbs[i * 2 + 1][level]);
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
  
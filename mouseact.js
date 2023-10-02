function mousePressed() {
    if (!drawing) {
      if (mouseButton === LEFT) {
        if (maxSprings >= numSprings + 1) {
          numSprings++;
          sprs[numSprings] = new Spring();
          sprs[numSprings].penDown();
          drawing = true;
        }
      }
      if (mouseButton === RIGHT) {
        if (numSprings > 0) {
          for (let j = 1; j <= numSprings; j++) {
            let g = sprs[j].testGrab();
          }
        }
      }
    }
  }
  
  function mouseDragged() {
    if (drawing) {
      sprs[numSprings].penDrag();
    }
  }
  
  function keyPressed() {
    if (key === ' ') {
      if (drawing) {
        sprs[numSprings].penUp();
        drawing = false;
      }
    }
    if (key === 'c') {
      if (numSprings > 0) {
        numSprings -= 1;
      }
    }
  }
  
let b;
let t = 0;
//
let np = 50; // Adjust as needed
let zoom = 3000/np; // Adjust as needed
let prts = [];
let prtsnv = [];
let prtsn = [];
let prtsv = [];
let wrnt = 5; // Set your wrnt value here
let off = 0;
let prtg=0.009999;
let frcg=0.979;
let rate;
//
let x = [];
let y = [];
let z = [];
let segLength = 12;
let sd;

//Springs
let num = 1000;
let maxSprings = 32;
let numSprings = 0;
let sprs = new Array(maxSprings + 1);
let elementLength = 5;
let collideRad = 7;
let collideK = 0.025;
let collideC = 0.2;
let k = 0.015;
let c = 0.03;
let I = 100;
let kw = 10.0;
let cw = 0.02;
let gravity = 0.00002;
let iterations = 75;
let drawing = false;
let cleared = true;

function setup() {
  createCanvas(windowWidth, windowHeight, WEBGL);

  for (let x = 0; x < np; x++) {
    prts[x] = [];
    prtsv[x] = [];
    prtsnv[x] = [];
    prtsn[x] = [];
    for (let y = 0; y < np; y++) {
      prts[x][y] = 0;
      prtsv[x][y] = 0;
      prtsnv[x][y] = 0;
      prtsn[x][y] = 0;
    }
  }
  smooth(8);
  pixelDensity(2);
  b = new body(140);
}

function draw() {
  background(0);
  lights();
  t = frameCount * 0.01;
  push();
  rotateY(t/200);
  translate(t*10,0,100-t);
  push();
  translate(100,-242,-width/2.8);
  stroke(180,180,180,80);
  noFill();
  strokeWeight(8);
  rect(0,0,1500,900);
  pop();
  //translate(-width-100,390,0);
  
  if (numSprings > 0) {
    let whichOnes = numSprings;
    if (drawing) {
      whichOnes = numSprings - 1;
    }
    for (let i = 1; i <= iterations; i++) {
      for (let j = 1; j <= whichOnes; j++) {
        sprs[j].internalForces();
      }
      if (numSprings > 1 && !((numSprings === 2 && drawing === true))) {
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
  b.shw();
  push();
  translate(-width-100,390,0);
  rotateX(-PI/2);
  updateParticles();
  drawC();
  drawM();
 pop();
  for (let k = 0; k < 12; k++) {
    dragSegment(0, b.pt.x, b.pt.y + sd, b.pt.z + 60);
  
    for (let i = 0; i < x.length - 1; i++) {
      dragSegment(i + 1, x[i], y[i], z[i]);
    }
  }
  pop();
}
function updateParticles() {
  for (let x = 1; x < np - 2; x++) {
    let f1 = 0;
    f1 +=prts[x-1]-prts[x];
    f1 +=prts[x+1]-prts[x];
    f1 +=prts[x]-prts[x];
    for (let y = 1; y < np - 2; y++) { 
      let f1=0;   
      f1 += prts[x - 1][y - 1] - prts[x][y];
      f1 += prts[x - 1][y] - prts[x][y];
      f1 += prts[x - 1][y + 1] - prts[x][y];
      f1 += prts[x + 1][y - 1] - prts[x][y];
      f1 += prts[x + 1][y] - prts[x][y];
      f1 += prts[x + 1][y + 1] - prts[x][y];
      f1 += prts[x][y - 1] - prts[x][y];
      f1 += prts[x][y + 1] - prts[x][y];

      f1 -= prts[x][y + 1] / 8;
      prtsnv[x][y] = 0.945 * prtsnv[x][y] + f1 / 100;
      prtsn[x][y] = prts[x][y] + prtsnv[x][y];
    }
  }
  for (let x = 1; x < np - 1; x++) {
    prts[x] = prtsn[x];
    for (let y = 1; y < np - 1; y++) {
      prts[x][y] = prtsn[x][y];
    }
  }
  if (wrnt !== 0) {
    off += 1.5;
    let mx = Math.floor(2 + (np - 2) * mouseX / width);
    let my = Math.floor(0 + (np - 2) * constrain(120 - mouseY / height, 100, 0) / height * 2);
    prtsnv[mx][my] = wrnt;
    prtsnv[mx + 1][my + 1] = wrnt;
    prtsnv[mx + 1][my] = wrnt;
    prtsnv[mx + 1][my - 1] = wrnt;
    prtsnv[mx][my - 1] = wrnt;
    prtsnv[mx - 1][my + 1] = wrnt;
    prtsnv[mx - 1][my] = wrnt;
    prtsnv[mx - 1][my - 1] = wrnt;

    prts[mx][my] = wrnt * 10;
    prts[mx + 1][my + 1] = wrnt * 5;
    prts[mx + 1][my] = wrnt * 10;
    prts[mx + 1][my - 1] = wrnt * 5;
    prts[mx][my - 1] = wrnt * 10;
    prts[mx - 1][my + 1] = wrnt * 5;
    prts[mx - 1][my] = wrnt * 10;
    prts[mx - 1][my - 1] = wrnt * 5;
  }
}

function drawC() {
  strokeWeight(0.7);
  stroke(255, 200);
  line(0, 0, 0, 100, 0, 0);
  stroke(0, 255, 0);
  line(0, 0, 0, 0, 100, 0);
}

function drawM() {
  stroke(255, 40);
  strokeWeight(0.6);
  noFill();
  for (let x = 0; x < np - 1; x++) {
    for (let y = 0; y < np - 1; y++) {
      beginShape();
      vertex(x * zoom, y * zoom, prts[x][y]);
      vertex((x + 1) * zoom, y * zoom, prts[x + 1][y]);
      vertex((x + 1) * zoom, (y + 1) * zoom, prts[x + 1][y + 1]);
      vertex(x * zoom, (y + 1) * zoom, prts[x][y + 1]);
      endShape();
    }
  }
}
function dragSegment(i, xin, yin, zin) {
  let dx = xin - x[i];
  let dy = yin - y[i];
  let dz = zin - z[i];
  let angle = b.rd * 0.25 + atan2(dy, dx);
  let an2 = b.rd * 0.25 + atan2(dz, dx);
  x[i] = xin - cos(angle) * segLength;
  y[i] = yin - sin(angle) * (segLength - 0.81) + 1.5;
  z[i] = zin - cos(an2) * segLength;
  segment(x[i], y[i], z[i], angle);
}

function segment(x, y, z, a) {
  push();
  translate(x, y, z);
  rotateY(a);
  stroke(255, 70);
  strokeWeight(4);
  line(0, 0, 0, segLength, 0, 0);
  pop();
}

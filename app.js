let f = 0;
let w = 100;
let d = 50;
let W = 400;

setup = _ => {
	createCanvas(windowWidth, W = windowHeight, WEBGL);
	w = windowHeight / 4;
	d = w / 2;
}

draw = _ => {
	background(50);
	noStroke();
	[2, 2, -2].map(i => spotLight(W, W, W, 0, -W * i, w, 0, i, 0));
	rotateY(f += .01);
	for (z = -w; z <= w; z += d) {
		for (y = -w; y <= w; y += d) {
			for (x = -w; x <= w; x += d) {
				push();
				translate(x, y, z);
				sphere((sin(x / w + y / w + z + f * 2) / 16) * (windowHeight));
				pop();
			}
		}
	}
}
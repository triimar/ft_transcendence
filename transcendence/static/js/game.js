const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
let raf;

const ball = {
  x: 100,
  y: 100,
  vx: 5,
  vy: 2,
  radius: 25,
  color: "blue",
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();
	//ctx.restore();
  },
};

const paddleLeft= {
	x: 10,
	y: canvas.height/2,
	vx: 0,
	vy: 3,
	height: 100,
	width: 50,
	color: "green",
	draw() {
		ctx.fillStyle = this.color;
		ctx.fillRect(this.x, this.y, this.width, this.height);
	}
};

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  //ctx.fillRect(paddleLeft.x, paddleLeft.y, paddleLeft.width, paddleLeft.height);
  paddleLeft.draw();
  ball.draw();
  ball.x += ball.vx;
  ball.y += ball.vy;
  
  if (
    ball.y + ball.vy > canvas.height - ball.radius ||
    ball.y + ball.vy < ball.radius
) {
	ball.vy = -ball.vy;
}
if (
	ball.x + ball.vx > canvas.width - ball.radius ||
    ball.x + ball.vx < ball.radius
) {
	ball.vx = -ball.vx;
}

raf = window.requestAnimationFrame(draw);
}

document.addEventListener("keydown", (e) => {
	console.log(paddleLeft.y);
	switch (e.key) {
		case "ArrowDown":
			paddleLeft.y += paddleLeft.vy;
			if (paddleLeft.y > canvas.height - paddleLeft.height/2)
				paddleLeft.y = canvas.height - paddleLeft.height/2;
		break;
		case "ArrowUp":
			paddleLeft.y -= paddleLeft.vy;
			if (paddleLeft.y < 0)
				paddleLeft.y = 0;
			break;
		default:
			console.log(e.key);
			return;
	}
}, true);

canvas.addEventListener("mouseover", (e) => {
  raf = window.requestAnimationFrame(draw);
});

canvas.addEventListener("mouseout", (e) => {
  window.cancelAnimationFrame(raf);
});


ball.draw();
paddleLeft.draw();
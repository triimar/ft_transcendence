const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const BALL_SPEED_X = 5;
const BALL_SPEED_Y = 2;
const PADDLE_H = 150;
const PADDLE_W = 50;

let raf;
let pause = false;

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const ball = {
  x: canvas.width / 2,
  y: canvas.height / 2,
  vx: BALL_SPEED_X,
  vy: BALL_SPEED_Y,
  radius: 25,
  isReset: true,
  isSpeedingUp: true,
  color: "blue",
  draw() {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();
  },
  reset(side) {
	this.x = canvas.width / 2;
	this.y = canvas.height / 2;
	this.vx = BALL_SPEED_X * side;
	this.vy = BALL_SPEED_Y;
	this.isReset = true;
	this.isSpeedingUp = false;
	this.vx = 1 * side;
  }
};

const paddleLeft= {
	x: 0,
	y: canvas.height/2,
	vx: 0,
	vy: 6,
	height: PADDLE_H,
	width: PADDLE_W,
	color: "green",
	draw() {
		ctx.fillStyle = this.color;
		ctx.fillRect(this.x, this.y, this.width, this.height);
	},
	reset() {
		this.y = canvas.height/2 - PADDLE_H/2;
		this.height = PADDLE_H;
		this.width = PADDLE_W;
	}
};

const paddleRight = {
	x: canvas.width - PADDLE_W,
	y: canvas.height/2,
	vx: 0,
	vy: 6,
	height: PADDLE_H,
	width: PADDLE_W,
	color: "green",
	draw() {
		ctx.fillStyle = this.color;
		ctx.fillRect(this.x, this.y, this.width, this.height);
	},
	reset() {
		this.y = canvas.height/2 - PADDLE_H/2;
		this.height = PADDLE_H;
		this.width = 50;
	}
};

function moving() {
	if (ball.vx != 5 && ball.vx != -5 && !ball.isSpeedingUp) {
		
		ball.isSpeedingUp = true;
		setTimeout(function() {
			if (ball.vx > 0 && ball.vx != 5)
				ball.vx++;
			else if (ball.vx != -5)
				ball.vx--;
			ball.isSpeedingUp = false;
		}, 1000);
	}

	ball.x += ball.vx;
	ball.y += ball.vy;
  
  	if (
		ball.y + ball.vy > canvas.height - ball.radius ||
    	ball.y + ball.vy < ball.radius)
	{
		ball.vy = -ball.vy;
	}
	if (ball.x + ball.vx > canvas.width - ball.radius)
	{
		ball.reset(-1);
		paddleLeft.reset();
		paddleRight.reset();
	}
	if (ball.x + ball.vx < ball.radius){
		ball.reset(1);
		paddleLeft.reset();
		paddleRight.reset();
	}
	if (ball.x + ball.vx < ball.radius + paddleLeft.width &&
		ball.y + ball.vy < paddleLeft.y + paddleLeft.height &&
		ball.y + ball.vy > paddleLeft.y && ball.vx < 0)
	{
		ball.vx = -ball.vx;
	}
	if (ball.x + ball.vx > paddleRight.x - ball.radius &&
		ball.y + ball.vy < paddleRight.y + paddleRight.height &&
		ball.y + ball.vy > paddleRight.y && ball.vx > 0)
	{
		ball.vx = -ball.vx;
	}
}

async function draw() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	paddleLeft.draw();
	paddleRight.draw();
	ball.draw();
	if (ball.isReset) {
		pause = true;
		ball.isReset = false;
		setTimeout(function() {
			pause = false;
		}, 3000);
	}
	if (!pause)
		moving();
	raf = window.requestAnimationFrame(draw);
}

document.addEventListener("keydown", (e) => {
	switch (e.key) {
		case "ArrowDown":
			paddleRight.y += paddleRight.vy;
			if (paddleRight.y > canvas.height - paddleRight.height)
				paddleRight.y = canvas.height - paddleRight.height;
		break;
		case "ArrowUp":
			paddleRight.y -= paddleRight.vy;
			if (paddleRight.y < 0)
				paddleRight.y = 0;
			break;
		case "s":
			paddleLeft.y += paddleLeft.vy;
			if (paddleLeft.y > canvas.height - paddleLeft.height)
				paddleLeft.y = canvas.height - paddleLeft.height;
		break;
		case "w":
			paddleLeft.y -= paddleLeft.vy;
			if (paddleLeft.y < 0)
				paddleLeft.y = 0;
			break;
		case " ":
			window.cancelAnimationFrame(raf);
			break;
		case "Enter":
			raf = window.requestAnimationFrame(draw);
		default:
			return;
	}
}, true);

/*canvas.addEventListener("mouseover", (e) => {
  raf = window.requestAnimationFrame(draw);
});

canvas.addEventListener("mouseout", (e) => {
  window.cancelAnimationFrame(raf);
});
*/

ball.draw();
paddleLeft.draw();
paddleRight.draw();

raf = window.requestAnimationFrame(draw);
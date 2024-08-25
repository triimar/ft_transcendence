const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const BALL_SPEED_X = 5;
const BALL_SPEED_Y = 2;
const PADDLE_H = 150;
const PADDLE_W = 50;
const PADDLE_SPEED = 6;
const AI_SPEED = 10;

// PID constants
const Kp = 2.0;  // Proportional constant
const Ki = 1.9;  // Integral constant
const Kd = 0.1; // Derivative constant

// PID variables
let integral = 0;
let previousError = 0;

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
  draw()
  {
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fillStyle = this.color;
    ctx.fill();
  },
  reset(side)
  {
	this.x = canvas.width / 2;
	this.y = canvas.height / 2;
	this.vx = BALL_SPEED_X * side;
	this.vy = BALL_SPEED_Y;
	this.isReset = true;
	this.isSpeedingUp = false;
	this.vx = 1 * side;
  }
};

const paddleLeft = {
	x: 0,
	y: canvas.height/2 - PADDLE_H/2,
	vy: PADDLE_SPEED,
	height: PADDLE_H,
	width: PADDLE_W,
	color: "green",
	draw()
	{
		ctx.fillStyle = this.color;
		ctx.fillRect(this.x, this.y, this.width, this.height);
	},
	reset()
	{
		this.y = canvas.height/2 - PADDLE_H/2;
		this.height = PADDLE_H;
		this.width = PADDLE_W;
	}
};

const ai = {
	x: canvas.width - PADDLE_W,
	y: canvas.height/2 - PADDLE_H/2,
	vy: AI_SPEED,
	height: PADDLE_H,
	width: PADDLE_W,
	color: "pink",
	draw()
	{
		ctx.fillStyle = this.color;
		ctx.fillRect(this.x, this.y, this.width, this.height);
	},
	reset()
	{
		this.y = canvas.height/2 - PADDLE_H/2;
		this.height = PADDLE_H;
		this.width = 50;
		integral = 0;
		previousError = 0;
	}
};

function update_paddle_ai() {
	const now = Date.now();
    const dt = (now - lastTime) / 1000; // Convert ms to seconds
    lastTime = now;

	const rt = 0.1; //reaction time to see ahead of the ball
	const predictedBallY = ball.y + ball.vy * 0.1;
	const error = predictedBallY - (ai.y + ai.height/2);
	integral += error * dt;
	const deriv = (error - previousError) / dt;
	console.log(predictedBallY + ", " + ball.y);

	const newPos = ((error * Kp) + (integral * Ki) + (deriv * Kd)) * ai.vy;
	ai.y += newPos / canvas.height;
	previousError = error;
}

function moving_ai() {
	if (ball.vx != 5 && ball.vx != -5 && !ball.isSpeedingUp)
	{
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
		ai.reset();
	}
	if (ball.x + ball.vx < ball.radius)
	{
		ball.reset(1);
		paddleLeft.reset();
		ai.reset();
	}
	if (ball.x + ball.vx < ball.radius + paddleLeft.width &&
		ball.y + ball.vy < paddleLeft.y + paddleLeft.height &&
		ball.y + ball.vy > paddleLeft.y && ball.vx < 0)
	{
		ball.vx = -ball.vx;
	}
	if (ball.x + ball.vx > ai.x - ball.radius &&
		ball.y + ball.vy < ai.y + ai.height &&
		ball.y + ball.vy > ai.y && ball.vx > 0)
	{
		ball.vx = -ball.vx;
	}

	update_paddle_ai();
	if (ai.y < 0)
		ai.y = 0;
	if (ai.y > canvas.height - ai.height)
		ai.y = canvas.height - ai.height;
}

async function draw() {
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	paddleLeft.draw();
	ai.draw();
	ball.draw();
	if (ball.isReset)
	{
		pause = true;
		ball.isReset = false;
		setTimeout(function() {
			pause = false;
		}, 3000);
	}
	if (!pause)
		moving_ai();
	raf = window.requestAnimationFrame(draw);
}

document.addEventListener("keydown", (e) => {
	switch (e.key) {
		case "ArrowDown":
		case "s":
			paddleLeft.y += paddleLeft.vy;
			if (paddleLeft.y > canvas.height - paddleLeft.height)
			paddleLeft.y = canvas.height - paddleLeft.height;
		break;
		case "ArrowUp":
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
let lastTime = Date.now();

raf = window.requestAnimationFrame(draw);
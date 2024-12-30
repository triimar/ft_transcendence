import { myself } from "../myself.js";
export default class ComponentGameBoard extends HTMLElement {
	constructor() {
		super();
		this.shadow = this.attachShadow({ mode: "open" });
		const template = document.getElementById("component-game-board");
		this.shadow.appendChild(template.content.cloneNode(true));
	}

	getMyPaddle() {
		if (this.side == 0)
			return this.paddleLeft;
		else
			return this.paddleRight;
	}

	startMatch(ball, side) {
		this.side = side;
		this.ball.x = ball["position"]["x"]
		this.ball.y = ball["position"]["y"]
		this.ball.vx = ball["position"]["vx"]
		this.ball.vy = ball["position"]["vy"]
	}

	oponentPaddleMoved(side, position) {
		if (side == 0)
			this.paddleLeft = position;
		else
			this.paddleRight = position;
	}

	connectedCallback() {
		const canvas = this.shadow.querySelector("canvas");
		const ctx = canvas.getContext("2d");
		const BALL_SPEED = 5;
		const MAXBOUNCEANGLE = Math.PI/4;
		const PADDLE_H = canvas.width/10;
		const PADDLE_W = canvas.width/10;
		const PADDLE_SPEED = 15;

		let pause = false;

		function sleep(ms) {
			return new Promise(resolve => setTimeout(resolve, ms));
		}

		this.ball = {
			x: canvas.width / 2,
			y: canvas.height / 2,
			vx: BALL_SPEED,
			vy: BALL_SPEED,
			size: 50,
			isReset: true,
			isSpeedingUp: true,
			color: "blue",
			draw()
			{
				ctx.fillStyle = this.color;
				ctx.fillRect(this.x, this.y, this.size, this.size);
			},
			reset(side)
			{
				this.x = canvas.width / 2;
				this.y = canvas.height / 2;
				this.vx = BALL_SPEED * side;
				this.vy = BALL_SPEED;
				this.isReset = true;
				this.isSpeedingUp = false;
				this.vx = 1 * side;
			}
		};

		this.paddleLeft = {
			name: "6_6",
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
				ctx.font="60px Monomaniac One";
				ctx.textAlign="center"; 
				ctx.textBaseline = "middle";
				ctx.fillStyle = "#FFFFFF";
				ctx.fillText(this.name, this.x + this.width/2, this.y + this.height/2);
			},
			reset()
			{
				this.y = canvas.height/2 - PADDLE_H/2;
				this.height = PADDLE_H;
				this.width = PADDLE_W;
			}
		};

		this.paddleRight = {
			name: "0-0",
			x: canvas.width - PADDLE_W,
			y: canvas.height/2 - PADDLE_H/2,
			vy: PADDLE_SPEED,
			height: PADDLE_H,
			width: PADDLE_W,
			color: "green",
			draw()
			{
				ctx.fillStyle = this.color;
				ctx.fillRect(this.x, this.y, this.width, this.height);
				ctx.font="60px Monomaniac One";
				ctx.textAlign="center"; 
				ctx.textBaseline = "middle";
				ctx.fillStyle = "#FFFFFF";
				ctx.fillText(this.name, this.x + this.width/2, this.y + this.height/2);
			},
			reset()
			{
				this.y = canvas.height/2 - PADDLE_H/2;
				this.height = PADDLE_H;
				this.width = PADDLE_W;
			}
		};

		function moving() {
			if (this.ball.vx != PADDLE_SPEED && this.ball.vx != -PADDLE_SPEED && !this.ball.isSpeedingUp)
			{
				this.ball.isSpeedingUp = true;
				setTimeout(function() {
					if (this.ball.vx > 0 && this.ball.vx != PADDLE_SPEED)
						this.ball.vx++;
					else if (this.ball.vx != -PADDLE_SPEED)
						this.ball.vx--;
					this.ball.isSpeedingUp = false;
				}, 1000);
			}

			this.ball.x += this.ball.vx;
			this.ball.y += this.ball.vy;
		  	//Bounce off the ceiling/floor
			if (
				this.ball.y + this.ball.vy > canvas.height - this.ball.size ||
				this.ball.y + this.ball.vy <= 0)
			{
				this.ball.vy = -this.ball.vy;
				updateBall();
			}
			//Right wall collision
			if (this.ball.x + this.ball.vx > canvas.width - this.ball.size)
			{
				this.ball.reset(-1);
				this.paddleLeft.reset();
				this.paddleRight.reset();
			}
			//Left wall collision
			if (this.ball.x + this.ball.vx < 0)
			{
				this.ball.reset(1);
				this.paddleLeft.reset();
				this.paddleRight.reset();
			}
			if (this.ball.x + this.ball.vx < this.paddleLeft.width + this.paddleLeft.x &&
				this.ball.y + this.ball.vy < this.paddleLeft.y + this.paddleLeft.height &&
				this.ball.y + this.ball.vy + this.ball.size > this.paddleLeft.y && this.ball.vx < 0)
			{
				//Horizontal collision
				if (this.ball.x + this.ball.vx + this.ball.size > this.paddleLeft.width + this.paddleLeft.x)
				{
					var relativeIntersection = (this.ball.y + this.ball.size/2 + this.ball.vy) - (this.paddleLeft.y + this.paddleLeft.height / 2);
					var normalizedRelativeIntersectionY = (relativeIntersection/(this.paddleLeft.height/2));
					var bounceAngle = normalizedRelativeIntersectionY * MAXBOUNCEANGLE;
					var velocityY = this.ball.vy > 0 ? 1 : -1;
					this.ball.vx = BALL_SPEED*Math.cos(bounceAngle);
					this.ball.vy = BALL_SPEED*Math.sin(bounceAngle);
					if ((this.ball.vy > 0 && velocityY === -1) || this.ball.vy < 0 && velocityY === 1)
						this.ball.vy *= -1;
					this.ball.vx = Math.abs(this.ball.vx);
					updateBall();
				}
				else if (this.ball.y + this.ball.vy < this.paddleLeft.y) //Upper side collision
				{
					this.ball.vx = -this.ball.vx;
					if (this.ball.vy > 0)
						this.ball.vy = -this.ball.vy;
					updateBall();
				}
				else if (this.ball.y + this.ball.vy + this.ball.size > this.paddleLeft.y + this.paddleLeft.height) //Lower side collision
				{
					this.ball.vx = -this.ball.vx;
					if (this.ball.vy < 0)
						this.ball.vy = -this.ball.vy;
					updateBall();
				}
			}
			//Right paddle collisions
			if (this.ball.x + this.ball.vx + this.ball.size > this.paddleRight.x &&
				this.ball.y + this.ball.vy < this.paddleRight.y + this.paddleRight.height &&
				this.ball.y + this.ball.vy + this.ball.size > this.paddleRight.y && this.ball.vx > 0)
			{
				//Horizontal collision
				if (this.ball.x + this.ball.vx < this.paddleRight.x) {
					var relativeIntersection = ((this.ball.y + this.ball.size/2) + this.ball.vy) - (this.paddleRight.y + this.paddleRight.height/2);
					var normalizedRelativeIntersectionY = (relativeIntersection/(this.paddleRight.height/2));
					var bounceAngle = normalizedRelativeIntersectionY * MAXBOUNCEANGLE;
					var velocityY = this.ball.vy > 0 ? 1 : -1;
					this.ball.vx = BALL_SPEED*Math.cos(bounceAngle);
					this.ball.vy = BALL_SPEED*Math.sin(bounceAngle);
					if ((this.ball.vy > 0 && velocityY === -1) || this.ball.vy < 0 && velocityY === 1)
						this.ball.vy *= -1;
					this.ball.vx = -Math.abs(this.ball.vx);
					updateBall();
				}
				else if (this.ball.y + this.ball.vy < this.paddleRight.y) //Upper side collision
				{
					this.ball.vx = -this.ball.vx;
					if (this.ball.vy > 0)
						this.ball.vy = -this.ball.vy;
					updateBall();
				}
				else if (this.ball.y + this.ball.vy + this.ball.size > this.paddleRight.y + this.paddleRight.height) //Lower side collision
				{
					this.ball.vx = -this.ball.vx;
					if (this.ball.vy < 0)
						this.ball.vy = -this.ball.vy;
					updateBall();
				}
			}
		}

		async function draw() {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			this.paddleLeft.draw();
			this.paddleRight.draw();
			this.ball.draw();
			if (this.ball.isReset)
			{
				pause = true;
				this.ball.isReset = false;
				setTimeout(function() {
					pause = false;
				}, 3000);
			}
			if (!pause)
				moving();
			this.raf = window.requestAnimationFrame(draw);
		}

		this.keydownEventListener = ((e) => {
			if (["ArrowUp", "ArrowDown", " "].includes(e.key)) {
				// Prevent the default action (scrolling)
				e.preventDefault();
			}
			switch (e.key) {
				case "ArrowDown":
					getMyPaddle().y += getMyPaddle().vy;
					if (getMyPaddle().y > this.canvas.height - getMyPaddle().height)
						getMyPaddle().y = this.canvas.height - getMyPaddle().height;
					paddleMove();
				break;
				case "ArrowUp":
					getMyPaddle().y -= getMyPaddle().vy;
					if (getMyPaddle().y < 0)
						getMyPaddle().y = 0;
					paddleMove();
				break;
				case "s":
					getMyPaddle().y += getMyPaddle().vy;
					if (getMyPaddle().y > this.canvas.height - getMyPaddle().height)
						getMyPaddle().y = this.canvas.height - getMyPaddle().height;
					paddleMove();
				break;
				case "w":
					getMyPaddle().y -= getMyPaddle().vy;
					if (getMyPaddle().y < 0)
						getMyPaddle().y = 0;
					paddleMove();
				break;
				case " ":
					window.cancelAnimationFrame(this.raf);
					break;
				case "Enter":
					this.raf = window.requestAnimationFrame(draw);
				default:
					return;
			}
		}).bind(this);

		document.addEventListener("keydown", this.keydownEventListener, true);

		this.ball.draw();
		this.paddleLeft.draw();
		this.paddleRight.draw();

		this.raf = window.requestAnimationFrame(draw);
	}

	disconnectedCallback() {
		document.removeEventListener("keydown", this.keydownEventListener, true);
	}

	updateBall() {
		myself.sendMessage(JSON.stringify({
			'type': 'ball_bounce',
			'ball': {
				'position': {'x': this.ball.x, 'y': this.ball.y},
				'velocity': {'vx': this.ball.vx, 'vy': this.ball.vy}
			}
		}))
	}

	paddleMove() {
		myself.sendMessage(JSON.stringify({
			'type': 'paddle_move',
			'position': getMyPaddle().y
		}))
	}


}

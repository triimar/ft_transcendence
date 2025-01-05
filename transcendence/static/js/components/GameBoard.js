import { myself, sleep } from "../myself.js";
export default class ComponentGameBoard extends HTMLElement {
	constructor() {
		super();
		this.shadow = this.attachShadow({ mode: "open" });
		const template = document.getElementById("component-game-board");
		this.shadow.appendChild(template.content.cloneNode(true));
		this.raf = null;
	}

	getMyPaddle() {
		if (this.side == 0)
			return this.paddleLeft;
		else
			return this.paddleRight;
	}

	countdown() {
		let blocker = this.shadow.querySelector("#blocker");
		blocker.classList.add("show");
		let countdownPromise = new Promise((resolve) => {
			let seconds = 5;
			let intervalId = setInterval(() => {
				let countdownText = blocker.children[0];
				if (seconds == 0) {
					countdownText.textContent = "Start";
					clearInterval(intervalId);
					resolve();
				} else {
					countdownText.textContent = seconds;
					seconds--;
				}
			}, 1000);
		});
		return countdownPromise.then(() => sleep(1000)).then(() => blocker.classList.remove("show"));
	}

	startMatch(message) {
		let ball = message["ball"];
		let side = message["side"];
		let playerLeft = message["players"][0];
		let playerRight = message["players"][1];
		this.side = side;
		this.ball.x = ball["position"]["x"];
		this.ball.y = ball["position"]["y"];
		this.ball.vx = ball["velocity"]["vx"];
		this.ball.vy = ball["velocity"]["vy"];
		this.paddleLeft.name = playerLeft["player_emoji"];
		this.paddleLeft.color = '#' + playerLeft["player_bg_color"];
		this.paddleRight.name = playerRight["player_emoji"];
		this.paddleRight.color = '#' + playerRight["player_bg_color"];

		this.ball.draw();
		this.paddleRight.draw();
		this.paddleLeft.draw();

		console.log(this.side);

		document.addEventListener("keydown", this.keydownEventListener, true);
		this.raf = window.requestAnimationFrame(this.gameLoop);
	}

	freezeMatch() {
		if (this.raf != null) {
			window.cancelAnimationFrame(this.raf);
			document.removeEventListener("keydown", this.keydownEventListener, true);
			this.raf = null;
		}
	}

	unfreezeMatch() {
		if (this.raf == null) {
			document.addEventListener("keydown", this.keydownEventListener, true);
			this.raf = window.requestAnimationFrame(this.draw);
		}
	}

	oponentPaddleMoved(side, position) {
		if (side == this.side) {
			return;
		}
		if (side == 0)
			this.paddleLeft.y = position;
		else
			this.paddleRight.y = position;
		// TODO: maybe need to change more than just y, maybe the velocity as well?
	}

	pointScored(side) {
		if (side == 0)
			this.score.left++;
		else
			this.score.right++;
	}

	ballBounced(message) {
		let ball = message["ball"];
		this.ball.x = ball["position"]["x"];
		this.ball.y = ball["position"]["y"];
		this.ball.vx = ball["velocity"]["vx"];
		this.ball.vy = ball["velocity"]["vy"];
	}

	connectedCallback() {
		const canvas = this.shadow.querySelector("canvas");
		const ctx = canvas.getContext("2d");
		const BALL_SPEED = 5;
		const MAXBOUNCEANGLE = Math.PI/4;
		const PADDLE_H = canvas.width/10;
		const PADDLE_W = canvas.width/10;
		const PADDLE_SPEED = 15;
		let lastTime = 0; // The timestamp of the last frame
		// let serverTimeOffset = 0; // Difference between server and local clock
		let accumulatedTime = 0; // Accumulated time for fixed updates
		const updateInterval = 1000 / 60; // Fixed update interval (16.67 ms for 60 FPS)


		let pause = false;

		function sleep(ms) {
			return new Promise(resolve => setTimeout(resolve, ms));
		}

		this.score = {
			left: 0,
			right: 0,
			color: "black",
			draw()
			{
				ctx.fillStyle = this.color;
				ctx.globalAlpha = 0.2;
				ctx.font = '200px Monomaniac One';
				ctx.fillText(this.left.toString(), canvas.width / 3 - ctx.measureText(this.left.toString()).width / 2, canvas.height / 2);
				ctx.fillText(this.right.toString(), canvas.width - (canvas.width / 3 - ctx.measureText(this.right.toString()).width / 2), canvas.height / 2);
				ctx.globalAlpha = 1;
			}
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
				setTimeout((function() {
					if (this.ball.vx > 0 && this.ball.vx != PADDLE_SPEED)
						this.ball.vx++;
					else if (this.ball.vx != -PADDLE_SPEED)
						this.ball.vx--;
					this.ball.isSpeedingUp = false;
				}).bind(this), 1000);
			}

			this.ball.x += this.ball.vx;
			this.ball.y += this.ball.vy;
		  	//Bounce off the ceiling/floor
			if (
				this.ball.y + this.ball.vy > canvas.height - this.ball.size ||
				this.ball.y + this.ball.vy <= 0)
			{
				this.ball.vy = -this.ball.vy;
				this.updateBall();
			}
			//Right wall collision
			if (this.ball.x + this.ball.vx > canvas.width - this.ball.size)
			{
				if (this.side != 1)
					this.scorePoint();
				this.ball.reset(-1);
				this.paddleLeft.reset();
				this.paddleRight.reset();
			}
			//Left wall collision
			if (this.ball.x + this.ball.vx < 0)
				{
				if (this.side != 0)
					this.scorePoint();
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
					this.updateBall();
				}
				else if (this.ball.y + this.ball.vy < this.paddleLeft.y) //Upper side collision
				{
					this.ball.vx = -this.ball.vx;
					if (this.ball.vy > 0)
						this.ball.vy = -this.ball.vy;
					this.updateBall();
				}
				else if (this.ball.y + this.ball.vy + this.ball.size > this.paddleLeft.y + this.paddleLeft.height) //Lower side collision
				{
					this.ball.vx = -this.ball.vx;
					if (this.ball.vy < 0)
						this.ball.vy = -this.ball.vy;
					this.updateBall();
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
					this.updateBall();
				}
				else if (this.ball.y + this.ball.vy < this.paddleRight.y) //Upper side collision
				{
					this.ball.vx = -this.ball.vx;
					if (this.ball.vy > 0)
						this.ball.vy = -this.ball.vy;
					this.updateBall();
				}
				else if (this.ball.y + this.ball.vy + this.ball.size > this.paddleRight.y + this.paddleRight.height) //Lower side collision
				{
					this.ball.vx = -this.ball.vx;
					if (this.ball.vy < 0)
						this.ball.vy = -this.ball.vy;
					this.updateBall();
				}
			}
		}

		this.draw = (function() {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			this.score.draw();
			this.paddleLeft.draw();
			this.paddleRight.draw();
			this.ball.draw();
			// if (this.ball.isReset)
			// {
			// 	pause = true;
			// 	this.ball.isReset = false;
			// 	setTimeout(function() {
				// 		pause = false;
				// 	}, 3000);
				// }
				// if (!pause)
				// 	moving.bind(this)();
				// this.raf = window.requestAnimationFrame(this.draw);
			}).bind(this);
			
			this.gameLoop = (function(timeStamp) {
				if (!lastTime) lastTime = Date.now();
	
				const deltaTime = timeStamp - lastTime;
				lastTime = timeStamp;
	
				accumulatedTime += deltaTime;
				if (accumulatedTime < 0) accumulatedTime = 0;
				while (accumulatedTime >= updateInterval) {
					moving.bind(this)();
					accumulatedTime -= updateInterval;
				}
	
				this.draw();
				this.raf = window.requestAnimationFrame(this.gameLoop);
			}).bind(this);
		
		this.keydownEventListener = ((e) => {
			if (["ArrowUp", "ArrowDown", " "].includes(e.key)) {
				// Prevent the default action (scrolling)
				e.preventDefault();
			}
			switch (e.key) {
				case "s":
				case "ArrowDown":
					this.getMyPaddle().y += this.getMyPaddle().vy;
					if (this.getMyPaddle().y > canvas.height - this.getMyPaddle().height)
						this.getMyPaddle().y = canvas.height - this.getMyPaddle().height;
					this.paddleMove();
					break;
				case "w":
				case "ArrowUp":
					this.getMyPaddle().y -= this.getMyPaddle().vy;
					if (this.getMyPaddle().y < 0)
						this.getMyPaddle().y = 0;
					this.paddleMove();
					break;
				case " ":
					window.cancelAnimationFrame(this.raf);
					break;
				case "Enter":
					this.raf = window.requestAnimationFrame(this.gameLoop);
				default:
					return;
			}
		}).bind(this);
	}

	disconnectedCallback() {
		document.removeEventListener("keydown", this.keydownEventListener, true);
		window.cancelAnimationFrame(this.raf);
	}

	updateBall() {
		myself.sendMessage(JSON.stringify({
			'type': 'bounce_ball',
			'ball': {
				'position': {'x': this.ball.x, 'y': this.ball.y},
				'velocity': {'vx': this.ball.vx, 'vy': this.ball.vy},
				'size': 15
			}
		}))
	}

	paddleMove() {
		myself.sendMessage(JSON.stringify({
			'type': 'paddle_move',
			'position': this.getMyPaddle().y
		}))
	}

	scorePoint() {
		myself.sendMessage(JSON.stringify({
			'type': 'scored_point'
		}))
	}

}

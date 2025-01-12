import { myself, sleep } from "../myself.js";

const GameMode = {
	Default: "",
	Balance: "balance",
	Shoot: "shoot",
	Bomb: "bomb",
	Remix: "remix"
};
export default class ComponentAIGameBoard extends HTMLElement {
	constructor() {
		super();
		this.shadow = this.attachShadow({ mode: "open" });
		const template = document.getElementById("component-game-board");
		this.shadow.appendChild(template.content.cloneNode(true));
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

	pointScored(side) {
		if (side == 0) {
			this.score.player++;
			if (this.gameMode === GameMode.Balance) {
				if (this.paddleLeft.size - 5 >= this.MIN_PADDLE_SIZE)
					this.paddleLeft.size -= 5;
				if (this.ai.size + 5 <= this.MAX_PADDLE_SIZE)
					this.ai += 5;
			}
		}
		else {
			this.score.ai++;
			if (this.gameMode === GameMode.Balance) {
				if (this.ai.size - 5 >= this.MIN_PADDLE_SIZE)
					this.ai.size -= 5;
				if (this.paddleLeft.size + 5 <= this.MAX_PADDLE_SIZE)
					this.paddleLeft += 5;
			}
		}
	}

	updateBall(message) {
		let ball = message["ball"];
		this.ball.x = ball["position"]["x"];
		this.ball.y = ball["position"]["y"];
		this.ball.vx = ball["velocity"]["vx"];
		this.ball.vy = ball["velocity"]["vy"];
	}

	startMatch(message) {
		let ball = message["ball"];
		let player = message["player"];
		this.ball.x = ball["position"]["x"];
		this.ball.y = ball["position"]["y"];
		this.ball.vx = ball["velocity"]["vx"];
		this.ball.vy = ball["velocity"]["vy"];
		this.paddleLeft.name = player["player_emoji"];
		this.paddleLeft.color = '#' + player["player_bg_color"];

		this.ball.draw();
		this.paddleLeft.draw();
		this.ai.draw();
		this.lastTime = Date.now();

		document.addEventListener("keydown", this.keydownEventListener, true);
		this.raf = window.requestAnimationFrame(this.gameLoop);
	}

	connectedCallback() {
		const canvas = this.shadow.querySelector("canvas");
		const ctx = canvas.getContext("2d");
		const BALL_SPEED = 6;
		const MAXBOUNCEANGLE = Math.PI/4;
		const PADDLE_H = canvas.width/10;
		const PADDLE_W = canvas.width/10;
		const PADDLE_SPEED = 10;
		const AI_SPEED = 8.5;
		this.MAX_PADDLE_SIZE = canvas.height/3;
		this.MIN_PADDLE_SIZE = canvas.height/6;
		this.lastLoop = 0; // The timestamp of the last frame
		// let serverTimeOffset = 0; // Difference between server and local clock
		let accumulatedTime = 0; // Accumulated time for fixed updates
		const updateInterval = 1000 / 60; // Fixed update interval (16.67 ms for 60 FPS)
		this.gameMode = GameMode.Default;

		// PID constants
		const Kp = 2.0;  // Proportional constant
		const Ki = 1.9;  // Integral constant
		const Kd = 0.1; // Derivative constant

		// PID variables
		let integral = 0;
		let previousError = 0;

		let raf;

		function sleep(ms) {
			return new Promise(resolve => setTimeout(resolve, ms));
		}

		this.score = {
			player: 0,
			ai: 0,
			color: "black",
			draw()
			{
				ctx.fillStyle = this.color;
				ctx.globalAlpha = 0.2;
				ctx.font = '200px Monomaniac One';
				ctx.fillText(this.player.toString(), canvas.width / 3 - ctx.measureText(this.player.toString()).width / 2, canvas.height / 2);
				ctx.fillText(this.ai.toString(), canvas.width - (canvas.width / 3 - ctx.measureText(this.ai.toString()).width / 2), canvas.height / 2);
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
			this.vx = 1 * side;
			}
		};

		this.paddleLeft = {
			name: "._.",
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

		this.ai = {
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
				ctx.font="60px Monomaniac One";
				ctx.textAlign="center"; 
				ctx.textBaseline = "middle";
				ctx.fillStyle = "#FFFFFF";
				ctx.fillText("=*.*=", this.x + this.width/2, this.y + this.height/2);
			},
			reset()
			{
				this.y = canvas.height/2 - PADDLE_H/2;
				this.height = PADDLE_H;
				this.width = PADDLE_W;
				integral = 0;
				previousError = 0;
			}
		};

		function update_paddle_ai() {
			const now = Date.now();
			const dt = (now - this.lastTime) / 1000; // Convert ms to seconds
			this.lastTime = now;

			const rt = 0.1; //reaction time to see ahead of the ball
			const predictedBallY = this.ball.y + this.ball.size / 2 + this.ball.vy * 0.1;
			const error = predictedBallY - (this.ai.y + this.ai.height/2);
			integral += error * dt;
			const deriv = (error - previousError) / dt;
			const newPos = ((error * Kp) + (integral * Ki) + (deriv * Kd)) * this.ai.vy;
			this.ai.y += newPos / canvas.height;
			previousError = error;
		}

		function moving_ai() {
			this.ball.x += this.ball.vx;
			this.ball.y += this.ball.vy;
			//Bounce off the ceiling/floor
			if (
				this.ball.y + this.ball.vy > canvas.height - this.ball.size ||
				this.ball.y + this.ball.vy <= 0)
			{
				this.ball.vy = -this.ball.vy;
			}
			//Right wall collision
			if (this.ball.x + this.ball.vx > canvas.width - this.ball.size)
			{
				this.ball.reset(-1);
				this.paddleLeft.reset();
				this.ai.reset();
				this.pointScored(0);
				this.scorePointPlayer();
				//TODO send message player scored
			}
			//Left wall collision
			if (this.ball.x + this.ball.vx < 0)
			{
				this.ball.reset(1);
				this.paddleLeft.reset();
				this.ai.reset();
				this.pointScored(1);
				this.scorePointAI();
				//TODO: send message ai scored
			}

			//Left paddle collisions
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
				}
				else if (this.ball.y + this.ball.vy < this.paddleLeft.y) //Upper side collision
				{
					this.ball.vx = -this.ball.vx;
					if (this.ball.vy > 0)
						this.ball.vy = -this.ball.vy;
				}
				else if (this.ball.y + this.ball.vy + this.ball.size > this.paddleLeft.y + this.paddleLeft.height) //Lower side collision
				{
					this.ball.vx = -this.ball.vx;
					if (this.ball.vy < 0)
						this.ball.vy = -this.ball.vy;
				}
			}
			
			//AI paddle collisions
			if (this.ball.x + this.ball.vx + this.ball.size > this.ai.x &&
				this.ball.y + this.ball.vy < this.ai.y + this.ai.height &&
				this.ball.y + this.ball.vy + this.ball.size > this.ai.y && this.ball.vx > 0)
			{
				//Horizontal collision
				if (this.ball.x + this.ball.vx < this.ai.x) {
					var relativeIntersection = ((this.ball.y + this.ball.size/2) + this.ball.vy) - (this.ai.y + this.ai.height/2);
					var normalizedRelativeIntersectionY = (relativeIntersection/(this.ai.height/2));
					var bounceAngle = normalizedRelativeIntersectionY * MAXBOUNCEANGLE;
					var velocityY = this.ball.vy > 0 ? 1 : -1;
					this.ball.vx = BALL_SPEED*Math.cos(bounceAngle);
					this.ball.vy = BALL_SPEED*Math.sin(bounceAngle);
					if ((this.ball.vy > 0 && velocityY === -1) || this.ball.vy < 0 && velocityY === 1)
						this.ball.vy *= -1;
					this.ball.vx = -Math.abs(this.ball.vx);
				}
				else if (this.ball.y + this.ball.vy < this.ai.y) //Upper side collision
				{
					this.ball.vx = -this.ball.vx;
					if (this.ball.vy > 0)
						this.ball.vy = -this.ball.vy;
				}
				else if (this.ball.y + this.ball.vy + this.ball.size > this.ai.y + this.ai.height) //Lower side collision
				{
					this.ball.vx = -this.ball.vx;
					if (this.ball.vy < 0)
						this.ball.vy = -this.ball.vy;
				}
			}

			update_paddle_ai.bind(this)();
			if (this.ai.y < 0)
				this.ai.y = 0;
			if (this.ai.y > canvas.height - this.ai.height)
				this.ai.y = canvas.height - this.ai.height;
		}

		this.draw = (function() {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			this.score.draw();
			this.paddleLeft.draw();
			this.ai.draw();
			this.ball.draw();
			// moving_ai.bind(this)();
			// raf = window.requestAnimationFrame(this.draw);
		}).bind(this);

		this.gameLoop = (function(timeStamp) {
			if (!this.lastLoop) this.lastLoop = Date.now();

			const deltaTime = timeStamp - this.lastLoop;
			this.lastLoop = timeStamp;

			accumulatedTime += deltaTime;
			if (accumulatedTime < 0) accumulatedTime = 0;
			while (accumulatedTime >= updateInterval) {
				moving_ai.bind(this)();
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
				case "ArrowDown":
				case "s":
					this.paddleLeft.y += this.paddleLeft.vy;
					if (this.paddleLeft.y > canvas.height - this.paddleLeft.height)
					this.paddleLeft.y = canvas.height - this.paddleLeft.height;
				break;
				case "ArrowUp":
				case "w":
					this.paddleLeft.y -= this.paddleLeft.vy;
					if (this.paddleLeft.y < 0)
						this.paddleLeft.y = 0;
					break;
				case " ":
					window.cancelAnimationFrame(raf);
					break;
				case "Enter":
					raf = window.requestAnimationFrame(this.gameLoop);
				default:
					return;
			}
		}).bind(this);

		document.addEventListener("keydown", this.keydownEventListener, true);

		/*canvas.addEventListener("mouseover", (e) => {
			raf = window.requestAnimationFrame(draw);
		});

		canvas.addEventListener("mouseout", (e) => {
			window.cancelAnimationFrame(raf);
		});
		*/

		// this.ball.draw();
		// this.paddleLeft.draw();

		// raf = window.requestAnimationFrame(this.draw);
	}

	disconnectedCallback() {
		document.removeEventListener("keydown", this.keydownEventListener, true);
	}

	scorePointPlayer() {
		myself.sendMessage(JSON.stringify({
			'type': 'ai_score_player'
		}))
	}

	scorePointAI() {
		myself.sendMessage(JSON.stringify({
			'type': 'ai_score_ai'
		}))
	}
}

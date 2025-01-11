import { myself, sleep } from "../myself.js";
export default class ComponentAIGameBoard extends HTMLElement {
	constructor() {
		super();
		this.shadow = this.attachShadow({ mode: "open" });
		const template = document.getElementById("component-game-board");
		this.shadow.appendChild(template.content.cloneNode(true));
	}

	startMatch(message) {
		let ball = message["ball"];
		let player = message["player"][0];
		this.ball.x = ball["position"]["x"];
		this.ball.y = ball["position"]["y"];
		this.ball.vx = ball["velocity"]["vx"];
		this.ball.vy = ball["velocity"]["vy"];
		this.paddleLeft.name = player["player_emoji"];
		this.paddleLeft.color = '#' + player["player_bg_color"];

		this.ball.draw();
		this.paddleLeft.draw();
		this.ai.draw();

		document.addEventListener("keydown", this.keydownEventListener, true);
		this.raf = window.requestAnimationFrame(this.draw);
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
			const dt = (now - lastTime) / 1000; // Convert ms to seconds
			lastTime = now;

			const rt = 0.1; //reaction time to see ahead of the ball
			const predictedBallY = this.ball.y + this.ball.size / 2 + this.ball.vy * 0.1;
			const error = predictedBallY - (ai.y + ai.height/2);
			integral += error * dt;
			const deriv = (error - previousError) / dt;
			const newPos = ((error * Kp) + (integral * Ki) + (deriv * Kd)) * ai.vy;
			ai.y += newPos / canvas.height;
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
				ai.reset();
				//TODO send message player scored
			}
			//Left wall collision
			if (this.ball.x + this.ball.vx < 0)
			{
				this.ball.reset(1);
				this.paddleLeft.reset();
				ai.reset();
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
			if (this.ball.x + this.ball.vx + this.ball.size > ai.x &&
				this.ball.y + this.ball.vy < ai.y + ai.height &&
				this.ball.y + this.ball.vy + this.ball.size > ai.y && this.ball.vx > 0)
			{
				//Horizontal collision
				if (this.ball.x + this.ball.vx < ai.x) {
					var relativeIntersection = ((this.ball.y + this.ball.size/2) + this.ball.vy) - (ai.y + ai.height/2);
					var normalizedRelativeIntersectionY = (relativeIntersection/(ai.height/2));
					var bounceAngle = normalizedRelativeIntersectionY * MAXBOUNCEANGLE;
					var velocityY = this.ball.vy > 0 ? 1 : -1;
					this.ball.vx = BALL_SPEED*Math.cos(bounceAngle);
					this.ball.vy = BALL_SPEED*Math.sin(bounceAngle);
					if ((this.ball.vy > 0 && velocityY === -1) || this.ball.vy < 0 && velocityY === 1)
						this.ball.vy *= -1;
					this.ball.vx = -Math.abs(this.ball.vx);
				}
				else if (this.ball.y + this.ball.vy < ai.y) //Upper side collision
				{
					this.ball.vx = -this.ball.vx;
					if (this.ball.vy > 0)
						this.ball.vy = -this.ball.vy;
				}
				else if (this.ball.y + this.ball.vy + this.ball.size > ai.y + ai.height) //Lower side collision
				{
					this.ball.vx = -this.ball.vx;
					if (this.ball.vy < 0)
						this.ball.vy = -this.ball.vy;
				}
			}

			update_paddle_ai();
			if (ai.y < 0)
				ai.y = 0;
			if (ai.y > canvas.height - ai.height)
				ai.y = canvas.height - ai.height;
		}

		this.draw = (function() {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			this.paddleLeft.draw();
			ai.draw();
			this.ball.draw();
			if (!pause)
				moving_ai();
			raf = window.requestAnimationFrame(draw);

		})

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
					raf = window.requestAnimationFrame(draw);
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

		this.ball.draw();
		this.paddleLeft.draw();
		let lastTime = Date.now();

		raf = window.requestAnimationFrame(draw);
	}

	disconnectedCallback() {
		document.removeEventListener("keydown", this.keydownEventListener, true);
	}

	scorePointPlayer() {
		myself.sendMessage(JSON.stringify({
			'type': 'ai_score_ai'
		}))
	}

	scorePointAI() {
		myself.sendMessage(JSON.stringify({
			'type': 'ai_score_ai'
		}))
	}
}

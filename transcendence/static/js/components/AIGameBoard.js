export default class ComponentAIGameBoard extends HTMLElement {
	constructor() {
		super();
		this.shadow = this.attachShadow({ mode: "open" });
		const template = document.getElementById("component-game-board");
		this.shadow.appendChild(template.content.cloneNode(true));
	}

	connectedCallback() {
		const canvas = this.shadow.querySelector("canvas");
		const ctx = canvas.getContext("2d");
		const BALL_SPEED = 5;
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

		const ball = {
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

		const paddleLeft = {
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
			const predictedBallY = ball.y + ball.size / 2 + ball.vy * 0.1;
			const error = predictedBallY - (ai.y + ai.height/2);
			integral += error * dt;
			const deriv = (error - previousError) / dt;
			const newPos = ((error * Kp) + (integral * Ki) + (deriv * Kd)) * ai.vy;
			ai.y += newPos / canvas.height;
			previousError = error;
		}

		function moving_ai() {
			if (ball.vx != BALL_SPEED && ball.vx != -BALL_SPEED && !ball.isSpeedingUp)
			{
				ball.isSpeedingUp = true;
				setTimeout(function() {
					if (ball.vx > 0 && ball.vx != BALL_SPEED)
						ball.vx++;
					else if (ball.vx != -BALL_SPEED)
						ball.vx--;
					ball.isSpeedingUp = false;
				}, 1000);
			}

			ball.x += ball.vx;
			ball.y += ball.vy;
		  
			//Bounce off the ceiling/floor
			if (
				ball.y + ball.vy > canvas.height - ball.size ||
				ball.y + ball.vy <= 0)
			{
				ball.vy = -ball.vy;
			}
			//Right wall collision
			if (ball.x + ball.vx > canvas.width - ball.size)
			{
				ball.reset(-1);
				paddleLeft.reset();
				ai.reset();
			}
			//Left wall collision
			if (ball.x + ball.vx < 0)
			{
				ball.reset(1);
				paddleLeft.reset();
				ai.reset();
			}

			//Left paddle collisions
			if (ball.x + ball.vx < paddleLeft.width + paddleLeft.x &&
				ball.y + ball.vy < paddleLeft.y + paddleLeft.height &&
				ball.y + ball.vy + ball.size > paddleLeft.y && ball.vx < 0)
			{
				//Horizontal collision
				if (ball.x + ball.vx + ball.size > paddleLeft.width + paddleLeft.x)
				{
					var relativeIntersection = (ball.y + ball.size/2 + ball.vy) - (paddleLeft.y + paddleLeft.height / 2);
					var normalizedRelativeIntersectionY = (relativeIntersection/(paddleLeft.height/2));
					var bounceAngle = normalizedRelativeIntersectionY * MAXBOUNCEANGLE;
					var velocityY = ball.vy > 0 ? 1 : -1;
					ball.vx = BALL_SPEED*Math.cos(bounceAngle);
					ball.vy = BALL_SPEED*Math.sin(bounceAngle);
					if ((ball.vy > 0 && velocityY === -1) || ball.vy < 0 && velocityY === 1)
						ball.vy *= -1;
					ball.vx = Math.abs(ball.vx);
				}
				else if (ball.y + ball.vy < paddleLeft.y) //Upper side collision
				{
					ball.vx = -ball.vx;
					if (ball.vy > 0)
						ball.vy = -ball.vy;
				}
				else if (ball.y + ball.vy + ball.size > paddleLeft.y + paddleLeft.height) //Lower side collision
				{
					ball.vx = -ball.vx;
					if (ball.vy < 0)
						ball.vy = -ball.vy;
				}
			}
			
			//AI paddle collisions
			if (ball.x + ball.vx + ball.size > ai.x &&
				ball.y + ball.vy < ai.y + ai.height &&
				ball.y + ball.vy + ball.size > ai.y && ball.vx > 0)
			{
				//Horizontal collision
				if (ball.x + ball.vx < ai.x) {
					var relativeIntersection = ((ball.y + ball.size/2) + ball.vy) - (ai.y + ai.height/2);
					var normalizedRelativeIntersectionY = (relativeIntersection/(ai.height/2));
					var bounceAngle = normalizedRelativeIntersectionY * MAXBOUNCEANGLE;
					var velocityY = ball.vy > 0 ? 1 : -1;
					ball.vx = BALL_SPEED*Math.cos(bounceAngle);
					ball.vy = BALL_SPEED*Math.sin(bounceAngle);
					if ((ball.vy > 0 && velocityY === -1) || ball.vy < 0 && velocityY === 1)
						ball.vy *= -1;
					ball.vx = -Math.abs(ball.vx);
				}
				else if (ball.y + ball.vy < ai.y) //Upper side collision
				{
					ball.vx = -ball.vx;
					if (ball.vy > 0)
						ball.vy = -ball.vy;
				}
				else if (ball.y + ball.vy + ball.size > ai.y + ai.height) //Lower side collision
				{
					ball.vx = -ball.vx;
					if (ball.vy < 0)
						ball.vy = -ball.vy;
				}
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

		this.keydownEventListener = ((e) => {
			if (["ArrowUp", "ArrowDown", " "].includes(e.key)) {
				// Prevent the default action (scrolling)
				e.preventDefault();
			}
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
		}).bind(this);

		document.addEventListener("keydown", this.keydownEventListener, true);

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
	}

	disconnectedCallback() {
		document.removeEventListener("keydown", this.keydownEventListener, true);
	}
}

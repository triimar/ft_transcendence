export default class ComponentGameBoard extends HTMLElement {
	constructor() {
		super();
		this.shadow = this.attachShadow({ mode: "open" });
		const template = document.getElementById("component-game-board");
		this.shadow.appendChild(template.content.cloneNode(true));
	}

	connectedCallback() {
		const canvas = this.shadow.querySelector("canvas");
		const ctx = canvas.getContext("2d");
		const BALL_SPEED_X = 5;
		const BALL_SPEED_Y = 2;
		const PADDLE_H = canvas.width/10;
		const PADDLE_W = canvas.width/10;
		const PADDLE_SPEED = 6;

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
				this.vx = BALL_SPEED_X * side;
				this.vy = BALL_SPEED_Y;
				this.isReset = true;
				this.isSpeedingUp = false;
				this.vx = 1 * side;
			}
		};

		const paddleLeft = {
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

		const paddleRight = {
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
				paddleRight.reset();
			}
			//Left wall collision
			if (ball.x + ball.vx < 0)
			{
				ball.reset(1);
				paddleLeft.reset();
				paddleRight.reset();
			}
			if (ball.x + ball.vx < paddleLeft.width + paddleLeft.x &&
				ball.y + ball.vy < paddleLeft.y + paddleLeft.height &&
				ball.y + ball.vy + ball.size > paddleLeft.y && ball.vx < 0)
			{
				//Horizontal collision
				if (ball.x + ball.vx + ball.size > paddleLeft.width + paddleLeft.x)
				{
					ball.vx = -ball.vx;
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
			//Right paddle collisions
			if (ball.x + ball.vx + ball.size > paddleRight.x &&
				ball.y + ball.vy < paddleRight.y + paddleRight.height &&
				ball.y + ball.vy + ball.size > paddleRight.y && ball.vx > 0)
			{
				//Horizontal collision
				if (ball.x + ball.vx < paddleRight.x)
				{
					ball.vx = -ball.vx;
				}
				else if (ball.y + ball.vy < paddleRight.y) //Upper side collision
				{
					ball.vx = -ball.vx;
					if (ball.vy > 0)
						ball.vy = -ball.vy;
				}
				else if (ball.y + ball.vy + ball.size > paddleRight.y + paddleRight.height) //Lower side collision
				{
					ball.vx = -ball.vx;
					if (ball.vy < 0)
						ball.vy = -ball.vy;
				}
			}
		}

		async function draw() {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			paddleLeft.draw();
			paddleRight.draw();
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
				moving();
			raf = window.requestAnimationFrame(draw);
		}

		this.keydownEventListener = ((e) => {
			if (["ArrowUp", "ArrowDown", " "].includes(e.key)) {
				// Prevent the default action (scrolling)
				e.preventDefault();
			}
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
		paddleRight.draw();
		let lastTime = Date.now();

		raf = window.requestAnimationFrame(draw);
	}

	disconnectedCallback() {
		document.removeEventListener("keydown", this.keydownEventListener, true);
	}
}

import { myself, sleep } from "../myself.js";

const GameMode = {
	Default: "",
	Balance: "balance",
	Shoot: "shoot",
	Bomb: "bomb",
	Remix: "remix"
};

const BALANCE_FACTOR = 10;

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
					countdownText.textContent = i18next.t("game.start-txt");
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

	displayMatchResult(winner) {
		this.isRunning = false;
		let gameStatusLive = this.shadow.getElementById('game-status-live');
		gameStatusLive.textContent = ""
		const canvas = this.shadow.querySelector("canvas");
		const ctx = canvas.getContext("2d");
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		let winnerContainer = this.shadow.querySelector("#winner-container");
		winnerContainer.style.display = "flex";
		let avatarElement = this.shadow.querySelector("#winner");
		let blocker = this.shadow.querySelector("#blocker");
		let countdownText = blocker.children[0];
		if (winner["player_id"] == "ai") {
			avatarElement.setAttribute("avatar-name", "🤖");
			avatarElement.setAttribute("avatar-background", this.ai.color);
			avatarElement.setAttribute("avatar-id", "ai");
			countdownText.textContent = this.score.player + " : " + this.score.ai;
		} else {
			avatarElement.setAttribute("avatar-name", winner["player_emoji"]);
			avatarElement.setAttribute("avatar-background", '#' + winner["player_bg_color"]);
			avatarElement.setAttribute("avatar-id", winner["player_id"]);
			countdownText.textContent = this.score.player + " : " + this.score.ai;
		}
		let winnerText = this.shadow.querySelector("#winner-txt");
		winnerText.textContent =  i18next.t("game.winner-txt");
		blocker.classList.add("show");
		window.cancelAnimationFrame(this.raf);
		document.removeEventListener("keydown", this.keydownEventListener, true);
		document.removeEventListener("keyup", this.keyupEventListener, true);
		this.raf = null;
	}

	pointScored(side) {
		if (side == 0) {
			this.score.player++;
			if (this.gameMode === GameMode.Balance) {
				if (this.paddleLeft.height - BALANCE_FACTOR >= this.MIN_PADDLE_SIZE)
					this.paddleLeft.height -= BALANCE_FACTOR;
				if (this.ai.height + BALANCE_FACTOR <= this.MAX_PADDLE_SIZE)
					this.ai.height += BALANCE_FACTOR;
			}
		}
		else {
			this.score.ai++;
			if (this.gameMode === GameMode.Balance) {
				if (this.ai.height - BALANCE_FACTOR >= this.MIN_PADDLE_SIZE)
					this.ai.height -= BALANCE_FACTOR;
				if (this.paddleLeft.height + BALANCE_FACTOR <= this.MAX_PADDLE_SIZE)
					this.paddleLeft.height += BALANCE_FACTOR;
			}
		}
		let gameStatusLive = this.shadow.getElementById('game-status-live');
		gameStatusLive.textContent = (`Score: ${this.score.player}, ${this.score.ai}`)
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
		this.ball.x = ball["position"]["x"];
		this.ball.y = ball["position"]["y"];
		this.ball.vx = ball["velocity"]["vx"];
		this.ball.vy = ball["velocity"]["vy"];
		this.paddleLeft.name = myself["avatar_emoji"];
		this.paddleLeft.color = myself["avatar_bg_color"];
		this.tempBall = this.ball;
		this.gameMode = message["mode"];

		this.ball.draw();
		this.paddleLeft.draw();
		this.ai.draw();
		this.lastTime = Date.now();

		document.addEventListener("keydown", this.keydownEventListener, true);
		document.addEventListener("keyup", this.keyupEventListener, true);
		this.raf = window.requestAnimationFrame(this.gameLoop);
		let gameStatusLive = this.shadow.getElementById('game-status-live');
		gameStatusLive.textContent = "Using paddle on the left. Use the arrow keys to move the paddle up and down."
	}

	connectedCallback() {
		const canvas = this.shadow.querySelector("canvas");
		const ctx = canvas.getContext("2d");
		const BALL_SPEED = 6;
		const MAXBOUNCEANGLE = Math.PI/4;
		const PADDLE_H = canvas.width/10;
		const PADDLE_W = canvas.width/10;
		const PADDLE_SPEED = 3;
		const AI_SPEED = 5;
		const ERROR_MARGIN = 15;
		this.MAX_PADDLE_SIZE = canvas.height/2;
		this.MIN_PADDLE_SIZE = canvas.height/10;
		this.lastLoop = 0; // The timestamp of the last frame
		this.isRunning = true;
		let accumulatedTime = 0; // Accumulated time for fixed updates
		let accumulatedAiTime = 0;
		let aiMoveTimes = 0;
		const updateInterval = 1000 / 60; // Fixed update interval (16.67 ms for 60 FPS)
		const aiUpdateInterval = 1000;
		const aiMoveInterval = 3;
		this.gameMode = GameMode.Default;
		this.isRunning = true;
		this.keysPressed = {};
		this.joystickCenter = null;

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
			reset()
			{
				this.x = canvas.width / 2;
				this.y = canvas.height / 2;
				let randomVx = Math.floor(Math.random() * 13) - 6;
				if (randomVx === 0)
					randomVx = 2
				if (randomVx === -1 || randomVx === 1)
					randomVx *= 2
				let randomVy = Math.floor(Math.random() * 13) - 6;
				if (randomVy === 0)
					randomVy = 2
				if (randomVy === -1 || randomVy === 1)
					randomVy *= 2
				this.vx = randomVx;
				this.vy = randomVy;
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
				this.y = canvas.height/2 - this.height/2;
			}
		};

		this.ai = {
			x: canvas.width - PADDLE_W,
			y: canvas.height/2 - PADDLE_H/2,
			vy: AI_SPEED,
			height: PADDLE_H,
			width: PADDLE_W,
			moveFactor: 0,
			color: "#CCCCCC",
			draw()
			{
				ctx.fillStyle = this.color;
				ctx.fillRect(this.x, this.y, this.width, this.height);
				ctx.font="60px Monomaniac One";
				ctx.textAlign="center";
				ctx.textBaseline = "middle";
				ctx.fillStyle = "#FFFFFF";
				ctx.fillText("🤖", this.x + this.width/2, this.y + this.height/2);
			},
			reset()
			{
				this.y = canvas.height/2 - PADDLE_H/2;
			}
		};

		function update_paddle_ai() {
			let timeToCollision = (canvas.width - this.ai.width - this.tempBall.x) / this.tempBall.vx;
			let predictedY = this.tempBall.y + this.tempBall.vy * timeToCollision;

			predictedY += Math.random() * ERROR_MARGIN - ERROR_MARGIN / 2;
			while (predictedY < 0 || predictedY > canvas.height) {
				if (predictedY < 0) {
					predictedY = -predictedY;
				} else {
					predictedY = 2 * canvas.height - predictedY;
				}
			}
			if (predictedY > this.ai.y + this.ai.height) {
				this.ai.y += this.ai.vy;
			} else if (predictedY < this.ai.y) {
				this.ai.y -= this.ai.vy;
			}
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
				this.ball.reset();
				this.paddleLeft.reset();
				this.ai.reset();
				this.pointScored(0);
				this.scorePointPlayer();
			}
			//Left wall collision
			if (this.ball.x + this.ball.vx < 0)
			{
				this.ball.reset();
				this.paddleLeft.reset();
				this.ai.reset();
				this.pointScored(1);
				this.scorePointAI();
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
		}

		this.draw = (function() {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			this.score.draw();
			this.paddleLeft.draw();
			this.ai.draw();
			this.ball.draw();
		}).bind(this);
		
		this.updatePaddle = (function() {
			if (this.keysPressed['down']) {
				this.paddleLeft.y += this.paddleLeft.vy;
				if (this.paddleLeft.y > canvas.height - this.paddleLeft.height)
					this.paddleLeft.y = canvas.height - this.paddleLeft.height;
			}
			if (this.keysPressed['up']) {
				this.paddleLeft.y -= this.paddleLeft.vy;
				if (this.paddleLeft.y < 0)
					this.paddleLeft.y = 0;
			}
		}).bind(this);

		this.gameLoop = (function(timeStamp) {
			if (!this.isRunning)
				return;
			if (!this.lastLoop) this.lastLoop = Date.now();

			const deltaTime = timeStamp - this.lastLoop;
			this.lastLoop = timeStamp;

			accumulatedTime += deltaTime;
			accumulatedAiTime += deltaTime;
			if (accumulatedTime < 0) accumulatedTime = 0;
			if (accumulatedAiTime < 0) accumulatedAiTime = 0;
			while (accumulatedTime >= updateInterval) {
				moving_ai.bind(this)();
				if (aiMoveTimes === aiMoveInterval) {
					update_paddle_ai.bind(this)();
					if (this.ai.y < 0)
						this.ai.y = 0;
					if (this.ai.y > canvas.height - this.ai.height)
						this.ai.y = canvas.height - this.ai.height;
					aiMoveTimes = 0;
				} else {
					aiMoveTimes++;
				}
				this.updatePaddle();
				accumulatedTime -= updateInterval;
			}
			while (accumulatedAiTime >= aiUpdateInterval) {
				this.tempBall = this.ball;
				accumulatedAiTime -= aiUpdateInterval;
				this.ai.moveFactor = 0;
			}

			if (this.isRunning) {
				this.draw();
				this.raf = window.requestAnimationFrame(this.gameLoop);
			}
		}).bind(this);


		// Add touch event listeners to the canvas
		this.touchStartFunc = (e) => {
			if (!this.isRunning)
				return;
			const touch = e.touches[0]; // Get the y-coordinate of the touch
			const canvasRect = canvas.getBoundingClientRect();
			this.joystickCenter = {
				x: touch.clientX - canvasRect.left,
				y: touch.clientY - canvasRect.top,
			}
		};
		canvas.addEventListener("touchstart", this.touchStartFunc);
		this.touchMoveFunc = (e) => {
			if (!this.isRunning || !this.joystickCenter) return;
			e.preventDefault();
			const touch = e.touches[0];
			const canvasRect = canvas.getBoundingClientRect();
			const currentPos = {
				x: touch.clientX - canvasRect.left,
				y: touch.clientY - canvasRect.top,
			};

			// Calculate vertical offset
			const deltaY = currentPos.y - this.joystickCenter.y;

			// Check if movement exceeds the dead zone
			if (deltaY < -5) {
				// Moved upward
				this.keysPressed["up"] = true;
				this.keysPressed["down"] = false;
			} else if (deltaY > 5) {
				// Moved downward
				this.keysPressed["down"] = true;
				this.keysPressed["up"] = false;
			} else {
				// Within dead zone; no key should be active
				this.keysPressed["up"] = false;
				this.keysPressed["down"] = false;
  }
		};
		canvas.addEventListener("touchmove", this.touchMoveFunc);
		canvas.addEventListener("touchend", (e) => {
			if (!this.isRunning)
				return;
			e.preventDefault(); // Prevent scrolling while playing
			this.joystickCenter = null;
			this.keysPressed["down"] = false;
			this.keysPressed["up"] = false;
		});

		this.keyupEventListener = ((e) => {
			// if (["ArrowUp", "ArrowDown", "w", "s", " "].includes(e.key)) {
			// 	// Prevent the default action (scrolling)
			// 	e.preventDefault();
			// }
			if (["ArrowUp", "w"].includes(e.key)) {
				this.keysPressed["up"] = false;
			} else if (["ArrowDown", "s"].includes(e.key)) {
				this.keysPressed["down"] = false;
			}
		}).bind(this)
		
		this.keydownEventListener = ((e) => {
			if (!this.isRunning)
				return;
			// if (["ArrowUp", "ArrowDown", "w", "s", " "].includes(e.key)) {
			// 	// Prevent the default action (scrolling)
			// 	e.preventDefault();
			// }
			if (["ArrowUp", "w"].includes(e.key)) {
				this.keysPressed["up"] = true;
			} else if (["ArrowDown", "s"].includes(e.key)) {
				this.keysPressed["down"] = true;
			}
		}).bind(this)

		document.addEventListener("keydown", this.keydownEventListener, true);
		document.addEventListener("keyup", this.keyupEventListener, true);
	}

	disconnectedCallback() {
		document.removeEventListener("keydown", this.keydownEventListener, true);
		document.removeEventListener("keyup", this.keyupEventListener, true);
		window.cancelAnimationFrame(this.raf);
		this.raf = null;
	}

	scorePointPlayer() {
		if (!this.isRunning)
			return;
		myself.sendMessage(JSON.stringify({
			'type': 'ai_score_player'
		}))
	}

	scorePointAI() {
		if (!this.isRunning)
			return;
		myself.sendMessage(JSON.stringify({
			'type': 'ai_score_ai'
		}))
	}
}

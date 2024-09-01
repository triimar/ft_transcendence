class Visitor {
	constructor() {
		this.page = null;
		this.ws = null;
		this.jwt = null; // TODO(HeiYiu): We can decide using session cookies or JWT
	}

	verifyJWT() {
		// TODO(HeiYiu): find in localStorage or CookieStorage if a JWT exists
		// if yes, verify with the server
		// if it verified, save the jwt in this object
		return true;
	}

	connectWs() {
		this.ws = new WebSocket('/ws/transcendence/');
		this.ws.addEventListener("open", function (event) {
			console.log("Websocket connection is open");
		});
		this.ws.addEventListener("message", function (event) {
			const message = JSON.parse(event.data);
			console.log("Incoming message:", message);
			switch (message.type) {
				case "ack_init":
					let pageHash = message.payload;
					console.log(`client appeared on page ${pageHash}!`);
				break;
			}
		});
		this.ws.addEventListener("close", function (event) {
			console.log("Websocket connection is closed unexpectedly");
		});
	}

	#waitForOpenConnection() {
		return new Promise((resolve, reject) => {
			const maxNumberOfAttempts = 10;
			const intervalTime = 200; //ms

			let currentAttempt = 0;
			const interval = setInterval(() => {
				if (currentAttempt > maxNumberOfAttempts - 1) {
					clearInterval(interval);
					reject(new Error('Maximum number of attempts exceeded'));
				} else if (this.ws.readyState === this.ws.OPEN) {
					clearInterval(interval);
					resolve();
				}
				currentAttempt++;
			}, intervalTime);
		});
	}

	async sendMessage(message) {
		if (this.ws.readyState !== this.ws.OPEN) {
			try {
				await this.#waitForOpenConnection();
				this.ws.send(message);
			} catch (err) { console.error(err); }
		} else {
			this.ws.send(message);
		}
	}

	async sendMessageInit(pageHash) {
		let message = {
			type: "init",
			payload: pageHash
		};
		this.sendMessage(JSON.stringify(message));
	}

}

export const myself = new Visitor();

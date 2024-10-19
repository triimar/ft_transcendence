class Visitor {
	constructor() {
		this.page = null;
		this.pageHash = null;
		this.pageFinishedRendering = false; // Note(HeiYiu): this is a mutex that make sure the template is rendered before receiving incoming websocket message that will change the UI tree
		this.id = null;
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
		this.ws.addEventListener("message", async function (event) {
			const message = JSON.parse(event.data);
			console.log("Incoming message:", message);
			switch (message.type) {
				case "ack_init":
					await this.waitForPageToRender();
					// TODO(HeiYiu): get list of rooms and render them
					break;
				case "b_join_room":
					if (this.pageHash == "main") {

					} else if (this.pageHash == "room") {

					}
					break;
				case "ack_join_room":
					await this.waitForPageToRender();
					// TODO(HeiYiu): Render the room
					break;
				case "b_add_room":
					// TODO(HeiYiu): Append a room to lobby page
					break;
				case "ack_add_room":
					await this.waitForPageToRender();
					// TODO(HeiYiu): Render the newly added room
					break;
				default:
					console.error("Received unknown websocket message type");
			}
		});
		this.ws.addEventListener("close", function (event) {
			console.log("Websocket connection is closed unexpectedly");
		});
	}

	waitForPageToRender() {
		// Note(HeiYiu): Change of hash will trigger the hashchange event handler to render a template. The hashchange event handler should set the pageFinishedRendering to true when it finished rendering
		return new Promise((resolve, reject) => {
			const intervalTime = 100; //ms
			const interval = setInterval(() => {
				if (this.pageFinishedRendering) {
					clearInterval(internval);
					resolve();
				}
			}, intervalTime);
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

	sendMessageInit() {
		let message = {
			type: "init",
			"player_id": this.id
		};
		this.sendMessage(JSON.stringify(message));
	}

	sendMessageJoinRoom(roomId) {
		let message = {
			type: "join_room",
			"room_id": roomId,
			"player_id": this.id
		};
		this.sendMessage(JSON.stringify(message));
	}

	sendMessageAddRoom() {
		let message = {
			type: "add_room",
			"owner_id": this.id
		};
		this.sendMessage(JSON.stringify(message));
	}
}

export const myself = new Visitor();

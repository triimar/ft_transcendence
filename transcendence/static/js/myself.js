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
		this.ws = new WebSocket('/');
		this.ws.addEventListener("message", function (event) {
			const message = JSON.parse(event.data);
			switch (message.type) {
				// TODO(HeiYiu): Receive message types
			}
		});
		this.ws.addEventListener("close", function (event) {
			console.log("Websocket connection is closed unexpectedly");
		});
	}
}

export const myself = new Visitor();

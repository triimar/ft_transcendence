class Visitor {
	constructor() {
		this.page = null;
		this.pageName = null;
		this.pageFinishedRendering = false; // Note(HeiYiu): this is a mutex that make sure the template is rendered before receiving incoming websocket message that will change the UI tree
		this.id = null;
		this.avatar_emoji = null;
		this.avatar_bg_color = null;
		this.ws = null;
		this.jwt = null; // TODO(HeiYiu): We can decide using session cookies or JWT
	}

	#getCookie(name) {
		let cookies = document.cookie.split(';');
		for(let i = 0; i < cookies.length; i++) {
			let c = cookies[i];
			while (c.charAt(0) == ' ') {
				c = c.substring(1, c.length);
			}
			let target = name + '=';
			if (c.indexOf(target) == 0) return c.substring(target.length, c.length);
		}
		return null;
	}

	async verifyJWT() {
		// Note(HeiYiu): find in CookieStorage if a JWT exists
		try {
			let jwt = this.#getCookie("jwt");
			if (jwt) {
			let response = await fetch("/api/check_auth/");
			this.jwt = await response.json();
					this.id = this.jwt.id;
			return true;
			}
		}
		catch (error) {
			console.error(error);
		}
		return false;
	}

	async fetchAvatarInfo() {
		try {
			let response = await fetch("/api/myself/");
			let json = await response.json();
			this.avatar_emoji = json.player_emoji;
			this.avatar_bg_color = '#' + json.player_bg_color;
		}
		catch (error) {
			console.error(error);
		}
	}

	getLoginMethod() {
		return localStorage.getItem("login_method");
	}

	async login(isAsGuest) {
		let is_success = true;
		if (isAsGuest) {
			localStorage.setItem("login_method", "guest");
			// Note(HeiYiu): ask server for a id
			try {
				let response = await fetch("api/guest_login/");
				let json = await response.json();
			} catch(error) {
				console.error("Guest login error:", error);
				is_success = false;
			}
		} else {
			localStorage.setItem("login_method", "intra");
			// Note(HeiYiu): Redirect the page to do authentication
			window.location.href = "api/trigger_auth/";
			// fetch("api/trigger_auth/")
			// .then(res => {
			//     if (res.redirected) window.location.href = response.url;
			// });
		}
		return is_success;
	}

	logout() {
		this.jwt = null;
		this.id = null;
		this.avatar_emoji = null;
		this.avatar_bg_color = null;
		localStorage.removeItem("login_method");
		document.cookie = 'jwt=; Max-Age=-99999999;';
	}

	connectWs() {
		this.ws = new WebSocket('/ws/transcendence/');
		this.ws.addEventListener("open", function (event) {
			console.log("Websocket connection is open");
		});
		this.ws.addEventListener("message", async (event) => {
			const message = JSON.parse(event.data);
			console.log("Incoming message:", message);
			switch (message.type) {
			case "ack_init":
				await this.waitForPageToRender();
				// Note(HeiYiu): get list of rooms and render them
				let fragment = document.createDocumentFragment();
				for (let room of message.rooms) {
					let roomElement = document.createElement("td-lobby-room");
					for (let avatar of room.avatars) {
						let avatarElement = document.createElement("td-avatar");
						avatarElement.setAttribute("avatar-name", avatar["player_emoji"]);
						avatarElement.setAttribute("avatar-background", '#' + avatar["player_bg_color"]);
						avatarElement.setAttribute("avatar-id", avatar["player_id"]);
						roomElement.appendChild(avatarElement);
					}
					roomElement.setAttribute("room-max", room["max_player"]);
					roomElement.setAttribute("room-id", room["room_id"]);
					roomElement.classList.add("ui");
					fragment.appendChild(roomElement);
				}
				this.page.container.appendChild(fragment);
				break;
			case "b_join_room":
				if (this.pageName == "main") {

				} else if (this.pageName == "room") {

				}
				break;
			case "ack_join_room":
				await this.waitForPageToRender();
				let roomElement = this.page.container.querySelector("td-lobby-room");
				let room = message["single_room_data"];
				roomElement.setAttribute("room-id", room["room_id"]);
				for (let avatar of room.avatars) {
					let avatarElement = document.createElement("td-avatar");
					avatarElement.setAttribute("avatar-name", avatar["player_emoji"]);
					avatarElement.setAttribute("avatar-background", '#' + avatar["player_bg_color"]);
					avatarElement.setAttribute("avatar-id", avatar["player_id"]);
					roomElement.appendChild(avatarElement);
				}
				roomElement.setAttribute("room-max", room["max_player"]);
				let settingSizeElement = this.page.container.querySelector("td-room-setting-size");
				settingSizeElement.size = room.avatars.length;
				break;
			case "b_add_room":
				// TODO(HeiYiu): Append a room to lobby page
				break;
			case "ack_add_room":
				let roomId = message["room_id"];
				window.location.href = "#room" + roomId;
				break;
			case "error":
				this.displayPopupMessage(message.message);
				if (message["redirect_hash"]) window.location.href = '#' + message["redirect_hash"];
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
					clearInterval(interval);
					resolve();
				}
			}, intervalTime);
		});
	}

	displayPopupMessage(message) {
		let popup = document.getElementById("notification-popup");
		let popupText = popup.children[0];
		popupText.textContent = message;
		popup.classList.add("show");
		setTimeout(() => {
			popup.classList.remove("show");
		}, 5000);
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
				console.log("Sending message", message);
				this.ws.send(message);
			} catch (err) { console.error(err); }
		} else {
			console.log("Sending message", message);
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

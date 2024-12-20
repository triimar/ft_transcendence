class Visitor {
	constructor() {
		this.page = null;
		this.pageName = null;
		this.roomId = null;
		this.roomOwnerIsMyself = false;
		this.gameIndex = null;
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
			case "ack_init": {
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
			} break;
			case "b_join_room": {
				let avatar = message["avatar"];
				if (avatar["player_id"] != this.id) {
					let roomId = message["room_id"];
					if (this.pageName == "main") {
						let rooms = this.page.container.querySelectorAll("td-lobby-room");
						let roomExisted = false;
						for (let room of rooms) {
							if (room.getAttribute("room-id") == roomId) {
								roomExisted = true;
								room.addParticipant(avatar["player_emoji"], '#' + avatar["player_bg_color"], avatar["player_id"]);
								break;
							}
						}
						if (!roomExisted) {
							let roomElement = document.createElement("td-lobby-room");
							let avatarElement = document.createElement("td-avatar");
							avatarElement.setAttribute("avatar-name", avatar["player_emoji"]);
							avatarElement.setAttribute("avatar-background", '#' + avatar["player_bg_color"]);
							avatarElement.setAttribute("avatar-id", avatar["player_id"]);
							roomElement.appendChild(avatarElement);
							roomElement.setAttribute("room-max", "2");
							roomElement.setAttribute("room-id", roomId);
							roomElement.classList.add("ui");
							this.page.container.appendChild(roomElement);
						}
					} else if (this.pageName == "room") {
						let roomElement = this.page.container.querySelector("td-lobby-room");
						roomElement.addParticipant(avatar["player_emoji"], '#' + avatar["player_bg_color"], avatar["player_id"]);
						if (this.roomOwnerIsMyself) {
							let roomSizeButtons = this.page.container.querySelector("#room-size-buttons");
							let avatars = roomElement.querySelectorAll("td-avatar");
							roomSizeButtons.changeMinSize(avatars.length > 2 ? avatars.length : 2);
						}
					}
				}
			} break;
			case "ack_join_room": {
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
				if (this.id == room["room_owner"]) {
					this.roomOwnerIsMyself = true;
					let roomSizeButtons = this.page.container.querySelector("#room-size-buttons");
					roomSizeButtons.style.display = "flex";
					roomSizeButtons.changeSize(room["max_player"]);
				}
			} break;
			case "ack_add_room": {
				let roomId = message["room_id"];
				window.location.hash = "#room" + roomId;
			} break;
			case "ack_leave_room": {
				console.assert(this.pageName == "room", `ack_leave_room should only be received in room page, but has pageName ${this.pageName}`);
				this.roomOwnerIsMyself = false;
				window.location.hash = this.page.confirmPopupRedirectPageHash;
			} break;
			case "b_remove_room": {
				let rooms = this.page.container.querySelectorAll("td-lobby-room");
				for (let room of rooms) {
					if (room.getAttribute("room-id") == message["room_id"]) {
						room.parentNode.removeChild(room);
						break;
					}
				}
			} break;
			case "b_leave_room": {
				if (message["player_id"] != this.id) {
					let roomId = message["room_id"];
					if (this.pageName == "main") {
						let rooms = this.page.container.querySelectorAll("td-lobby-room");
						for (let room of rooms) {
							if (room.getAttribute("room-id") == roomId) {
								room.removeParticipant(message["player_id"]);
								break;
							}
						}
					} else if (this.pageName == "room") {
						let roomElement = this.page.container.querySelector("td-lobby-room");
						roomElement.removeParticipant(message["player_id"]);
						if (("new_room_owner" in message) && (message["new_room_owner"] == this.id)) {
							this.roomOwnerIsMyself = true;
							this.displayPopupMessage("Room owner has left. You become the new owner");
						}
						if (this.roomOwnerIsMyself) {
							let roomSizeButtons = this.page.container.querySelector("#room-size-buttons");
							roomSizeButtons.style.display = "flex";
							let avatars = roomElement.shadowRoot.querySelectorAll("td-avatar");
							if (avatars != null) {
								roomSizeButtons.changeMinSize(avatars.length > 2 ? avatars.length : 2);
							}
						}
					}
				}
			} break;
			case "b_max_player": {
				let maxPlayerNumber = message["max_player_num"];
				if (this.pageName == "main") {
					let roomId = message["room_id"];
					let rooms = this.page.container.querySelectorAll("td-lobby-room");
					for (let room of rooms) {
						if (room.getAttribute("room-id") == roomId) {
							room.setAttribute("room-max", maxPlayerNumber);
							break;
						}
					}
				} else if (this.pageName == "room") {
					let roomElement = this.page.container.querySelector("td-lobby-room");
					roomElement.setAttribute("room-max", maxPlayerNumber);
				}
			} break;
			case "error": {
				this.displayPopupMessage(message.message);
				if (message["redirect_hash"]) {
					if (this.pageName == "room")
					{
						this.page.displayConfirmPopup = false;
					}
					window.location.href = '#' + message["redirect_hash"];
				}
			} break;
			default: {
				console.error("Received unknown websocket message type");
			}
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

	sendMessageLeaveRoom(roomId) {
		let message = {
			type: "leave_room",
			"room_id": roomId,
			"player_id": this.id
		};
		this.sendMessage(JSON.stringify(message));
	}

	sendMessageChangeMaxPlayer(roomId, maxPlayer) {
		let message = {
			type: "max_player",
			"room_id": roomId,
			"max_player_num": maxPlayer
		};
		this.sendMessage(JSON.stringify(message));
	}
}

export const myself = new Visitor();

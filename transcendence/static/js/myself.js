class Visitor {
	constructor() {
		this.page = null;
		this.pageName = null;
		this.roomId = null;
		this.roomOwnerIsMyself = false;
		this.gameIndex = null;
		this.firstLayerPlayers = [];
		this.pageFinishedRendering = false; // Note(HeiYiu): this is a mutex that make sure the template is rendered before receiving incoming websocket message that will change the UI tree
		this.id = null;
		this.avatar_emoji = null;
		this.avatar_bg_color = null;
		this.ws = null;
		this.jwt = null; // TODO(HeiYiu): We can decide using session cookies or JWT
		this.reconnectCount = 0;
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
			if (response.status != 200) {
				throw new Error("JWT is not valid");
			}
			this.jwt = await response.json();
			this.id = this.jwt.id;
			return true;
			}
		}
		catch (error) {
			console.error(error);	
			this.displayPopupMessage("Failed to verify your account");	
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
			this.displayPopupMessage("Failed to fetch your avatar's data");
		}
	}

	changeAvatar(newEmoji, newBackgroundColor) {
		if (this.gameIndex != null) {
			this.displayPopupMessage("You cannot change avatar during a game");
		} else if (newEmoji.length != 3) {
			this.displayPopupMessage("Avatar's face can only have 3 characters");
		} else if (!["ff4d6d", "045d75", "4ba3c7", "007f5f", "ffe156", "a01a58", "ff5da2", "001f54"].includes(newBackgroundColor)) {
			this.displayPopupMessage("Avatar's color is not in the color palette");
		} else {
			this.avatar_emoji = newEmoji;
			this.avatar_bg_color = '#' + newBackgroundColor;
			this.sendMessageAvatarChange(newEmoji, newBackgroundColor);
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
				this.displayPopupMessage("Failed to login");
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
					if (avatar["prepared"])
					{
						let readySpeechBubble = document.createElement("div");
						readySpeechBubble.classList.add("speech-bubble");
						readySpeechBubble.style.background = "var(--td-ui-background-color)";
						readySpeechBubble.style.position = "absolute";
						readySpeechBubble.style.bottom = "84%";
						readySpeechBubble.style.left = "50%";
						readySpeechBubble.style.width = "fit-content";
						readySpeechBubble.style.height = "fit-content";
						{
							let text = document.createElement("p");
							text.style.width = "max-content";
							text.style.padding = "0 0.5em";
							text.textContent = i18next.t("lobby-room.ready-bubble-txt");
							readySpeechBubble.appendChild(text);
						}
						avatarElement.appendChild(readySpeechBubble);
					}
					roomElement.appendChild(avatarElement);
				}
				roomElement.setAttribute("room-max", room["max_player"]);
				if (this.id == room["room_owner"]) {
					this.roomOwnerIsMyself = true;
					let prepareButton = this.page.container.querySelector("#prepare-btn");
					prepareButton.children[0].textContent = i18next.t("lobby-room.prepare-btn-wait");
					prepareButton.children[0].setAttribute("id", "prepare-btn-wait")
					prepareButton.children[0].setAttribute("aria-hidden", "false")
					prepareButton.children[0].setAttribute("aria-labelledby", "prepare-btn-wait")
					prepareButton.setAttribute("disabled", "");
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
							this.displayPopupMessage(i18next.t("error.owner-left"));
						}
						if (this.roomOwnerIsMyself) {
							// Note(HeiYiu): Change the prepare button
							let prepareButton = this.page.container.querySelector("#prepare-btn");
							if (message["all_prepared"]) {
								prepareButton.children[0].textContent = i18next.t("lobby-room.prepare-btn-start");
								prepareButton.children[0].setAttribute("id", "prepare-btn-start")
								prepareButton.children[0].setAttribute("aria-labelledby", "prepare-btn-start")
								prepareButton.removeAttribute("disabled");
								prepareButton.removeEventListener("click", this.page.prepareButtonFunc, {once: true});
								prepareButton.addEventListener("click", () => {
									this.sendMessageStartGame(this.roomId);
								}, {once: true});
							} else {
								prepareButton.children[0].textContent = i18next.t("lobby-room.prepare-btn-wait");
								prepareButton.children[0].setAttribute("id", "prepare-btn-wait")
								prepareButton.children[0].setAttribute("aria-hidden", "false")
								prepareButton.children[0].setAttribute("aria-labelledby", "prepare-btn-wait")
								prepareButton.setAttribute("disabled", "");
							}
							let roomSizeButtons = this.page.container.querySelector("#room-size-buttons");
							roomSizeButtons.style.display = "flex";
							let avatars = roomElement.querySelectorAll("td-avatar");
							if (avatars != null) {
								roomSizeButtons.changeMinSize(avatars.length > 2 ? avatars.length : 2);
							}
						}
					}
				} else {
					this.firstLayerPlayers = [];
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
			case "b_prepare_game": {
				console.assert(message["room_id"] == this.roomId, `Only room ${message["room_id"]} should receive b_prepare_game message. But player is in ${this.roomId == null ? "lobby" : "room " + this.roomId}`);
				let roomElement = this.page.container.querySelector("td-lobby-room");
				let avatarElements = roomElement.querySelectorAll("td-avatar");
				for (let avatarElement of avatarElements)
				{
					if (avatarElement.getAttribute("avatar-id") == message["player_id"])
					{
						let readySpeechBubble = document.createElement("div");
						readySpeechBubble.classList.add("speech-bubble");
						readySpeechBubble.style.background = "var(--td-ui-background-color)";
						readySpeechBubble.style.position = "absolute";
						readySpeechBubble.style.bottom = "84%";
						readySpeechBubble.style.left = "50%";
						readySpeechBubble.style.width = "fit-content";
						readySpeechBubble.style.height = "fit-content";
						{
							let text = document.createElement("p");
							text.style.width = "max-content";
							text.style.padding = "0 0.5em";
							text.textContent = i18next.t("lobby-room.ready-bubble-txt");
							readySpeechBubble.appendChild(text);
						}
						avatarElement.appendChild(readySpeechBubble);
						break;
					}
				}
				if (this.roomOwnerIsMyself && message["all_prepared"]) {
					let prepareButton = this.page.container.querySelector("#prepare-btn");
					prepareButton.children[0].textContent = i18next.t("lobby-room.prepare-btn-start");
					prepareButton.children[0].setAttribute("id", "prepare-btn-start")
					prepareButton.children[0].setAttribute("aria-labelledby", "prepare-btn-start")
					prepareButton.removeAttribute("disabled");
					prepareButton.removeEventListener("click", this.page.prepareButtonFunc, {once: true});
					prepareButton.addEventListener("click", (e) => {
						console.log("BUTTON PRESSED");
						e.stopImmediatePropagation();
						this.sendMessageStartGame(this.roomId);
					}, {once: true});
				}
			} break;
			case "b_start_game": {
				this.pageFinishedRendering = false;
				let players = message["players"];
				this.firstLayerPlayers = players;
				let gameIndex = 0;
				let ai = false;
				for (let [i, player] of players.entries()) {
					if (player["player_id"] == this.id) {
						gameIndex = Math.floor(i / 2);
						if ((i % 2) == 0) {
							if (players[i + 1]["player_id"] == "ai") {
								ai = true;
								window.location.href += `-ai-game${gameIndex}`; // Note(HeiYiu): might be sketchy but it works now
							}
							else {
								window.location.href += `-game${gameIndex}`; // Note(HeiYiu): might be sketchy but it works now
							}
						} else {
							if (players[i - 1]["player_id"] == "ai") {
								ai = true;
								window.location.href += `-ai-game${gameIndex}`; // Note(HeiYiu): might be sketchy but it works now
							}
							else {
								window.location.href += `-game${gameIndex}`; // Note(HeiYiu): might be sketchy but it works now
							}
						}
						document.querySelector("#tournament-tree-popup td-tournament-tree").initiateTournament(players);
						await this.waitForPageToRender();
						let popup = document.querySelector("#tournament-tree-popup");
						popup.classList.add('show');
						await sleep(5000);
						// Note(HeiYiu): show leaderboard with 5 seconds loading animation
						popup.classList.remove('show');
						let gameboard = this.page.container.querySelector("td-game-board,td-ai-game-board");
						await gameboard.countdown();
						this.sendMessagePlayerMatchReady();
						break;
					}
				}
			} break;
			case "ack_join_match": {
				this.firstLayerPlayers = message["players"];
				await this.waitForPageToRender();
				let popup = document.querySelector("#tournament-tree-popup");
				popup.classList.add('show');
				await sleep(5000);
				// Note(HeiYiu): show leaderboard with 5 seconds loading animation
				popup.classList.remove('show');
				let gameboard = this.page.container.querySelector("td-game-board,td-ai-game-board");
				await gameboard.countdown();
				this.sendMessagePlayerMatchReady();
			} break;
			case "b_join_match": {

			} break;
			case "b_leave_match": {
				
			} break;
			case "b_start_match": {
				let gameboard = this.page.container.querySelector("td-game-board");
				if (!gameboard) {
					gameboard = document.createElement("td-game-board");
					this.page.container.appendChild(matchElement);
				}
				gameboard.startMatch(message);
			} break;
			case "b_start_ai_match": {
				let gameboard = this.page.container.querySelector("td-ai-game-board");
				if (!gameboard) {
					gameboard = document.createElement("td-ai-game-board");
					this.page.container.appendChild(matchElement);
				}
				gameboard.startMatch(message);
			} break;
			case "b_paddle_move": {
				let gameboard = this.page.container.querySelector("td-game-board");
				gameboard.oponentPaddleMoved(message["paddle"], message["position"])
			} break;
			case "b_bounce_ball": {
				let gameboard = this.page.container.querySelector("td-game-board");
				gameboard.ballBounced(message);
			} break;
			case "b_scored_point": {
				let gameboard = this.page.container.querySelector("td-game-board");
				gameboard.pointScored(message["player"]);
				gameboard.ballBounced(message);
			} break;
			case "b_match_win": {
				let gameboard = this.page.container.querySelector("td-game-board, td-ai-game-board");
				gameboard.displayMatchResult(this.firstLayerPlayers[message["winners"][this.gameIndex]]);
			} break;
			case "b_ai_scored_point": {
				let gameboard = this.page.container.querySelector("td-ai-game-board");
				gameboard.updateBall(message);
			} break;
			case "b_avatar_change": {
				// only in room page
				let playerId = message["player_id"];
				let emoji = message["emoji"];
				let backgroundColor = '#' + message["bg_color"];
				if (this.pageName == "room") {
					let roomElement = this.page.container.querySelector("td-lobby-room");
					roomElement.changeParticipant(emoji, backgroundColor, playerId);
				}
			} break;
			case "ack_avatar_change": {
				// only in lobby or room page
				let emoji = message["emoji"];
				let backgroundColor = '#' + message["bg_color"];
				let avatarElement = document.querySelector("td-navigation-bar")?.shadow.querySelector("td-avatar");
				avatarElement.setAttribute("avatar-name", emoji);
				avatarElement.setAttribute("avatar-background", backgroundColor);
				if (this.pageName == "room") {
					let roomElement = this.page.container.querySelector("td-lobby-room");
					roomElement.changeParticipant(emoji, backgroundColor, this.id);
				}
			} break;
			case "error": {
				this.displayPopupMessage(i18next.t(message.message_key));
				if (message["redirect_hash"]) {
					if ((this.pageName == "room") || (this.pageName == "game") || (this.pageName == "ai-game"))
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
		this.ws.addEventListener("close", (event) => {
			if (this.reconnectCount >= 3) {
				console.log("Websocket connection is closed");
				this.displayPopupMessage(i18next.t("error.connection-lost-3-times"));
				this.displayPopupMessage("Connection lost");
				this.reconnectCount = 0;
				window.location.hash = "#login";
			} else {
				console.log("Websocket connection is being restarted");
				this.displayPopupMessage(i18next.t("error.connection-lost"));
				this.reconnectCount++;
				setTimeout(this.connectWs.bind(this), 1000);
			}
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

	sendMessagePrepareGame(roomId) {
		let message = {
			type: "prepare_game",
			"room_id": roomId,
			"player_id": this.id
		};
		this.sendMessage(JSON.stringify(message));
	}

	sendMessageStartGame(roomId) {
		let message = {
			type: "start_game",
			"room_id": roomId,
		};
		this.sendMessage(JSON.stringify(message));
	}

	sendMessageJoinMatch(roomId, gameIndex) {
		let message = {
			type: "join_match",
			"room_id": roomId,
			"player_id": this.id,
			"match_id": gameIndex
		};
		this.sendMessage(JSON.stringify(message));
	}

	sendMessageStartGameCountDown() {
		let message = {
			type: "start_game_countdown"
		};
		this.sendMessage(JSON.stringify(message));
	}

	sendMessagePlayerMatchReady() {
		let message = {
			type: "player_match_ready"
		};
		this.sendMessage(JSON.stringify(message));
	}

	sendMessageAvatarChange(emoji, backgroundColor) {
		let message = {
			type: "player_avatar_change",
			emoji: emoji,
			bg_color: backgroundColor
		};
		this.sendMessage(JSON.stringify(message));
	}
}

export function sleep(ms) {
	return new Promise(resolve => setTimeout(resolve, ms));
}

export const myself = new Visitor();

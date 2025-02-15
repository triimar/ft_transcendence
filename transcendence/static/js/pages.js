import { myself } from "./myself.js"

class PageConfirmLeave {
	constructor() {
		this.previousHref = null;
		this.displayConfirmPopup = true;
		this.confirmPopupRedirectPageHash = null;
	}

	attachEvents() {
		// Note(HeiYiu): Events for leaving room confirmation
		this.previousHref = location.href;
		let roomId = myself.roomId;
		this.logoutYesButtonFunc = () => {
			this.displayConfirmPopup = false;
			myself.sendMessageLeaveRoom(roomId);
		};
		document.querySelector("#logout-yes-btn").addEventListener("click", this.logoutYesButtonFunc, {once: true});
		this.beforeUnloadFunc = ((e) => {
			e.preventDefault();
			e.returnValue = true;
		});
		window.addEventListener("beforeunload", this.beforeUnloadFunc);
	}

	removeEvents() {
		document.querySelector("#logout-yes-btn").removeEventListener("click", this.logoutYesButtonFunc, {once: true});
		window.removeEventListener("beforeunload", this.beforeUnloadFunc);
	}

	beforeOnHashChange(newPageName, newRoomId, newGameIndex) {
		let userNotLoggedOut = myself.id != null;
		if (this.displayConfirmPopup && userNotLoggedOut) {
			if (newRoomId == myself.roomId) {
				this.confirmPopupRedirectPageHash = "#main";
			} else {
				// Note(HeiYiu): So that one can leave a room and join another room directly
				this.confirmPopupRedirectPageHash = window.location.hash;
			}
			history.replaceState(null, document.title, this.previousHref);
			openPopup("confirm-to-logout-popup")
			return false;
		}
		return true;
	}
}

export class PageAiGame extends PageConfirmLeave {
	constructor(container) {
		super();
		this.templateId = "page-ai-game";
		this.container = container;
	}

	attachEvents() {
		super.attachEvents();
		// Note(HeiYiu): Other events
		this.container.querySelector("#leave-room-btn").addEventListener("click", () => {
			location.hash = "#main";
		});
		let avatarCustomizationForm = document.querySelector("#avatar-info-popup form");
		avatarCustomizationForm.classList.add("disable-click");
		let colorSeletionContainer = document.querySelector("#color-selection-container");
		for (let colorOption of colorSeletionContainer.children) {
			colorOption.setAttribute("disabled", true);
		}
		let inputName = document.querySelector("#id-card-name");
		inputName.setAttribute("disabled", true);
	}

	removeEvents() {
		super.removeEvents();
	}

	beforeOnHashChange(newPageName, newRoomId, newGameIndex) {
		if ((newPageName == "game" || newPageName == "ai-game") && (newRoomId == myself.roomId)) {
			return true;
		}
		return super.beforeOnHashChange(newPageName, newRoomId, newGameIndex);
	}
}

export class PageError {
	constructor(container) {
		this.templateId = "page-error";
		this.container = container;
	}

	attachEvents() {

	}

	removeEvents() {

	}
}

export class PageGame extends PageConfirmLeave {
	constructor(container) {
		super();
		this.templateId = "page-game";
		this.container = container;
	}

	attachEvents() {
		super.attachEvents();
		// Note(HeiYiu): Other events
		this.container.querySelector("#leave-room-btn").addEventListener("click", () => {
			location.hash = "#main";
		});
		let avatarCustomizationForm = document.querySelector("#avatar-info-popup form");
		avatarCustomizationForm.classList.add("disable-click");
		let colorSeletionContainer = document.querySelector("#color-selection-container");
		for (let colorOption of colorSeletionContainer.children) {
			colorOption.setAttribute("disabled", true);
		}
		let inputName = document.querySelector("#id-card-name");
		inputName.setAttribute("disabled", true);
	}

	removeEvents() {
		super.removeEvents();
	}

	beforeOnHashChange(newPageName, newRoomId, newGameIndex) {
		if ((newPageName == "game" || newPageName == "ai-game") && (newRoomId == myself.roomId)) {
			return true;
		}
		return super.beforeOnHashChange(newPageName, newRoomId, newGameIndex);
	}
}

export class PageLogin {
	constructor(container) {
		this.templateId = "page-login";
		this.container = container;
	}

	attachEvents() {
		this.btnLoginGuestEvent = async () => {
			console.log("guest login");
			let is_success = await myself.login(true);
			if (!is_success) {
				localStorage.removeItem("login_method");
				location.hash = "#login";
				window.dispatchEvent(new HashChangeEvent("hashchange"));
			}
			else {
				let hash = window.location.hash.slice(1);
				if ((hash == '') || (hash == "login")) {
					hash = "main";
					location.hash = '#' + hash;
				} else {
					location.hash = '#' + hash;
					window.dispatchEvent(new HashChangeEvent("hashchange"));
				}
			}
		};
		this.container.querySelector("#btn-login-guest").addEventListener("click", this.btnLoginGuestEvent);
		this.btnLoginIntraEvent = async () => {
			console.log("intra login");
			let lastPageHash = localStorage.getItem("last_page_hash");
			if (!lastPageHash) localStorage.setItem("last_page_hash", "main");
			await myself.login(false);
		};
		this.container.querySelector("#btn-login-intra").addEventListener("click", this.btnLoginIntraEvent);
	}

	removeEvents() {
		// Note(HeiYiu): One might not need to removeEventListener because the tree will be removed anyway
		// this.container.querySelector("#btn-login-guest").removeEventListener("click", this.#btnLoginGuestEvent);
		// this.container.querySelector("#btn-login-intra").removeEventListener("click", this.#btnLoginIntraEvent);
	}
}

export class PageMain {
	constructor(container) {
		this.templateId = "page-main";
		this.container = container;
	}

	attachEvents() {
		if (myself.getLoginMethod() == "intra")
		{
			let label = document.createElement("p");
			label.textContent = "Intra User";
			label.style.color = "black";
			label.style.fontSize = "15px";
			label.style.background = "yellow";
			label.style.border = "2px solid black";
			label.style.zIndex = "5";
			label.style.position = "fixed";
			label.style.width = "fit-content";
			label.style.top = "0";
			label.style.left = "0";
			this.container.appendChild(label);
		}
		let addRoomButton = this.container.querySelector("#add-room-btn");
		addRoomButton.addEventListener("click", myself.sendMessageAddRoom.bind(myself));
		let avatarCustomizationForm = document.querySelector("#avatar-info-popup form");
		avatarCustomizationForm.classList.remove("disable-click");
		let colorSeletionContainer = document.querySelector("#color-selection-container");
		for (let colorOption of colorSeletionContainer.children) {
			colorOption.removeAttribute("disabled");
		}
		let inputName = document.querySelector("#id-card-name");
		inputName.removeAttribute("disabled");
	}

	removeEvents() {

	}
}

export class PageRoom extends PageConfirmLeave{
	constructor(container) {
		super();
		this.templateId = "page-room";
		this.container = container;
	}

	attachEvents() {
		super.attachEvents();
		// Note(HeiYiu): Other events
		this.container.querySelector("#leave-room-btn").addEventListener("click", () => {
			location.hash = "#main";
		});
		let roomId = myself.roomId;
		this.prepareButtonFunc = (e) => {
			myself.sendMessagePrepareGame(roomId);

			e.currentTarget.children[0].textContent = i18next.t("lobby-room.prepared-btn-txt");
			e.currentTarget.setAttribute("disabled", "");
		};
		this.container.querySelector("#prepare-btn").addEventListener("click", this.prepareButtonFunc, {once: true});

		let roomSizeSetting = this.container.querySelector("#room-size-buttons");
		roomSizeSetting.shadowRoot.querySelector("#inc-button").addEventListener("click", () => {
			if (myself.roomOwnerIsMyself) myself.sendMessageChangeMaxPlayer(roomId, roomSizeSetting.size);
		});
		roomSizeSetting.shadowRoot.querySelector("#dec-button").addEventListener("click", () => {
			if (myself.roomOwnerIsMyself) myself.sendMessageChangeMaxPlayer(roomId, roomSizeSetting.size);
		});
		let avatarCustomizationForm = document.querySelector("#avatar-info-popup form");
		avatarCustomizationForm.classList.remove("disable-click");
		let colorSeletionContainer = document.querySelector("#color-selection-container");
		for (let colorOption of colorSeletionContainer.children) {
			colorOption.removeAttribute("disabled");
		}
		let inputName = document.querySelector("#id-card-name");
		inputName.removeAttribute("disabled");
		let roomModeSetting = this.container.querySelector("#room-mode-buttons");
		let container = roomModeSetting.shadow.querySelector("#mode-btn-container");
		container.addEventListener("click", (event) => {
			if (myself.roomOwnerIsMyself && (event.target != container) && !(event.target.classList.contains("chosen"))) {
				let id = event.target.id;
				let modeName = id.substring(0, id.indexOf("-"));
				myself.sendMessageUpdateMode(myself.roomId, modeName);
			}
		}, true);
	}

	removeEvents() {
		super.removeEvents();
	}

	beforeOnHashChange(newPageName, newRoomId, newGameIndex) {
		if (((newPageName == "game") || (newPageName == "ai-game")) && (newRoomId != null) && (newRoomId == myself.roomId)) {
			return true;
		}
		return super.beforeOnHashChange(newPageName, newRoomId, newGameIndex);
	}
}

export class PageLocalGame {
	constructor(container) {
		this.templateId = "page-local-game";
		this.container = container;
	}

	attachEvents() {
		let registrationContainer = this.container.querySelector(".registration-container");
		let gameContainer = this.container.querySelector("#game-container");
		let startButton = this.container.querySelector("#start-game-button");
		startButton.addEventListener("click", async () => {
			let gameBoard = this.container.querySelector("td-local-game-board");
			let gameMode = this.container.querySelector("td-room-setting-mode").getAttribute("room-mode");
			let player0Avatar = this.container.querySelector("#player0-info").shadow.querySelector("td-avatar");
			let player1Avatar = this.container.querySelector("#player1-info").shadow.querySelector("td-avatar");
			let player0 = {player_emoji: player0Avatar.getAttribute("avatar-name"), player_bg_color: player0Avatar.getAttribute("avatar-background").slice(1)};
			let player1 = {player_emoji: player1Avatar.getAttribute("avatar-name"), player_bg_color: player1Avatar.getAttribute("avatar-background").slice(1)};
			let ball = {
				position: {x: 600, y: 300},
				velocity: {vx: 2, vy: 2}
			};
			registrationContainer.classList.add("hide");
			
			const contentContainer = document.getElementsByClassName("content-container")[0];
			const focusableElements = contentContainer.querySelectorAll(
				'a[href], button, textarea, input[type="text"], input[type="radio"], input[type="checkbox"], select, [tabindex]:not([tabindex="-1"])'
			);
			if (focusableElements.length > 0) focusableElements[0].focus();

			gameContainer.classList.remove("hide");
			await gameBoard.countdown();
			gameBoard.startMatch({players: [player0, player1], game_mode: gameMode, ball: ball, side: 0});
		});
	}

	removeEvents() {

	}
}

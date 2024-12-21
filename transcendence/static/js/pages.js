import { myself } from "./myself.js"
export class PageAiGame {
	constructor(container) {
		this.templateId = "page-ai-game";
		this.container = container;
	}

	attachEvents() {

	}

	removeEvents() {

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

export class PageGame {
	constructor(container) {
		this.templateId = "page-game";
		this.container = container;
	}

	attachEvents() {

	}

	removeEvents() {

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
	}

	removeEvents() {

	}
}

export class PageRoom {
	constructor(container) {
		this.templateId = "page-room";
		this.container = container;
		this.displayConfirmPopup = true;
		this.confirmPopupRedirectPageHash = null;
	}

	attachEvents() {
		this.previousHref = location.href;
		this.container.querySelector("#leave-room-btn").addEventListener("click", () => {
			location.hash = "#main";
		});
		let roomId = myself.roomId;
		this.container.querySelector("#prepare-btn").addEventListener("click", e => {
			myself.sendMessagePrepareGame(roomId);
			e.currentTarget.children[0].textContent = "PREPARED";
			e.currentTarget.setAttribute("disabled", "");
		}, {once: true});
		this.container.querySelector("#yes-btn").addEventListener("click", () => {
			this.displayConfirmPopup = false;
			myself.sendMessageLeaveRoom(roomId);
		});
		this.container.querySelector("#no-btn").addEventListener("click", () => {
			let confirmToLogOutPopup = this.container.querySelector("#confirm-to-logout-popup");
			confirmToLogOutPopup.classList.remove("show");
		});
		this.beforeUnloadFunc = ((e) => {
			e.preventDefault();
			e.returnValue = true;
		});
		window.addEventListener("beforeunload", this.beforeUnloadFunc);

		let roomSizeSetting = this.container.querySelector("#room-size-buttons");
		roomSizeSetting.shadowRoot.querySelector("#inc-button").addEventListener("click", () => {
			myself.sendMessageChangeMaxPlayer(roomId, roomSizeSetting.size);
		});
		roomSizeSetting.shadowRoot.querySelector("#dec-button").addEventListener("click", () => {
			myself.sendMessageChangeMaxPlayer(roomId, roomSizeSetting.size);
		});
	}

	removeEvents() {
		window.removeEventListener("beforeunload", this.beforeUnloadFunc);
	}

	beforeOnHashChange() {
		// Note(HeiYiu): if the user is not logged out
		if (this.displayConfirmPopup && (myself.id != null)) {
			this.confirmPopupRedirectPageHash = window.location.hash;
			history.replaceState(null, document.title, this.previousHref);
			let confirmToLogOutPopup = this.container.querySelector("#confirm-to-logout-popup");
			confirmToLogOutPopup.classList.add("show");
			return true;
		}
		return false;
	}
}

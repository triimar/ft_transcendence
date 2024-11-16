import { myself } from "../myself.js"
export default class PageLogin {
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

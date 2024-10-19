import { myself } from "../myself.js"
export default class PageLogin {
	constructor(container) {
		this.templateId = "page-login";
		this.container = container;
	}

	attachEvents() {
        this.btnLoginGuestEvent = async () => {
            console.log("guest login");
            await myself.login(true);
        };
        this.container.querySelector("#btn-login-guest").addEventListener("click", this.btnLoginGuestEvent);
        this.btnLoginIntraEvent = async () => {
            console.log("intra login");
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

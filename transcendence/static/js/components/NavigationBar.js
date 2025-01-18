import { myself } from "../myself.js"
export default class ComponentNavigationBar extends HTMLElement {
	constructor() {
		super();
		this.shadow = this.attachShadow({ mode: "open" });
		const template = document.getElementById("component-navigation-bar");
		this.shadow.appendChild(template.content.cloneNode(true));
	}

	connectedCallback() {
		this.shadow.querySelector("td-logo").addEventListener("click", () => {window.location.hash = "#main"});

		this.logoutFunc = () => {
			if (myself.roomId == null) {
				myself.logout();
				window.location.hash = "#login";
			} else {
				// Note(HeiYiu): this will redirect there after ack_leave_room is received
				myself.page.confirmPopupRedirectPageHash = "#login";
				myself.sendMessageLeaveRoom(myself.roomId);
				myself.logout();
				setTimeout(() => {
					if (window.location.hash != "#login") {
						window.location.hash = "#login";
					}
				}, 2000);
			}
		};
		document.querySelector("#logout-btn").addEventListener("click", this.logoutFunc, true);
		// Note(HeiYiu): Change avatar
		let avatarElement = document.createElement("td-avatar");
		avatarElement.setAttribute("avatar-name", myself.avatar_emoji);
		avatarElement.setAttribute("avatar-background", myself.avatar_bg_color);
		avatarElement.setAttribute("avatar-id", myself.id);
		avatarElement.setAttribute("slot", "avatar");
		let dummyAvatars = [document.querySelector("#avatar-info td-avatar"), this.shadow.querySelector("td-avatar")];
		for (let dummyAvatar of dummyAvatars) {
			dummyAvatar.parentNode.replaceChild(avatarElement.cloneNode(), dummyAvatar);
		}
		document.querySelector("#id-card-name").value = myself.avatar_emoji;
		let colorContainer = document.querySelector("#color-selection-container");
		for (let colorOption of colorContainer.children) {
			if (colorOption.getAttribute("color") == myself.avatar_bg_color) {
				colorOption.classList.add("chosen");
			}
			else {
				colorOption.classList.remove("chosen");
			}
		}
	}

	disconnectedCallback() {
		document.querySelector("#logout-btn").removeEventListener("click", this.logoutFunc, true);
	}
}

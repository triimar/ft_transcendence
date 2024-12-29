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
		this.modeSwitcherFunc = (() => {
			let bgColor = getComputedStyle(document.documentElement).getPropertyValue('--td-ui-background-color');
			let fgColor = getComputedStyle(document.documentElement).getPropertyValue('--td-ui-font-color');
			document.documentElement.style.setProperty('--td-ui-background-color', fgColor);
			document.documentElement.style.setProperty('--td-ui-font-color', bgColor);
		}).bind(this);
		this.shadow.querySelector("#mode").addEventListener("click", this.modeSwitcherFunc, true);

		this.logoutFunc = () => {
			if (myself.roomId == null) {
				myself.logout();
				window.location.hash = "#login";
			} else {
				// Note(HeiYiu): this will redirect there after ack_leave_room is received
				myself.page.confirmPopupRedirectPageHash = "#login";
				myself.sendMessageLeaveRoom(myself.roomId);
				myself.logout();
				window.location.hash = "#login";
			}
		};
		document.querySelector("#logout-btn").addEventListener("click", this.logoutFunc, true);
			// Note(HeiYiu): Change avatar
			let avatarElement = document.createElement("td-avatar");
			avatarElement.setAttribute("avatar-name", myself.avatar_emoji);
			avatarElement.setAttribute("avatar-background", myself.avatar_bg_color);
			avatarElement.setAttribute("avatar-id", myself.id);
			avatarElement.setAttribute("slot", "avatar");
			let dummyAvatars = [document.querySelector("#avatar-info-popup td-avatar"), this.shadow.querySelector("td-avatar")];
			for (let dummyAvatar of dummyAvatars) {
				dummyAvatar.parentNode.replaceChild(avatarElement.cloneNode(), dummyAvatar);
			}
	}

	disconnectedCallback() {
		this.shadow.querySelector("#mode").removeEventListener("click", this.modeSwitcherFunc, true);
		document.querySelector("#logout-btn").removeEventListener("click", this.logoutFunc, true);
	}
}

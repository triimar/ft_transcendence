export default class ComponentRoomSettingMode extends HTMLElement {
	static observedAttributes = ["room-mode"];
	constructor() {
		super();
		this.shadow = this.attachShadow({ mode: "open" });
		const template = document.getElementById("component-room-setting-mode");
		this.shadow.appendChild(template.content.cloneNode(true));
	}

	connectedCallback() {
		// const incButton = this.shadow.querySelector("#inc-button");
		// const decButton = this.shadow.querySelector("#dec-button");
		// incButton.addEventListener("click", () => {
		// 	if (this.size < this.maxSize) {
		// 		this.size++;
		// 		this.shadow.querySelector("#label").textContent = i18next.t("label.people", { count: this.size });
		// 		if (this.size == this.maxSize) {
		// 			incButton.setAttribute("disabled", "");
		// 		}
		// 		else {
		// 			incButton.removeAttribute("disabled");
		// 			decButton.removeAttribute("disabled");
		// 		}
		// 	}
		// });
		// decButton.addEventListener("click", () => {
		// 	if (this.size > this.minSize) {
		// 		this.size--;
		// 		this.shadow.querySelector("#label").textContent = i18next.t("label.people", { count: this.size });
		// 		if (this.size == this.minSize) {
		// 			decButton.setAttribute("disabled", "");
		// 		}
		// 		else {
		// 			decButton.removeAttribute("disabled");
		// 			incButton.removeAttribute("disabled");
		// 		}
		// 	}
		// });
		// if (this.size == this.minSize) decButton.setAttribute("disabled", "");
		// if (this.size == this.maxSize) incButton.setAttribute("disabled", "");
		// this.shadow.querySelector("#label").textContent = i18next.t("label.people", { count: this.size });
	}
}

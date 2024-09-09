export default class ComponentRoomSettingSize extends HTMLElement {
	constructor() {
		super();
		this.shadow = this.attachShadow({ mode: "open" });
		const template = document.getElementById("component-room-setting-size");
		this.shadow.appendChild(template.content.cloneNode(true));
		this.size = 2;
		this.maxSize = 8;
	}

	connectedCallback() {
		const incButton = this.shadow.querySelector("#inc-button");
		const decButton = this.shadow.querySelector("#dec-button");
		incButton.addEventListener("click", () => {
			if (this.size < this.maxSize) {
				this.size++;
				this.shadow.querySelector("#label").textContent = `${this.size} PEOPLE`;
				if (this.size == this.maxSize) {
					incButton.setAttribute("disabled", "");
				}
				else {
					incButton.removeAttribute("disabled");
					decButton.removeAttribute("disabled");
				}
			}
		});
		decButton.addEventListener("click", () => {
			if (this.size > 2) {
				this.size--;
				this.shadow.querySelector("#label").textContent = `${this.size} PEOPLE`;
				if (this.size == 2) {
					decButton.setAttribute("disabled", "");
				}
				else {
					decButton.removeAttribute("disabled");
					incButton.removeAttribute("disabled");
				}
			}
		});
		if (this.size == 2) decButton.setAttribute("disabled", "");
		if (this.size == this.maxSize) incButton.setAttribute("disabled", "");
		this.shadow.querySelector("#label").textContent = `${this.size} PEOPLE`;
	}
}

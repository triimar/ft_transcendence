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
					incButton.classList.add("disable-click");
				}
				else {
					incButton.classList.remove("disable-click");
					decButton.classList.remove("disable-click");
				}
			}
		});
		decButton.addEventListener("click", () => {
			if (this.size > 2) {
				this.size--;
				this.shadow.querySelector("#label").textContent = `${this.size} PEOPLE`;
				if (this.size == 2) {
					decButton.classList.add("disable-click");
				}
				else {
					decButton.classList.remove("disable-click");
					incButton.classList.remove("disable-click");
				}
			}
		});
		if (this.size == 2) decButton.classList.add("disable-click");
		if (this.size == this.maxSize) incButton.classList.add("disable-click");
		this.shadow.querySelector("#label").textContent = `${this.size} PEOPLE`;
	}
}

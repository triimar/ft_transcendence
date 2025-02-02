export default class ComponentRoomSettingMode extends HTMLElement {
	static observedAttributes = ["room-mode"];
	constructor() {
		super();
		this.shadow = this.attachShadow({ mode: "open" });
		const template = document.getElementById("component-room-setting-mode");
		this.shadow.appendChild(template.content.cloneNode(true));
	}

	connectedCallback() {
		let container = this.shadow.querySelector("#mode-btn-container");
		container.addEventListener("click", (event) => {
			for (let button of container.children) {
				if (event.target == button) {
					let id = event.target.id;
					let modeName = id.substring(0, id.indexOf("-"));
					button.classList.add("chosen");
					this.setAttribute("room-mode", modeName);
				} else {
					button.classList.remove("chosen");
				}
			}
		});
		let description = this.shadow.querySelector("#game-mode-description-txt");
		container.addEventListener("mouseover", (event) => {
			let id = event.target.id;
			switch (id) {
			case "classic-mode-btn": {
				description.textContent = i18next.t("classic-mode-description");
			} break;
			case "balance-mode-btn": {
				description.textContent = i18next.t("balance-mode-description");
			} break;
			case "local-mode-btn": {
				description.textContent = i18next.t("local-mode-description");
			} break;
			}
		});
		this.setAttribute("room-mode", "classic");
		container.addEventListener("mouseout", (event) => {
			let modeName = this.getAttribute("room-mode");
			description.textContent = i18next.t(`${modeName}-mode-description`);
		});
		this.shadow.querySelector("#classic-mode-btn-txt").textContent = i18next.t("classic-mode-txt");
		this.shadow.querySelector("#balance-mode-btn-txt").textContent = i18next.t("balance-mode-txt");
		this.shadow.querySelector("#local-mode-btn-txt").textContent = i18next.t("local-mode-txt");
	}

	attributeChangedCallback(name, oldValue, newValue) {
		if (oldValue == newValue) return;
		if (name == "room-mode") {
			let modeName = newValue;
			let possibleNames = ["classic", "balance", "local"];
			if (possibleNames.includes(modeName)) {
				let description = this.shadow.querySelector("#game-mode-description-txt");
				let container = this.shadow.querySelector("#mode-btn-container");
				for (let button of container.children) {
					let id = button.id;
					if (id == `${modeName}-mode-btn`) {
						button.classList.add("chosen");
					} else {
						button.classList.remove("chosen");
					}
				}
				description.textContent = i18next.t(`${modeName}-mode-description`);
			}
		}
	}
}

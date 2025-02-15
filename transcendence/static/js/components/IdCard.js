export default class ComponentIdCard extends HTMLElement {
	constructor() {
		super();
		this.shadow = this.attachShadow({ mode: "open" });
		const template = document.getElementById("component-id-card");
		this.shadow.appendChild(template.content.cloneNode(true));
	}

	connectedCallback() {
		let colorSelectionContainer = this.shadow.getElementById("color-selection-container");
		let avatarNameTextInput = this.shadow.getElementById("id-card-name");
		let avatarElement = this.shadow.querySelector("td-avatar");
		avatarNameTextInput.value = "^;^";
		avatarElement.setAttribute("avatar-name", "^;^");

		avatarNameTextInput.addEventListener("input", (e) => {
			avatarElement.setAttribute("avatar-name", e.target.value);
		}, true);
		let colorSelectionFunc = (e) => {
			if (e.target != colorSelectionContainer) {
				for (let colorOption of colorSelectionContainer.children) {
					colorOption.classList.remove("chosen");
				}
				e.target.classList.add("chosen");
				let avatarElement = this.shadow.querySelector("td-avatar");
				avatarElement.setAttribute("avatar-background", e.target.getAttribute("color"));
			}
		}
		colorSelectionFunc({target: colorSelectionContainer.children[0]});
		colorSelectionContainer.addEventListener("click", colorSelectionFunc);
		colorSelectionContainer.addEventListener("keydown", (e) => {
			if ((e.key == "Enter") || (e.key == " ")) {
				e.preventDefault();
				e.target.click();
			}
		});
	}

	updateTranslation() {
    const translations = [
			{ id: "id-card-name-text", key: "popups.id-card-name-text" },
			{ id: "id-card-background-text", key: "popups.id-card-background-text" },
		];
		translations.forEach(({ id, key }) => {
			this.shadow.getElementById(id).textContent = i18next.t(key);
		});
	}
}

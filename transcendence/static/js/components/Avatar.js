export default class ComponentAvatar extends HTMLElement {
	static observedAttributes = ["avatar-name", "avatar-background"];
	constructor() {
		super();
		this.shadow = this.attachShadow({ mode: "open" });
		const template = document.getElementById("component-avatar");
		this.shadow.appendChild(template.content.cloneNode(true));
	}

	attributeChangedCallback(name, oldValue, newValue) {
		switch (name)
		{
		case "avatar-name":
			let text = this.shadow.querySelector("#avatar-name");
			text.textContent = newValue.slice(0, 3);
			break;
		case "avatar-background":
			this.style.background = newValue;
			break;
		}
	}
}

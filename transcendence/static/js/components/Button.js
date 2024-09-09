export default class ComponentButton extends HTMLElement {
	static observedAttributes = ["text"];
	constructor() {
		super();
		this.shadow = this.attachShadow({ mode: "open" });
		const template = document.getElementById("component-button");
		this.shadow.appendChild(template.content.cloneNode(true));
	}

	connectedCallback() {
		
	}

	attributeChangedCallback(name, oldValue, newValue) {
		switch (name)
		{
		case "text":
			this.shadow.host.children[0].textContent = newValue;
			break;
		}
	}
}

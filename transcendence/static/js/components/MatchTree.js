export default class ComponentMatchTree extends HTMLElement {
	//static observedAttributes = ["room-max", "room-id"];
	constructor() {
		super();
		this.shadow = this.attachShadow({ mode: "open" });
		const template = document.getElementById("component-match-tree");
		this.shadow.appendChild(template.content.cloneNode(true));
	}

	attributeChangedCallback(name, oldValue, newValue) {}

	connectedCallback() {
	}
}

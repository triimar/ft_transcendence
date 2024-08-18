export default class ComponentAvatar extends HTMLElement {
	static observedAttributes = ["avatar-name", "avatar-background"];
	constructor() {
		super();
		const shadowRoot = this.attachShadow({ mode: "open" });
		const template = document.getElementById("component-avatar");
		shadowRoot.appendChild(template.content.cloneNode(true));
	}

	connectedCallback() {

	}
}

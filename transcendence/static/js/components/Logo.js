export default class ComponentLogo extends HTMLElement {
	constructor() {
		super();
		const shadowRoot = this.attachShadow({ mode: "open" });
		const template = document.getElementById("component-logo");
		shadowRoot.appendChild(template.content.cloneNode(true));
	}

	connectedCallback() {

	}
}

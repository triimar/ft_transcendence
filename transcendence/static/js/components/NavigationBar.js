export default class ComponentNavigationBar extends HTMLElement {
	constructor() {
		super();
		const shadowRoot = this.attachShadow({ mode: "open" });
		const template = document.getElementById("component-navigation-bar");
		shadowRoot.appendChild(template.content.cloneNode(true));
	}

	connectedCallback() {

	}
}

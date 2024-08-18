export default class ComponentLobbyRoom extends HTMLElement {
	constructor() {
		super();
		const shadowRoot = this.attachShadow({ mode: "open" });
		const template = document.getElementById("component-lobby-room");
		shadowRoot.appendChild(template.content.cloneNode(true));
	}

	connectedCallback() {

	}
}

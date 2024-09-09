export default class ComponentButton extends HTMLElement {
	constructor() {
		super();
		this.shadow = this.attachShadow({ mode: "open" });
		const template = document.getElementById("component-button");
		this.shadow.appendChild(template.content.cloneNode(true));
	}
}

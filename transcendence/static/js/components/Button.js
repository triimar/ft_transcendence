export default class ComponentButton extends HTMLElement {
	constructor() {
		super();
		this.shadow = this.attachShadow({ mode: "open" });
		const template = document.getElementById("component-button");
		this.shadow.appendChild(template.content.cloneNode(true));		
	}

	connectedCallback() {
		this.setAttribute("role", "button");
		this.setAttribute("tabindex", "0")
		Array.from(this.children).forEach((child) => {
			if (child.tagName === "P") {
				child.setAttribute("role", "none");
			}
		});

		this.addEventListener("keydown", (e) => {
			if ((e.key === "Enter") || (e.key === " ")) {
				this.click();
			}
		});
	}
}

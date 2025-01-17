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
				child.setAttribute("aria-hidden", "true");
			}
		});

		this.addEventListener("keydown", (e) => {
			if ((!this.hasAttribute("disabled")) && ((e.key === "Enter") || (e.key === " "))) {
				e.preventDefault(); 
				this.dispatchEvent(new Event("click", { bubbles: true }));
			}
		});
	}
}

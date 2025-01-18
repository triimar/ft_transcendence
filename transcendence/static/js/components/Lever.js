export default class ComponentLever extends HTMLElement {
	constructor() {
		super();
		this.shadow = this.attachShadow({ mode: "open" });
		const template = document.getElementById("component-lever");
		this.shadow.appendChild(template.content.cloneNode(true));
		this.shadow.host.addEventListener("click", () => {
			let handleElement = this.shadow.querySelector("#handle");
			const isOn = handleElement.classList.toggle("on");
			this.setAttribute("aria-checked", isOn ? "true" : "false");
		});
	}

	connectedCallback() {
		this.setAttribute("role", "switch");
		this.setAttribute("tabindex", "0")
		this.addEventListener("keydown", (e) => {
			if ((e.key === "Enter") || (e.key === " ")) {
				this.click();
			}
		});
	}
}

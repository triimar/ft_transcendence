export default class ComponentLever extends HTMLElement {
	constructor() {
		super();
		this.shadow = this.attachShadow({ mode: "open" });
		const template = document.getElementById("component-lever");
		this.shadow.appendChild(template.content.cloneNode(true));
		this.shadow.host.addEventListener("click", () => {
			let handleElement = this.shadow.querySelector("#handle");
			handleElement.classList.toggle("on");
		});
	}
}

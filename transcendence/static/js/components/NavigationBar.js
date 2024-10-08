export default class ComponentNavigationBar extends HTMLElement {
	constructor() {
		super();
		this.shadow = this.attachShadow({ mode: "open" });
		const template = document.getElementById("component-navigation-bar");
		this.shadow.appendChild(template.content.cloneNode(true));
	}

	connectedCallback() {
		this.modeSwitcherFunc = (() => {
			let bgColor = getComputedStyle(document.documentElement).getPropertyValue('--td-ui-background-color');
			let fgColor = getComputedStyle(document.documentElement).getPropertyValue('--td-ui-font-color');
			document.documentElement.style.setProperty('--td-ui-background-color', fgColor);
			document.documentElement.style.setProperty('--td-ui-font-color', bgColor);
		}).bind(this);
		this.shadow.querySelector("#mode").addEventListener("click", this.modeSwitcherFunc, true);
	}

	disconnectedCallback() {
		this.shadow.querySelector("#mode").removeEventListener("click", this.modeSwitcherFunc, true);
	}
}

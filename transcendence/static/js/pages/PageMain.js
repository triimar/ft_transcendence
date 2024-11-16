import { myself } from "../myself.js"
export default class PageMain {
	constructor(container) {
	this.templateId = "page-main";
	this.container = container;
	}

	attachEvents() {
		if (myself.getLoginMethod() == "intra")
		{
			let label = document.createElement("p");
			label.textContent = "Intra User";
			label.style.color = "black";
			label.style.fontSize = "15px";
			label.style.background = "yellow";
			label.style.border = "2px solid black";
			label.style.zIndex = "5";
			label.style.position = "fixed";
			label.style.width = "fit-content";
			label.style.top = "0";
			label.style.left = "0";
			this.container.appendChild(label);
		}
		let addRoomButton = this.container.querySelector("#add-room-btn");
		addRoomButton.addEventListener("click", myself.sendMessageAddRoom.bind(myself));
	}

	removeEvents() {

	}
}

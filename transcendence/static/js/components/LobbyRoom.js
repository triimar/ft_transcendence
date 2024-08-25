export default class ComponentLobbyRoom extends HTMLElement {
	static observedAttributes = ["room-max", "room-id"];
	constructor() {
		super();
		this.shadow = this.attachShadow({ mode: "open" });
		const template = document.getElementById("component-lobby-room");
		this.shadow.appendChild(template.content.cloneNode(true));
	}

	attributeChangedCallback(name, oldValue, newValue) {
		switch (name)
		{
		case "room-max":
			let participants = this.querySelectorAll("td-avatar");
			let join_buttons = this.querySelectorAll("td-lobby-room-join-button");
			for (let join_button of join_buttons)
			{
				this.removeChild(join_button);
			}
			let participants_max = parseInt(newValue);
			if (participants_max > participants.length) {
				for (let i = participants_max - participants.length; i > 0; i--)
				{
					let button = document.createElement("td-lobby-room-join-button");
					button.classList.add("ui");
					this.appendChild(button);
				}
			}
			break;
		case "room-id":
			let id = this.shadow.querySelector("#lobby-room-id");
			id.textContent = newValue;
			break;
		}
	}
}

export class ComponentLobbyRoomJoinButton extends HTMLElement {
	constructor() {
		super();
		this.shadow = this.attachShadow({ mode: "open" });
		const template = document.getElementById("component-lobby-room-join-button");
		this.shadow.appendChild(template.content.cloneNode(true));
	}
}

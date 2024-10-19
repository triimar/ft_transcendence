export default class ComponentLobbyRoom extends HTMLElement {
	static observedAttributes = ["room-max", "room-id", "room-join-disabled"];
	constructor() {
		super();
		this.shadow = this.attachShadow({ mode: "open" });
		const template = document.getElementById("component-lobby-room");
		this.shadow.appendChild(template.content.cloneNode(true));
	}

	attributeChangedCallback(name, oldValue, newValue) {
		switch (name)
		{
		case "room-join-disabled": {
			this.joinDisabled = (newValue != null);
			let join_buttons = this.querySelectorAll(".join-button");
			if (this.joinDisabled) {
				for (let join_button of join_buttons) {
					button.setAttribute("disabled", "");
				}
			} else {
				for (let join_button of join_buttons) {
					button.removeAttribute("disabled");
				}
			}
			break;
		}
		case "room-max": {
			let participants = this.querySelectorAll("td-avatar");
			let join_buttons = this.querySelectorAll(".join-button");
			for (let join_button of join_buttons)
			{
				this.removeChild(join_button);
			}
			let participants_max = parseInt(newValue);
			if (participants_max > participants.length) {
				for (let i = participants_max - participants.length; i > 0; i--)
				{
					let button = document.createElement("td-button");
					button.classList.add("ui");
					button.classList.add("join-button");
					button.style.width = "var(--td-avatar-width)";
					button.style.height = "var(--td-avatar-height)";
					button.style.position = "relative";
					button.style.padding = "0.5em em";
					button.style.display = "block";
					if (this.joinDisabled) button.setAttribute("disabled", "");

					this.appendChild(button);
					const template = document.getElementById("icon-lobby-room-join");
					button.appendChild(template.content.cloneNode(true));
				}
			}
			// TODO(HeiYiu): Might introduce join buttons that allow user to add themselves even if the room max is reached. User can simply change the attribute in this component in the html
			break;
		}
		case "room-id": {
			let id = this.shadow.querySelector("#lobby-room-id");
			id.textContent = newValue;
			break;
		}
		}
	}
}

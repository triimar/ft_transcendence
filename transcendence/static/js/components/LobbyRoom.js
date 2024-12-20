import { myself } from "../myself.js"
export default class ComponentLobbyRoom extends HTMLElement {
	static observedAttributes = ["room-max", "room-id", "room-join-disabled"];
	constructor() {
		super();
		this.shadow = this.attachShadow({ mode: "open" });
		const template = document.getElementById("component-lobby-room");
		this.shadow.appendChild(template.content.cloneNode(true));
	}

	connectedCallback() {
		let id = this.shadow.querySelector("#lobby-room-id");
		id.addEventListener("click", () => {
			navigator.clipboard.writeText(location.origin + "/#room" + id.textContent);
			myself.displayPopupMessage("Invitation link copied to clipboard");
		});
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
			let joinButtons = this.querySelectorAll(".join-button");
			let participantsMax = parseInt(newValue);
			if (oldValue == null) {
				for (let i = participantsMax - participants.length; i > 0; i--)
				{
					let button = this.#createJoinButton();
					this.appendChild(button);
				}
			} else {
				let participantsMaxPrevious = parseInt(oldValue);
				if (participantsMax > participantsMaxPrevious) {
					let amount = participantsMax - participantsMaxPrevious;
					while (amount > 0) {
						let button = this.#createJoinButton();
						this.appendChild(button);
						amount--;
					}
				} else {
					let amount = participantsMaxPrevious - participantsMax;
					if (joinButtons.length >= amount) {
						for (let joinButton of joinButtons) {
							this.removeChild(joinButton);
							amount--;
							if (amount <= 0) break;
						}
					}
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

	#createJoinButton() {
		let button = document.createElement("td-button");
		button.classList.add("ui");
		button.classList.add("join-button");
		button.style.width = "var(--td-avatar-width)";
		button.style.height = "var(--td-avatar-height)";
		button.style.position = "relative";
		button.style.padding = "0.5em em";
		button.style.display = "block";
		button.addEventListener("click", () => {
			let id = this.shadow.querySelector("#lobby-room-id");
			window.location.href = "#room" + id.textContent;
		});
		if (this.joinDisabled) button.setAttribute("disabled", "");
		const template = document.getElementById("icon-lobby-room-join");
		button.appendChild(template.content.cloneNode(true));
		return button;
	}

	addParticipant(avatarName, avatarBackground, avatarId) {
		let participants = this.querySelectorAll("td-avatar");
		let joinButtons = this.querySelectorAll(".join-button");
		if (participants.length >= parseInt(this.getAttribute("room-max"))) {
			console.error("LobbyRoom component cannot add more participant");
			return;
		}
		let avatarElement = document.createElement("td-avatar");
		avatarElement.setAttribute("avatar-name", avatarName);
		avatarElement.setAttribute("avatar-background", avatarBackground);
		avatarElement.setAttribute("avatar-id", avatarId);
		this.replaceChild(avatarElement, joinButtons[0]);
	}

	removeParticipant(avatarId) {
		let participants = this.querySelectorAll("td-avatar");
		if (participants == 0) {
			console.error("LobbyRoom component cannot remove participants because it is already zero");
			return;
		}
		for (let participant of participants)
		{
			if (participant.getAttribute("avatar-id") == avatarId) {
				let button = this.#createJoinButton();
				this.replaceChild(button, participant);
				break;
			}
		}
	}
}

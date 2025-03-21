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
		this.setAttribute("tabindex", "0");
		let max = this.getAttribute("room-max");
		if (max) this.setAttribute("aria-label", `Room with maximum ${max} players`);
		else this.setAttribute("aria-label", `Room`)
		let id = this.shadow.querySelector("#lobby-room-id");
		id.setAttribute("aria-label", "Copy the room's invitation link!")
		id.setAttribute("tabindex", "0")
		id.setAttribute("role", "button");
		id.addEventListener("click", () => {
			navigator.clipboard.writeText(location.origin + "/#room" + id.textContent);
			myself.displayPopupMessage(i18next.t("lobby-room.invitation-link-txt"));
		});
		id.addEventListener("keydown", (event) => {
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault(); // Prevent space from scrolling
				id.click(); // Simulate a click event
			}
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
					join_button.setAttribute("disabled", "");
					join_button.setAttribute("tabindex", "-1");
				}
			} else {
				for (let join_button of join_buttons) {
					join_button.removeAttribute("disabled");
					join_button.setAttribute("tabindex", "0");
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
		button.setAttribute("aria-label", "Join the room!")
		if (this.joinDisabled) {
			button.setAttribute("tabindex", "-1")
			button.setAttribute("disabled", "");}
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

	changeParticipant(avatarName, avatarBackground, avatarId) {
		let participants = this.querySelectorAll("td-avatar");
		for (let participant of participants) {
			if (participant.getAttribute("avatar-id") == avatarId) {
				participant.setAttribute("avatar-name", avatarName);
				participant.setAttribute("avatar-background", avatarBackground);
				break;
			}
		}
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

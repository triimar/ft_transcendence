import ComponentLobbyRoom, { ComponentLobbyRoomJoinButton } from "./components/LobbyRoom.js";
import ComponentAvatar from "./components/Avatar.js";
import ComponentNavigationBar from "./components/NavigationBar.js";
import ComponentLogo from "./components/Logo.js";
import ComponentGameBoard from "./components/GameBoard.js";
import ComponentAIGameBoard from "./components/AIGameBoard.js";

function main() {
	window.addEventListener("hashchange", function() {
		renderPage();
	});
	renderPage();
}

function renderPage() {
	const mainElement = document.getElementsByClassName("content-container")[0];
	let hash = location.hash.slice(1);
	if (hash == '')
		hash = "main";
	// TODO(Anthony): Authentication here. To ensure that user has been logged in
	renderTemplate(mainElement, "page-" + hash);
}

function renderTemplate(container, templateId) {
	let template = document.getElementById(templateId);
	if (template == null) {
		console.error("renderTemplate() attempts to access unknown template");
		template = document.getElementById("page-error");
	}
	const clone = template.content.cloneNode(true);
	// Note(HeiYiu): remove all DOM Elements in container
	while (container.firstElementChild) {
		container.removeChild(container.firstElementChild);
	}
	container.prepend(clone);
}

window.addEventListener("DOMContentLoaded", main);
window.customElements.define("td-lobby-room", ComponentLobbyRoom);
window.customElements.define("td-lobby-room-join-button", ComponentLobbyRoomJoinButton);
window.customElements.define("td-avatar", ComponentAvatar);
window.customElements.define("td-navigation-bar", ComponentNavigationBar);
window.customElements.define("td-logo", ComponentLogo);
window.customElements.define("td-game-board", ComponentGameBoard);
window.customElements.define("td-ai-game-board", ComponentAIGameBoard);

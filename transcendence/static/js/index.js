import ComponentLobbyRoom, { ComponentLobbyRoomJoinButton } from "./components/LobbyRoom.js";
import ComponentAvatar from "./components/Avatar.js";
import ComponentNavigationBar from "./components/NavigationBar.js";
import ComponentLogo from "./components/Logo.js";

function main() {
	window.addEventListener("hashchange", function() {
		renderPage();
	});
	renderPage();
}

function renderPage() {
	const mainElement = document.getElementsByTagName("main")[0];
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
	container.innerHTML = "";
	container.appendChild(clone);
}

window.addEventListener("DOMContentLoaded", main);
window.customElements.define("td-lobby-room", ComponentLobbyRoom);
window.customElements.define("td-lobby-room-join-button", ComponentLobbyRoomJoinButton);
window.customElements.define("td-avatar", ComponentAvatar);
window.customElements.define("td-navigation-bar", ComponentNavigationBar);
window.customElements.define("td-logo", ComponentLogo);
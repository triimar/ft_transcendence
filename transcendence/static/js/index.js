import ComponentLobbyRoom from "./components/LobbyRoom.js";
import ComponentAvatar from "./components/Avatar.js";
import ComponentNavigationBar from "./components/NavigationBar.js";
import ComponentLogo from "./components/Logo.js";
import ComponentGameBoard from "./components/GameBoard.js";
import ComponentAIGameBoard from "./components/AIGameBoard.js";
import ComponentRoomSettingSize from "./components/RoomSettingSize.js";
import ComponentButton from "./components/Button.js";
import ComponentLever from "./components/Lever.js";

import PageError from "./pages/PageError.js";
import PageLogin from "./pages/PageLogin.js";
import PageGame from "./pages/PageGame.js";
import PageAiGame from "./pages/PageAiGame.js";
import PageRoom from "./pages/PageRoom.js";
import PageMain from "./pages/PageMain.js";

import { myself } from "./myself.js";

const pageMapping = {
	error: PageError,
	login: PageLogin,
	game: PageGame,
	"ai-game": PageAiGame,
	room: PageRoom,
	main: PageMain
};

async function main() {
	const contentContainer = document.getElementsByClassName("content-container")[0];
	let currentPage = null;
	let isAuthenticated = false;
	window.addEventListener("hashchange", async (event) => {
		currentPage.removeEvents();
		myself.pageFinishedRendering = false;
		let pageHash = getPageHashFromURL(location);
		if (!pageMapping[pageHash]) pageHash = "error";
		if (pageHash != "error") {
			if (!isAuthenticated) isAuthenticated = myself.verifyJWT();
			// NOTE(Anthony): Check JWT is expired? Probably we dont need that here ???
			if (!isAuthenticated) {
				// TODO(HeiYiu): save the pageHash that the client wants to visit originally, and after login is successful, change the hash to that hash directly
				pageHash = "login";
			}
			else {
				// if (pageHash == "login") pageHash = "main";
				if (!myself.ws) myself.connectWs();
			}
		}
		let pageClass = pageMapping[pageHash];
		currentPage = new pageClass(contentContainer);
		myself.page = currentPage;
		myself.pageHash = pageHash;
		renderTemplate(contentContainer, currentPage.templateId);
		currentPage.attachEvents();
		// TODO(HeiYiu): Send message depending on the page
		myself.pageFinishedRendering = true;
	});
	myself.pageFinishedRendering = false;
	let pageHash = getPageHashFromURL(location);
	if (!pageMapping[pageHash]) pageHash = "error";
	if (pageHash != "error") {
		isAuthenticated = myself.verifyJWT();
		if (!isAuthenticated) {
			// TODO(HeiYiu): save the pageHash that the client wants to visit originally, and after login is successful, change the hash to that hash directly
			pageHash = "login";
		}
		else {
			// if (pageHash == "login") pageHash = "main";
			myself.connectWs();
		}
	}
	let pageClass = pageMapping[pageHash];
	currentPage = new pageClass(contentContainer);
	myself.page = currentPage;
	myself.pageHash = pageHash;
	renderTemplate(contentContainer, currentPage.templateId);
	currentPage.attachEvents();
	// TODO(HeiYiu): Send message depending on the page
	myself.pageFinishedRendering = true;
}

function getPageHashFromURL(url) {
	let hash = url.hash.slice(1);
	if (hash == '')
		hash = "main";
	return hash;
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
window.customElements.define("td-room-setting-size", ComponentRoomSettingSize);
window.customElements.define("td-avatar", ComponentAvatar);
window.customElements.define("td-navigation-bar", ComponentNavigationBar);
window.customElements.define("td-logo", ComponentLogo);
window.customElements.define("td-game-board", ComponentGameBoard);
window.customElements.define("td-ai-game-board", ComponentAIGameBoard);
window.customElements.define("td-button", ComponentButton);
window.customElements.define("td-lever", ComponentLever);

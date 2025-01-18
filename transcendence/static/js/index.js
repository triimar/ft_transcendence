import ComponentLobbyRoom from "./components/LobbyRoom.js";
import ComponentAvatar from "./components/Avatar.js";
import ComponentNavigationBar from "./components/NavigationBar.js";
import ComponentLogo from "./components/Logo.js";
import ComponentGameBoard from "./components/GameBoard.js";
import ComponentAIGameBoard from "./components/AIGameBoard.js";
import ComponentRoomSettingSize from "./components/RoomSettingSize.js";
import ComponentButton from "./components/Button.js";
import ComponentLever from "./components/Lever.js";
import ComponentTournamentTree from "./components/TournamentTree.js";
import ComponentLanguageSelector from "./components/LanguageSelector.js";
import { initializeI18n, updateGlobalTranslations } from "./translation.js";
import { PageError, PageLogin, PageGame, PageAiGame, PageRoom, PageMain } from "./pages.js";

import { myself } from "./myself.js";

const pageMapping = {
	error: PageError,
	login: PageLogin,
	game: PageGame,
	"ai-game": PageAiGame,
	room: PageRoom,
	main: PageMain
};

let isTriggerHashChange = true;
async function main() {
	// Note(HeiYiu): global event listeners
	{
		let avatarChangeButton = document.getElementById("avatar-apply-change-btn");
		let colorSelectionContainer = document.getElementById("color-selection-container");
		let avatarNameTextInput = document.getElementById("id-card-name");

		avatarNameTextInput.addEventListener("input", (e) => {
			let avatarElement = document.querySelector("#avatar-info td-avatar");
			avatarElement.setAttribute("avatar-name", e.target.value);
		}, true);
		colorSelectionContainer.addEventListener("click", (e) => {
			if (e.target != colorSelectionContainer) {
				for (let colorOption of colorSelectionContainer.children) {
					colorOption.classList.remove("chosen");
				}
				e.target.classList.add("chosen");
				let avatarElement = document.querySelector("#avatar-info td-avatar");
				avatarElement.setAttribute("avatar-background", e.target.getAttribute("color"));
			}
		});
		avatarChangeButton.addEventListener("click", () => {
			if (myself.gameInde == null) {
				let emoji = avatarNameTextInput.value;
				let background = document.querySelector("#color-selection-container > .chosen")?.getAttribute("color");
				myself.changeAvatar(emoji, background);
			} else {
				myself.displayPopupMessage("You cannot change avatar after game starts");
			}
		}, true);
		let closeButton = document.querySelector("#avatar-info .close-btn");
		closeButton.addEventListener("click", () => {
			let popupElement = document.querySelector("#avatar-info-popup");
			popupElement.classList.remove("show");
			let avatarElement = document.querySelector("#avatar-info td-avatar");
			avatarElement.setAttribute("avatar-name", myself.avatar_emoji);
			avatarElement.setAttribute("avatar-background", myself.avatar_bg_color);
			avatarNameTextInput.value = myself.avatar_emoji;
			for (let colorOption of colorSelectionContainer.children) {
				if (colorOption.getAttribute("color") == myself.avatar_bg_color) {
					colorOption.classList.add("chosen");
				}
				else {
					colorOption.classList.remove("chosen");
				}
			}
		});
	}
	await initializeI18n(); // Ensure translations are initialized
	document.myself = myself; // only for debugging
	const contentContainer = document.getElementsByClassName("content-container")[0];
	let currentPage = null;
	window.addEventListener("hashchange", async (event) => {
		if (!isTriggerHashChange) {
			isTriggerHashChange = true;
			return;
		}
		if (currentPage.beforeOnHashChange != null) {
			let url = URL.parse(event.newURL);
			let pageHash = getPageHashFromURL(url);
			let result = analysisPageHash(pageHash);
			if (!currentPage.beforeOnHashChange(...result)) {
				return;
			}
		}
		currentPage.removeEvents();
		myself.pageFinishedRendering = false;
		let pageHash = getPageHashFromURL(location);
		if (analysisPageHash(pageHash)[0] != "error") {
			let [isAuthenticated, newPageHash] = await authenticateVisitor(pageHash);
			pageHash = newPageHash;
			if (isAuthenticated) {
				if (pageHash != "login" && !myself.ws) myself.connectWs();
				if ((myself.avatar_emoji == null) || (myself.avatar_bg_color == null)) {
					await myself.fetchAvatarInfo();
				}
			}
		}
		let [pageName, roomId, gameIndex] = analysisPageHash(pageHash);
		let pageClass = pageMapping[pageName];
		currentPage = new pageClass(contentContainer);
		myself.page = currentPage;
		myself.pageName = pageName;
		myself.roomId = roomId;
		myself.gameIndex= gameIndex;
		renderTemplate(contentContainer, currentPage.templateId);
		updateGlobalTranslations();
		currentPage.attachEvents();
		if (myself.ws) sendInitMessage(pageName, roomId, gameIndex);
		myself.pageFinishedRendering = true;
	});
	myself.pageFinishedRendering = false;
	let pageHash = getPageHashFromURL(location);
	if (analysisPageHash(pageHash)[0] != "error") {
		let [isAuthenticated, newPageHash] = await authenticateVisitor(pageHash);
		pageHash = newPageHash;
		if (isAuthenticated) {
			if (pageHash != "login" && !myself.ws) myself.connectWs();
			if ((myself.avatar_emoji == null) || (myself.avatar_bg_color == null)) {
				await myself.fetchAvatarInfo();
			}
		}
	}
	let [pageName, roomId, gameIndex] = analysisPageHash(pageHash);
	let pageClass = pageMapping[pageName];
	currentPage = new pageClass(contentContainer);
	myself.page = currentPage;
	myself.pageName = pageName;
	myself.roomId = roomId;
	myself.gameIndex= gameIndex;
	renderTemplate(contentContainer, currentPage.templateId);
	updateGlobalTranslations();
	currentPage.attachEvents();
	if (myself.ws) sendInitMessage(pageName, roomId, gameIndex);
	myself.pageFinishedRendering = true;
}

// Note(HeiYiu): takes a pageHash of what the user wants to go to
// returns a pageHash of which page the website should render depending on the
// result of the authentication
async function authenticateVisitor(pageHash) {
	let isAuthenticated = false;
	switch (myself.getLoginMethod()) {
	case "guest":
	case "intra": {
		if (myself.jwt == null) {
			isAuthenticated = await myself.verifyJWT();
		}
		else {
			isAuthenticated = true;
		}
		// NOTE(Anthony): Check JWT is expired? Probably we dont need that here ???
		if (!isAuthenticated) {
			// Note(HeiYiu): save the pageHash that the client wants to visit originally, and after login is successful, change the hash to that hash directly
			if (pageHash && pageHash != "login") localStorage.setItem("last_page_hash", pageHash);
			pageHash = "login";
		} else {
			let lastPageHash = localStorage.getItem("last_page_hash");
			if (lastPageHash) {
				pageHash = lastPageHash;
			}
			if (getPageHashFromURL(window.location) != pageHash) {
				isTriggerHashChange = false;
				window.location.hash = '#' + pageHash;
			}
			localStorage.removeItem("last_page_hash");
		}
	} break;
	default: {
		if (pageHash && pageHash != "login") localStorage.setItem("last_page_hash", pageHash);
		pageHash = "login";
	}
	}
	return [isAuthenticated, pageHash];
}

function getPageHashFromURL(url) {
	let hash = url.hash.slice(1);
	if (hash == '')
		hash = "main";
	return hash;
}

function analysisPageHash(pageHash) {
	let pageName = "error";
	let roomId = null;
	let gameIndex = null;
	switch (pageHash) {
	case "error":
	case "login":
	case "main":
		pageName = pageHash; break;
	default: {
		if (pageHash.startsWith("room")) {
			let index = pageHash.indexOf("-");
			if (index == -1) {
				pageName = "room";
				roomId = pageHash.substring(4);
			} else if (pageHash.startsWith("ai-game", index + 1)) {
				pageName = "ai-game";
				roomId = pageHash.substring(4, index);
				gameIndex = pageHash.substring(index + 8);
			} else if (pageHash.startsWith("game", index + 1)) {
				pageName = "game";
				roomId = pageHash.substring(4, index);
				gameIndex = pageHash.substring(index + 5);
			}
			// TODO(HeiYiu): More precise syntax checking
			if (roomId == "") {
				pageName = "error";
				roomId = null;
			}
			if (gameIndex == "") {
				pageName = "error";
				gameIndex = null;
			}
		}
	}
	}
	return [pageName, roomId, gameIndex];
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

function sendInitMessage(pageName, roomId, gameIndex) {
	switch (pageName) {
	case "error":
	case "login":
		break;
	case "game":
	case "ai-game":
		myself.sendMessageJoinMatch(roomId, gameIndex);
		break;
	case "room":
		myself.sendMessageJoinRoom(roomId);
		break;
	case "main":
		myself.sendMessageInit();
		break;
	}
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
window.customElements.define("td-tournament-tree", ComponentTournamentTree);
window.customElements.define("td-language-selector", ComponentLanguageSelector);

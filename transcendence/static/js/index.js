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
	window.addEventListener("hashchange", async (event) => {
		currentPage.removeEvents();
		myself.pageFinishedRendering = false;
		let pageHash = getPageHashFromURL(location);
		if (!pageMapping[pageHash]) pageHash = "error";
		if (pageHash != "error") {
            let [isAuthenticated, newPageHash] = await authenticateVisitor(pageHash);
            pageHash = newPageHash;
            if (isAuthenticated && !myself.ws) myself.connectWs();
        }
		let pageClass = pageMapping[pageHash];
		currentPage = new pageClass(contentContainer);
		myself.page = currentPage;
		myself.pageHash = pageHash;
		renderTemplate(contentContainer, currentPage.templateId);
		currentPage.attachEvents();
		if (myself.ws) sendInitMessage(pageHash);
		myself.pageFinishedRendering = true;
	});
	myself.pageFinishedRendering = false;
	let pageHash = getPageHashFromURL(location);
	if (!pageMapping[pageHash]) pageHash = "error";
    if (pageHash != "error") {
        let [isAuthenticated, newPageHash] = await authenticateVisitor(pageHash);
        pageHash = newPageHash;
        if (isAuthenticated && !myself.ws) myself.connectWs();
    }
	let pageClass = pageMapping[pageHash];
	currentPage = new pageClass(contentContainer);
	myself.page = currentPage;
	myself.pageHash = pageHash;
	renderTemplate(contentContainer, currentPage.templateId);
	currentPage.attachEvents();
	if (myself.ws) sendInitMessage(pageHash);
	myself.pageFinishedRendering = true;
}

// Note(HeiYiu): takes a pageHash of what the user wants to go to
// returns a pageHash of which page the website should render depending on the
// result of the authentication
async function authenticateVisitor(pageHash) {
    let isAuthenticated = false;
    switch (myself.getLoginMethod()) {
        case "guest": {
            let lastPageHash = localStorage.getItem("last_page_hash");
            if (pageHash == "login") {
                pageHash = lastPageHash ? lastPageHash : "main";
            } else if (lastPageHash) {
                pageHash = lastPageHash;
            }
            localStorage.removeItem("last_page_hash");
            isAuthenticated = true;
        } break;
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
                if (pageHash == "login") {
                    pageHash = lastPageHash ? lastPageHash : "main";
                } else if (lastPageHash) {
                    pageHash = lastPageHash;
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

function sendInitMessage(pageHash) {
	switch (pageHash) {
		case "error":
		case "login":
		case "game":
		case "ai-game":
			break;
		case "room":
			let roomId = 1314;
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

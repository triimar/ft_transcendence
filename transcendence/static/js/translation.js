let isI18nInitialized = false;

export async function initializeI18n() {
	if (isI18nInitialized) return;
	try {
		const savedLanguage = localStorage.getItem("language") || "en";
        await i18next
            .use(i18nextHttpBackend)
            .init({
                lng: savedLanguage, // use saved language or default to english
                fallbackLng: "en",
                ns: ["translation"], // Default namespace
                defaultNS: "translation",
                backend: {
                    loadPath: "/static/locales/{{lng}}.json", 
                },
                debug: false, // Set to false in producti
            });

		isI18nInitialized = true;
		updateGlobalTranslations();

		// Set the initial lang attribute on the <html> tag
        document.documentElement.lang = i18next.language;
		

        i18next.on("languageChanged", (newLanguage) => { 
			localStorage.setItem("language", newLanguage);
			document.documentElement.lang = newLanguage;
            
			updateGlobalTranslations();
            const speechBubbles = document.querySelectorAll(".speech-bubble p");
            speechBubbles.forEach(bubble => {
                bubble.textContent = i18next.t("lobby-room.ready-bubble-txt");
            });
			const label = document.querySelector("td-room-setting-size")?.shadow?.querySelector("#label")
			if (label) {
				label.textContent = i18next.t("label.people", { count: document.querySelector("td-room-setting-size").size });
			}
			const modeDescription = document.querySelector("td-room-setting-mode");
			if (modeDescription) {
				let modeName = modeDescription.getAttribute("room-mode");
				modeDescription.shadow.querySelector("#game-mode-description-txt").textContent = i18next.t(`${modeName}-mode-description`);
				modeDescription.shadow.querySelector("#classic-mode-btn-txt").textContent = i18next.t("classic-mode-txt");
				modeDescription.shadow.querySelector("#balance-mode-btn-txt").textContent = i18next.t("balance-mode-txt");
			}
		});
	} catch (error) {
		console.error("Error initializing i18next:", error);
	}
}

function assignTranslation(elementId, translationKey) {
	const element = document.getElementById(elementId);
	if (element) {
		element.textContent = i18next.t(translationKey)
	}
}

export function updateGlobalTranslations() {
    if (!isI18nInitialized) return; // Ensure i18n is initialized

		const idCards = document.querySelectorAll("td-id-card");
		for (let idCard of idCards) {
			idCard.updateTranslation();
		}
    const translations = [
        { id: "footer-authors", key: "footer.authors" },
		{ id: "text-size", key: "footer.text-size" },
        { id: "add-room", key: "add-room" },
        { id: "add-local-game", key: "add-local-game" },
        { id: "exit-room", key: "exit-room" },
        { id: "tree-btn-txt", key: "tree-btn-txt" },
        { id: "exit-game", key: "exit-game" },
        { id: "page-error-txt", key: "error.page-not-found" },
        { id: "login-guest", key: "login.guest" },
        { id: "login-intra", key: "login.intra" },
        { id: "prepare-btn-txt", key: "lobby-room.prepare-btn-txt" },
		{ id: "prepare-btn-wait", key: "lobby-room.prepare-btn-wait" },
		{ id: "prepare-btn-start", key: "lobby-room.prepare-btn-start" },
        { id: "logout", key: "popups.logout" },
        { id: "confirm-logout-txt", key: "popups.confirm-logout-txt" },
        { id: "agree-txt", key: "popups.agree-txt"},
        { id: "decline-txt", key: "popups.decline-txt" },
		{ id: "id-card-text", key: "popups.id-card-text" },
		{ id: "id-card-name-text", key: "popups.id-card-name-text" },
		{ id: "id-card-background-text", key: "popups.id-card-background-text" },
		{ id: "avatar-apply-change-text", key: "popups.avatar-apply-change-text"},
		{ id: "start-game-text", key: "game.start-txt"},
    ];
    translations.forEach(({ id, key }) => assignTranslation(id, key));
}

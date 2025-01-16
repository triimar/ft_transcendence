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
                debug: false, // Set to false in production
            });

        isI18nInitialized = true; 
		updateGlobalTranslations();

        i18next.on("languageChanged", (newLanguage) => { 
            updateGlobalTranslations();
			localStorage.setItem("language", newLanguage);
            const speechBubbles = document.querySelectorAll(".speech-bubble p");
            speechBubbles.forEach(bubble => {
                bubble.textContent = i18next.t("lobby-room.ready-bubble-txt");
            });
			const label = document.querySelector("td-room-setting-size")?.shadow?.querySelector("#label")
			if (label) {
				label.textContent = i18next.t("label.people", { count: document.querySelector("td-room-setting-size").size });
			}
        });
    } catch (error) {
        console.error("Error initializing i18next:", error);
    }
}

function assignTranslation(elementId, translationKey) {
	const element = document.getElementById(elementId);
	if (element)
		element.textContent = i18next.t(translationKey)
}

export function updateGlobalTranslations() {
    if (!isI18nInitialized) return; // Ensure i18n is initialized

    const translations = [
        { id: "footer-authors", key: "footer.authors" },
        { id: "add-room", key: "add-room" },
        { id: "exit-room", key: "exit-room" },
        { id: "tree-btn-txt", key: "tree-btn-txt" },
        { id: "exit-game", key: "exit-game" },
        { id: "page-error-txt", key: "error.page-not-found" },
        { id: "login-guest", key: "login.guest" },
        { id: "login-intra", key: "login.intra" },
        { id: "prepare-btn-txt", key: "lobby-room.prepare-btn-txt" },
        { id: "logout", key: "popups.logout" },
        { id: "confirm-logout-txt", key: "popups.confirm-logout-txt" },
        { id: "agree-txt", key: "popups.agree-txt" },
        { id: "decline-txt", key: "popups.decline-txt" }
    ];
    translations.forEach(({ id, key }) => assignTranslation(id, key));
}

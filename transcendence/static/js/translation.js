let isI18nInitialized = false;

export async function initializeI18n() {
    if (isI18nInitialized) return; // Skip if already initialized
    try {
        await i18next
            .use(i18nextHttpBackend)
            .init({
                lng: "en", // Default language
                fallbackLng: "en",
                ns: ["translation"], // Default namespace
                defaultNS: "translation",
                backend: {
                    loadPath: "/static/locales/{{lng}}.json", // Ensure locales are accessible here
                },
                debug: true, // Set to false in production
            });

        isI18nInitialized = true; // Mark as initialized

        const languageSelector = document.getElementById("language-selector");
        if (languageSelector) {
            languageSelector.addEventListener("change", (event) => {
                const selectedLanguage = event.target.value;
                i18next.changeLanguage(selectedLanguage);
            });
        }
        // The language change listener
        i18next.on("languageChanged", () => {
            updateGlobalTranslations();
            const speechBubbles = document.querySelectorAll(".speech-bubble p");
            speechBubbles.forEach(bubble => {
                bubble.textContent = i18next.t("lobby-room.ready-bubble-txt");
            });
        });
    } catch (error) {
        console.error("Error initializing i18next:", error);
    }
}

export function updateGlobalTranslations() {
    if (!isI18nInitialized) return; // Ensure i18n is initialized

    const footerAuthors = document.getElementById("footer-authors");
	const addRoom = document.getElementById("add-room");
	const exitRoom = document.getElementById("exit-room"); 	
	const tree = document.getElementById("tree-btn-txt");
	const exitGame = document.getElementById("exit-game");
	const pageError = document.getElementById("page-error-txt");
    if (footerAuthors)
        footerAuthors.textContent = i18next.t("footer.authors");
	if (addRoom)
		addRoom.textContent = i18next.t("add-room");
	if (exitRoom)
		exitRoom.textContent = i18next.t("exit-room");
	if (tree)
		tree.textContent = i18next.t("tree-btn-txt");
	if (exitGame) 
		exitGame.textContent = i18next.t("exit-game");
	if (pageError)
		pageError.textContent = i18next.t("page-error-txt");

    updateLoginTranslations();
	updatePopupTranslations();
	updateLobbyTranslations();
}

function updateLoginTranslations() {
    const loginGuest = document.getElementById("login-guest");
    const loginIntra = document.getElementById("login-intra");
    if (loginGuest) 
        loginGuest.textContent = i18next.t("login.guest");
    if (loginIntra) 
        loginIntra.textContent = i18next.t("login.intra");
}

function updateLobbyTranslations() {
	const prepare = document.getElementById("prepare-btn-txt");
	if (prepare)
		prepare.textContent = i18next.t("lobby-room.prepare-btn-txt")
}

function updatePopupTranslations() {
	const customAvatar = document.getElementById("custom-avatar");
	const logout = document.getElementById("logout")
	const confirmLogout = document.getElementById("confirm-logout-txt")
	const agree = document.getElementById("agree-txt")
	const decline = document.getElementById("decline-txt")
	if (customAvatar)
		customAvatar.textContent = i18next.t("popups.custom-avatar")
	if (logout)
		logout.textContent = i18next.t("popups.logout");
	if (confirmLogout)
		confirmLogout.textContent = i18next.t("popups.confirm-logout-txt");
	if (agree)
		agree.textContent = i18next.t("popups.agree-txt");
	if (decline)
		decline.textContent = i18next.t("popups.decline-txt");
}
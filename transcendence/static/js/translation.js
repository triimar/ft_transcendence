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
                i18next.changeLanguage(selectedLanguage, () => {
                    updateGlobalTranslations(); // Reapply translations
                });
            });
        }
    } catch (error) {
        console.error("Error initializing i18next:", error);
    }
}

export function updateGlobalTranslations() {
    if (!isI18nInitialized) return; // Ensure i18n is initialized

    const footerAuthors = document.getElementById("footer-authors");
    if (footerAuthors) {
        footerAuthors.textContent = i18next.t("footer.authors");
    }

    updateLoginTranslations();
}

function updateLoginTranslations() {
    const loginGuest = document.getElementById("login-guest");
    const loginIntra = document.getElementById("login-intra");

    if (loginGuest) {
        loginGuest.textContent = i18next.t("login.guest");
    }
    if (loginIntra) {
        loginIntra.textContent = i18next.t("login.intra");
    }
}

export default class ComponentLanguageSelector extends HTMLElement {
    constructor() {
        super();
        this.shadow = this.attachShadow({ mode: "open" });
        const template = document.getElementById("component-language-selector");
        this.shadow.appendChild(template.content.cloneNode(true));
    }

    connectedCallback() {
        if (typeof i18next === "undefined") {
            console.error("i18next is not defined or initialized.");
            return;
        }

        const languageSelector = this.shadow.querySelector("#language-selector");
        languageSelector.addEventListener("change", (event) => {
            const selectedLanguage = event.target.value;
            i18next.changeLanguage(selectedLanguage);
        });

        // Initialize the dropdown with the current language
        this.updateSelectedLanguage(i18next.language);
    }

    updateSelectedLanguage(lng) {
        const languageSelector = this.shadow.querySelector("#language-selector");
        if (languageSelector) {
            languageSelector.value = lng || "en"; // Default to English
        }
    }
}

export default class ComponentProgressBar extends HTMLElement {
	constructor() {
		super();

		// Attach shadow DOM and clone template
		this.shadow = this.attachShadow({ mode: "open" });
		const template = document.getElementById("componet-progress-bar");
		this.shadow.appendChild(template.content.cloneNode(true));

		// Get references to elements
		this.progressBar = this.shadow.querySelector("#progress-bar");
		this.progressText = this.shadow.querySelector("#progress-text");

		// Set initial state
		this.progress = 0; // Progress in percentage (0 to 100)
	}

	// Set progress value (public method)
	setProgress(value) {
		this.progress = Math.min(100, Math.max(0, value)); // Clamp between 0 and 100
		this.updateProgress();
	}

	// Update the progress bar visuals
	updateProgress() {
		this.progressBar.style.width = `${this.progress}%`;
		this.progressText.textContent = `${Math.round(this.progress)}%`;
	}

	// Optional: Start progress automatically
	connectedCallback() {
		if (this.hasAttribute("auto")) {
			const duration = this.getAttribute("duration") || 5000; // Default to 5 seconds
			this.startProgress(duration);
		}
	}

	// Method to start progress
	startProgress(duration) {
		let elapsedTime = 0;
		const interval = 50; // Update interval
		const increment = (100 / duration) * interval;

		const timer = setInterval(() => {
			elapsedTime += interval;
			this.setProgress((elapsedTime / duration) * 100);

			if (elapsedTime >= duration) {
				clearInterval(timer);
				this.dispatchEvent(new Event("complete")); // Notify when progress is complete
			}
		}, interval);
	}
}




// export default class ComponentBinaryTournamentTree extends HTMLElement {
// 	constructor() {
// 		super();
// 		const template = document.getElementById('component-binary-tree').content;
// 		this.attachShadow({ mode: 'open' }).appendChild(template.cloneNode(true));

// 		// Sample binary tree with avatars
// 		this.playersTree = [
// 			8, // Number of players
// 			null, null, null, null, null, null, null, // Placeholder nulls to fill levels
// 			{ "avatar-name": "E9E", "avatar-background": "#FFD133" },
// 			{ "avatar-name": "T.T", "avatar-background": "#A633FF" },
// 			{ "avatar-name": "$u$", "avatar-background": "#33FFF5" },
// 			{ "avatar-name": "HuH", "avatar-background": "#FF8333" },
// 			{ "avatar-name": "E9E", "avatar-background": "#FFD133" },
// 			{ "avatar-name": "T.T", "avatar-background": "#A633FF" },
// 			{ "avatar-name": "$u$", "avatar-background": "#33FFF5" },
// 			{ "avatar-name": "HuH", "avatar-background": "#FF8333" }
// 		];
// 	}

// 	connectedCallback() {
// 		this.renderTree(this.playersTree);
// 	}

// 	renderTree(tree) {
// 		const tournamentContainer = this.shadowRoot.querySelector('.tournament');
// 		tournamentContainer.innerHTML = ''; // Clear previous tree render

// 		// Helper function to create a row of matches
// 		const createRow = (elements) => {
// 			const rowDiv = document.createElement('div');
// 			rowDiv.className = 'round';

// 			// Loop through elements in pairs (for each match)
// 			for (let i = 0; i < elements.length; i += 2) {
// 				const matchDiv = document.createElement('div');
// 				matchDiv.className = 'match';

// 				// Player 1 in the match
// 				const player1 = elements[i];
// 				const avatar1 = document.createElement('td-avatar');
// 				if (player1) {
// 					avatar1.setAttribute('avatar-name', player1["avatar-name"]);
// 					avatar1.setAttribute('avatar-background', player1["avatar-background"]);
// 				} else {
// 					avatar1.setAttribute('avatar-name', "???");
// 					avatar1.setAttribute('avatar-background', "#CCCCCC"); // Gray color for placeholder
// 				}
// 				matchDiv.appendChild(avatar1);

// 				// Player 2 in the match
// 				const player2 = elements[i + 1];
// 				const avatar2 = document.createElement('td-avatar');
// 				if (player2) {
// 					avatar2.setAttribute('avatar-name', player2["avatar-name"]);
// 					avatar2.setAttribute('avatar-background', player2["avatar-background"]);
// 				} else {
// 					avatar2.setAttribute('avatar-name', "???");
// 					avatar2.setAttribute('avatar-background', "#CCCCCC"); // Gray color for placeholder
// 				}
// 				matchDiv.appendChild(avatar2);

// 				// Add the match div to the row
// 				rowDiv.appendChild(matchDiv);
// 			}

// 			return rowDiv;
// 		};

// 		// Calculate the number of levels in the binary tree
// 		const levels = [];
// 		let levelSize = 1;
// 		let currentIndex = 1;

// 		while (currentIndex < tree.length) {
// 			const level = tree.slice(currentIndex, currentIndex + levelSize);
// 			levels.push(level);
// 			currentIndex += levelSize;
// 			levelSize *= 2;
// 		}

// 		// Render each row in the tournament container
// 		levels.forEach(level => {
// 			const rowDiv = createRow(level);
// 			tournamentContainer.appendChild(rowDiv);
// 		});
// 	}
// }

export default class ComponentBinaryTournamentTree extends HTMLElement {
	constructor() {
		super();
		const template = document.getElementById('component-binary-tree').content;
		this.attachShadow({ mode: 'open' }).appendChild(template.cloneNode(true));

		// Sample binary tree with avatars
		this.playersTree = [
			8, // Number of players
			null, null, null, null, null, null, null, // Placeholder nulls to fill levels
			{ "avatar-name": "E9E", "avatar-background": "#FFD133" },
			{ "avatar-name": "T.T", "avatar-background": "#A633FF" },
			{ "avatar-name": "$u$", "avatar-background": "#33FFF5" },
			{ "avatar-name": "HuH", "avatar-background": "#FF8333" },
			{ "avatar-name": "E9E", "avatar-background": "#FFD133" },
			{ "avatar-name": "T.T", "avatar-background": "#A633FF" },
			{ "avatar-name": "$u$", "avatar-background": "#33FFF5" },
			{ "avatar-name": "HuH", "avatar-background": "#FF8333" }
		];
	}

	connectedCallback() {
		this.renderTree(this.playersTree);
	}

	renderTree(tree) {
		const tournamentContainer = this.shadowRoot.querySelector('.tournament');
		tournamentContainer.innerHTML = ''; // Clear previous tree render

		// Helper function to create a row of matches
		const createRow = (elements) => {
			const rowDiv = document.createElement('div');
			rowDiv.className = 'round';

			// Check if this row has only one element (top of the tree, the winner)
			if (elements.length === 1) {
				// Create a single avatar for the winner
				const winner = elements[0];
				const winnerDiv = document.createElement('div');
				winnerDiv.className = 'match';

				const avatar = document.createElement('td-avatar');
				if (winner) {
					avatar.setAttribute('avatar-name', winner["avatar-name"]);
					avatar.setAttribute('avatar-background', winner["avatar-background"]);
				} else {
					avatar.setAttribute('avatar-name', "???");
					avatar.setAttribute('avatar-background', "#CCCCCC"); // Gray color for placeholder
				}
				winnerDiv.appendChild(avatar);
				rowDiv.appendChild(winnerDiv);
			} else {
				// Loop through elements in pairs for each match
				for (let i = 0; i < elements.length; i += 2) {
					const matchDiv = document.createElement('div');
					matchDiv.className = 'match';

					// Player 1 in the match
					const player1 = elements[i];
					const avatar1 = document.createElement('td-avatar');
					if (player1) {
						avatar1.setAttribute('avatar-name', player1["avatar-name"]);
						avatar1.setAttribute('avatar-background', player1["avatar-background"]);
					} else {
						avatar1.setAttribute('avatar-name', "???");
						avatar1.setAttribute('avatar-background', "#CCCCCC"); // Gray color for placeholder
					}
					matchDiv.appendChild(avatar1);

					// Player 2 in the match
					const player2 = elements[i + 1];
					const avatar2 = document.createElement('td-avatar');
					if (player2) {
						avatar2.setAttribute('avatar-name', player2["avatar-name"]);
						avatar2.setAttribute('avatar-background', player2["avatar-background"]);
					} else {
						avatar2.setAttribute('avatar-name', "???");
						avatar2.setAttribute('avatar-background', "#CCCCCC"); // Gray color for placeholder
					}
					matchDiv.appendChild(avatar2);

					// Add the match div to the row
					rowDiv.appendChild(matchDiv);
				}
			}

			return rowDiv;
		};

		// Calculate the number of levels in the binary tree
		const levels = [];
		let levelSize = 1;
		let currentIndex = 1;

		while (currentIndex < tree.length) {
			const level = tree.slice(currentIndex, currentIndex + levelSize);
			levels.push(level);
			currentIndex += levelSize;
			levelSize *= 2;
		}

		// Render each row in the tournament container
		levels.forEach(level => {
			const rowDiv = createRow(level);
			tournamentContainer.appendChild(rowDiv);
		});
	}
}

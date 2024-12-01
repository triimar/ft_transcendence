export default class ComponentTournamentTree extends HTMLElement {
	constructor() {
		super();
		const template = document.getElementById('component-tournament-tree').content;
		this.attachShadow({ mode: 'open' }).appendChild(template.cloneNode(true));

		// Initialize the tournament data correctly
		// this.tournamentData = {
		// 	player_count: 8,
		// 	round1: [
		// 		{ 
		// 			match_id: 1, 
		// 			player1: { "avatar-name": "E9E", "avatar-background": "#FFD133" },
		// 			player2: { "avatar-name": "T.T", "avatar-background": "#A633FF" },
		// 			winner: { "avatar-name": "E9E", "avatar-background": "#FFD133" }
		// 		},
		// 		{ 
		// 			match_id: 2, 
		// 			player1: { "avatar-name": "$u$", "avatar-background": "#33FFF5" },
		// 			player2: { "avatar-name": "HuH", "avatar-background": "#FF8333" },
		// 			winner: { "avatar-name": "HuH", "avatar-background": "#FF8333" }
		// 		},
		// 		{
		// 			match_id: 3,
		// 			player1: { "avatar-name": "0)0", "avatar-background": "#FF33A6" },
		// 			player2: { "avatar-name": "wmw", "avatar-background": "#3357FF" },
		// 			winner: { "avatar-name": "0)0", "avatar-background": "#FF33A6" }
		// 		},
		// 		{
		// 			match_id: 4,
		// 			player1: { "avatar-name": "A.A", "avatar-background": "#FF5733" },
		// 			player2: { "avatar-name": "pip", "avatar-background": "#33FF57" },
		// 			winner: { "avatar-name": "pip", "avatar-background": "#33FF57" }
		// 		}
		// 	],
		// 	round2: [
		// 		{ 
		// 			match_id: 1, 
		// 			player1: { "avatar-name": "E9E", "avatar-background": "#FFD133" },
		// 			player2: { "avatar-name": "HuH", "avatar-background": "#FF8333" },
		// 			winner: { "avatar-name": "E9E", "avatar-background": "#FFD133" }
		// 		},
		// 		{ 
		// 			match_id: 2, 
		// 			player1: { "avatar-name": "0)0", "avatar-background": "#FF33A6" },
		// 			player2: { "avatar-name": "pip", "avatar-background": "#33FF57" },
		// 			winner: { "avatar-name": "pip", "avatar-background": "#33FF57" }
		// 		}
				
		// 	],
		// 	round3: [
		// 		{ 
		// 			match_id: 4, 
		// 			player1: { "avatar-name": "E9E", "avatar-background": "#FFD133" },
		// 			player2: { "avatar-name": "pip", "avatar-background": "#33FF57" },
		// 			winner: null
		// 		}
		// 	]
		// };
		this.tournamentData = {
			player_count: 8,
			round1: [
				{ 
					match_id: 1, 
					player1: { "avatar-name": "E9E", "avatar-background": "#FFD133" },
					player2: { "avatar-name": "T.T", "avatar-background": "#A633FF" },
					winner: { "avatar-name": "E9E", "avatar-background": "#FFD133" }
				},
				{ 
					match_id: 2, 
					player1: { "avatar-name": "$u$", "avatar-background": "#33FFF5" },
					player2: { "avatar-name": "HuH", "avatar-background": "#FF8333" },
					winner: null
				},
				{
					match_id: 3,
					player1: { "avatar-name": "0)0", "avatar-background": "#FF33A6" },
					player2: { "avatar-name": "wmw", "avatar-background": "#3357FF" },
					winner: null
				},
				{
					match_id: 4,
					player1: { "avatar-name": "A.A", "avatar-background": "#FF5733" },
					player2: { "avatar-name": "pip", "avatar-background": "#33FF57" },
					winner: null
				}
			],
			round2: [
				{ 
					match_id: 1, 
					player1: { "avatar-name": "E9E", "avatar-background": "#FFD133" },
					player2: null,
					winner: null
				},
				{ 
					match_id: 2, 
					player1: null,
					player2: null,
					winner: null
				}
				
			],
			round3: [
				{ 
					match_id: 4, 
					player1: null,
					player2: null,
					winner: null
				}
			]
		};
	// 	this.tournamentData = {
	// 		player_count: 4,
	// 		round1: [
	// 			{ 
	// 				match_id: 1, 
	// 				player1: { "avatar-name": "E9E", "avatar-background": "#FFD133" },
	// 				player2: { "avatar-name": "T.T", "avatar-background": "#A633FF" },
	// 				winner: { "avatar-name": "E9E", "avatar-background": "#FFD133" }
	// 			},
	// 			{ 
	// 				match_id: 2, 
	// 				player1: { "avatar-name": "$u$", "avatar-background": "#33FFF5" },
	// 				player2: { "avatar-name": "HuH", "avatar-background": "#FF8333" },
	// 				winner: { "avatar-name": "HuH", "avatar-background": "#FF8333" }
	// 			},
	// 		],
	// 		round2: [
	// 			{ 
	// 				match_id: 1, 
	// 				player1: { "avatar-name": "E9E", "avatar-background": "#FFD133" },
	// 				player2: { "avatar-name": "HuH", "avatar-background": "#FF8333" },
	// 				winner: null
	// 			},
	// 		]
	// 	};
		
	}

	connectedCallback() {
		// Pass the tournament data to the renderTree method
		this.renderTree(this.tournamentData);
	}

	renderTree(tournamentData) {
		const tournamentContainer = this.shadowRoot.querySelector('.tournament');
		tournamentContainer.innerHTML = ''; // Clear previous tree render
	
		// Helper function to create a player avatar
		const createAvatar = (player, winner) => {
			const avatar = document.createElement('td-avatar');
	
			// Set default values if player doesn't exist
			const playerName = player ? player["avatar-name"] : "???";
			const playerBackground = player ? player["avatar-background"] : "#C8C8C8";
	
			avatar.setAttribute('avatar-name', playerName);
			if (winner && winner["avatar-name"] !== playerName) {
				avatar.setAttribute('avatar-background', "#C8C8C8");
			} else {
				avatar.setAttribute('avatar-background', playerBackground);
			}
			return avatar;
		};
	
		// Helper function to create a row of matches
		const createRoundRow = (roundMatches) => {
			const rowDiv = document.createElement('div');
			rowDiv.className = 'round';
	
			roundMatches.forEach(match => {
				const matchDiv = document.createElement('div');
				matchDiv.className = 'match';
	
				// Create and append Player avatars
				const avatar1 = createAvatar(match.player1, match.winner);
				matchDiv.appendChild(avatar1);
				const avatar2 = createAvatar(match.player2, match.winner);
				matchDiv.appendChild(avatar2);
	
				rowDiv.appendChild(matchDiv);
			});
	
			return rowDiv;
		};
	
		// Dynamically determine and process rounds
		const rounds = Object.keys(tournamentData)
			.filter(key => key.startsWith('round')) // Only include "round" keys
			.sort((a, b) => b.localeCompare(a)); // Sort rounds in reverse order
	
		rounds.forEach(roundKey => {
			const roundMatches = tournamentData[roundKey];
			if (roundMatches && roundMatches.length > 0) {
				const roundRow = createRoundRow(roundMatches);
				tournamentContainer.appendChild(roundRow);
			}
		});
	}
	
}

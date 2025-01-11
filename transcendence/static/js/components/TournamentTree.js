export default class ComponentTournamentTree extends HTMLElement {
	constructor() {
		super();
		const template = document.getElementById('component-tournament-tree').content;
		this.attachShadow({ mode: 'open' }).appendChild(template.cloneNode(true));
		this.players = [];
		this.tournamentData = {
			player_count: 0,
			rounds: [], //array of rounds, that contain an array of matches
		};
	}

	connectedCallback() {
	}

	initiateTournament(playersArray) {
		this.players = playersArray.map(player => {
			if (player === "ai") {
				return {
					"avatar-name": "🤖", // Default emoji for AI player
					"avatar-background": "#CCCCCC" // Default background color for AI player
				};
			} else {
				return {
					"avatar-name": player.player_emoji,
					"avatar-background": `#${player.player_bg_color}` // Convert the background to proper format
				};
			}

		});

		this.tournamentData = {
			player_count: this.players.length,
			rounds: [], //array of rounds, that contain an array of matches
		};
		const totalRounds = Math.ceil(Math.log2(this.tournamentData.player_count)); // Calculate total rounds based on players
		// Initialize the first round
		const round1 = [];
		for (let i = 0; i < this.tournamentData.player_count; i += 2) {
			round1.push({
				player1_i: i,
				player2_i: i + 1 < this.players.length ? i + 1 : -1, // Next player index or -1 if uneven amount of players
				winner_i: null,
			});
		}
		this.tournamentData.rounds.push(round1);
		
		// Initialize future rounds
		for (let roundIndex = 1; roundIndex < totalRounds; roundIndex++) {
			const newRound = [];
			const previousRoundLen = this.tournamentData.rounds[roundIndex - 1].length
			for (let i = 0; i < previousRoundLen; i += 2) {
				const p2_placeholder = i + 1 < previousRoundLen ? null : -1; //
				newRound.push({
					player1_i: null,
					player2_i: p2_placeholder,
					winner_i: null,
				})
			}
			this.tournamentData.rounds.push(newRound)
		}
		this.#renderTree();
	}

	addWinners(winners_index_array) {
		let i = 0;
		const roundsLen = this.tournamentData.rounds.length
		for (let roundIndex = 0; roundIndex < roundsLen; roundIndex++) {
			const currentRound = this.tournamentData.rounds[roundIndex];
			const nextRound = roundIndex + 1 < roundsLen ? this.tournamentData.rounds[roundIndex + 1] : null;
			currentRound.forEach((match, matchIndex) => {
				if (i >= winners_index_array.length) // can happen only with 6 players 
					i--;
				const winnerIdx = winners_index_array[i];
				if (winnerIdx === -1) 
					return;
				if (match.winner_i === null)
					match.winner_i = winnerIdx;
				if (!nextRound) 
					return;
				//set next matches for the winner
				const nextMatchIndex = Math.floor(matchIndex / 2)
				const isPlayer1Slot = matchIndex % 2 === 0; // bool if the player should be player1 or 2
				if (isPlayer1Slot && nextRound[nextMatchIndex].player1_i === null) {
					nextRound[nextMatchIndex].player1_i = winnerIdx;
					if (this.tournamentData.player_count === 6 && nextRound.length === 2 && matchIndex === 2) {
						nextRound[nextMatchIndex].winner_i = winnerIdx;
						this.tournamentData.rounds[2][0].player2_i = winnerIdx // pass single player to final
					}
				}
				else if (!isPlayer1Slot && nextRound[nextMatchIndex].player2_i === null)
					nextRound[nextMatchIndex].player2_i = winnerIdx;
				i++;
			})
		}
		this.#renderTree();
	}

	#renderTree() {
		const tournamentContainer = this.shadowRoot.querySelector('.tournament');
		tournamentContainer.innerHTML = ''; // Clear previous tree render

		// Helper function to create a player avatar
		const createAvatar = (player_i, winner_i) => {
			if (player_i === -1)
				return null;
			const avatar = document.createElement('td-avatar');
			// Set default values if player is null
			const playerName = player_i === null ? "???" : this.players[player_i]["avatar-name"];
			const playerBackground = player_i === null ? "#C8C8C8" : this.players[player_i]["avatar-background"];
			avatar.setAttribute('avatar-name', playerName);
			if (winner_i !== null && winner_i !== player_i) {
				avatar.setAttribute('avatar-background', "#A0A0A0");
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
				const avatar1 = createAvatar(match.player1_i, match.winner_i);
				matchDiv.appendChild(avatar1);
				const avatar2 = createAvatar(match.player2_i, match.winner_i);
				if (avatar2) //if uneven number of players avatar 2 wont be created
					matchDiv.appendChild(avatar2);
				rowDiv.appendChild(matchDiv);
			});
			return rowDiv;
		};

		//render each round in the tree structure starting from the final
		for (let roundIndex = this.tournamentData.rounds.length - 1; roundIndex >= 0; roundIndex--) {
			const roundMatches = this.tournamentData.rounds[roundIndex];
			if (roundMatches && roundMatches.length > 0) {
				const roundRow = createRoundRow(roundMatches);
				tournamentContainer.appendChild(roundRow);
			}
		}
	}
	
}

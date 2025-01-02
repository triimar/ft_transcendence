export default class ComponentTournamentTree extends HTMLElement {
	constructor() {
		super();
		const template = document.getElementById('component-tournament-tree').content;
		this.attachShadow({ mode: 'open' }).appendChild(template.cloneNode(true));
		this.tournamentData = {
            player_count: 0,
            round1: [],
            round2: [],
            round3: []
        };		
	}

	// connectedCallback() {
	// 	// Pass the tournament data to the renderTree method
	// 	this.addFirstRound([{player_id: "c701ab9c-252b-5f4f-9a68-fc7f03a5502a", player_emoji: "VDV", player_bg_color: "F53948"}, 
	// 		{player_id: "a0eb6023-a04b-512e-ab4b-4993df6a4377", player_emoji: "zmz", player_bg_color: "158FDA"},
	// 		{player_id: "a0eb6023-a04b-512e-ab4b-4993df6a4377", player_emoji: "E9E", player_bg_color: "FFD133"},
	// 		{player_id: "a0eb6023-a04b-512e-ab4b-4993df6a4377", player_emoji: "T.T", player_bg_color: "A633FF"},
	// 		{player_id: "a0eb6023-a04b-512e-ab4b-4993df6a4377", player_emoji: "$u$", player_bg_color: "33FFF5"},
	// 		{player_id: "a0eb6023-a04b-512e-ab4b-4993df6a4377", player_emoji: "HuH", player_bg_color: "FF8333"},
	// 		{player_id: "a0eb6023-a04b-512e-ab4b-4993df6a4377", player_emoji: "0(0", player_bg_color: "FF33A6"},
	// 		{player_id: "a0eb6023-a04b-512e-ab4b-4993df6a4377", player_emoji: "wmw", player_bg_color: "3357FF"}])
	// 	console.log(this.tournamentData)
	// 	this.addWinners([1, 2, 4, 6, 2, 6, 6])
	// 	console.log(this.tournamentData)
	// 	this.renderTree(this.tournamentData);
	// }


	connectedCallback() {
		// Pass the tournament data to the renderTree method
		this.addFirstRound([{player_id: "c701ab9c-252b-5f4f-9a68-fc7f03a5502a", player_emoji: "VDV", player_bg_color: "F53948"}, 
			{player_id: "a0eb6023-a04b-512e-ab4b-4993df6a4377", player_emoji: "E9E", player_bg_color: "FFD133"},
			{player_id: "a0eb6023-a04b-512e-ab4b-4993df6a4377", player_emoji: "zmz", player_bg_color: "158FDA"},
			{player_id: "a0eb6023-a04b-512e-ab4b-4993df6a4377", player_emoji: "0(0", player_bg_color: "FF33A6"},
			{player_id: "a0eb6023-a04b-512e-ab4b-4993df6a4377", player_emoji: "T.T", player_bg_color: "A633FF"},
			{player_id: "a0eb6023-a04b-512e-ab4b-4993df6a4377", player_emoji: "wmw", player_bg_color: "3357FF"}])
		console.log(this.tournamentData)
		this.addWinners([0, 2, 4, 2, -1])
		console.log(this.tournamentData)
		this.renderTree(this.tournamentData);
	}

	addFirstRound(players_array) {
		// Transform backend player data to match the expected format
        const transformedPlayers = players_array.map(player => ({
            name: player.player_emoji,
            background: `#${player.player_bg_color}` // Convert the background to proper format
        }));

        const totalPlayers = transformedPlayers.length;
        const totalRounds = Math.ceil(Math.log2(totalPlayers)); // Calculate total rounds based on players
		console.log("total rounds:", totalRounds)
        this.tournamentData.player_count = totalPlayers;
        this.tournamentData.round1 = transformedPlayers.reduce((matches, player, index, array) => {
            if (index % 2 === 0) {
                matches.push({
                    player1: { "avatar-name": player.name, "avatar-background": player.background },
                    player2: { "avatar-name": array[index + 1].name, "avatar-background": array[index + 1].background },
                    winner: null
                });
            }
            return matches;
        }, []);
        // Initialize future rounds dynamically
        let previousRoundSize = this.tournamentData.round1.length;
        for (let i = 2; i <= totalRounds; i++) {
            const roundKey = `round${i}`;
            this.tournamentData[roundKey] = Array(Math.ceil(previousRoundSize / 2)).fill(null).map(() => ({
                player1: null,
                player2: null,
                winner: null
            }));
            previousRoundSize = Math.ceil(previousRoundSize / 2);
        }
	}

	addWinners(winners_index_array) {
		let i = 0;
	
		for (let round = 1; round <= Object.keys(this.tournamentData).length - 1; round++) {
			const currentRoundKey = `round${round}`;
			const nextRoundKey = `round${round + 1}`;
			const currentRound = this.tournamentData[currentRoundKey];
			const nextRound = this.tournamentData[nextRoundKey];
	
			currentRound.forEach((match, matchIndex) => {
				const winnerIdx = winners_index_array[i];	
				if (winnerIdx === -1) {
					i++;
					return;
				}
				// Update the current round's match with the winner
				match.winner = winnerIdx % 2 === 0 ? match.player1 : match.player2;
				// Populate the next round's match
				if (nextRound) {
					const nextMatchIndex = Math.floor(matchIndex / 2);
	
					// Assign the winner to the correct slot in the next round					
					if (matchIndex % 2 === 0) {
						console.log(matchIndex, this.tournamentData.player_count)
						if (this.tournamentData.player_count === 6 && matchIndex === 2) {
								console.log("why are we not here");
								nextRound[nextMatchIndex].player1 = match.winner;
								nextRound[nextMatchIndex].player2 = { "avatar-name": "", "avatar-background": null };
								nextRound[nextMatchIndex].winner = match.winner;
								i--;
							}
						else if (!nextRound[nextMatchIndex].player1) {
							nextRound[nextMatchIndex].player1 = match.winner;
						}
					} else {
						if (!nextRound[nextMatchIndex].player2) {
							nextRound[nextMatchIndex].player2 = match.winner;
						}
					}
				}
	
				i++;
			});
		}
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
				if (match.player2 && match.player2["avatar-name"] !== "") {
					const avatar2 = createAvatar(match.player2, match.winner);
					matchDiv.appendChild(avatar2);
				}
	
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

export default class ComponentTournamentTree extends HTMLElement {
    constructor() {
        super();
        const template = document.getElementById('component-tournament-tree').content;
        this.attachShadow({ mode: 'open' }).appendChild(template.cloneNode(true));

        // Avatars for players (8 players)
        this.avatars = [
            { "avatar-name": "A.A", "avatar-background": "#FF5733" },
            { "avatar-name": "pip", "avatar-background": "#33FF57" },
            { "avatar-name": "wmw", "avatar-background": "#3357FF" },
            { "avatar-name": "0)0", "avatar-background": "#FF33A6" },
            { "avatar-name": "E9E", "avatar-background": "#FFD133" },
            { "avatar-name": "T.T", "avatar-background": "#A633FF" },
            { "avatar-name": "$u$", "avatar-background": "#33FFF5" },
            { "avatar-name": "HuH", "avatar-background": "#FF8333" }
        ];

        // Automatically create matchups from avatars
        this.matchups = this.createMatchups(this.avatars);
    }

    // Create pairs of avatars (2 per match) for each round
    createMatchups(avatars) {
        let rounds = [];

        // Round 1: Initial matchups (4 pairs)
        const round1 = [
            [{ player1: avatars[0], player2: avatars[1] }, { player1: avatars[2], player2: avatars[3] }],
            [{ player1: avatars[4], player2: avatars[5] }, { player1: avatars[6], player2: avatars[7] }]
        ];

        // Round 2: Semifinals (2 pairs, one from left and one from right)
        const round2 = [
            [{ player1: round1[0][0].player1, player2: round1[0][1].player1 }],
            [{ player1: round1[1][0].player1, player2: round1[1][1].player1 }]
        ];

        // Round 3: Final (1 match)
        const final = [
            [{ player1: round2[0][0].player1, player2: round2[1][0].player1 }]
        ];

        rounds.push(round1, round2, final);

        return rounds;
    }

    connectedCallback() {
        this.render();
    }

    render() {
        const container = this.shadowRoot.querySelector('.tournament-container');
        container.innerHTML = ''; // Clear existing rounds

        // Iterate over rounds and display matchups
        this.matchups.forEach((round, roundIndex) => {
            const roundDiv = document.createElement('div');
            roundDiv.classList.add('round');

            // Set alignment for rounds:
            // - First round (index 0): left for the first half, right for the second half
            // - Semifinal (index 1): balanced towards center
            // - Final (index 2): center
            if (roundIndex === 0) {
                roundDiv.classList.add('align-left');  // First round aligned to left and right
            } else if (roundIndex === 1) {
                roundDiv.classList.add('align-center'); // Semifinals closer to center
            } else if (roundIndex === 2) {
                roundDiv.classList.add('align-final'); // Final centered
            }

            // Create matchups in the round
            round.forEach((side, sideIndex) => {
                side.forEach(match => {
                    const matchupDiv = document.createElement('div');
                    matchupDiv.classList.add('matchup');

                    // Player 1 Avatar (uses <td-avatar> component)
                    const player1 = document.createElement('td-avatar');
                    player1.setAttribute('avatar-name', match.player1["avatar-name"]);
                    player1.setAttribute('avatar-background', match.player1["avatar-background"]);

                    // Player 2 Avatar (uses <td-avatar> component)
                    const player2 = document.createElement('td-avatar');
                    player2.setAttribute('avatar-name', match.player2["avatar-name"]);
                    player2.setAttribute('avatar-background', match.player2["avatar-background"]);

                    // Connector (line between avatars)
                    const connector = document.createElement('div');
                    connector.classList.add('connector');

                    // Append avatars and connector
                    matchupDiv.appendChild(player1);
                    matchupDiv.appendChild(connector);
                    matchupDiv.appendChild(player2);

                    // Add matchup to the round div
                    roundDiv.appendChild(matchupDiv);
                });
            });

            // Append the round div to the tournament container
            container.appendChild(roundDiv);
        });
    }
}



export default class ComponentTournamentTree extends HTMLElement {
    constructor() {
        super();
        const template = document.getElementById('component-tournament-tree').content;
        this.attachShadow({ mode: 'open' }).appendChild(template.cloneNode(true));

        // Avatars for players in matchups
        this.avatars = [
            { "avatar-name": "A.A", "avatar-background": "#FF5733" },
            { "avatar-name": "pip", "avatar-background": "#33FF57" },
            { "avatar-name": "wmw", "avatar-background": "#3357FF" },
            { "avatar-name": "0)0", "avatar-background": "#FF33A6" }
        ];
        
        // Audience avatars to be displayed in the UI box
        this.audience_avatars = [
            { "avatar-name": "E9E", "avatar-background": "#FFD133" },
            { "avatar-name": "T.T", "avatar-background": "#A633FF" },
            { "avatar-name": "$u$", "avatar-background": "#33FFF5" },
            { "avatar-name": "HuH", "avatar-background": "#FF8333" }
        ];

        // Create matchups for the tournament
        this.matchups = this.createMatchups(this.avatars);
    }

    // Generate pairs of avatars for each matchup
    createMatchups(avatars) {
        const matchups = [];
        for (let i = 0; i < avatars.length; i += 2) {
            if (avatars[i + 1]) {
                matchups.push({ player1: avatars[i], player2: avatars[i + 1] });
            }
        }
        return matchups;
    }

    // Populate the .ui box with audience avatars
    createAudienceBox() {
        const uiBox = this.shadowRoot.querySelector('.ui');
        uiBox.innerHTML = ''; // Clear any existing audience avatars

        this.audience_avatars.forEach(avatar => {
            const audienceAvatar = document.createElement('td-avatar');
            audienceAvatar.setAttribute('avatar-name', avatar["avatar-name"]);
            audienceAvatar.setAttribute('avatar-background', avatar["avatar-background"]);
            uiBox.appendChild(audienceAvatar);
        });
    }

    connectedCallback() {
        this.render();
        this.createAudienceBox(); // Populate the UI box with audience avatars
    }

    render() {
        const container = this.shadowRoot.querySelector('.tournament-container');
        container.innerHTML = ''; // Clear existing matchups

        // Iterate over matchups and render each
        this.matchups.forEach(match => {
            const matchupDiv = document.createElement('div');
            matchupDiv.classList.add('matchup');

            // Player 1 Avatar (using <td-avatar> component)
            const player1 = document.createElement('td-avatar');
            player1.setAttribute('avatar-name', match.player1["avatar-name"]);
            player1.setAttribute('avatar-background', match.player1["avatar-background"]);

            // Player 2 Avatar (using <td-avatar> component)
            const player2 = document.createElement('td-avatar');
            player2.setAttribute('avatar-name', match.player2["avatar-name"]);
            player2.setAttribute('avatar-background', match.player2["avatar-background"]);

            // Versus line between avatars
            const vs_line = document.createElement('div');
            vs_line.classList.add('vs_line');

            // Append avatars and vs line to the matchup div
            matchupDiv.appendChild(player1);
            matchupDiv.appendChild(vs_line);
            matchupDiv.appendChild(player2);

            // Add the matchup div to the tournament container
            container.appendChild(matchupDiv);
        });
    }
}

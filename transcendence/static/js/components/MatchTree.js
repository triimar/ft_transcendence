export default class ComponentMatchTree extends HTMLElement {
	//static observedAttributes = ["room-max", "room-id"];
	
	constructor() {
		super();
		this.shadow = this.attachShadow({ mode: "open" });
		const template = document.getElementById("component-match-tree");
		this.shadow.appendChild(template.content.cloneNode(true));
	}

	fetchMatchData() {
        return {
            "matchlist-avatars": [
                { "avatar-name": "A.A", "avatar-background": "#FF5733" },
                { "avatar-name": "pip", "avatar-background": "#33FF57" },
                { "avatar-name": "wmw", "avatar-background": "#3357FF" },
                { "avatar-name": "0)0", "avatar-background": "#FF33A6" },
                { "avatar-name": "E9E", "avatar-background": "#FFD133" },
                { "avatar-name": "T.T", "avatar-background": "#A633FF" },
                { "avatar-name": "$u$", "avatar-background": "#33FFF5" },
                { "avatar-name": "HuH", "avatar-background": "#FF8333" }
            ]
        };
	}
	connectedCallback() {
	
	}

}


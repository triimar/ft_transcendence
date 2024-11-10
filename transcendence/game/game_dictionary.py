rooms = {
    'room1': {
        'players': {
            'player1': {
				'look': {'color': 'blue', 'avatar': 'Q-Q'},
                'ready': False,
				'score': 0,
                'paddle': {
                    'position': 50,
                    'velocity': 15
                }
            },
            'player2': {
				'look': {'color': 'yellow', 'avatar': 'T-T'},
                'ready': False,
				'score': 0,
                'paddle': {
                    'position': 50,
                    'velocity': 15
                }
            },
        },
        'matches': ['match1', 'match2']
    }
}

matches = {
    'match1': {
        "players": {
            'player1': {'position': 50, 'size': 15, 'score': 0, 'ready': False},
            'player2': {'position': 50, 'size': 15, 'score': 0, 'ready': False},
        },      
        'ball': {
            'position': {'x': 50, 'y': 50},
            'velocity': {'vx': 5, 'vy': 5},
            'size': 15
        },
        'winner':'player1'
    },
    'match2': {
        'player3': {'position': 50, 'size': 15, 'score': 0, 'ready': False},
        'player4': {'position': 50, 'size': 15, 'score': 0, 'ready': False},
        'ball': {
            'position': {'x': 50, 'y': 50},
            'velocity': {'vx': 5, 'vy': 5},
            'size': 15
        },
        'winner':'player1'
    },

}
rooms = {
    'room1': {
        'players': {
            'player1': {
                'id': 'player1',
				'look': {'color': 'blue', 'avatar': 'Q-Q'},
                'ready': False,
				'score': 0,
                'paddle': {
                    'position': 50,
                    'velocity': 15
                }
            },
            'player2': {
                'id': 'player2',
				'look': {'color': 'yellow', 'avatar': 'T-T'},
                'ready': False,
				'score': 0,
                'paddle': {
                    'position': 50,
                    'velocity': 15
                }
            },
        },
        'matches': {
            'match1': {
                'player1': 'player1',
                'player2': 'player2',
                'ball': {
                    'position': {'x': 50, 'y': 50},
                    'velocity': {'vx': 5, 'vy': 5},
					'size': 15
                },
				'winner':'player1'
            },
        }
    }
}

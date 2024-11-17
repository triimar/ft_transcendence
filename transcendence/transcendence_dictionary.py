room_data_sample = [
    {
        'room_id': 'example_room_1',
        'room_owner': 'player_id_1',
        'mode': 'balance', #'shoot','bomb','remix'
        'avatars': [
            {'player_id': 'example_player_id_1'},
            {'player_id': 'example_player_id_2'},
            {'player_id': 'example_player_id_3'},
        ], # can be list
        'prepared_count': 1,
        'max_player': 3,
        'matches':['match_id_1', 'match_id_2']
    },
    {
        'room_id': 'example_room_2',
        'room_owner': 'player_id_4',
        'mode': 'balance', #'shoot','bomb','remix'
        'avatars': [
            {'player_id': 'example_player_id_4'},
            {'player_id': 'example_player_id_5'},
            {'player_id': 'example_player_id_6'}
        ],
        'prepared_count': 1,
        'max_player': 5,
        'matches':['match_id_3', 'match_id_4']
    },
]

player_data_sample = [
    {
        'player_id': 'example_player_id_1',
        'look': {'color': 'blue', 'avatar': 'Q-Q'},
        'position': 50,
        'size': 15,
        'score': 0
    },
    {
        'player_id': 'example_player_id_2',
        'look': {'color': 'yellow', 'avatar': 'T-T'},
        'position': 50,
        'size': 15,
        'score': 0
    },
    {
        'player_id': 'example_player_id_3',
        'look':{'color': 'green', 'avatar': 'O_O'},
        'position': 50,
        'size': 15,
        'score': 0
    }
]

matches = [
    {
        'match_id': 'example_match_id_1',
        'ready': 1,
        'players': ['player_id_1', 'player_id_2'],
        'ball': {
            'position': {'x': 50, 'y': 50},
            'velocity': {'vx': 5, 'vy': 5},
            'size': 15
        },
        'winner':'player1'
    },
    {
        'match_id': 'example_match_id_2',
        'ready': 1,
        'players': ['player_id_3', 'player_id_4'],
        'ball': {
            'position': {'x': 50, 'y': 50},
            'velocity': {'vx': 5, 'vy': 5},
            'size': 15
        },
        'winner':'player1'
    }
]
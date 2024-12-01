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
        'player_emoji': 'Q-Q',
        'player_bg_color': 'ffffff',
        'position': 50,
        'size': 15,
        'score': 0
    },
    {
        'player_id': 'example_player_id_2',
        'player_emoji': '-_-',
        'player_bg_color': 'ff000',
        'position': 50,
        'size': 15,
        'score': 0
    },
    {
        'player_id': 'example_player_id_3',
        'player_emoji': 'O-O',
        'player_bg_color': 'ff000',
        'position': 50,
        'size': 15,
        'score': 0
    }
]

match_data_sample = [
    {
        'match_id': 'example_match_id_1',
        'ready': 1,
        'players': ['player_id_1', 'player_id_2'],
        'ball': {
            'position': {'x': 50, 'y': 50},
            'velocity': {'vx': 5, 'vy': 5},
            'size': 15
        },
        'winner':'player_id_1'
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
        'winner':'player_id_3'
    }
]

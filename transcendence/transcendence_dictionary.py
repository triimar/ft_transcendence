room_data_sample = {
    'example_room_1': {
        'room_id': 'example_room_1',
        'room_owner': 'player_id_1',
        'mode': 'balance', #'shoot','bomb','remix'
        'avatars': [
            {'player_id': 'example_player_id_1', 'prepared': True, "disconnected": False},
            {'player_id': 'example_player_id_2', 'prepared': False, "disconnected": False},
            {'player_id': 'example_player_id_3', 'prepared': True, "disconnected": False},
        ], # can be list
        'prepared_count': 1,
        'max_player': 3,
        'ai': {'score': 0},
        'matches':[
            {
                "started": False,
                'ready': 1,
                'players': ['player_id_1', 'player_id_2'],
                'ball': {
                    'position': {'x': 50, 'y': 50},
                    'velocity': {'vx': 5, 'vy': 5}
                },
                'winner':'player_id_1'
            },
            {
                "started": False,
                'ready': 1,
                'players': ['player_id_3', 'ai'],
                'ball': {
                    'position': {'x': 50, 'y': 50},
                    'velocity': {'vx': 5, 'vy': 5}
                },
                'winner':'player_id_3'
            }
        ]
    },
    'example_room_2': {
        'room_id': 'example_room_2',
        'room_owner': 'player_id_4',
        'mode': 'balance', #'shoot','bomb','remix'
        'avatars': [
            {'player_id': 'example_player_id_4', 'prepared': True, "disconnected": False},
            {'player_id': 'example_player_id_5', 'prepared': False, "disconnected": False},
            {'player_id': 'example_player_id_6', 'prepared': True, "disconnected": False},
        ],
        'prepared_count': 1,
        'max_player': 5,
        'ai': {'score': 0},
        'matches':[
            {
                "started": False,
                'ready': 1,
                'players': ['player_id_4', 'player_id_5'],
                'ball': {
                    'position': {'x': 50, 'y': 50},
                    'velocity': {'vx': 5, 'vy': 5},
                    'size': 15
                },
                'winner':'player_id_1'
            },
            {
                "started": False,
                'ready': 1,
                'players': ['ai', 'player_id_6'],
                'ball': {
                    'position': {'x': 50, 'y': 50},
                    'velocity': {'vx': 5, 'vy': 5},
                    'size': 15
                },
                'winner':'player_id_3'
            }
        ]
    },
}

player_data_sample = {
    'example_player_id_1': {
        'player_id': 'example_player_id_1',
        'player_emoji': 'Q-Q',
        'player_bg_color': 'ff0000',
        'position': 50,
        'size': 15,
        'score': 0
    },
    'example_player_id_2': {
        'player_id': 'example_player_id_2',
        'player_emoji': '-_-',
        'player_bg_color': '00ff00',
        'position': 50,
        'size': 15,
        'score': 0
    },
    'example_player_id_3': {
        'player_id': 'example_player_id_3',
        'player_emoji': 'O-O',
        'player_bg_color': '0000ff',
        'position': 50,
        'size': 15,
        'score': 0
    },
    'example_player_id_4': {
        'player_id': 'example_player_id_4',
        'player_emoji': '~_~',
        'player_bg_color': 'ff0f00',
        'position': 50,
        'size': 15,
        'score': 0
    },
    'example_player_id_5': {
        'player_id': 'example_player_id_5',
        'player_emoji': '4-4',
        'player_bg_color': 'f00f00',
        'position': 50,
        'size': 15,
        'score': 0
    },
    'example_player_id_6': {
        'player_id': 'example_player_id_6',
        'player_emoji': 'T-T',
        'player_bg_color': 'f000ff',
        'position': 50,
        'size': 15,
        'score': 0
    }
}

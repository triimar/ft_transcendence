import json
import redis
from .redis_client import get_redis_client
from channels.generic.websocket import AsyncWebsocketConsumer

# Connect to Redis
redis_instance = redis.Redis(host='db_redis', port=6379, db=0)

# Sample room data
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

# Convert the room data to JSON and store it under a specific key in Redis
redis_instance.set("room_data", json.dumps(room_data_sample))

# all the player data who is connected
player_data_sample = [
    {"player_id": "example_player_id_1", "player_emoji": "233", "player_bg_color": "ff0000"},
    {"player_id": "example_player_id_2", "player_emoji": "234", "player_bg_color": "ffff00"},
    {"player_id": "example_player_id_3", "player_emoji": "235", "player_bg_color": "00ff00"},
    {"player_id": "example_player_id_4", "player_emoji": "236", "player_bg_color": "0000ff"},
    {"player_id": "example_player_id_5", "player_emoji": "237", "player_bg_color": "ff00ff"},
    {"player_id": "example_player_id_6", "player_emoji": "238", "player_bg_color": "00ffff"}
]
redis_instance.set("player_data", json.dumps(player_data_sample))

# The match data
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
redis_instance.set("match_data", json.dumps(match_data_sample))

redis_instance.set('player_channels', json.dumps(player_channels))

async def add_player_channel(player_id, channel_name):
    channels = json.loads(await redis_instance.get("player_channels"))
    channels[player_id] = channel_name

async def get_player_channel(player_id) -> str:
    channels = json.loads(await redis_instance.get("player_channels"))
    return channels[player_id]

async def get_full_room_data() -> list:
	redis_instance = await get_redis_client()
	room_data = json.loads(await redis_instance.get("room_data"))
	player_data = json.loads(await redis_instance.get("player_data"))

	player_data_dict = {player["player_id"]: player for player in player_data}

	full_room_data = []

	for room in room_data:
		# Add player data to each avatar in the room
		for avatar in room["avatars"]:
			player_id = avatar["player_id"]
			# Fetch the corresponding player data and merge it
			if player_id in player_data_dict:
				avatar.update(player_data_dict[player_id])

		# Append the updated room data to the combined list
		full_room_data.append(room)

	return full_room_data

async def add_player_to_room(room_id, player_id) -> bool:
	redis_instance = await get_redis_client()

	room_data = json.loads(await redis_instance.get("room_data"))
	player_data = json.loads(await redis_instance.get("player_data"))

	# Find the player details from player_data
	new_player = next((player for player in player_data if player["player_id"] == player_id), None)

	# Check if the player exists in player_data
	if new_player is None:
		print(f"Player with player_id {player_id} not found in player_data.")
		return False
	else:
		# Find room based on room id and add new player to it
		for room in room_data:
			if room["room_id"] == room_id:
				room["avatars"].append({"player_id": new_player["player_id"]})
				print(f"Player {player_id} added to {room['room_id']}.")
				await redis_instance.set("room_data", json.dumps(room_data))
				return True
		print(f"Room with room_id {room_id} not found in room_data.")
		return False

async def get_one_room_data(room_id):
    redis_instance = await get_redis_client()

    room_data = json.loads(await redis_instance.get("room_data"))

    # Find the room by room_id
    room = next((room for room in room_data if room["room_id"] == room_id), None)

    return room

# Update room data with new room data
async def update_room(updated_room):
	redis_instance = await get_redis_client()
	player_data = json.loads(await redis_instance.get('room_data'))
	player_data[updated_room['room_id']] = updated_room
	await redis_instance.set('room_data', json.dumps(player_data))

async def add_new_room(room_id, owner_id) -> dict:
    redis_instance = await get_redis_client()

    room_data = json.loads(await redis_instance.get("room_data") or '[]')

    # Create a new room with default settings
    new_room = {
        "room_id": room_id,
        "room_owner": owner_id,
		# TODO: add default room setting
        # "room_setting": {
        #     "default_setting": "value"
        # },
		"prepared_count": 0,
        "avatars": [
            {"player_id": owner_id}
        ],
        "max_player": 2
    }

    room_data.append(new_room)

    await redis_instance.set("room_data", json.dumps(room_data))

    return new_room

async def get_one_player(player_id) -> dict|None:
    redis_instance = await get_redis_client()
    player_data = json.loads(await redis_instance.get("player_data"))

    one_player = next((player for player in player_data if player["player_id"] == player_id), None)

    return one_player

# Update playar data with new player data
async def update_player(updated_player):
	redis_instance = await get_redis_client()
	player_data = json.loads(await redis_instance.get('player_data'))
	player_data[updated_player['player_id']] = updated_player
	await redis_instance.set('player_data', json.dumps(player_data))

async def get_full_match_data() -> list:
    redis_instance = await get_redis_client()
    match_data = json.loads(await redis_instance.get("match_data"))

    return match_data

async def update_full_matches(updated_matches):
	redis_instance = await get_redis_client()
	await redis_instance.set('match_data', json.dumps(updated_matches))

async def get_one_match_data(match_id) -> dict|None:
    redis_instance = await get_redis_client()
    match_data = json.loads(await redis_instance.get("match_data"))
    one_match = next((match for match in match_data if match["match_id"] == match_id), None)
    
    return one_match

# Update playar data with new player data
async def update_match(updated_match):
	redis_instance = await get_redis_client()
	match_data = json.loads(await redis_instance.get('match_data'))
	match_data[updated_match['match_id']] = updated_match
	await redis_instance.set('match_data', json.dumps(match_data))

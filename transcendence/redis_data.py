import json
import redis
from channels.generic.websocket import AsyncWebsocketConsumer
import redis_data as data

# Connect to Redis
redis_instance = redis.Redis(host='db_redis', port=6379, db=0)

# Sample room data
room_data_sample = [
    {
        "room_id": "example_room_1",
        "room_ownder": "player_id_1",
        # "room_setting": {
        #     ...
        # }
        "avatars": [
            {"player_id": "example_player_id_1"},
            {"player_id": "example_player_id_2"},
            {"player_id": "example_player_id_3"},
        ],
        "max_player": 3
    },
    {
        "room_id": "example_room_2",
        "room_ownder": "player_id_4",
        # "room_setting": {
        #     ...
        # }
        "avatars": [
            {"player_id": "example_player_id_4"},
            {"player_id": "example_player_id_5"},
            {"player_id": "example_player_id_6"}
        ],
        "max_player": 5
    }
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

async def get_full_room_data() -> list:
	room_data = json.loads(redis_instance.get("room_data"))
	player_data = json.loads(redis_instance.get("player_data"))

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

	room_data = json.loads(redis_instance.get("room_data"))
	player_data = json.loads(redis_instance.get("player_data"))

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
				redis_instance.set("room_data", json.dumps(room_data))
				return True
		print(f"Room with room_id {room_id} not found in room_data.")
		return False

async def get_one_room_data(room_id):

    room_data = json.loads(redis_instance.get("room_data"))

    # Find the room by room_id
    room = next((room for room in room_data if room["room_id"] == room_id), None)

    return room

async def add_new_room(room_id, owner_id):
    room_data = json.loads(redis_instance.get("room_data") or '[]')

    # Create a new room with default settings
    new_room = {
        "room_id": room_id,
        "room_owner": owner_id,
		# TODO: add default room setting
        # "room_setting": {
        #     "default_setting": "value"
        # },
        "avatars": [
            {"player_id": owner_id}
        ],
        "max_player": 2
    }

    room_data.append(new_room)

    redis_instance.set("room_data", json.dumps(room_data))

from enum import Enum
import redis
import random
from .transcendence_dictionary import player_data_sample, room_data_sample
from .redis_client import get_redis_client

MAX_NUM_PLAYER = 8
SUPPORTED_MODES = ["balance", "shoot","bomb","remix"]

# Connect to Redis
redis_instance = redis.Redis(host='db_redis', port=6379, db=0)

# Use redis JSON to store json documents
redis_instance.json().set("room_data", "$", room_data_sample)
redis_instance.json().set("player_data", "$", player_data_sample)

class RedisError(Enum):
    NONE = 0
    NOPLAYERFOUND = 1
    NOROOMFOUND = 2
    MAXROOMPLAYERSREACHED = 3
    MODENOTSUPPORTED = 4
    PLAYERALLPREPARED = 5

BALL_VELOCITY_X = [-1, 1]
BALL_VELOCITY_Y = [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5]

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

async def add_player_to_room(room_id, player_id) -> RedisError:
    redis_instance = await get_redis_client()

    room_data = json.loads(await redis_instance.get("room_data"))
    player_data = json.loads(await redis_instance.get("player_data"))

    # Find the player details from player_data
    new_player = next((player for player in player_data if player["player_id"] == player_id), None)

    # Check if the player exists in player_data
    if new_player is None:
        print(f"Player with player_id {player_id} not found in player_data.")
        return RedisError.NOPLAYERFOUND
    else:
        # Find room based on room id and add new player to it
        for room in room_data:
            if room["room_id"] == room_id:
                for avatar in room["avatars"]:
                    if avatar["player_id"] == new_player["player_id"]:
                        return RedisError.NONE
                if room["max_player"] <= len(room["avatars"]):
                    return RedisError.MAXROOMPLAYERSREACHED
                room["avatars"].append({"player_id": new_player["player_id"], "prepared": False})
                print(f"Player {player_id} added to {room['room_id']}.")
                await redis_instance.set("room_data", json.dumps(room_data))
                return RedisError.NONE
        print(f"Room with room_id {room_id} not found in room_data.")
        return RedisError.NOROOMFOUND

async def get_one_room_data(room_id):
    redis_instance = await get_redis_client()

    room_data = json.loads(await redis_instance.get("room_data"))
    player_data = json.loads(await redis_instance.get("player_data"))
    player_data_dict = {player["player_id"]: player for player in player_data}

    # Find the room by room_id
    room = next((room for room in room_data if room["room_id"] == room_id), None)

    # Add player data to each avatar in the room
    for avatar in room["avatars"]:
        player_id = avatar["player_id"]
        # Fetch the corresponding player data and merge it
        if player_id in player_data_dict:
            avatar.update(player_data_dict[player_id])
    return room

# Update room data with new room data
async def update_room(updated_room):
    redis_instance = await get_redis_client()
    room_data = json.loads(await redis_instance.get('room_data'))
    for i, room in enumerate(room_data):
        if room['room_id'] == updated_room['room_id']:
            room_data[i] = updated_room
            break
    await redis_instance.set('room_data', json.dumps(room_data))

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
        "mode": "",
        "avatars": [
            {"player_id": owner_id, "prepared": True}
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
    for i, room in enumerate(player_data):
        if room['player_id'] == updated_player['player_id']:
            player_data[i] = updated_player
            break
    await redis_instance.set('player_data', json.dumps(player_data))

async def get_full_match_data() -> list:
    redis_instance = await get_redis_client()
    match_data = json.loads(await redis_instance.get("match_data"))

    return match_data

async def update_full_matches(updated_matches):
	redis_instance = await get_redis_client()
	await redis_instance.set('match_data', json.dumps(updated_matches))

async def get_one_match(room_id, match_id) -> dict|None:
    redis_instance = await get_redis_client()
    room_data = await get_one_room_data(room_id)
    match_data = room_data['matches'][match_id]
    return match_data

# Update playar data with new player data
async def update_match(updated_match):
	redis_instance = await get_redis_client()
	match_data = json.loads(await redis_instance.get('match_data'))
	match_data[updated_match['match_id']] = updated_match
	await redis_instance.set('match_data', json.dumps(match_data))

async def add_one_player(player_id, player_emoji, player_bg_color):
    redis_instance = await get_redis_client()
    player_data = json.loads(await redis_instance.get("player_data"))
    player_data.append({"player_id": player_id, "player_emoji": player_emoji, "player_bg_color": player_bg_color});
    await redis_instance.set("player_data", json.dumps(player_data))

# leave room
async def delete_one_room(room_id) -> None:
    redis_instance = await get_redis_client()

    room_data = json.loads(await redis_instance.get("room_data"))

    room_data = [room for room in room_data if room['room_id'] != room_id]

    await redis_instance.set("room_data", json.dumps(room_data))


async def delete_one_player_from_room(room_id, player_id):
    redis_instance = await get_redis_client()

    room_data = json.loads(await redis_instance.get("room_data"))

    for room in room_data:
        if room["room_id"] == room_id:
            room["avatars"] = [avatar for avatar in room["avatars"] if avatar["player_id"] != player_id]
    await redis_instance.set("room_data", json.dumps(room_data))

async def update_room_owner(room_id, player_id):
    redis_instance = await get_redis_client()

    room_data = json.loads(await redis_instance.get("room_data"))
    room_owner = None

    for room in room_data:
        if room["room_id"] == room_id:
            room["avatars"] = [avatar for avatar in room["avatars"] if avatar["player_id"] != player_id]
            room["room_owner"] = room["avatars"][0]["player_id"]
            room["avatars"][0]["prepared"] = True
            room_owner = room["room_owner"]
            break

    await redis_instance.set("room_data", json.dumps(room_data))
    return room_owner

async def is_all_prepared(room_id):
    redis_instance = await get_redis_client()

    room_data = json.loads(await redis_instance.get("room_data"))

    for room in room_data:
        if room["room_id"] == room_id:
            if (len(room["avatars"]) > 1) and all(elem["prepared"] for elem in room["avatars"]):
                return RedisError.PLAYERALLPREPARED
            else:
                return RedisError.NONE
    return RedisError.NOROOMFOUND


# update room data
async def update_max_player_num_in_one_room(room_id, max_player_num) -> RedisError:
    redis_instance = await get_redis_client()

    room_data = json.loads(await redis_instance.get("room_data"))

    for room in room_data:
        if room["room_id"] == room_id:
            if max_player_num > MAX_NUM_PLAYER:
                return RedisError.MAXROOMPLAYERSREACHED
            room["max_player"] = max_player_num
            await redis_instance.set("room_data", json.dumps(room_data))
            return RedisError.NONE
    return RedisError.NOROOMFOUND

async def update_game_mode_in_one_room(room_id, mode) -> RedisError:
    if mode not in SUPPORTED_MODES:
        return RedisError.MODENOTSUPPORTED

    redis_instance = await get_redis_client()
    room_data = json.loads(await redis_instance.get("room_data"))

    for room in room_data:
        if room["room_id"] == room_id:
            room["mode"] = mode
            await redis_instance.set("room_data", json.dumps(room_data))
            return RedisError.NONE
    return RedisError.NOROOMFOUND

async def update_prepared_one_player_in_one_room(room_id, player_id):
    redis_instance = await get_redis_client()
    room_data = json.loads(await redis_instance.get("room_data"))

    for room in room_data:
        if room["room_id"] == room_id:
            for player in room["avatars"]:
                if player["player_id"] == player_id:
                    player["prepared"] = True
                    await redis_instance.set("room_data", json.dumps(room_data))
                    if all(elem["prepared"] for elem in room["avatars"]):
                        return RedisError.PLAYERALLPREPARED
                    else:
                        return RedisError.NONE
            return RedisError.NOPLAYERFOUND
    return RedisError.NOROOMFOUND

async def get_owner_id(room_id) -> str:
    redis_instance = await get_redis_client()

    room_data = json.loads(await redis_instance.get("room_data"))

    for room in room_data:
        if room["room_id"] == room_id:
            return room["room_ownder"]
    return ""

def init_ball() -> dict:
    ball = dict()
    ball.update({"position": {"x": 600, "y": 300}})
    ball.update({"velocity": {"vx": random.choice(BALL_VELOCITY_X), "vy":random.choice(BALL_VELOCITY_Y)}})
    ball.update({"size": 50})
    return {"ball": ball}

async def generate_matches(room_id, self_player_id) -> list[str]:
    redis_instance = await get_redis_client()
    room_data = json.loads(await redis_instance.get("room_data"))
    first_layer_player_id = None

    for room in room_data:
        if room["room_id"] == room_id:
            players = room["avatars"]
            player_nums = len(players)
            match_nums = (player_nums + 1) // 2
            temp_player_list = [p["player_id"] for p in players]
            if (player_nums % 2 != 0):
                temp_player_list.append("ai")
            random.shuffle(temp_player_list)
            matches = []
            for idx in range(match_nums):
                match = dict()
                match["ready"] = 0
                if (idx <= match_nums//2):
                    match["players"] = [temp_player_list[2*idx], temp_player_list[2*idx+1]]
                else:
                    match["players"] = []
                match.update(init_ball())
                match["winner"] = ""
                matches.append(match)
            first_layer_player_id = temp_player_list
            room["matches"] = matches
            room["ai"] = {"score": 0}
            break

    await redis_instance.set("room_data", json.dumps(room_data))
    return first_layer_player_id

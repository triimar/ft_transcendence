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

BALL_VELOCITY_X = [-6, -5, -4, -3, -2, 2, 3, 4, 5, 6]
BALL_VELOCITY_Y = [-6, -5, -4, -3, -2, 2, 3, 4, 5, 6]

async def get_full_room_data() -> list:
    redis_instance = get_redis_client()
    rooms = await redis_instance.json().get("room_data")
    players = await redis_instance.json().get("player_data")
    player_keys = ["player_emoji", "player_bg_color"]

    full_room_data = []

    # TODO: remove redundant data
    for _, room in rooms.items():
        # Add player data to each avatar in the room
        for avatar in room["avatars"]:
            player_id = avatar["player_id"]
            # Fetch the corresponding player data and merge it
            if player_id in players:
                player_info = dict((key, players[player_id][key]) for key in player_keys)
                avatar.update(player_info)

        # Append the updated room data to the combined list
        full_room_data.append({"avatars": room["avatars"], "room_id": room["room_id"], "max_player": room["max_player"]})

    return full_room_data

async def add_player_to_room(room_id, player_id) -> RedisError:
    redis_instance = get_redis_client()

    result = await redis_instance.json().get("room_data", f'$.{room_id}')
    if len(result) == 0:
        print(f"Room with room_id {room_id} not found in room_data.")
        return RedisError.NOROOMFOUND
    room = result[0]
    result = await redis_instance.json().get("player_data", f'$.{player_id}')
    if len(result) == 0:
        print(f"Player with player_id {player_id} not found in player_data.")
        return RedisError.NOPLAYERFOUND
    player = result[0]
    # Find room based on room id and add new player to it
    for avatar in room["avatars"]:
        if avatar["player_id"] == player_id:
            return RedisError.NONE
    if room["max_player"] <= len(room["avatars"]):
        return RedisError.MAXROOMPLAYERSREACHED
    await redis_instance.json().arrappend("room_data", f'$.{room_id}.avatars', {"player_id": player_id, "prepared": False})
    print(f"Player {player_id} added to {room['room_id']}.")
    return RedisError.NONE

async def get_one_room_data(room_id):
    redis_instance = get_redis_client()

    result = await redis_instance.json().get("room_data", f'$.{room_id}')
    if len(result) == 0:
        return None
    room = result[0]
    players = await redis_instance.json().get("player_data")

    # Add player data to each avatar in the room
    for avatar in room["avatars"]:
        player_id = avatar["player_id"]
        # Fetch the corresponding player data and merge it
        if player_id in players:
            avatar.update(players[player_id])
    return room

async def add_new_room(room_id, owner_id) -> dict:
    redis_instance = get_redis_client()

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

    await redis_instance.json().set("room_data", f'$.{room_id}', new_room)

    return new_room

async def get_one_player(player_id) -> dict|None:
    redis_instance = get_redis_client()
    result = await redis_instance.json().get("player_data", f'$.{player_id}')
    if len(result) > 0:
        return result[0]
    else:
        return None

# Update playar data with new player data
async def update_player(updated_player):
    redis_instance = get_redis_client()
    await redis_instance.json().set('player_data', f'$.{updated_player["player_id"]}', updated_player)

async def get_one_match(room_id, match_id) -> dict|None:
    redis_instance = get_redis_client()
    room_data = await get_one_room_data(room_id)
    match_data = room_data['matches'][match_id]
    return match_data

# Update playar data with new player data
async def add_one_player(player_id, player_emoji, player_bg_color):
    redis_instance = get_redis_client()
    await redis_instance.json().set("player_data", f'$.{player_id}', {"player_id": player_id, "player_emoji": player_emoji, "player_bg_color": player_bg_color});

# leave room
async def delete_one_room(room_id) -> None:
    redis_instance = get_redis_client()
    await redis_instance.json().delete("room_data", f'$.{room_id}')

async def delete_one_player_from_room(room_id, player_id):
    redis_instance = get_redis_client()
    await redis_instance.json().delete("room_data", f'$.{room_id}.avatars[?(@.player_id == "{player_id}")]')

async def update_room_owner(room_id, left_player_id):
    redis_instance = get_redis_client()
    result = await redis_instance.json().get("room_data", f'$.{room_id}.avatars[1].player_id');
    if len(result) > 0:
        new_player_id = result[0]
    await redis_instance.json().delete("room_data", f'$.{room_id}.avatars[?(@.player_id == "{left_player_id}")]')
    await redis_instance.json().set("room_data", f'$.{room_id}.room_owner', new_player_id);
    await redis_instance.json().set("room_data", f'$.{room_id}.avatars[0].prepared', True);
    return new_player_id

async def is_all_prepared(room_id):
    redis_instance = get_redis_client()

    result = await redis_instance.json().get("room_data", f'$.{room_id}.avatars')
    if len(result) == 0:
        return RedisError.NOROOMFOUND
    avatars = result[0]

    if (len(avatars) > 1) and all(elem["prepared"] for elem in avatars):
        return RedisError.PLAYERALLPREPARED
    else:
        return RedisError.NONE


# update room data
async def update_max_player_num_in_one_room(room_id, max_player_num) -> RedisError:
    if max_player_num > MAX_NUM_PLAYER:
        return RedisError.MAXROOMPLAYERSREACHED
    redis_instance = get_redis_client()
    await redis_instance.json().set("room_data", f'$.{room_id}.max_player', max_player_num)
    return RedisError.NONE

async def update_game_mode_in_one_room(room_id, mode) -> RedisError:
    if mode not in SUPPORTED_MODES:
        return RedisError.MODENOTSUPPORTED

    redis_instance = get_redis_client()
    await redis_instance.json().set("room_data", f'$.{room_id}.mode', mode)
    return RedisError.NONE

async def update_prepared_one_player_in_one_room(room_id, player_id):
    redis_instance = get_redis_client()
    await redis_instance.json().set("room_data", f'$.{room_id}.avatars[?(@.player_id == "{player_id}")].prepared', True)
    result = await redis_instance.json().get("room_data", f'$.{room_id}.avatars')
    if len(result) == 0:
        return RedisError.NOROOMFOUND
    avatars = result[0]

    if all(elem["prepared"] for elem in avatars):
        return RedisError.PLAYERALLPREPARED
    else:
        return RedisError.NONE

async def get_owner_id(room_id) -> str:
    redis_instance = get_redis_client()
    result = await redis_instance.json().get("room_data", f'$.{room_id}.room_owner')
    if len(result) == 0:
        return ""
    room_owner = result[0]
    return room_owner

def init_ball() -> dict:
    ball = dict()
    ball.update({"position": {"x": 600, "y": 300}})
    ball.update({"velocity": {"vx": random.choice(BALL_VELOCITY_X), "vy":random.choice(BALL_VELOCITY_Y)}})
    ball.update({"size": 50})
    return {"ball": ball}

async def reset_ball(room_id, match_index) -> dict:
    redis_instance = get_redis_client()
    await redis_instance.json().mset([
        ("room_data", f'$.{room_id}.matches[{match_index}].ball.position', {'x': 600, 'y': 300}),
        ("room_data", f'$.{room_id}.matches[{match_index}].ball.velocity', {"vx": random.choice(BALL_VELOCITY_X), "vy":random.choice(BALL_VELOCITY_Y)})
    ])
    result = await redis_instance.json().get("room_data", f'$.{room_id}.matches[{match_index}].ball')
    if len(result) >= 0:
        return result[0]
    else:
        return None

async def generate_matches(room_id, self_player_id) -> list[str]:
    redis_instance = get_redis_client()
    [room] = await redis_instance.json().get("room_data", f'$.{room_id}')
    first_layer_player_id = None

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
    await redis_instance.json().set("room_data", f'$.{room_id}.matches', matches)
    await redis_instance.json().set("room_data", f'$.{room_id}.ai', {"score": 0})

    return first_layer_player_id

async def set_player_ready_for_match(room_id, match_index, player_id):
    redis_instance = get_redis_client()
    await redis_instance.json().numincrby("room_data", f'$.{room_id}.matches[{match_index}].ready', 1)
    await redis_instance.json().set("player_data", f'$.{player_id}.score', 0)

async def set_ball_bounce(room_id, match_index, ball):
    redis_instance = get_redis_client()
    await redis_instance.json().mset([
        ("room_data", f'$.{room_id}.matches[{match_index}].ball.position', ball['position']),
        ("room_data", f'$.{room_id}.matches[{match_index}].ball.velocity', ball['velocity'])
    ])

async def set_match_winner(room_id, match_index, player_id):
    redis_instance = get_redis_client()
    await redis_instance.json().set("room_data", f'$.{room_id}.matches[{match_index}].winner', player_id)

async def increase_ai_score(room_id):
    redis_instance = get_redis_client()
    await redis_instance.json().numincrby("room_data", f'$.{room_id}.ai.score', 1)

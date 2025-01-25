import json
from .redis_client import get_redis_client
from .transcendence_dictionary import player_data_sample, room_data_sample
from .db_async_queries import select_all_users, user_exists_by_uuid, update_color_and_avatar

async def sync_db_to_redis():
	# get all users from db
	result = await select_all_users()

	# get first instance of redis
	redis_instance = get_redis_client()

	# set sample data to redis (delete later)
	await redis_instance.json().set("room_data", "$", room_data_sample)
	await redis_instance.json().set("player_data", "$", player_data_sample)

	# convert record to dict
	users = []
	if result is not None:
		users = [dict(record) for record in result]

	key_mapping = {
		"uuid": "player_id",
		"avatar": "player_emoji",
		"color": "player_bg_color"
	}

	keys_to_discard = ['id', 'login']

	for user in users:
			for key in list(user.keys()):
					if key in keys_to_discard:
							del user[key]
					elif key in key_mapping:
							user[key_mapping[key]] = user.pop(key)
			user['position'] = 50
			user['size'] = 15
			user['score'] = 0
			await redis_instance.json().set("player_data", f"$.{user['player_id']}", user)

	print("All users in db synced to Redis")


async def sync_redis_to_db():
	# get data from redis
	players = await get_redis_client().json().get("player_data")

	if players is None:
		players = {}

	print("All player data in redis:")
	print(f"{players}")

	# a loop to update avatars in db
	# condition: update when user exists
	for key, value in players.items():
		if (await user_exists_by_uuid(key)):
			await update_color_and_avatar(value['player_id'], value['player_bg_color'], value['player_emoji'])
			print(f"Player {key} updated, new color: {value['player_bg_color']}, new avatar: {value['player_emoji']}")
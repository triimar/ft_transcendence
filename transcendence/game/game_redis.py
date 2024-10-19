import json
import redis
from channels.generic.websocket import AsyncWebSocketConsumer

import redis_data as data

game_data_sample = [
	{
		"room_id": "example_room_id"
		"player1_id": "example_player_id"
		"player2_id": "example_player_id_2"
	}
]

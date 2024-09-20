import json
import redis
from channels.generic.websocket import AsyncWebsocketConsumer

# Connect to Redis
redis_instance = redis.Redis(host='db_redis', port=6379, db=0)

# Sample room data
room_data = [
    {
        "room_id": "example_room_1",
        "room_ownder": "player_id_1",
        "avatars": [
            {"player_id": "example_player_id_1", "player_emoji": "233", "player_bg_color": "ff0000"},
            {"player_id": "example_player_id_2", "player_emoji": "234", "player_bg_color": "ffff00"},
            {"player_id": "example_player_id_3", "player_emoji": "235", "player_bg_color": "00ff00"}
        ],
        "max_player": 3
    },
    {
        "room_id": "example_room_2",
        "room_ownder": "player_id_4",
        "avatars": [
            {"player_id": "example_player_id_4", "player_emoji": "236", "player_bg_color": "0000ff"},
            {"player_id": "example_player_id_5", "player_emoji": "237", "player_bg_color": "ff00ff"},
            {"player_id": "example_player_id_6", "player_emoji": "238", "player_bg_color": "00ffff"}
        ],
        "max_player": 5
    }
]

# Convert the room data to JSON and store it under a specific key in Redis
redis_instance.set("room_data", json.dumps(room_data))

player_data = []
redis_instance.set("player_data", json.dumps(player_data))

class LobbyConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.lobby_group_name = 'lobby_group'

        # Join the group
        await self.channel_layer.group_add(
            self.lobby_group_name,
            self.channel_name
        )

        # Accept the WebSocket connection
        await self.accept()

    async def disconnect(self, close_code):
        # Leave the group
        await self.channel_layer.group_discard(
            self.lobby_group_name,
            self.channel_name
        )

    # Receive message from WebSocket
    async def receive(self, text_data):
        received_json = json.loads(text_data)
        event = {}
        match (received_json):
            case {"type": "init", "payload": payload}:
                # self.player_id = payload.id # save who the player is
                # event = {"type": "lobby.info", "message": payload}
                if payload:
                    stored_room_data = redis_instance.get("room_data")
                    if stored_room_data:
                        room_list = json.loads(stored_room_data)
                        await self.send(text_data=json.dumps({"type": "ack_init", "payload": room_list}))
            # case {"type": "join_room", "payload": payload}:
        # Send message to room group, broadcasting
        # await self.channel_layer.group_send("lobby_group", event)

    async def lobby_info(self, event):
        message = event['message']

        if message:
            stored_room_data = redis_instance.get("room_data")
            if stored_room_data:
                room_list = json.loads(stored_room_data)
            await self.send(text_data=json.dumps({"type": "ack_init", "payload": room_list}))

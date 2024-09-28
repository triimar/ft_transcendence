import json
import redis
from channels.generic.websocket import AsyncWebsocketConsumer
import redis_data as data


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
            case {"type": "init", "player_id": player_id}:
                self.player_id = player_id # save who the player is
                if player_id:
                    room_list = data.get_full_room_data()
                    await self.send(text_data=json.dumps({"type": "ack_init", "rooms": room_list}))
            case {"type": "join_room",  "room_id": room_id, "player_id": player_id}:
                self.room_group_name = room_id
                # Add this consumer to a group identified by 'room_id'
                await self.channel_layer.group_add(
            		self.room_group_name,
            		self.channel_name
        		)
                event_join_room_lobby = {"type": "joinroom.lobby", "message": {"room_id": room_id, "player_id": player_id}}
                event_join_room_room = {"type": "joinroom.room", "message": {"room_id": room_id, "player_id": player_id}}
                if data.add_player_to_room(room_id=room_id, player_id=player_id):
                    await self.channel_layer.group_send(self.lobby_group_name, event=event_join_room_lobby)
                    await self.channel_layer.group_send(self.room_group_name, event=event_join_room_room)
            case {"type": "join_room",  "room_id": room_id, "room_owner": owner_id}:
                self.room_group_name = room_id
                await self.channel_layer.group_add(
            		self.room_group_name,
            		self.channel_name
        		)
                event_add_room_lobby = {"type": "addroom.lobby", "message": {"room_id": room_id, "room_owner": owner_id}}
                data.add_new_room(room_id=room_id, owner_id=owner_id)
                single_room_data = data.get_one_room_data(room_id=room_id)
                if single_room_data:
                    await self.send(text_data=json.dumps({"type": "ack_add_room_room", "payload": single_room_data}))
                    await self.channel_layer.group_send(self.lobby_group_name, event=event_add_room_lobby)


	# functions for dealing with events
    async def joinroom_lobby(self, event):
        message = event['message']
        if message:
            room_data =  data.get_full_room_data()
            if room_data:
                room_list = json.loads(room_data)
                await self.send(text_data=json.dumps({"type": "ack_join_room_lobby", "payload": room_list}))
            else:
                await self.send(text_data=json.dumps(
                    {"type": "ack_join_room_lobby", "payload": "Cannot get room data after one play joined."})
                )

    async def joinroom_room(self, event):
        message = event['message']
        if message:
            room_id = message["room_id"]
            single_room_data = data.get_one_room_data(room_id=room_id)
            if single_room_data:
                await self.send(text_data=json.dumps({"type": "ack_join_room_room", "payload": single_room_data}))
            else:
                await self.send(text_data=json.dumps(
                    {"type": "ack_join_room_room", "payload": "Cannot get certain room data after one play joined."})
                )

    async def addroom_lobby(self, event):
        message = event['message']
        if message:
            room_data =  data.get_full_room_data()
            if room_data:
                room_list = json.loads(room_data)
                await self.send(text_data=json.dumps({"type": "ack_add_room_lobby", "payload": room_list}))







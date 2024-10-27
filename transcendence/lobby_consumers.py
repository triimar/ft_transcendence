import json
import redis
from channels.generic.websocket import AsyncWebsocketConsumer
from . import redis_data as data
import shortuuid

class LobbyConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.lobby_group_name = 'lobby_group'

        # Join the group
        await self.channel_layer.group_add(
            self.lobby_group_name,
            self.channel_name
        )
        self.joined_group = ["lobby"] # indicate which groups the consumer is in

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
                    room_list = await data.get_full_room_data()
                    await self.send(text_data=json.dumps({"type": "ack_init", "rooms": room_list}))
            case {"type": "join_room",  "room_id": room_id, "player_id": player_id}:
                self.room_group_name = room_id
                # Remove this consumer from lobby group
                await self.channel_layer.group_discard(
                    self.lobby_group_name,
                    self.channel_name
				)
                if await data.add_player_to_room(room_id=room_id, player_id=player_id):
                    avatar = await data.get_one_player(player_id=player_id)
                    if avatar is not None:
                        event_join_room = {"type": "join.room", "room_id": room_id, "avatar": avatar}
                    else:
                        event_join_room = {"type": "join.room", "room_id": room_id}
                    await self.channel_layer.group_send(self.lobby_group_name, event=event_join_room)
                    # Add this consumer to a group identified by 'room_id'
                    await self.channel_layer.group_add(
                        self.room_group_name,
                        self.channel_name
                    )
                    self.joined_group = ["room"]
                    await self.channel_layer.group_send(self.room_group_name, event=event_join_room)
                    joined_room = await data.get_one_room_data(room_id=room_id)
                    if joined_room is not None:
                        await self.send(text_data=json.dumps({"type": "ack_join_room", "single_room_data": joined_room}))
                    else:
                        await self.send(text_data=json.dumps({"type": "ack_join_room", "single_room_data": "Cannot find the room to join!"}))
            case {"type": "add_room","owner_id": owner_id}:
                self.room_group_name = shortuuid.ShortUUID().random(length=15)
                await self.channel_layer.group_discard(
                    self.lobby_group_name,
                    self.channel_name
				)
                added_room = await data.add_new_room(room_id=room_id, owner_id=owner_id)
                await self.channel_layer.group_add(
                        self.room_group_name,
                        self.channel_name
                )
                self.joined_group = ["room"]
                owner_avatar = await data.get_one_player(player_id=owner_id)
                if owner_avatar is not None:
                    event_add_room = {"type": "add.room", "room_id": room_id, "owner_avatar": owner_avatar}
                else:
                    event_add_room = {"type": "add.room", "room_id": room_id}
                await self.channel_layer.group_send(self.room_group_name, event=event_add_room)
                await self.send(text_data=json.dumps({"type": "ack_add_room", "single_room_data": added_room}))


	# functions for dealing with events
    # async def joinroom_lobby(self, event):
    #     message = event['message']
    #     if message:
    #         room_data =  data.get_full_room_data()
    #         if room_data:
    #             room_list = json.loads(room_data)
    #             await self.send(text_data=json.dumps({"type": "ack_join_room_lobby", "payload": room_list}))
    #         else:
    #             await self.send(text_data=json.dumps(
    #                 {"type": "ack_join_room_lobby", "payload": "Cannot get room data after one play joined."})
    #             )

    # async def joinroom_room(self, event):
    #     message = event['message']
    #     if message:
    #         room_id = message["room_id"]
    #         single_room_data = data.get_one_room_data(room_id=room_id)
    #         if single_room_data:
    #             await self.send(text_data=json.dumps({"type": "ack_join_room_room", "payload": single_room_data}))
    #         else:
    #             await self.send(text_data=json.dumps(
    #                 {"type": "ack_join_room_room", "payload": "Cannot get certain room data after one play joined."})
    #             )

    async def join_room(self, event):
        room_id = event["room_id"]
        try:
            avatar = event["avatar"]
            text_data = json.dumps({"type": "b_join_room", "room_id": room_id, "avatar": avatar})
        except KeyError as e:
            text_data = json.dumps({"type": "b_join_room", "room_id": room_id, "avatar": "Cannot get the certain player who joined the room!"})
        await self.send(text_data=text_data)

    async def add_room(self, event):
        room_id = event["room_id"]
        try:
            owner_avatar = event["avatar"]
            text_data = json.dumps({"type": "b_add_room", "room_id": room_id, "owner_avatar": owner_avatar })
        except KeyError as e:
            text_data = json.dumps({"type": "b_add_room", "room_id": room_id, "owner_avatar": "Cannot get room owner's avatar!" })
        await self.send(text_data=text_data)







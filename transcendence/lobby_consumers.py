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
                match (await data.add_player_to_room(room_id=room_id, player_id=player_id)):
                    case data.RedisError.NONE:
                        avatar = await data.get_one_player(player_id=player_id)
                        if avatar is not None:
                            event_join_room = {"type": "join.room", "room_id": room_id, "avatar": avatar}
                        else:
                            event_join_room = {"type": "join.room", "room_id": room_id}
                        await self.channel_layer.group_send(self.lobby_group_name, event_join_room)
                        # Add this consumer to a group identified by 'room_id'
                        await self.channel_layer.group_add(
                            self.room_group_name,
                            self.channel_name
                        )
                        self.joined_group = ["room"]
                        await self.channel_layer.group_send(self.room_group_name, event_join_room)
                        joined_room = await data.get_one_room_data(room_id=room_id)
                        if joined_room is not None:
                            await self.send(text_data=json.dumps({"type": "ack_join_room", "single_room_data": joined_room}))
                        else:
                            await self.send(text_data=json.dumps({"type": "ack_join_room", "single_room_data": "Cannot find the room to join!"}))
                    case data.RedisError.NOPLAYERFOUND:
                        await self.send(text_data=json.dumps({"type": "error", "message": "player id not found", "redirect_hash": "main"}))
                    case data.RedisError.NOROOMFOUND:
                        await self.send(text_data=json.dumps({"type": "error", "message": "room id not found", "redirect_hash": "main"}))
                    case data.RedisError.MAXROOMPLAYERSREACHED:
                        await self.send(text_data=json.dumps({"type": "error", "message": "max number of players reached. Cannot join room", "redirect_hash": "main"}))
            case {"type": "add_room","owner_id": owner_id}:
                room_id = shortuuid.ShortUUID().random(length=15)
                self.room_group_name = room_id
                await self.channel_layer.group_discard(
                    self.lobby_group_name,
                    self.channel_name
				)
                added_room = await data.add_new_room(room_id, owner_id)
                await self.channel_layer.group_add(
                        self.room_group_name,
                        self.channel_name
                )
                self.joined_group = ["room"]
                owner_avatar = await data.get_one_player(owner_id)
                if owner_avatar is not None:
                    event_add_room = {"type": "add.room", "room_id": room_id, "avatar": owner_avatar}
                else:
                    event_add_room = {"type": "add.room", "room_id": room_id}
                await self.channel_layer.group_send(self.room_group_name, event_add_room)
                await self.send(text_data=json.dumps({"type": "ack_add_room", "room_id": room_id}))
            case {"type": "leave_room","room_id": room_id,"player_id": player_id}:
                current_room = await data.get_one_room_data(room_id)
                await self.channel_layer.group_discard(self.room_group_name, self.channel_name)
                if len(current_room["avatarts"]) != 1:
                    if current_room["room_owner"] == player_id:
                        new_room_owner = await data.update_room_owner(room_id, player_id)
                        event_leave_room = {"type": "leave.room", "delete_room": False, "room_id": room_id, "player_id": player_id, "new_room_onwer": new_room_owner}
                    else:
                        await data.delete_one_player_from_room(room_id,player_id)
                        event_leave_room = {"type": "leave.room", "delete_room": False, "room_id": room_id, "player_id": player_id}
                    await self.channel_layer.group_send(self.room_group_name, event_leave_room)
                else:
                    await data.delete_one_room(room_id)
                    event_leave_room = {"type": "leave.room", "delete_room": True, "room_id": room_id, "player_id": player_id}
                await self.channel_layer.group_send(self.lobby_group_name, event_leave_room)
                await self.channel_layer.group_add(self.lobby_group_name, self.channel_name)
                self.join_group = ["lobby"]
                room_list = await data.get_full_room_data()
                await self.send(text_data=json.dumps({"type": "ack_leave_room", "rooms": room_list}))


	# functions for dealing with events
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

    async def leave_room(self, event):
        room_id = event["room_id"]
        player_id = event["player_id"]
        if event["delete_room"] == True:
            text_data = json.dumps({"type": "b_leave_room", "room_id": room_id})
        else:
            try:
                new_room_owner = event["new_room_owner"]
                text_data = json.dumps({"type":"b_leave_room", "room_id": room_id, "player_id": player_id,"new_room_owner": new_room_owner})
            except KeyError as e:
                text_data = json.dumps({"type":"b_leave_room", "room_id": room_id, "player_id": player_id})
        await self.send(text_data=text_data)











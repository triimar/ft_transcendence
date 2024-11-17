import json
import redis
from channels.generic.websocket import AsyncWebsocketConsumer
from . import redis_data as data
import shortuuid

class LobbyConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.lobby_group_name = 'lobby_group'

        # Join the lobby group
        await self.channel_layer.group_add(
            self.lobby_group_name,
            self.channel_name
        )
        self.joined_group = ["lobby"]  # indicate which groups the consumer is in

        # Accept the WebSocket connection
        await self.accept()

    async def disconnect(self, close_code):
        # Leave the current group(s)
        for group in self.joined_group:
            await self.channel_layer.group_discard(
                group,
                self.channel_name
            )

    # Receive message from WebSocket
    async def receive(self, text_data):
        received_json = json.loads(text_data)
        event = {}
        match received_json:
            case {"type": "init", "player_id": player_id}:
                self.player_id = player_id  # save who the player is
                if player_id:
                    room_list = await data.get_full_room_data()
                    await self.send(text_data=json.dumps({"type": "ack_init", "rooms": room_list}))
            case {"type": "join_room", "room_id": room_id, "player_id": player_id}:
                await self.join_room_group(room_id, player_id)
            case {"type": "add_room", "owner_id": owner_id}:
                await self.add_room_group(owner_id)
            case {"type": "player_ready", "room_id": room_id, "player_id": player_id}:
                await self.mark_player_ready(room_id, player_id)

    async def join_room_group(self, room_id, player_id):
        self.room_group_name = room_id

        # Remove this consumer from the lobby group
        await self.channel_layer.group_discard(
            self.lobby_group_name,
            self.channel_name
        )

        if await data.add_player_to_room(room_id=room_id, player_id=player_id):
            avatar = await data.get_one_player(player_id=player_id)
            event_join_room = {"type": "join_room", "room_id": room_id, "avatar": avatar}
            await self.channel_layer.group_send(self.lobby_group_name, event=event_join_room)
            await self.channel_layer.group_add(
                self.room_group_name,
                self.channel_name
            )
            self.joined_group = [room_id]
            await self.channel_layer.group_send(self.room_group_name, event=event_join_room)
            joined_room = await data.get_one_room_data(room_id=room_id)
            if joined_room is not None:
                await self.send(text_data=json.dumps({"type": "ack_join_room", "single_room_data": joined_room}))
            else:
                await self.send(text_data=json.dumps({"type": "ack_join_room", "single_room_data": "Cannot find the room to join!"}))

    async def add_room_group(self, owner_id):
        self.room_group_name = shortuuid.ShortUUID().random(length=15)
        await self.channel_layer.group_discard(
            self.lobby_group_name,
            self.channel_name
        )
        added_room = await data.add_new_room(room_id=self.room_group_name, owner_id=owner_id)
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        self.joined_group = [self.room_group_name]
        owner_avatar = await data.get_one_player(player_id=owner_id)
        event_add_room = {"type": "add_room", "room_id": self.room_group_name, "owner_avatar": owner_avatar}
        await self.channel_layer.group_send(self.room_group_name, event=event_add_room)
        await self.send(text_data=json.dumps({"type": "ack_add_room", "single_room_data": added_room}))

    async def mark_player_ready(self, room_id, player_id):
        await data.mark_player_ready(room_id, player_id)
        room_data = await data.get_one_room_data(room_id)
        if room_data and all(player['ready'] for player in room_data['players'].values()):
            await self.create_matches(room_id, room_data['players'])
   
    async def create_matches(self, room_id, players):
        player_ids = list(players.keys())
        matches = {}
        match_groups = []
        for i in range(0, len(player_ids), 2):
            if i + 1 < len(player_ids):
                match_id = shortuuid.ShortUUID().random(length=15)
                match_group_name = f'match_{match_id}'
                match_groups.append(match_group_name)
                matches[match_id] = {
                    'players': {
                        player_ids[i]: players[player_ids[i]],
                        player_ids[i + 1]: players[player_ids[i + 1]],
                    },
                    'ball': {
                        'position': {'x': 50, 'y': 50},
                        'velocity': {'vx': 5, 'vy': 5},
                        'size': 15
                    },
                    'winner': None
                }

        await data.save_matches(room_id, matches)

        # Add players to match groups and notify them
        for match_id, match_data in matches.items():
            match_group_name = f'match_{match_id}'
            for player_id in match_data['players']:
                # Add the player to the match group
                await self.channel_layer.group_add(
                    match_group_name,
                    self.channel_name
                )
                self.joined_group.append(match_group_name)
            # Notify players in the room about the match creation
            event_matches = {"type": "matches_created", "matches": {match_id: match_data}}
            await self.channel_layer.group_send(room_id, event=event_matches)
            # Also send the match creation event to the match group
            await self.channel_layer.group_send(match_group_name, event=event_matches)

    # Handlers for sending messages to WebSocket
    async def join_room(self, event):
        room_id = event["room_id"]
        try:
            avatar = event["avatar"]
            text_data = json.dumps({"type": "b_join_room", "room_id": room_id, "avatar": avatar})
        except KeyError:
            text_data = json.dumps({"type": "b_join_room", "room_id": room_id, "avatar": "Cannot get the certain player who joined the room!"})
        await self.send(text_data=text_data)

    async def add_room(self, event):
        room_id = event["room_id"]
        try:
            owner_avatar = event["owner_avatar"]
            text_data = json.dumps({"type": "b_add_room", "room_id": room_id, "owner_avatar": owner_avatar })
        except KeyError:
            text_data = json.dumps({"type": "b_add_room", "room_id": room_id, "owner_avatar": "Cannot get room owner's avatar!" })
        await self.send(text_data=text_data)

    async def matches_created(self, event):
        await self.send(text_data=json.dumps(event))

# VER_3
import json
import random

from game.game_dictionary import rooms
from channels.generic.websocket import AsyncWebsocketConsumer

BALL_SPEED = 5
BALL_SIZE = 15
PADDLE_SPEED = 15
CANVAS_HEIGHT = 600
CANVAS_WIDTH = 1200

class TranscendenceConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        # Join room group
        await self.channel_layer.group_add("group_test", self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard("group_test", self.channel_name)

    async def receive(self, text_data):
        received_json = json.loads(text_data)
        event = {}
        match (received_json):
            case {"type": "init", "payload": payload}:
                event = {"type": "example.event", "message": payload}
        # Send message to room group
        await self.channel_layer.group_send("group_test", event)

    async def example_event(self, event):
        message = event["message"]
        # Send message to WebSocket
        await self.send(text_data=json.dumps({"type": "ack_init", "payload": message}))

class LobbyConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.accept()

    async def disconnect(self, close_code):
        pass

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')

        if message_type == 'create_room':
            await self.create_room(data)
        elif message_type == 'join_room':
            await self.join_room(data)

    async def create_room(self, data):
        room_id = data['room_id']
        rooms[room_id] = {
            'players': {},
            'matches': {}
        }
        await self.send(text_data=json.dumps({'status': 'room_created', 'room_id': room_id}))

    async def join_room(self, data):
        room_id = data['room_id']
        player_id = data['player_id']
        player_look = data['look']
        if room_id in rooms:
            rooms[room_id]['players'][player_id] = {
                'id': player_id,
                'look': player_look,
                'ready': False,
                'score': 0,
                'paddle': {
                    'position': 50,
                    'velocity': 15
                }
            }
            await self.send(text_data=json.dumps({'status': 'joined_room', 'room_id': room_id, 'player_id': player_id}))
        else:
            await self.send(text_data=json.dumps({'status': 'room_not_found', 'room_id': room_id}))


class GameConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_id = self.scope['url_route']['kwargs']['room_id']
        await self.channel_layer.group_add(self.room_id, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.room_id, self.channel_name)

    async def receive(self, text_data):
        data = json.loads(text_data)
        message_type = data.get('type')

        if message_type == 'ready':
            await self.handle_ready_message(data)
        elif message_type == 'update':
            await self.handle_update_message(data)
        elif message_type == 'score':
            await self.handle_score_message(data)

    async def handle_ready_message(self, data):
        player_id = data['player_id']
        match_id = data['match_id']

        room = rooms[self.room_id]
        player = room['players'].get(player_id)
        if player:
            player['ready'] = True
            match_players = room['matches'][match_id]['players']
            match_ready_state = all(room['players'][p]['ready'] for p in match_players)

            if match_ready_state:
                room['matches'][match_id]['winner'] = 0
                await self.channel_layer.group_send(
                    self.room_id,
                    {
                        'type': 'game_start',
                        'match_id': match_id
                    }
                )
            else:
                await self.send(text_data=json.dumps({'status': 'waiting', 'match_id': match_id}))
        else:
            await self.send(text_data=json.dumps({'status': 'invalid_match', 'match_id': match_id}))

    async def handle_update_message(self, data):
        match_id = data['match_id']
        ball_position = data['ball']['position']
        ball_velocity = data['ball']['velocity']
        paddle_updates = data['paddles']  # This will be a dictionary of player_id -> paddle state

        # Update game state
        room = rooms[self.room_id]
        match = room['matches'][match_id]
        match['ball']['position'] = ball_position
        match['ball']['velocity'] = ball_velocity
        for player_id in match['players']:
            if player_id in paddle_updates:
                room['players'][player_id]['paddle']['position'] = paddle_updates[player_id]['position']
                room['players'][player_id]['paddle']['velocity'] = paddle_updates[player_id]['velocity']

        # Broadcast the updated game state to all players in the room
        await self.channel_layer.group_send(
            self.room_id,
            {
                'type': 'game_update',
                'match_id': match_id,
                'ball': match['ball'],
                'paddles': {player_id: room['players'][player_id]['paddle'] for player_id in match['players']}
            }
        )

    async def handle_score_message(self, data):
        match_id = data['match_id']
        paddle_updates = data['paddles']  # This will be a dictionary of player_id -> paddle state
        point = data['player_id']
        win = False

        # Update game state
        room = rooms[self.room_id]
        match = room['matches'][match_id]
        match['ball']['position']['x'] = CANVAS_WIDTH/2
        match['ball']['position']['y'] = CANVAS_HEIGHT/2
        match['ball']['velocity']['vx'] = random.randrange(1, 5)
        match['ball']['velocity']['vy'] = random.randrange(1, 5)

        for player_id in match['players']:
            if player_id in paddle_updates:
                room['players'][player_id]['paddle']['position'] = paddle_updates[player_id]['position']
                room['players'][player_id]['paddle']['velocity'] = paddle_updates[player_id]['velocity']

        for player_id in match['players']:
            if (player_id == point):
                room['players'][player_id]['score'] += 1
                if (room['players'][player_id]['score'] == 8):
                    match['winner'] = room['players'][player_id]
                    win = True

        # Broadcast the updated game state to all players in the room
        await self.channel_layer.group_send(
            self.room_id,
            {
                'type': 'point_score',
                'match_id': match_id,
                'ball': match['ball'],
                'paddles': {player_id: room['players'][player_id]['paddle'] for player_id in match['players']},
                'win': win,
                'winner': point
            }
        )

    async def game_start(self, event):
        match_id = event['match_id']
        await self.send(text_data=json.dumps({'status': 'start', 'match_id': match_id}))

    async def game_update(self, event):
        match_id = event['match_id']
        ball = event['ball']
        paddles = event['paddles']
        await self.send(text_data=json.dumps({
            'status': 'update',
            'match_id': match_id,
            'ball': ball,
            'paddles': paddles
        }))
    
    async def point_score(self, event):
        match_id = event['match_id']
        ball = event['ball']
        paddles = event['paddles']
        win = event['win']
        winner = event['winner']
        await self.send(text_data=json.dumps({
            'status': 'score',
            'match_id': match_id,
            'ball': ball,
            'paddles': paddles,
            'win': win,
            'winner': winner
        }))



messages = []

class ChatConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
        self.room_group_name = "chat_%s" % self.room_name

        # Join room group
        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        await self.accept()
        await self.send(text_data=json.dumps({"type": "messages", "payload": messages}))

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

    # Receive message from WebSocket
    async def receive(self, text_data):
        text_data_json = json.loads(text_data)
        message = text_data_json["message"]
        messages.append(message)

        # Send message to room group
        await self.channel_layer.group_send(
            self.room_group_name, {"type": "chat_message", "message": message}
        )

    # Receive message from room group
    async def chat_message(self, event):
        message = event["message"]

        # Send message to WebSocket
        await self.send(text_data=json.dumps({"type": "message", "payload": message}))

# VER_1
# import json

# from channels.generic.websocket import WebsocketConsumer


# class ChatConsumer(WebsocketConsumer):
#     def connect(self):
#         self.accept()

#     def disconnect(self, close_code):
#         pass

#     def receive(self, text_data):
#         text_data_json = json.loads(text_data)
#         message = text_data_json["message"]

#         self.send(text_data=json.dumps({"message": message}))

#VER_2
# import json

# from asgiref.sync import async_to_sync
# from channels.generic.websocket import WebsocketConsumer


# class ChatConsumer(WebsocketConsumer):
#     def connect(self):
#         self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
#         self.room_group_name = "chat_%s" % self.room_name

#         # Join room group
#         async_to_sync(self.channel_layer.group_add)(
#             self.room_group_name, self.channel_name
#         )

#         self.accept()

#     def disconnect(self, close_code):
#         # Leave room group
#         async_to_sync(self.channel_layer.group_discard)(
#             self.room_group_name, self.channel_name
#         )

#     # Receive message from WebSocket
#     def receive(self, text_data):
#         text_data_json = json.loads(text_data)
#         message = text_data_json["message"]

#         # Send message to room group
#         async_to_sync(self.channel_layer.group_send)(
#             self.room_group_name, {"type": "chat_message", "message": message}
#         )

#     # Receive message from room group
#     def chat_message(self, event):
#         message = event["message"]

#         # Send message to WebSocket
#         self.send(text_data=json.dumps({"message": message}))

# VER_3
import json

from .game.game_dictionary import rooms
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

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
        elif message_type == 'paddle_move':
            await self.handle_paddle_message(data)
        elif message_type == 'score':
            await self.handle_score_message(data)


# {
#     match_id: jfi30,
#     ball: {
#         position: {
#             x: 50,
#             y: 50
#         },
#         velocity: {
#             vx: 5,
#             vy: 2
#         }
#     }
# }

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


# {
#     match_id: jfi30,
#     ball: {
#         position: {
#             x: 50,
#             y: 50
#         },
#         velocity: {
#             vx: 5,
#             vy: 2
#         }
#     }
# }


    async def handle_update_message(self, data):
        match_id = data['match_id']
        ball_position = data['ball']['position']
        ball_velocity = data['ball']['velocity']

        # Update game state
        room = rooms[self.room_id]
        match = room['matches'][match_id]
        match['ball']['position'] = ball_position
        match['ball']['velocity'] = ball_velocity

        # Broadcast the updated game state to all players in the room
        await self.channel_layer.group_send(
            self.room_id,
            {
                'type': 'game.update',
                'match_id': match_id,
                'ball': match['ball'],
            }
        )
# {
#     match_id: jfi30,
#     player: {
#         id: player392f,
#         position: 50
#     }

# }


    async def handle_paddle_message(self, data):
        match_id = data['match_id']
        player = data['player']

        # Update game state
        room = rooms[self.room_id]
        match = room['matches'][match_id]
        
        match[player['id']]['position'] = player['position']

        # Broadcast the updated game state to all players in the room
        await self.channel_layer.group_send(
            self.room_id,
            {
                'type': 'paddle_update',
                'match_id': match_id,
                'paddles': {player['id']: player['position']}
            }
        )


# {
#     match_id: vj2k4,
#     winner: player_sjf2,
#     loser: player_op2m,
#     balance: False
# }

    async def handle_score_message(self, data):
        match_id = data['match_id']
        point = data['winner']
        no_point = data['loser']
        balance = data['balance']
        win = False

        # Update game state
        match = rooms[self.room_id]['matches'][match_id]
        match['ball']['position']['x'] = CANVAS_WIDTH/2
        match['ball']['position']['y'] = CANVAS_HEIGHT/2
        match['ball']['velocity']['vx'] = random.randrange(1, 5)
        match['ball']['velocity']['vy'] = random.randrange(1, 5)

        match[point]['score'] += 1
        if (match[point]['score'] == 8):
            match['winner'] = match[point]
            win = True

        if (balance == True):
            match[point]['size'] -= 5
            match[no_point]['size'] += 5

        # Broadcast the updated game state to all players in the room
        await self.channel_layer.group_send(
            self.room_id,
            {
                'type': 'point.score',
                'match_id': match_id,
                'ball': match['ball'],
                'paddles': {point, no_point},
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

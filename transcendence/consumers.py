# VER_3
import json

from channels.generic.websocket import AsyncWebsocketConsumer
connected_clients = {}

# messages = []

# class ChatConsumer(AsyncWebsocketConsumer):
#     async def connect(self):
#         self.room_name = self.scope["url_route"]["kwargs"]["room_name"]
#         self.room_group_name = "chat_%s" % self.room_name

#         # Join room group
#         await self.channel_layer.group_add(self.room_group_name, self.channel_name)

#         await self.accept()
#         await self.send(text_data=json.dumps({"type": "messages", "payload": messages}))

#     async def disconnect(self, close_code):
#         # Leave room group
#         await self.channel_layer.group_discard(self.room_group_name, self.channel_name)

#     # Receive message from WebSocket
#     async def receive(self, text_data):
#         text_data_json = json.loads(text_data)
#         message = text_data_json["message"]
#         messages.append(message)

#         # Send message to room group
#         await self.channel_layer.group_send(
#             self.room_group_name, {"type": "chat_message", "message": message}
#         )

#     # Receive message from room group
#     async def chat_message(self, event):
#         message = event["message"]

#         # Send message to WebSocket
#         await self.send(text_data=json.dumps({"type": "message", "payload": message}))

class LobbyConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        await self.channel_layer.group_add("lobby", self.channel_name)
        await self.accept() 
        connected_clients[self.channel_name] = self.scope["user"].username if self.scope["user"].is_authenticated else "Anonymous"
        await self.broadcast_lobby_update()

    async def disconnect(self, close_code):
        # Leave room group
        await self.channel_layer.group_discard("lobby", self.channel_name)
        if self.channel_name in connected_clients:
            del connected_clients[self.channel_name]
        await self.broadcast_lobby_update()
    
    # Optional: Broadcast updates to the lobby when clients join/leave (not mandatory)
    async def broadcast_lobby_update(self):
        # Send the updated list of clients to everyone in the lobby
        await self.channel_layer.group_send(
            "lobby",
            {
                "type": "lobby_clients_update",
                "clients": list(connected_clients.values())
            }
        )

    async def lobby_clients_update(self, event):
        # Send the updated list of clients to WebSocket
        await self.send(text_data=json.dumps({
            "type": "lobby_clients",
            "clients": event["clients"]
        }))
    
        
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

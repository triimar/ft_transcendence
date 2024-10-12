from django.urls import path, re_path

from . import consumers

websocket_urlpatterns = [
    re_path(r"ws/chat/(?P<room_name>\w+)/$", consumers.ChatConsumer.as_asgi()),
	re_path(r'ws/game/(?P<room_name>\w+)/$', consumers.GameConsumer.as_asgi()),
    path("ws/transcendence/", consumers.TranscendenceConsumer.as_asgi()),
]

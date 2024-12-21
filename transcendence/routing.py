from django.urls import path, re_path

from . import lobby_consumers

websocket_urlpatterns = [
    path("ws/transcendence/", lobby_consumers.LobbyConsumer.as_asgi()),
]

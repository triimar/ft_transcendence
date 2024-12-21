from django.urls import path, re_path

from . import consumers

websocket_urlpatterns = [
    path("ws/transcendence/", consumers.WebsiteConsumer.as_asgi()),
]

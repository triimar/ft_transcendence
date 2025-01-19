from django.urls import path, re_path

from . import consumers

websocket_urlpatterns = [
    path("", consumers.WebsiteConsumer.as_asgi()),
]

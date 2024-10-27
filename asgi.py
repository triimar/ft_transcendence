import os

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application
from .transcendence.redis_client import _redis_client

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "transcendence.settings")

# Initialize Django ASGI application early to ensure the AppRegistry
# is populated before importing code that may import ORM models.
django_asgi_app = get_asgi_application()

import transcendence.routing

async def lifespan_scope(scope, receive, send):
    """
    Handle application lifespan events
    """

    if scope['type'] == 'lifespan':
        while True:
            message = await receive()
            if message['type'] == 'lifespan.startup':
                 # Do some startup
                await send({'type': 'lifespan.startup.complete'})
            elif message['type'] == 'lifespan.shutdown':
                # Do some shutdown
                await _redis_client.close() # close the redis connection pool
                await send({'type': 'lifespan.shutdown.complete'})
                return
    else:
        pass

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": AllowedHostsOriginValidator(
            AuthMiddlewareStack(URLRouter(transcendence.routing.websocket_urlpatterns))
        ),
        "lifespan": lifespan_scope,
    }
)

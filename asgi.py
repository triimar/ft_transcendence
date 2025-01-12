import os
import django

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application
from transcendence.redis_client import _redis_client
from transcendence.db_async_queries import add_user

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "settings")

# Initialize Django ASGI application early to ensure the AppRegistry
# is populated before importing code that may import ORM models.
django_asgi_app = get_asgi_application()

import transcendence.routing

# Initialize Django application
django.setup()

# Define lifespan scope (startup and shutdown)
async def lifespan_scope(scope, receive, send):
    """
    Handle application lifespan events
    """

    if scope['type'] == 'lifespan':
        while True:
            message = await receive()

            if message['type'] == 'lifespan.startup':
                
                print("Application is starting up...")
                print("hi")
                # Perform any startup tasks (e.g., connect to Redis, etc.)
                # Example: await _redis_client.connect() if needed
                await send({'type': 'lifespan.startup.complete'})
            
            elif message['type'] == 'lifespan.shutdown':
                print("Application is shutting down...")
                # Perform cleanup tasks (e.g., close Redis connections)
                await add_user("123", "test", "tst", "tttt")
                await _redis_client.close()  # Clean up Redis connection pool
                await send({'type': 'lifespan.shutdown.complete'})
                return  # Exit the lifespan loop after shutdown

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": AllowedHostsOriginValidator(
            AuthMiddlewareStack(URLRouter(transcendence.routing.websocket_urlpatterns))
        ),
        "lifespan": lifespan_scope,
    }
)

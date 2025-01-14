import os
import django
from time import sleep

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application
from django.core.management import call_command
from transcendence.redis_client import _redis_client
from transcendence.db_connection import init_db_connection, close_asyncpg_pool

os.environ.setdefault("DJANGO_SETTINGS_MODULE", "settings")

# Initialize Django ASGI application early to ensure the AppRegistry
# is populated before importing code that may import ORM models.
django_asgi_app = get_asgi_application()

import transcendence.routing

# Initialize Django application
django.setup()

def collect_static_files():
    try:
        # Run Django's collectstatic command
        call_command('collectstatic', verbosity=1, interactive=False)
        print("Static files collected successfully.")
    except Exception as e:
        print(f"Error collecting static files: {e}")

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
                collect_static_files()
                await init_db_connection()
                # Perform any startup tasks (e.g., connect to Redis, etc.)
                # Example: await _redis_client.connect() if needed
                await send({'type': 'lifespan.startup.complete'})
            
            elif message['type'] == 'lifespan.shutdown':
                print("Application is shutting down...")
                await close_asyncpg_pool()
                # Perform cleanup tasks (e.g., close Redis connections)
                # await _redis_client.close()  # Clean up Redis connection pool
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

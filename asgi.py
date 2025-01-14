import os
import django

from channels.auth import AuthMiddlewareStack
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from django.core.asgi import get_asgi_application
from django.core.management import call_command
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
                print("[lifespan] Application is starting up...")
                collect_static_files()
                await init_db_connection()
                # TODO: sync db to redis
                await send({'type': 'lifespan.startup.complete'})
            
            elif message['type'] == 'lifespan.shutdown':
                print("[lifespan] Application is shutting down...")
                # TODO: sync redis to db
                # TODO: how to clean up redis connections (should I?)
                await close_asyncpg_pool()
                await send({'type': 'lifespan.shutdown.complete'})
                return  # exit the lifespan loop after shutdown

application = ProtocolTypeRouter(
    {
        "http": django_asgi_app,
        "websocket": AllowedHostsOriginValidator(
            AuthMiddlewareStack(URLRouter(transcendence.routing.websocket_urlpatterns))
        ),
        "lifespan": lifespan_scope,
    }
)

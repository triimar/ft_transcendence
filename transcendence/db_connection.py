import asyncpg
from django.conf import settings

pool = None

async def init_db_pool():
    global pool
    pool = await asyncpg.create_pool(
        user=settings.DATABASES['default']['USER'],
        password=settings.DATABASES['default']['PASSWORD'],
        database=settings.DATABASES['default']['NAME'],
        host=settings.DATABASES['default']['HOST'],
        port=settings.DATABASES['default']['PORT']
    )

async def get_connection():
    if pool is None:
        await init_db_pool()
    return pool

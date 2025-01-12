import asyncpg
import logging
from django.conf import settings

connection = None

async def init_db_connection():
    global connection
    if connection is None:
        try:
            connection = await asyncpg.create_pool(
                user=settings.DATABASES['default']['USER'],
                password=settings.DATABASES['default']['PASSWORD'],
                database=settings.DATABASES['default']['NAME'],
                host=settings.DATABASES['default']['HOST'],
                port=settings.DATABASES['default']['PORT'],
                min_size=5,
                max_size=20
            )
            result = await connection.fetch('SELECT 1')
            print("Asyncpg connection successful:", result)
            return connection
        except Exception as e:
            logging.error(f"Failed to connect to database: {e}")

async def get_db_connection():
    global connection
    if connection is None:
        await init_db_connection()
    return connection

async def close_asyncpg_pool():
    global connection
    if connection is not None:
        await connection.close()
        connection = None
        print("Asyncpg connection pool closed.")

import logging
from .db_connection import get_db_connection

async def add_user(uuid, login, avatar, color):
    try:
        pool = await get_db_connection()
        async with (pool.acquire()) as conn:
            query = """
                INSERT INTO transcendence_users (uuid, login, avatar, color)
                VALUES ($1, $2, $3, $4)
            """
            await conn.execute(query, uuid, login, avatar, color)
    except Exception as e:
        logging.error(f"Failed to insert user {login}: {e}")

async def user_exists(login):
    try:
        pool = await get_db_connection()
        async with (pool.acquire()) as conn:
            query = "SELECT EXISTS(SELECT 1 FROM transcendence_users WHERE login = $1)"
            result = await conn.fetchval(query, login)
            print("User exists: ", result)
            return result
    except Exception as e:
        logging.error(f"Failed to check if user with login {login} exists: {e}")
        return False

async def get_uuid(login):
    try:
        pool = await get_db_connection()
        async with (pool.acquire()) as conn:
            query = "SELECT uuid FROM transcendence_users WHERE login=$1"
            result = await conn.fetchval(query, login)
            print("UUID: ", result)
            return result
    except Exception as e:
        logging.error(f"Failed to get uuid for user {login}: {e}")
        return None
    
async def avatar_exists(avatar):
    try:
        pool = await get_db_connection()
        async with (pool.acquire()) as conn:
            query = "SELECT EXISTS (SELECT 1 FROM transcendence_users WHERE avatar = $1);"
            result = await conn.fetchval(query, avatar)
            print("Avatar exists: ", result)
            return result
    except Exception as e:
        logging.error(f"Failed to check if avatar {avatar} exists: {e}")
        return False

async def color_exists(color):
    try:
        pool = await get_db_connection()
        async with (pool.acquire()) as conn:
            query = "SELECT EXISTS (SELECT 1 FROM transcendence_users WHERE color = $1);"
            result = await conn.fetchval(query, color)
            print("Color exists: ", result)
            return result
    except Exception as e:
        logging.error(f"Failed to check if color {color} exists: {e}")
        return False

async def update_color_and_avatar(uuid, color, avatar):
    try:
        pool = await get_db_connection()
        async with (pool.acquire()) as conn:
            query = "UPDATE transcendence_users SET color=$1, avatar=$2 WHERE uuid=$3"
            await conn.execute(query, color, avatar, uuid)
    except Exception as e:
        logging.error(f"Failed to update color and avatar for user {uuid}: {e}")

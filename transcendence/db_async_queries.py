from .db_connection import get_connection

async def add_user(uuid, login, avatar, color):
    async with (await get_connection()).acquire() as conn:
        query = """
            INSERT INTO users (uuid, login, avatar, color)
            VALUES ($1, $2, $3, $4)
        """
        await conn.execute(query, uuid, login, avatar, color)

async def user_exists(uuid):
    async with (await get_connection()).acquire() as conn:
        query = "SELECT EXISTS(SELECT 1 FROM users WHERE uuid=$1)"
        result = await conn.fetchval(query, uuid)
        return result

async def get_uuid(login):
    async with (await get_connection()).acquire() as conn:
        query = "SELECT uuid FROM users WHERE login=$1"
        result = await conn.fetchval(query, login)
        return result
    
async def avatar_exists(avatar):
    async with (await get_connection()).acquire() as conn:
        query = "SELECT EXISTS (SELECT 1 FROM users WHERE avatar = $1);"
        result = await conn.fetchval(query, avatar)
        return result

async def color_exists(color):
    async with (await get_connection()).acquire() as conn:
        query = "SELECT EXISTS (SELECT 1 FROM users WHERE color = $1);"
        result = await conn.fetchval(query, color)
        return result

async def update_color_and_avatar(uuid, color, avatar):
    async with (await get_connection()).acquire() as conn:
        query = "UPDATE users SET color=$1, avatar=$2 WHERE uuid=$3"
        await conn.execute(query, color, avatar, uuid)
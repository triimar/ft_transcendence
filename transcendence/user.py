import random
from .redis_client import get_redis_client
from .db_async_queries import add_user, avatar_exists, color_exists

async def save_user_cache(id, avatar, color, guest=False):
    pass

async def assign_random_background_color():
    while True:
        color = ''.join(map(str, [random.choice('0123456789ABCDEF') for i in range(6)]))
        if (await color_exists(color) == False):
            break
    return color

async def assign_random_avatar():
    while True:
        eye = ['\"', '*', 'V', 'A', 'Y', 'w', '0', 'e', 'T', '$', 'Q', 'M', 'X', '^', '=', 'z', 'L'] # 17 eyes
        mouth = ['o', '8', '@', 'D', 'c', 'p', 'w', 'x', 'u', 'v', 's', '_', ',', '.', '9', 'm', '+'] # 17 mouths
        random_eye = random.choice(eye)
        random_mouth = random.choice(mouth)
        avatar = random_eye + random_mouth + random_eye
        if (await avatar_exists(avatar) == False):
            break
    return avatar

async def create_new_user(uuid, login):
    avatar = await assign_random_avatar()
    color = await assign_random_background_color()
    # save_user_cache(uuid, avatar, color)
    add_user(uuid, login, avatar, color)


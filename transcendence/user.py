import random
import redis
from django.db import connection

def add_user_to_db(user_id, avatar, color):
    with connection.cursor() as cursor:
        cursor.execute("INSERT INTO users (login, avatar, color) VALUES (%s, %s, %s)", [user_id, avatar, color])

def save_user_cache(id, avatar, color, guest=False):
    pass

def assign_random_background_color():
    return ''.join(map(str, [random.choice('0123456789ABCDEF') for i in range(6)]))

def check_if_unique_avatar(avatar):
    with connection.cursor() as cursor:
        cursor.execute("SELECT EXISTS (SELECT 1 FROM users WHERE avatar = %s);", (avatar,))
        exists = cursor.fetchone()[0]
    return not exists

def assign_random_avatar():
    eye = ['\"', '*', 'V', 'A', 'Y', 'w', '0', 'e', 'T', '$', 'Q', 'M', 'X', '^', '=', 'z', 'L'] # 17 eyes
    mouth = ['o', '8', '@', 'D', 'c', 'p', 'w', 'x', 'u', 'v', 's', '_', ',', '.', '9', 'm', '+'] # 17 mouths
    random_eye = random.choice(eye)
    random_mouth = random.choice(mouth)
    avatar = random_eye + random_mouth + random_eye
    return avatar

def create_new_user(login):
    avatar = assign_random_avatar()
    color = assign_random_background_color()
    # save_user_cache(user_login, avatar, color)
    add_user_to_db(user_login, avatar, color)

def check_if_new_user(login):
    with connection.cursor() as cursor:
        cursor.execute("SELECT EXISTS (SELECT 1 FROM users WHERE login = %s);", (login,))
        exists = cursor.fetchone()[0]
    return not exists

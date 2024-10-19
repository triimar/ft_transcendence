import jwt
from django.conf import settings

def save_user_to_db(guest, avatar, color):
    pass

def save_user_cache(guest, avatar, color, guest=False):
    pass

def assign_random_background_color():
    pass

def assign_random_avatar():
    # eyes = ['\/', '*', '\"', '' ]
    # mouth = []
    pass

def create_new_user(login):
    pass
    # avatar = assign_random_avatar()
    # color = assign_random_background_color()
    # save_user_cache(user_login, avatar, color)
    # save_user_to_db(user_login, avatar, color)

def check_if_new_user(login):
    pass

def create_jwt(access_token_response, login):
    payload = {
        'login': login,
        'iat': access_token_response.json().get('created_at'),
        'exp': iat + access_token_response.json().get('expires_in'),
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
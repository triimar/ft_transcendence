import requests
import shortuuid
import jwt
import time
from random import random
from django.conf import settings
from django.shortcuts import redirect
from django.http import HttpResponseRedirect, JsonResponse
from .user import assign_random_avatar, assign_random_background_color, create_new_user
from .db_async_queries import user_exists_by_login, get_uuid
from .redis_data import add_one_player, get_one_player

async def avatar_information(request):
    jwt_token = request.COOKIES.get('jwt')
    try:
        payload = jwt.decode(jwt_token, settings.JWT_SECRET_KEY, algorithms=settings.JWT_ALGORITHM)
    except jwt.InvalidTokenError:
        return JsonResponse({'error': 'Invalid token'}, status=404)
    except jwt.ExpiredSignatureError:
        return JsonResponse({'error': 'Token has expired'}, status=404)
    player = await get_one_player(payload['id'])
    if player is not None:
        return JsonResponse(player)
    else:
        avatar = await assign_random_avatar()
        color = await assign_random_background_color()
        await add_one_player(payload['id'], avatar, color)
        return JsonResponse({'player_id': payload['id'], 'player_emoji': avatar, 'player_bg_color': color})

async def guest_login(request):
    guest_id = shortuuid.ShortUUID().random(length=22)

    now = int(time.time())

    payload = {
        'id': guest_id,
        'guest': True,
        'iat': now,
        'exp': now + 7200,
    }

    jwt_token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

    avatar = await assign_random_avatar()
    color = await assign_random_background_color()
    await add_one_player(guest_id, avatar, color)

    # return json response while setting jwt token as cookie
    response = JsonResponse(payload)
    response.set_cookie(
        key='jwt',
        value=jwt_token,
        httponly=False,  # make the cookie inaccessible to js
        secure=False,  # TODO: make it True in production to ensure the cookie is sent over HTTPS
        samesite='Lax'  # define when to allow the cookie to be sent
    )
    return response

# check if user is authenticated
def check_auth(request):
    jwt_token = request.COOKIES.get('jwt')
    try:
        payload = jwt.decode(jwt_token, settings.JWT_SECRET_KEY, algorithms=settings.JWT_ALGORITHM)
    except jwt.InvalidTokenError:
        return JsonResponse({'error': 'Invalid token'}, status=404)
    except jwt.ExpiredSignatureError:
        return JsonResponse({'error': 'Token has expired'}, status=404)
    return JsonResponse(payload)

# OAuth callback view
async def oauth_callback(request):
    code = request.GET.get('code')
    if not code:
        return JsonResponse({'error': 'No code provided from OAuth'}, status=400)

    # exchange authorization code for access token
    access_token_url = settings.OAUTH2_PROVIDER['ACCESS_TOKEN_URL']
    data = {
        'grant_type': 'authorization_code',
        'client_id': settings.OAUTH2_PROVIDER['CLIENT_ID'],
        'client_secret': settings.OAUTH2_PROVIDER['CLIENT_SECRET'],
        'code': code,
        'redirect_uri': settings.OAUTH2_PROVIDER['REDIRECT_URI'],
    }

    # post request to get the access token
    access_token_response = requests.post(access_token_url, data=data)

    if access_token_response.status_code != 200:
        return JsonResponse({'error': 'Failed to obtain access token from OAuth'}, status=400)

    access_token = access_token_response.json().get('access_token')

    # use the access token to fetch user data
    user_data_response = requests.get(
        settings.OAUTH2_PROVIDER['USER_DATA_URL'],
        headers = {'Authorization': f'Bearer {access_token}'}
    )

    if user_data_response.status_code != 200:
        return JsonResponse({'error': 'Failed to fetch user data from 42 API'}, status=400)

    user_login = user_data_response.json().get('login')

    if (await user_exists_by_login(user_login) == True):
        intra_user_uuid = await get_uuid(user_login)
    else:
        intra_user_uuid = shortuuid.ShortUUID().random(length=22)
        await create_new_user(intra_user_uuid, user_login)

    payload = {
        'id': intra_user_uuid,
        'guest': False,
        'iat': access_token_response.json().get('created_at'),
        'exp': int(time.time()) + access_token_response.json().get('expires_in'),
    }

    print(payload)

    jwt_token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

    # redirect to the main page with jwt token as cookie set
    response = HttpResponseRedirect('/')  # Redirect to the dashboard or desired URL
    response.set_cookie(
        key='jwt',
        value=jwt_token,
        httponly=False,  # make the cookie inaccessible to js
        secure=False, # TODO: make it True in production to ensure the cookie is sent over HTTPS
        samesite='Lax'  # define when to allow the cookie to be sent
    )
    return response

# redirect to 42 OAuth page
def oauth_redirect(request):
    authorization_url = (
        f'{settings.OAUTH2_PROVIDER["AUTHORIZATION_URL"]}?'
        f'client_id={settings.OAUTH2_PROVIDER["CLIENT_ID"]}'
        '&response_type=code'
        f'&redirect_uri={settings.OAUTH2_PROVIDER["REDIRECT_URI"]}'
        '&scope=public'
    )
    return redirect(authorization_url)

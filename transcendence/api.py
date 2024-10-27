import requests
import shortuuid
import jwt
import time
from django.conf import settings
from .user import assign_random_avatar, assign_random_background_color, check_if_new_user, create_new_user, save_user_cache
from django.shortcuts import redirect
from django.http import HttpResponseRedirect, JsonResponse

# TODO: borrow a new api

# TODO: user management
# check the database for the user
# if user does not exist, create a new user
# get the user id from the database

# TODO: assign a random avatar and background color to the user
# only for the new login
# update the redis cache and the database with the user data

# TODO: make the login button work

# TODO: make the logout button work
# delete the jwt token from the cookie

def logout(request):
    pass

def guest_login(request):
    guest_id = shortuuid.ShortUUID().random(length=22)
    now = int(time.time())
    
    payload = {
        'id': guest_id,
        'guest': True,
        'iat': now,
        'exp': now + 3600,
    }

    jwt_token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

    avatar = assign_random_avatar()
    color = assign_random_background_color()
    # save_user_cache(guest_id, avatar, color, guest=True)

    # redirect to the main page with jwt token as cookie set
    response = HttpResponseRedirect('/')  # Redirect to the dashboard or desired URL
    response.set_cookie(
        key='jwt', 
        value=jwt_token, 
        httponly=True,  # make the cookie inaccessible to js
        secure=True,  # ensure the cookie is sent over HTTPS
        samesite='Lax'  # define when to allow the cookie to be sent
    )
    return response

# check if user is authenticated
def check_auth(request):
    jwt_token = request.cookies.get('jwt')
    try:
        payload = jwt.decode(jwt_token, settings.JWT_SECRET_KEY, algorithms=settings.JWT_ALGORITHM)
    except jwt.invalidTokenError:
        return {'error': 'Invalid token'}
    except jwt.ExpiredSignatureError:
        return {'error': 'Token has expired'}
    return payload

# OAuth callback view
def oauth_callback(request):
    code = request.GET.get('code')
    if not code:
        return JsonResponse({'error': 'No code provided from OAuth'}, status=400)

    # exchange authorization code for access token
    access_token_url = "https://api.intra.42.fr/oauth/token"
    data = {
        'grant_type': 'authorization_code',
        'client_id': settings.OAUTH2_PROVIDER['CLIENT_ID'],
        'client_secret': settings.OAUTH2_PROVIDER['CLIENT_SECRET'],
        'code': code,
        'redirect_uri': 'http://localhost:8000/api/callback',
    }

    # post request to get the access token
    access_token_response = requests.post(access_token_url, data=data)
    
    if access_token_response.status_code != 200:
        return JsonResponse({'error': 'Failed to obtain access token from OAuth'}, status=400)

    # access_token = access_token_response.json().get('access_token')

    # use the access token to fetch user data
    # user_data_response = requests.get(
    #     'https://api.intra.42.fr/v2/me', 
    #     headers = {'Authorization': f'Bearer {access_token}'}
    # )

    # if user_data_response.status_code != 200:
    #     return JsonResponse({'error': 'Failed to fetch user data from 42 API'}, status=400)

    # user_login = user_data_response.json().get('login')

#    if check_if_new_user(user_login):
#        create_new_user(user_login)

    intra_user_uuid = shortuuid.ShortUUID().random(length=22)

    payload = {
        'id': intra_user_uuid,
        'guest': false,
        'iat': access_token_response.json().get('created_at'),
        'exp': access_token_response.json().get('created_at') + access_token_response.json().get('expires_in'),
    }

    jwt_token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

    # redirect to the main page with jwt token as cookie set
    response = HttpResponseRedirect('/')  # Redirect to the dashboard or desired URL
    response.set_cookie(
        key='jwt', 
        value=jwt_token, 
        httponly=True,  # make the cookie inaccessible to js
        secure=True,  # ensure the cookie is sent over HTTPS
        samesite='Lax'  # define when to allow the cookie to be sent
    )
    return response

# redirect to 42 OAuth page
def oauth_redirect(request):
    authorization_url = (
        'https://api.intra.42.fr/oauth/authorize?'
        f'client_id={settings.OAUTH2_PROVIDER["CLIENT_ID"]}'
        '&response_type=code'
        '&redirect_uri=http://localhost:8000/api/callback'
        '&scope=public'
    )
    return redirect(authorization_url)
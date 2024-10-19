import jwt
import requests
import shortuuid
from . import user
from django.conf import settings
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
    response = HttpResponseRedirect('/')
    response.delete_cookie('jwt')
    return response

def guest_login(request):
    guest_uuid = shortuuid.ShortUUID().random(length=6)
    avatar = user.assign_random_avatar()
    color = user.assign_random_background_color()
    # save_user_cache(guest_id, avatar, color, guest=True)
    return JsonResponse({'guest_login': guest_id})

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
        'redirect_uri': 'http://localhost:8000/callback',
    }

    # post request to get the access token
    access_token_response = requests.post(access_token_url, data=data)
    
    if access_token_response.status_code != 200:
        return JsonResponse({'error': 'Failed to obtain access token from OAuth'}, status=400)

    access_token = access_token_response.json().get('access_token')

    # use the access token to fetch user data
    user_data_response = requests.get(
        'https://api.intra.42.fr/v2/me', 
        headers = {'Authorization': f'Bearer {access_token}'}
    )

    if user_data_response.status_code != 200:
        return JsonResponse({'error': 'Failed to fetch user data from 42 API'}, status=400)

    user_login = user_data_response.json().get('login')

#    if check_if_new_user(user_login):
#        create_new_user(user_login)

    jwt_token = user.create_jwt(access_token_response.json(), user_login)

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
        "https://api.intra.42.fr/oauth/authorize?client_id=u-s4t2ud-2c74cb6c9f554597b5c7d047ce0c48014e0b52ad290228c6d520a09f588d1602&redirect_uri=http%3A%2F%2Flocalhost%3A8000%2Fcallback&response_type=code"
        # 'https://api.intra.42.fr/oauth/authorize?'
        # f'client_id={settings.OAUTH2_PROVIDER["CLIENT_ID"]}'
        # '&response_type=code'
        # '&redirect_uri=http://localhost:8000/api/auth_request'
        # '&scope=public'
    )
    return redirect(authorization_url)
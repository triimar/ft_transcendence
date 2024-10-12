import requests
import jwt
from django.utils import timezone
from django.shortcuts import render, redirect
from django.conf import settings
from django.http import HttpResponseRedirect, JsonResponse

# Create your views here.
def transcendence(request):
    return render(request, 'index.html')

def chat_lobby(request):
	return render(request, 'chat_lobby.html')

def room(request, room_name):
    return render(request, 'room.html', {'room_name': room_name})

# check if user is authenticated
def check_auth(jwt_token):
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
        'redirect_uri': 'http://localhost:8000/api/auth_request',
    }

    # get current UNIX timestamp
    iat = timezone.now()

    # post request to get the access token
    access_token_response = requests.post(access_token_url, data=data)
    
    if access_token_response.status_code != 200:
        return JsonResponse({'error': 'Failed to obtain access token from OAuth'}, status=400)

    # take a closer look at the access_token_response
    access_token = access_token_response.json().get('access_token')
    exp = iat + access_token_response.json().get('expires_in')

    # use the access token to fetch user data
    user_data_response = requests.get(
        'https://api.intra.42.fr/v2/me', 
        headers = {'Authorization': f'Bearer {access_token}'}
    )

    if user_data_response.status_code != 200:
        return JsonResponse({'error': 'Failed to fetch user data from 42 API'}, status=400)

    user_login = user_data_response.json().get('login')
    
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

    # create a jwt token
    payload = {
        'login': user_login,
        'iat': iat,
        'exp': exp,
    }
    jwt_token = jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)

    # redirect to the main page with jwt token as cookie set
    response = HttpResponseRedirect('transcendence')  # Redirect to the dashboard or desired URL
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
        '&redirect_uri=http://localhost:8000/api/auth_request'
        '&scope=public'
    )
    return redirect(authorization_url)
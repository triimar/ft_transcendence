import requests
from django.shortcuts import render, redirect
from django.conf import settings
from django.http import HttpResponse, JsonResponse

# Create your views here.
def transcendence(request):
    return render(request, 'index.html')

def chat_lobby(request):
	return render(request, 'chat_lobby.html')

def room(request, room_name):
    return render(request, 'room.html', {'room_name': room_name})

# check if user is authenticated
def check_auth(request):
    return JsonResponse({'authenticated': True})

# OAuth callback view
def oauth_callback(request):
    code = request.GET.get('code')
    if not code:
        return JsonResponse({'error': 'No code provided from OAuth'}, status=400)

    # exchange authorization code for access token
    token_url = "https://api.intra.42.fr/oauth/token"
    data = {
        'grant_type': 'authorization_code',
        'client_id': settings.OAUTH2_PROVIDER['CLIENT_ID'],
        'client_secret': settings.OAUTH2_PROVIDER['CLIENT_SECRET'],
        'code': code,
        'redirect_uri': 'http://localhost:8000/api/auth_request',
    }

    # post request to get the access token
    token_response = requests.post(token_url, data=data)
    
    if token_response.status_code != 200:
        return JsonResponse({'error': 'Failed to obtain access token from OAuth'}, status=400)

    access_token = token_response.json().get('access_token')

    # use the access token to fetch user data
    user_data_response = requests.get(
        'https://api.intra.42.fr/v2/me', 
        headers = {'Authorization': f'Bearer {access_token}'}
    )

    if user_data_response.status_code != 200:
        return JsonResponse({'error': 'Failed to fetch user data from 42 API'}, status=400)

    user_data = user_data_response.json()
    print(user_data) # save user data to database

    return redirect('transcendence')

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
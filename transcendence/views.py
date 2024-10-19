from .api import *
from django.shortcuts import render

# Create your views here.
def transcendence(request):
    return render(request, 'index.html')

def chat_lobby(request):
	return render(request, 'chat_lobby.html')

def room(request, room_name):
    return render(request, 'room.html', {'room_name': room_name})

from django.shortcuts import render

# Create your views here.
from django.http import HttpResponse

def transcendence(request):
    return render(request, 'index.html')

def chat_lobby(request):
	return render(request, 'lobby_establish_ws.html')

# def room(request, room_name):
#     return render(request, 'room.html', {'room_name': room_name})

from django.shortcuts import render

# Create your views here.
from django.http import HttpResponse

# def hello_world(request):
#     return HttpResponse("Hello, world!")

def hello_world(request):
	return render(request, 'game.html')

def transcendence(request):
    return render(request, 'index.html')

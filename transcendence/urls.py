from django.urls import path
from . import views

urlpatterns = [
    path('', views.transcendence, name='transcendence'),
    path('hello_world', views.hello_world, name='hello_world'),
    path('chat/', views.chat_lobby, name='chat_lobby'),
    path('chat/<str:room_name>/', views.room, name='room'),
]

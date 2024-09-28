from django.urls import path, include
from django.contrib import admin
from oauth2_provider import urls as oauth2_urls
from . import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.transcendence, name='transcendence'),
    path('chat/', views.chat_lobby, name='chat_lobby'),
    path('chat/<str:room_name>/', views.room, name='room'),
    path('trigger_auth/', views.oauth_redirect, name='oauth_redirect'),
    path('authentification/', views.oauth_callback, name='oauth_callback'),
]

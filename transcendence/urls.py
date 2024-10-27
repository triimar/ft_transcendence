from django.urls import path, include
from django.contrib import admin
from . import views
from .api import guest_login, oauth_redirect, oauth_callback, check_auth, logout

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.transcendence, name='transcendence'),
    path('chat/', views.chat_lobby, name='chat_lobby'),
    path('chat/<str:room_name>/', views.room, name='room'),
    path('api/trigger_auth/', oauth_redirect, name='oauth_redirect'),
    path('api/callback/', oauth_callback, name='oauth_callback'),
    path('api/check_auth/', check_auth, name='check_auth'),
    path('api/guest_login/', guest_login, name='guest_login'),
    path('api/logout/', logout, name='logout'),
]

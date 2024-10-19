from django.urls import path, include
from django.contrib import admin
from . import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.transcendence, name='transcendence'),
    path('chat/', views.chat_lobby, name='chat_lobby'),
    path('chat/<str:room_name>/', views.room, name='room'),
    path('api/trigger_auth/', views.oauth_redirect, name='oauth_redirect'),
    path('api/auth_request/', views.oauth_callback, name='oauth_callback'),
    path('api/check_auth/', views.check_auth, name='check_auth'),
    path('api/guest_login/', views.guest_login, name='guest_login'),
    path('api/logout/', views.logout, name='logout'),
]

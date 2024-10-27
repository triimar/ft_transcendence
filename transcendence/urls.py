from django.urls import path, include
from django.contrib import admin
from . import views
from . import api

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.transcendence, name='transcendence'),
    path('chat/', views.chat_lobby, name='chat_lobby'),
    path('chat/<str:room_name>/', views.room, name='room'),
    path('api/trigger_auth/', api.oauth_redirect, name='oauth_redirect'),
    path('api/callback/', api.oauth_callback, name='oauth_callback'),
    # path('api/auth_request/', views.oauth_callback, name='oauth_callback'),
    path('api/check_auth/', api.check_auth, name='check_auth'),
    path('api/guest_login/', api.guest_login, name='guest_login'),
    path('api/logout/', api.logout, name='logout'),
]

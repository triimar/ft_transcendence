from django.urls import path, include
from django.contrib import admin
from . import views
from .api import guest_login, oauth_redirect, oauth_callback, check_auth, avatar_information, logout

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', views.transcendence, name='transcendence'),
    path('api/trigger_auth/', oauth_redirect, name='oauth_redirect'),
    path('api/callback/', oauth_callback, name='oauth_callback'),
    path('api/check_auth/', check_auth, name='check_auth'),
    path('api/guest_login/', guest_login, name='guest_login'),
    path('api/myself/', avatar_information, name='avatar_information'),
    path('api/logout/', logout, name='logout'),
]

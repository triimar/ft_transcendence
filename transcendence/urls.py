from django.urls import path
from . import views

urlpatterns = [
    path('', views.transcendence, name='transcendence'),
    path('hello_world', views.hello_world, name='hello_world')
]

from django.urls import path
from django.contrib import admin
from . import views

urlpatterns = [
	  path('admin/', admin.site.urls)
    path('', views.transcendence, name='transcendence'),
    path('hello_world', views.hello_world, name='hello_world')
]

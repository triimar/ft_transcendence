from django.urls import path
from django.contrib import admin
from . import views

urlpatterns = [
    path('', views.hello_world, name='hello_world'),
	path('admin/', admin.site.urls)
]

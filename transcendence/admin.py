from django.contrib import admin

# Register your models here.
from .tests import models

admin.site.register(models.Users)

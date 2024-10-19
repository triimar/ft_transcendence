from django.contrib import admin
from transcendence.game.models import Player, Ball, Paddle, Game

# Register your models here.
from . import models

# admin.site.register(models.Player)

admin.site.register(Player)
admin.site.register(Ball)
admin.site.register(Paddle)
admin.site.register(Game)

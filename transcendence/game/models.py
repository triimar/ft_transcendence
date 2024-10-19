from django.db import models

class Player(models.Model):
	username = models.CharField(max_length=3)
	score = models.IntegerField(default=0)

	def __str__(self):
		return self.username

class Game(models.Model):
	player1 = models.ForeignKey(Player, related_name="player1", on_delete=models.CASCADE)
	player2 = models.ForeignKey(Player, related_name="player2", on_delete=models.CASCADE)


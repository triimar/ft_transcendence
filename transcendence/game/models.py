from django.db import models

CANVAS_HEIGHT = 600
CANVAS_WIDTH = 1200
BALL_SPEED = 5
BALL_SIZE = 15
PADDLE_SPEED = 15
PADDLE_SIZE = CANVAS_WIDTH/10

class Player(models.Model):
	username = models.CharField(max_length=3)
	score = models.IntegerField(default=0)
	color = models.CharField(max_length=6)

	def __str__(self):
		return self.username

class Ball(models.Model):
	x = models.FloatField(default=CANVAS_WIDTH/2)
	y = models.FloatField(default=CANVAS_HEIGHT/2)
	vy = models.FloatField(default=BALL_SPEED)
	vx = models.FloatField(default=BALL_SPEED)
	size = models.IntegerField(default=BALL_SIZE)

class Paddle(models.Model):
	x = models.FloatField(default=0)
	y = models.FloatField(default=CANVAS_HEIGHT/2)
	v = models.FloatField(default=PADDLE_SPEED)
	size = models.IntegerField(default=PADDLE_SIZE)

class Game(models.Model):
	player1 = models.ForeignKey(Player, related_name="player1", on_delete=models.CASCADE)
	player2 = models.ForeignKey(Player, related_name="player2", on_delete=models.CASCADE)
	ball = models.ForeignKey(Ball, related_name="ball", on_delete=models.CASCADE)
	paddleLeft = models.ForeignKey(Paddle, related_name="paddleLeft", on_delete=models.CASCADE)
	paddleRight = models.ForeignKey(Paddle, related_name="paddleRight", on_delete=models.CASCADE)

	def __str__(self):
		return f"Game between {self.player1} and {self.player2}"

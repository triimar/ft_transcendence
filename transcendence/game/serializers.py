from rest_framework import serializers
from .models import Player, Ball, Paddle, Game

class PlayerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Player
        fields = ['id', 'username', 'score', 'color']

class BallSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ball
        fields = ['id', 'x', 'y', 'vx', 'vy', 'size']

class PaddleSerializer(serializers.ModelSerializer):
    class Meta:
        model = Paddle
        fields = ['id', 'x', 'y', 'v', 'size']

class GameSerializer(serializers.ModelSerializer):
    player1 = PlayerSerializer()
    player2 = PlayerSerializer()
    ball = BallSerializer()
    paddleLeft = PaddleSerializer()
    paddleRight = PaddleSerializer()

    class Meta:
        model = Game
        fields = ['id', 'player1', 'player2', 'ball', 'paddleLeft', 'paddleRight']

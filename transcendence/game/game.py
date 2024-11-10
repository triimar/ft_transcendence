class PongGame:
    def __init__(self):
        self.ball_position = [400, 300]
        self.ball_velocity = [2, 2]
        self.paddle1_position = 300
        self.paddle2_position = 300
        self.paddle_speed = 5
        self.score1 = 0
        self.score2 = 0

    def update(self):
        # Update ball position
        self.ball_position[0] += self.ball_velocity[0]
        self.ball_position[1] += self.ball_velocity[1]

        # Check for collision with top or bottom
        if self.ball_position[1] <= 0 or self.ball_position[1] >= 600:
            self.ball_velocity[1] = -self.ball_velocity[1]

        # Check for collision with paddles
        if self.ball_position[0] <= 20:
            if self.paddle1_position <= self.ball_position[1] <= self.paddle1_position + 100:
                self.ball_velocity[0] = -self.ball_velocity[0]
            else:
                self.score2 += 1
                self.reset_ball()

        if self.ball_position[0] >= 780:
            if self.paddle2_position <= self.ball_position[1] <= self.paddle2_position + 100:
                self.ball_velocity[0] = -self.ball_velocity[0]
            else:
                self.score1 += 1
                self.reset_ball()

    def reset_ball(self):
        self.ball_position = [400, 300]
        self.ball_velocity = [2, 2]

    def move_paddle(self, paddle, direction):
        if paddle == 1:
            if direction == 'up' and self.paddle1_position > 0:
                self.paddle1_position -= self.paddle_speed
            elif direction == 'down' and self.paddle1_position < 500:
                self.paddle1_position += self.paddle_speed
        elif paddle == 2:
            if direction == 'up' and self.paddle2_position > 0:
                self.paddle2_position -= self.paddle_speed
            elif direction == 'down' and self.paddle2_position < 500:
                self.paddle2_position += self.paddle_speed

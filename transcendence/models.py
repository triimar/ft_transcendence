from django.db import models
from django.core.validators import RegexValidator
class Users(models.Model):
    id = models.AutoField(primary_key=True)  # Automatically creates the SERIAL column
    uuid = models.CharField(max_length=22, unique=True)
    login = models.CharField(max_length=10, unique=True)
    avatar = models.CharField(
        max_length=3,
        validators=[RegexValidator(regex=r'^.{3}$', message="Invalid avatar.")]
    )
    color = models.CharField(
        max_length=6,
        validators=[RegexValidator(regex=r'^[A-F0-9]{6}$', message="Invalid color format.")]
    )

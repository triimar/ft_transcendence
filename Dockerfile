FROM python:3.11-slim

RUN apt-get update \
	&& apt-get install -y --no-install-recommends \
		postgresql-client \
        redis-tools \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt /app/

RUN pip install --no-cache-dir -r requirements.txt

ENV DJANGO_SETTINGS_MODULE=myproject.settings \
    PYTHONUNBUFFERED=1

EXPOSE 8000

CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
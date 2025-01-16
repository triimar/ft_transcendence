FROM python:3.11-slim

RUN apt-get update \
	&& apt-get install -y --no-install-recommends \
		postgresql-client \
        redis-tools \
		libgdbm-dev \
		ca-certificates \
		libssl-dev \
	&& rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY settings.py \
	 manage.py \
	 asgi.py ./
COPY transcendence ./transcendence

ENV PYTHONUNBUFFERED=1

EXPOSE 8000

CMD python manage.py migrate && python manage.py runserver 0.0.0.0:8000
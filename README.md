# ft_transcendence

![Our ft_transcendence](./ft_transcendence.png)

## Key Features:
- **Local & Remote Play**: Play solo or team up with friends, whether locally or remotely
- **Tournament Mode**: Compete in exciting tournaments
- **AI Opponents**: Challenge intelligent AI opponents
- **Classic & Balance Modes**: Choose between classic and balance mode for a customizable experience

## User-Friendly Features:
- **Voice Over Support**: Navigate the game effortlessly with voice-over assistance
- **Multi-Language Support**: Play in your preferred language with built-in language options
- **Cross-Device & Multi-Browser Compatibility**: Seamlessly play across different devices and browsers for a consistent experience

# Setup

1. Clone the repository

## With docker
2. Run init.sh
   ```
	./init.sh
   ```
3. Open your browser and navigate to https://localhost

4. Your Pong awaits (Only playable as guests)


## If you are a 42 member and want to play with intra login

Have your own 42 API with the redirect URI set to https://[localhost or current domain]/api/request and change the followings in the .env with the corresponding UID and SECRET
```
OAUTH_CLIENT_ID=''
OAUTH_CLIENT_SECRET=''
```

## If you want to enjoy remote play
Change the DOMAIN in the .env to the IP address of a shared network and let users connect to it. If you use 42 API, the redirect URI of the API should change accordingly to https://[new_domain]/api/request. Hover over the sprocket-wheel icon and click 'Edit' to add a new redirect URI on the 42 API setting page.

## When virtual environment is used (defunct)
2. Create and activate a virtual environment:
   ```
	python3 -m venv myenv
	source myenv/bin/activate
   ```
3. Install dependencies:
   ```
	pip install -r requirements.txt
   ```
4. Run migrations:
   ```
	python manage.py migrate
   ```
5. Start the development server:
   ```
	python manage.py runserver
   ```
6. Open your browser and navigate to http://127.0.0.1:8000/
7. Quit the server CONTROL-C
8. Deactivate the virtual environment
    ```
	deactivate
    ```

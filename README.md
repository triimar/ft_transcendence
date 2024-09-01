## Setup

1. Clone the repository

## With docker
2. Run init.sh
   ```
	./init.sh
   ```
3. Open your browser and navigate to http://127.0.0.1:8000/
   
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

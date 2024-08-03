## Setup

Project notion page :
https://www.notion.so/anthonytsang/Transandence-675ea23a0317475b811968d092041775?pvs=4

1. Clone the repository:
2. Create and activate a virtual environment:
   ```
	python3 -m venv myenv
	source myenv/bin/activate
   ```
4. Install dependencies:
   ```
	pip install -r requirements.txt
   ```
6. Run migrations:
   ```
	python manage.py migrate
   ```
8. Start the development server:
   ```
	python manage.py runserver
   ```
10. Open your browser and navigate to http://127.0.0.1:8000/
11. Quit the server CONTROL-C
12. Deactivate the virtual environment
    ```
	deactivate
    ```

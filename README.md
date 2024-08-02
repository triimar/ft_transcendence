## Setup

1. Clone the repository:
2. Create and activate a virtual environment:
	python3 -m venv myenv
	source myenv/bin/activate
3. Install dependencies:
	pip install -r requirements.txt
4. Run migrations:
	python manage.py migrate
5. Start the development server:
	python manage.py runserver
6. Open your browser and navigate to http://127.0.0.1:8000/
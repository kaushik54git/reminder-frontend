from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask import Flask, request, jsonify, send_from_directory
from flask_sqlalchemy import SQLAlchemy
from flask_login import LoginManager, UserMixin, login_user, login_required, logout_user, current_user
from flask_cors import CORS
from werkzeug.security import generate_password_hash, check_password_hash
import os
from datetime import datetime, timezone, timedelta # Added timedelta
from dotenv import load_dotenv
from sqlalchemy import text
import logging
from groq import Groq # Import Groq
import pytz # Import pytz
from flask_socketio import SocketIO, emit # Import SocketIO and emit
from apscheduler.schedulers.background import BackgroundScheduler # Import BackgroundScheduler

# Disable SQLAlchemy logging output
#logging.getLogger('sqlalchemy.engine').setLevel(logging.WARNING)

load_dotenv()

app = Flask(__name__, static_folder="../dist", static_url_path="/", instance_relative_config=True) # Added instance_relative_config
CORS(app,
     supports_credentials=True,
     origins=["http://127.0.0.1:5000", "http://localhost:5000", "http://localhost:5173", "http://127.0.0.1:5173"],
     methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
     allow_headers=["Content-Type", "Authorization"],
     expose_headers=["Content-Type", "Authorization"])

# Initialize Groq client
groq_client = Groq(api_key="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")

# Function to determine reminder time using Groq AI
def reminder_call(task_description):
    """
    Determines a suitable reminder time in minutes based on the task description using Groq AI.
    """
    if not task_description:
        return None # No description, no reminder

    try:
        chat_completion = groq_client.chat.completions.create(
            messages=[
                {
                    "role": "system",
                    "content": "You are an AI assistant that determines a suitable reminder time in minutes for a task based on its description. Respond only with a single integer representing the number of minutes before the task is due or needs attention. If the task description does not suggest a specific time, provide a reasonable default like 30 minutes. Do not include any other text or explanation."
                },
                {
                    "role": "user",
                    "content": f"Task description: {task_description}"
                }
            ],
            model="llama3-8b-8192", # Using a suitable model
            temperature=0.5, # Adjust temperature as needed
            max_tokens=10 # We only expect a small number
        )
        
        # Extract the integer from the response
        response_text = chat_completion.choices[0].message.content.strip()
        print(f" \n Groq response: {response_text}") # Debugging output
        try:
            reminder_minutes = int(response_text)
            return 1 #reminder_minutes
        except ValueError:
            print(f"Warning: Groq response was not an integer: {response_text}. Returning default reminder.")
            return 30 # Default if AI response is not an integer

    except Exception as e:
        print(f"Error calling Groq API: {str(e)}")
        return 30 # Default reminder in case of API error


# Ensure instance folder exists
try:
    os.makedirs(app.instance_path)
except OSError:
    pass

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'your-secret-key')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///calendar.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ECHO'] = True  # Enable SQL logging for debugging

db = SQLAlchemy(app)
login_manager = LoginManager()
login_manager.init_app(app)
socketio = SocketIO(app, cors_allowed_origins="*", manage_session=False) # Initialize SocketIO
scheduler = BackgroundScheduler(timezone=pytz.utc) # Initialize APScheduler with UTC timezone

# Function to check for reminders
def check_reminders():
    with app.app_context():
        now = datetime.now(pytz.utc)
        # Check for event reminders
        # Fetch all future events
        upcoming_events = Event.query.filter(
            Event.start_time > now
        ).all()
        for event in upcoming_events:
            # Ensure event start_time is timezone-aware (UTC) before calculation
            start_time_utc = event.start_time.replace(tzinfo=pytz.utc) if event.start_time.tzinfo is None else event.start_time.astimezone(pytz.utc)
            # Calculate reminder time for each event
            reminder_time = start_time_utc - timedelta(minutes=event.reminder)
            if reminder_time <= now:
                notification_data = {
                    'type': 'event',
                    'title': event.title,
                    'description': event.description,
                    'start_time': event.start_time.isoformat(),
                    'location': 'N/A', # Assuming location is not in the current model
                    'note': event.description # Using description as additional note for now
                }
                print(f"Emitting event reminder: {notification_data}") # Debugging
                socketio.emit('notification', notification_data, room=f'user_{event.user_id}') # Emit to specific user

        # Check for task reminders
        # Fetch all future and incomplete tasks
        upcoming_tasks = Task.query.filter(
            Task.due_date > now,
            Task.is_completed == False
        ).all()
        for task in upcoming_tasks:
            # Calculate reminder time for each task
            if task.reminder is not None and task.due_date is not None: # Only check if reminder and due_date are set
                # Ensure task due_date is timezone-aware (UTC) before calculation
                due_date_utc = task.due_date.replace(tzinfo=pytz.utc) if task.due_date.tzinfo is None else task.due_date.astimezone(pytz.utc)
                reminder_time = due_date_utc - timedelta(minutes=task.reminder)
                if reminder_time <= now:
                     notification_data = {
                        'type': 'task',
                        'title': task.title,
                        'description': task.description,
                        'due_date': task.due_date.isoformat(),
                        'note': task.description # Using description as additional note for now
                    }
                     print(f"Emitting task reminder: {notification_data}") # Debugging
                     socketio.emit('notification', notification_data, room=f'user_{task.user_id}') # Emit to specific user


# Add the reminder checking job to the scheduler
scheduler.add_job(func=check_reminders, trigger="interval", seconds=60) # Check every 60 seconds

# Serve the frontend
@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    if path != "" and os.path.exists(app.static_folder + "/" + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, "index.html")

# User Model
class User(UserMixin, db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128))
    name = db.Column(db.String(100))

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    events = db.relationship('Event', backref='author', lazy='dynamic') # Relationship to events
    tasks = db.relationship('Task', backref='owner', lazy='dynamic') # Relationship to tasks

# Event Model
class Event(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    start_time = db.Column(db.DateTime, nullable=False)
    end_time = db.Column(db.DateTime, nullable=False)
    description = db.Column(db.Text, nullable=True)
    color = db.Column(db.String(20), nullable=True, default='blue')
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    # --- Add reminder column ---
    reminder = db.Column(db.Integer, nullable=False, default=20) # Reminder time in minutes

    def to_dict(self):
        # The stored time is UTC but naive; attach UTC timezone info before formatting
        start_aware = self.start_time.replace(tzinfo=pytz.utc)
        end_aware = self.end_time.replace(tzinfo=pytz.utc)
        return {
            'id': self.id,
            'title': self.title,
            # Format as ISO string with 'Z' for UTC
            'start_time': start_aware.isoformat(timespec='milliseconds').replace('+00:00', 'Z'),
            'end_time': end_aware.isoformat(timespec='milliseconds').replace('+00:00', 'Z'),
            'description': self.description,
            'color': self.color,
            'user_id': self.user_id,
            # --- Include reminder ---
            'reminder': self.reminder
        }

# Task Model
class Task(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(100), nullable=False)
    due_date = db.Column(db.DateTime, nullable=True) # Tasks might not have a due date
    description = db.Column(db.Text, nullable=True)
    is_completed = db.Column(db.Boolean, default=False, nullable=False)
    color = db.Column(db.String(20), nullable=True, default='green')
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    reminder = db.Column(db.Integer, nullable=True) # Reminder time in minutes

    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'due_date': self.due_date.isoformat() if self.due_date else None,
            'description': self.description,
            'is_completed': self.is_completed,
            'color': self.color,
            'user_id': self.user_id
        }

@login_manager.user_loader
def load_user(user_id):
    return db.session.get(User, int(user_id))

# Root route
@app.route('/')
def index():
    return jsonify({
        'status': 'success',
        'message': 'AI Calendar API is running',
        'version': '1.0.0'
    })

# Helper function to parse ISO string and ensure it's UTC
def parse_iso_to_utc(dt_str):
    try:
        # Python 3.7+ handles 'Z' directly
        dt = datetime.fromisoformat(dt_str.replace('Z', '+00:00'))
        # If parsing resulted in naive datetime, assume it's UTC
        if dt.tzinfo is None:
            return dt.replace(tzinfo=pytz.utc)
        # Otherwise, convert to UTC
        return dt.astimezone(pytz.utc)
    except ValueError as e:
        raise ValueError(f"Invalid date format: {dt_str}. Use ISO format. Error: {e}")

# Routes
@app.route('/api/register', methods=['POST'])
def register():
    try:
        if not request.is_json:
            return jsonify({'error': 'Request must be JSON'}), 400
            
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'password', 'name']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
                
        # Validate email format
        if '@' not in data['email']:
            return jsonify({'error': 'Invalid email format'}), 400
            
        # Check if email already exists
        if User.query.filter_by(email=data['email']).first():
            return jsonify({'error': 'Email already registered'}), 400
        
        # Create new user
        user = User(email=data['email'], name=data['name'])
        user.set_password(data['password'])
        
        try:
            db.session.add(user)
            db.session.commit()
            return jsonify({
                'message': 'User registered successfully',
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'name': user.name
                }
            }), 201
        except Exception as e:
            db.session.rollback()
            print(f"Database error during registration: {str(e)}")
            return jsonify({'error': 'Failed to register user'}), 500
            
    except Exception as e:
        print(f"Error during registration: {str(e)}")
        return jsonify({'error': 'An unexpected error occurred'}), 500

@app.route('/api/login', methods=['POST'])
def login():
    try:
        if not request.is_json:
            return jsonify({'error': 'Request must be JSON'}), 400
            
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['email', 'password']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        user = User.query.filter_by(email=data['email']).first()
        
        if user and user.check_password(data['password']):
            login_user(user)
            return jsonify({
                'message': 'Logged in successfully',
                'user': {
                    'id': user.id,
                    'email': user.email,
                    'name': user.name
                }
            })
        
        return jsonify({'error': 'Invalid email or password'}), 401
        
    except Exception as e:
        print(f"Error during login: {str(e)}")
        return jsonify({'error': 'An unexpected error occurred'}), 500

@app.route('/api/logout', methods=['POST'])
@login_required
def logout():
    logout_user()
    return jsonify({'message': 'Logged out successfully'})

@app.route('/api/user', methods=['GET'])
@login_required
def get_user():
    return jsonify({
        'id': current_user.id,
        'email': current_user.email,
        'name': current_user.name
    })

# Event Routes
@app.route('/api/events', methods=['POST'])
@login_required
def create_event():
    try:
        if not request.is_json:
            return jsonify({'error': 'Request must be JSON'}), 400
            
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'start_time', 'end_time']
        for field in required_fields:
            if field not in data:
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        try:
            start_time = parse_iso_to_utc(data['start_time']) # Use shared helper
            end_time = parse_iso_to_utc(data['end_time'])
        except ValueError as e:
            return jsonify({'error': str(e)}), 400

        # --- Get reminder, default to 20 ---
        reminder_value = data.get('reminder')
        try:
            # Ensure reminder is an integer if provided
            reminder = int(reminder_call(data.get('description'))) #int(reminder_value) if reminder_value is not None else 20
            reminder_call(data.get('description'))
        except (ValueError, TypeError):
            # Handle cases where reminder is provided but not a valid number
             return jsonify({'error': 'Invalid value for reminder. Must be an integer.'}), 400


        new_event = Event(
            title=data['title'],
            start_time=start_time,
            end_time=end_time,
            description=data.get('description'),
            color=data.get('color', 'blue'),
            user_id=current_user.id,
            # --- Set reminder ---
            reminder=reminder
        )
        try:
            # Add the event to the session
            db.session.add(new_event)
            # Flush to get the ID
            db.session.flush()
            # Commit the transaction
            db.session.commit()
            return jsonify(new_event.to_dict()), 201
            
        except Exception as e:
            print(f"Database error: {str(e)}")
            db.session.rollback()
            return jsonify({'error': 'Failed to create event', 'details': str(e)}), 500
            
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return jsonify({'error': 'An unexpected error occurred'}), 500

@app.route('/api/events', methods=['GET'])
@login_required
def get_events():
    try:
        user_events = db.session.query(Event).filter_by(user_id=current_user.id).all()
        
            
        return jsonify([event.to_dict() for event in user_events])
        
    except Exception as e:
        print(f"Error fetching events: {str(e)}")
        return jsonify({'error': 'Failed to fetch events'}), 500

@app.route('/api/events/<int:event_id>', methods=['GET'])
@login_required
def get_event(event_id):
    event = Event.query.get_or_404(event_id)
    if event.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    return jsonify(event.to_dict())

@app.route('/api/events/<int:event_id>', methods=['PUT'])
@login_required
def update_event(event_id):
    event = Event.query.get_or_404(event_id)
    if event.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json()
    
    try:
        if 'start_time' in data:
            event.start_time = parse_iso_to_utc(data['start_time']) # Use shared helper
        if 'end_time' in data:
            event.end_time = parse_iso_to_utc(data['end_time']) # Use shared helper
    except ValueError as e:
        return jsonify({'error': str(e)}), 400

    event.title = data.get('title', event.title)
    event.description = data.get('description', event.description)
    event.color = data.get('color', event.color)
    # --- Update reminder if provided ---
    if 'reminder' in data:
        reminder_value = data.get('reminder')
        try:
            # Ensure reminder is an integer if provided
            event.reminder = int(reminder_value) if reminder_value is not None else event.reminder # Keep old value if null/invalid provided
        except (ValueError, TypeError):
             # Optionally return an error, or just ignore invalid update value
             return jsonify({'error': 'Invalid value for reminder update. Must be an integer.'}), 400


    db.session.commit()
    return jsonify(event.to_dict())

@app.route('/api/events/<int:event_id>', methods=['DELETE'])
@login_required
def delete_event(event_id):
    event = Event.query.get_or_404(event_id)
    if event.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
        
    db.session.delete(event)
    db.session.commit()
    return jsonify({'message': 'Event deleted successfully'})

# Task Routes
@app.route('/api/tasks', methods=['POST'])
@login_required
def create_task():
    data = request.get_json()
    
    due_date = None
    if data.get('due_date'):
        try:
            due_date = datetime.fromisoformat(data['due_date'])
        except ValueError:
            return jsonify({'error': 'Invalid date format for due_date. Use ISO format.'}), 400

    task_description = data.get('description')
    reminder_minutes = reminder_call(task_description) # Get reminder time from Groq

    new_task = Task(
        title=data['title'],
        due_date=due_date,
        description=task_description,
        is_completed=data.get('is_completed', False),
        color=data.get('color', 'green'),
        user_id=current_user.id,
        reminder=reminder_minutes # Add the reminder time
    )
    
    db.session.add(new_task)
    db.session.commit()
    
    return jsonify(new_task.to_dict()), 201

@app.route('/api/tasks', methods=['GET'])
@login_required
def get_tasks():
    user_tasks = Task.query.filter_by(user_id=current_user.id).all()
    return jsonify([task.to_dict() for task in user_tasks])

@app.route('/api/tasks/<int:task_id>', methods=['GET'])
@login_required
def get_task(task_id):
    task = Task.query.get_or_404(task_id)
    if task.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
    return jsonify(task.to_dict())

@app.route('/api/tasks/<int:task_id>', methods=['PUT'])
@login_required
def update_task(task_id):
    task = Task.query.get_or_404(task_id)
    if task.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
        
    data = request.get_json()
    
    if 'due_date' in data:
        if data['due_date']:
             try:
                 task.due_date = datetime.fromisoformat(data['due_date'])
             except ValueError:
                 return jsonify({'error': 'Invalid date format for due_date. Use ISO format.'}), 400
        else:
             task.due_date = None # Allow setting due_date to null

    task.title = data.get('title', task.title)
    task.description = data.get('description', task.description)
    task.is_completed = data.get('is_completed', task.is_completed)
    task.color = data.get('color', task.color)
    
    db.session.commit()
    return jsonify(task.to_dict())

@app.route('/api/tasks/<int:task_id>', methods=['DELETE'])
@login_required
def delete_task(task_id):
    task = Task.query.get_or_404(task_id)
    if task.user_id != current_user.id:
        return jsonify({'error': 'Unauthorized'}), 403
        
    db.session.delete(task)
    db.session.commit()
    return jsonify({'message': 'Task deleted successfully'})

# Create database tables if they don't exist
with app.app_context():
    try:
        print("Initializing database...")
        db.create_all()
        print("Database tables created successfully")
    except Exception as e:
        print(f"Error during database initialization: {str(e)}")
        raise e

if __name__ == '__main__':
    # Start the scheduler
    scheduler.start()
    # Run the app with SocketIO
    socketio.run(app, debug=True, use_reloader=False)

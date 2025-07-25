import os
import random
import string
from datetime import datetime, timedelta
from flask import render_template, request, redirect, url_for, flash, session, jsonify
from flask_login import LoginManager, login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash
from app import app, db
from models import User, Patient, MedicalRecord, TreatmentOrder, Alert, ChatMessage
from ai_service import clinical_ai

# Initialize Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)
login_manager.login_view = 'login'

@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

def generate_tracking_number():
    """Generate unique tracking number for patients"""
    return ''.join(random.choices(string.ascii_uppercase + string.digits, k=8))

# Authentication routes
@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        user = User.query.filter_by(username=username).first()
        
        if user and user.check_password(password):
            login_user(user)
            flash('Login successful!', 'success')
            
            # Redirect based on role
            if user.role == 'doctor':
                return redirect(url_for('doctor_dashboard'))
            elif user.role == 'nurse':
                return redirect(url_for('nurse_dashboard'))
            elif user.role == 'admin':
                return redirect(url_for('admin_dashboard'))
        else:
            flash('Invalid username or password', 'error')
    
    return render_template('login.html')

@app.route('/logout')
@login_required
def logout():
    logout_user()
    flash('You have been logged out', 'info')
    return redirect(url_for('login'))

# Main dashboard routes
@app.route('/')
def index():
    if current_user.is_authenticated:
        if current_user.role == 'doctor':
            return redirect(url_for('doctor_dashboard'))
        elif current_user.role == 'nurse':
            return redirect(url_for('nurse_dashboard'))
        elif current_user.role == 'admin':
            return redirect(url_for('admin_dashboard'))
    return redirect(url_for('login'))

@app.route('/doctor-dashboard')
@login_required
def doctor_dashboard():
    if current_user.role != 'doctor':
        flash('Access denied', 'error')
        return redirect(url_for('index'))
    
    # Get recent patients
    recent_patients = Patient.query.order_by(Patient.updated_at.desc()).limit(10).all()
    
    # Get pending orders
    pending_orders = TreatmentOrder.query.filter_by(
        doctor_id=current_user.id,
        status='pending'
    ).order_by(TreatmentOrder.created_at.desc()).limit(5).all()
    
    # Get alerts
    alerts = Alert.query.filter_by(
        user_id=current_user.id,
        is_read=False
    ).order_by(Alert.created_at.desc()).limit(5).all()
    
    return render_template('doctor_dashboard.html',
                         recent_patients=recent_patients,
                         pending_orders=pending_orders,
                         alerts=alerts)

@app.route('/nurse-dashboard')
@login_required
def nurse_dashboard():
    if current_user.role != 'nurse':
        flash('Access denied', 'error')
        return redirect(url_for('index'))
    
    # Get assigned orders
    assigned_orders = TreatmentOrder.query.filter_by(
        nurse_id=current_user.id,
        status='pending'
    ).order_by(TreatmentOrder.due_date.asc()).all()
    
    # Get patients with pending orders
    patients_with_orders = Patient.query.join(TreatmentOrder).filter(
        TreatmentOrder.status.in_(['pending', 'in_progress'])
    ).distinct().limit(10).all()
    
    # Get alerts
    alerts = Alert.query.filter_by(
        user_id=current_user.id,
        is_read=False
    ).order_by(Alert.created_at.desc()).limit(5).all()
    
    return render_template('nurse_dashboard.html',
                         assigned_orders=assigned_orders,
                         patients_with_orders=patients_with_orders,
                         alerts=alerts)

@app.route('/admin-dashboard')
@login_required
def admin_dashboard():
    if current_user.role != 'admin':
        flash('Access denied', 'error')
        return redirect(url_for('index'))
    
    # Get system statistics
    total_patients = Patient.query.count()
    total_doctors = User.query.filter_by(role='doctor').count()
    total_nurses = User.query.filter_by(role='nurse').count()
    pending_orders = TreatmentOrder.query.filter_by(status='pending').count()
    
    # Get recent activity
    recent_patients = Patient.query.order_by(Patient.created_at.desc()).limit(5).all()
    recent_orders = TreatmentOrder.query.order_by(TreatmentOrder.created_at.desc()).limit(5).all()
    
    return render_template('admin_dashboard.html',
                         total_patients=total_patients,
                         total_doctors=total_doctors,
                         total_nurses=total_nurses,
                         pending_orders=pending_orders,
                         recent_patients=recent_patients,
                         recent_orders=recent_orders)

# Patient management routes
@app.route('/register-patient', methods=['GET', 'POST'])
@login_required
def register_patient():
    if request.method == 'POST':
        patient = Patient(
            first_name=request.form['first_name'],
            last_name=request.form['last_name'],
            date_of_birth=datetime.strptime(request.form['date_of_birth'], '%Y-%m-%d').date(),
            gender=request.form['gender'],
            phone=request.form['phone'],
            email=request.form['email'],
            address=request.form['address'],
            emergency_contact=request.form['emergency_contact'],
            emergency_phone=request.form['emergency_phone'],
            tracking_number=generate_tracking_number(),
            status='registered'
        )
        
        db.session.add(patient)
        db.session.commit()
        
        flash('Patient registered successfully!', 'success')
        return redirect(url_for('patient_details', patient_id=patient.id))
    
    return render_template('register_patient.html')

@app.route('/patient/<int:patient_id>')
@login_required
def patient_details(patient_id):
    patient = Patient.query.get_or_404(patient_id)
    medical_records = MedicalRecord.query.filter_by(patient_id=patient_id).order_by(MedicalRecord.visit_date.desc()).all()
    treatment_orders = TreatmentOrder.query.filter_by(patient_id=patient_id).order_by(TreatmentOrder.created_at.desc()).all()
    
    return render_template('patient_details.html',
                         patient=patient,
                         medical_records=medical_records,
                         treatment_orders=treatment_orders)

@app.route('/search-patients')
@login_required
def search_patients():
    query = request.args.get('q', '')
    if query:
        patients = Patient.query.filter(
            db.or_(
                Patient.first_name.ilike(f'%{query}%'),
                Patient.last_name.ilike(f'%{query}%'),
                Patient.tracking_number.ilike(f'%{query}%')
            )
        ).limit(10).all()
    else:
        patients = []
    
    return jsonify([{
        'id': p.id,
        'name': f'{p.first_name} {p.last_name}',
        'tracking_number': p.tracking_number,
        'status': p.status
    } for p in patients])

# AI Chat routes
@app.route('/ai-chat', methods=['POST'])
@login_required
def ai_chat():
    if current_user.role != 'doctor':
        return jsonify({'error': 'Access denied'}), 403
    
    message = request.json.get('message', '')
    patient_id = request.json.get('patient_id')
    
    # Save user message
    chat_message = ChatMessage(
        user_id=current_user.id,
        patient_id=patient_id,
        message=message
    )
    
    # Get patient context if available
    context = None
    if patient_id:
        patient = Patient.query.get(patient_id)
        if patient:
            context = f"Patient: {patient.first_name} {patient.last_name}, Status: {patient.status}"
    
    # Process with AI
    ai_response = clinical_ai.process_doctor_query(message, patient_id, context)
    
    # Save AI response
    chat_message.response = ai_response.get('response', '')
    db.session.add(chat_message)
    db.session.commit()
    
    return jsonify(ai_response)

@app.route('/generate-summary/<int:patient_id>')
@login_required
def generate_summary(patient_id):
    if current_user.role != 'doctor':
        return jsonify({'error': 'Access denied'}), 403
    
    summary = clinical_ai.generate_patient_summary(patient_id)
    return jsonify(summary)

# Treatment order routes
@app.route('/create-order', methods=['POST'])
@login_required
def create_order():
    if current_user.role != 'doctor':
        return jsonify({'error': 'Access denied'}), 403
    
    order = TreatmentOrder(
        patient_id=request.json['patient_id'],
        doctor_id=current_user.id,
        order_type=request.json['order_type'],
        description=request.json['description'],
        priority=request.json.get('priority', 'normal'),
        due_date=datetime.strptime(request.json['due_date'], '%Y-%m-%d %H:%M') if request.json.get('due_date') else None
    )
    
    db.session.add(order)
    db.session.commit()
    
    # Create alert for nurses
    alert = Alert(
        user_id=request.json.get('nurse_id') if request.json.get('nurse_id') else None,
        patient_id=request.json['patient_id'],
        alert_type='info',
        title='New Treatment Order',
        message=f'New {order.order_type} order for patient'
    )
    
    if alert.user_id:
        db.session.add(alert)
        db.session.commit()
    
    return jsonify({'success': True, 'order_id': order.id})

@app.route('/update-order-status', methods=['POST'])
@login_required
def update_order_status():
    order_id = request.json['order_id']
    new_status = request.json['status']
    
    order = TreatmentOrder.query.get_or_404(order_id)
    
    # Check permissions
    if current_user.role == 'nurse' and order.nurse_id != current_user.id:
        return jsonify({'error': 'Access denied'}), 403
    
    order.status = new_status
    if new_status == 'completed':
        order.completed_at = datetime.utcnow()
    
    db.session.commit()
    
    return jsonify({'success': True})

# Initialize with sample data
@app.route('/init-sample-data')
def init_sample_data():
    # Only allow in development
    if not app.debug:
        return "Not available in production", 403
    
    # Create sample users
    admin = User(
        username='admin',
        email='admin@hospital.com',
        role='admin',
        first_name='Admin',
        last_name='User'
    )
    admin.set_password('admin123')
    
    doctor = User(
        username='doctor',
        email='doctor@hospital.com',
        role='doctor',
        first_name='Dr. Jane',
        last_name='Smith'
    )
    doctor.set_password('doctor123')
    
    nurse = User(
        username='nurse',
        email='nurse@hospital.com',
        role='nurse',
        first_name='Nurse',
        last_name='Johnson'
    )
    nurse.set_password('nurse123')
    
    db.session.add_all([admin, doctor, nurse])
    db.session.commit()
    
    return "Sample data initialized. Login with admin/admin123, doctor/doctor123, or nurse/nurse123"

@app.route('/init-db')
def init_db():
    """Initialize database tables and basic data"""
    try:
        db.create_all()
        
        # Check if users already exist
        if User.query.first():
            return "Database already initialized"
        
        # Create sample users
        admin = User(
            username='admin',
            email='admin@hospital.com',
            role='admin',
            first_name='Admin',
            last_name='User'
        )
        admin.set_password('admin123')
        
        doctor = User(
            username='doctor',
            email='doctor@hospital.com',
            role='doctor',
            first_name='Dr. Jane',
            last_name='Smith'
        )
        doctor.set_password('doctor123')
        
        nurse = User(
            username='nurse',
            email='nurse@hospital.com',
            role='nurse',
            first_name='Nurse',
            last_name='Johnson'
        )
        nurse.set_password('nurse123')
        
        db.session.add_all([admin, doctor, nurse])
        db.session.commit()
        
        return "Database initialized successfully! Login with admin/admin123, doctor/doctor123, or nurse/nurse123"
    except Exception as e:
        return f"Database initialization failed: {str(e)}"

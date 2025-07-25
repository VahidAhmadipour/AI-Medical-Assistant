# Clinical AI Support System

## Overview

This is a web-based healthcare management system that integrates AI-powered clinical decision support. The application serves doctors, nurses, and administrators with role-based dashboards and AI-assisted patient care capabilities. The system manages patient records, medical histories, treatment orders, and provides intelligent clinical support through OpenAI's GPT-4o model.

## System Architecture

### Backend Architecture
- **Framework**: Flask (Python web framework)
- **Database**: SQLAlchemy ORM with PostgreSQL support
- **AI Integration**: OpenAI GPT-4o for clinical decision support
- **Authentication**: Flask-Login for user session management
- **Security**: Werkzeug for password hashing and security utilities

### Frontend Architecture
- **Template Engine**: Jinja2 templates with Flask
- **UI Framework**: Bootstrap 5 for responsive design
- **Icons**: Font Awesome for iconography
- **JavaScript**: Vanilla JavaScript for interactivity
- **CSS**: Custom styling with CSS variables for theming

### Database Schema
The system uses the following main entities:
- **User**: Healthcare staff (doctors, nurses, admins) with role-based access
- **Patient**: Patient demographic and contact information
- **MedicalRecord**: Clinical records linking patients to doctors
- **TreatmentOrder**: Orders and tasks for patient care
- **Alert**: System notifications and alerts
- **ChatMessage**: AI chat interaction history

## Key Components

### User Management
- Role-based authentication (doctor, nurse, admin)
- Secure password hashing
- Session management with Flask-Login
- User profile and permission management

### Patient Management
- Comprehensive patient registration
- Unique tracking number generation
- Patient status tracking (registered, in_treatment, discharged)
- Emergency contact information

### Clinical AI Assistant
- OpenAI GPT-4o integration for clinical decision support
- Structured JSON responses for consistent AI interactions
- Context-aware patient information processing
- Priority-based response categorization

### Medical Records
- Doctor-patient medical record association
- Diagnosis, symptoms, and treatment plan documentation
- Medication tracking
- Visit history and clinical notes

### Dashboard System
- Role-specific dashboards for doctors, nurses, and administrators
- Real-time statistics and metrics
- Task management and order tracking
- Patient overview and quick access

## Data Flow

1. **User Authentication**: Users log in through the login system, which validates credentials and establishes role-based sessions
2. **Patient Registration**: New patients are registered with unique tracking numbers and demographic information
3. **Medical Records**: Doctors create and update medical records, linking diagnoses and treatment plans to patients
4. **AI Consultation**: Healthcare providers can query the AI assistant for clinical guidance, with responses formatted as structured JSON
5. **Order Management**: Treatment orders are created by doctors and assigned to nurses for execution
6. **Dashboard Updates**: Real-time statistics and alerts are displayed on role-specific dashboards

## External Dependencies

### AI Services
- **OpenAI API**: GPT-4o model for clinical decision support
- **API Key Management**: Environment-based configuration for secure API access

### Frontend Libraries
- **Bootstrap 5**: UI framework for responsive design
- **Font Awesome**: Icon library for consistent iconography
- **jQuery**: JavaScript library for DOM manipulation (implied by usage patterns)

### Backend Services
- **Flask Extensions**: SQLAlchemy, Flask-Login for core functionality
- **Werkzeug**: Security utilities and password management
- **PostgreSQL**: Primary database for data persistence

## Deployment Strategy

### Environment Configuration
- Database URL configuration through environment variables
- Session secret management for security
- OpenAI API key configuration
- Development and production environment separation

### Database Management
- SQLAlchemy ORM for database abstraction
- Automatic table creation on application startup
- Connection pooling and ping configuration for reliability

### Application Structure
- Modular design with separate files for models, routes, and services
- Template-based rendering with shared base templates
- Static asset management for CSS and JavaScript

## User Preferences

Preferred communication style: Simple, everyday language.

## Recent Changes

### July 03, 2025 - Version 1.0 Release
- ✅ Completed Flask-based clinical AI support system
- ✅ Implemented three role-based dashboards (Doctor, Nurse, Admin)
- ✅ Integrated OpenAI GPT-4o for AI-powered clinical assistant
- ✅ Created comprehensive patient management system
- ✅ Built treatment order workflow between doctors and nurses
- ✅ Added real-time alerts and notifications system
- ✅ Implemented secure user authentication with role-based access
- ✅ Created responsive UI with Bootstrap 5 and custom styling
- ✅ Added sample data initialization for testing
- ✅ Fixed all template date formatting issues
- ✅ Successfully tested all three user dashboards

### System Status
- **Database**: PostgreSQL configured and operational
- **AI Integration**: OpenAI API connected (requires credits for full functionality)
- **Authentication**: Working with demo accounts
- **UI/UX**: Responsive design with clinical theme
- **Core Features**: All major workflows operational

### Demo Accounts
- Admin: admin/admin123
- Doctor: doctor/doctor123  
- Nurse: nurse/nurse123
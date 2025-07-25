import os
import logging
from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.orm import DeclarativeBase
from werkzeug.middleware.proxy_fix import ProxyFix

# Configure logging
logging.basicConfig(level=logging.DEBUG)

class Base(DeclarativeBase):
    pass

db = SQLAlchemy(model_class=Base)

# Create the app
app = Flask(__name__)
app.secret_key = os.environ.get("SESSION_SECRET")
app.wsgi_app = ProxyFix(app.wsgi_app, x_proto=1, x_host=1)
app.debug = True

# Configure the database with fallback to SQLite
database_url = os.environ.get("DATABASE_URL")
if database_url and "ep-square-cake-a27honrv.eu-central-1.aws.neon.tech" in database_url:
    # Use SQLite as fallback for disabled database
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///clinical_ai.db"
    logging.info("Using SQLite database as fallback")
else:
    app.config["SQLALCHEMY_DATABASE_URI"] = database_url or "sqlite:///clinical_ai.db"

app.config["SQLALCHEMY_ENGINE_OPTIONS"] = {
    "pool_recycle": 300,
    "pool_pre_ping": True,
}

# Initialize the app with the extension
db.init_app(app)

# Import models to ensure they are registered
import models

# Database initialization will be handled by the /init-db route
logging.info("Application started - database initialization available at /init-db")

from flask_sqlalchemy import SQLAlchemy
from flask import Flask
import os
from flask_cors import CORS

app = Flask(__name__)

CORS(app)

app.config["SQLALCHEMY_DATABASE_URI"] = os.getenv(
    "SQLALCHEMY_DATABASE_URI",
    "mssql+pyodbc://sf_user:12345678@host.docker.internal/SmartFood?driver=ODBC+Driver+18+for+SQL+Server&Encrypt=no"
)

app.config["JWT_SECRET_KEY"] = os.getenv("JWT_SECRET_KEY", "dev-secret")
app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
app.config["JSON_AS_ASCII"] = False

db = SQLAlchemy(app)

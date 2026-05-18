from models.models import User
from config import db
from werkzeug.security import generate_password_hash, check_password_hash

def create_user(name, email, phone, password, role_id):
    hashed = generate_password_hash(password)
    user = User(user_name=name, email=email, phone=phone, password=hashed, role_id=role_id)
    db.session.add(user)
    db.session.commit()
    return user

def verify_user(email, password):
    user = User.query.filter_by(email=email).first()
    if user and check_password_hash(user.password, password):
        return user
    return None



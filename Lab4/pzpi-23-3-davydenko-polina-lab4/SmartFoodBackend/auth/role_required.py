from flask_jwt_extended import get_jwt_identity
from flask import jsonify
import json

def role_required(*roles):
    def decorator(func):
        def wrapper(*args, **kwargs):
            identity = json.loads(get_jwt_identity())
            if identity is None or identity["role"] not in roles:
                return jsonify({"error": "Доступ заборонено"}), 403
            return func(*args, **kwargs)
        wrapper.__name__ = func.__name__
        return wrapper
    return decorator

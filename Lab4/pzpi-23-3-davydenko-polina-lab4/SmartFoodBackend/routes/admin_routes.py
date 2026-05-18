from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import json

from config import db
from models.models import User, Order, OrderItem, Dish
from services.dish_service import (
    create_dish, update_dish, delete_dish, get_all_dishes
)
from services.user_service import create_user
from sqlalchemy import func

admin_bp = Blueprint("admin_bp", __name__)

def is_admin():
    identity = json.loads(get_jwt_identity())
    return identity["role"] == 1

@admin_bp.route("/admin/dish", methods=["POST"])
@jwt_required()
def admin_create_dish():
    if not is_admin():
        return jsonify({"error": "Доступ дозволено лише адміністратору"}), 403

    data = request.get_json()
    dish = create_dish(
        data["dish_name"],
        data.get("description", ""),
        data["price"],
        data["category_id"]
    )
    return jsonify({"message": "Страву створено", "dish_id": dish.dish_id})

@admin_bp.route("/admin/dish/<int:dish_id>", methods=["PUT"])
@jwt_required()
def admin_update_dish(dish_id):
    if not is_admin():
        return jsonify({"error": "Доступ дозволено лише адміністратору"}), 403

    data = request.get_json()
    dish = update_dish(dish_id, **data)
    return jsonify({"message": "Страву оновлено"})

@admin_bp.route("/admin/dish/<int:dish_id>", methods=["DELETE"])
@jwt_required()
def admin_delete_dish(dish_id):
    if not is_admin():
        return jsonify({"error": "Доступ дозволено лише адміністратору"}), 403

    delete_dish(dish_id)
    return jsonify({"message": "Страву видалено"})

@admin_bp.route("/admin/users", methods=["GET"])
@jwt_required()
def admin_get_users():
    if not is_admin():
        return jsonify({"error": "Доступ дозволено лише адміністратору"}), 403

    users = User.query.all()
    return jsonify([{
        "user_id": u.user_id,
        "name": u.user_name,
        "email": u.email,
        "phone": u.phone,
        "role_id": u.role_id
    } for u in users])

@admin_bp.route("/admin/users", methods=["POST"])
@jwt_required()
def admin_create_user():
    if not is_admin():
        return jsonify({"error": "Доступ дозволено лише адміністратору"}), 403

    data = request.get_json()
    user = create_user(
        data["name"],
        data["email"],
        data.get("phone"),
        data["password"],
        data["role_id"]
    )
    return jsonify({"message": "Користувача створено", "user_id": user.user_id})

@admin_bp.route("/admin/users/<int:user_id>", methods=["DELETE"])
@jwt_required()
def admin_delete_user(user_id):
    if not is_admin():
        return jsonify({"error": "Доступ дозволено лише адміністратору"}), 403

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Користувача не знайдено"}), 404

    db.session.delete(user)
    db.session.commit()
    return jsonify({"message": "Користувача видалено"})

@admin_bp.route("/admin/orders", methods=["GET"])
@jwt_required()
def admin_all_orders():
    if not is_admin():
        return jsonify({"error": "Доступ дозволено лише адміністратору"}), 403

    orders = Order.query.all()
    return jsonify([{
        "order_id": o.order_id,
        "table_id": o.table_id,
        "status": o.status.value,
        "total_price": o.total_price,
        "created_at": o.created_at
    } for o in orders])

@admin_bp.route("/admin/users/<int:user_id>/role", methods=["PUT"])
@jwt_required()
def admin_update_role(user_id):
    if not is_admin():
        return jsonify({"error": "Доступ лише адміну"}), 403

    data = request.get_json()

    new_role = data.get("role_id")

    if new_role is None:
        return jsonify({"error": "role_id є обов'язковим"}), 400

    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "Користувача не знайдено"}), 404

    user.role_id = new_role
    db.session.commit()

    return jsonify({
        "message": "Роль оновлено успішно",
        "user_id": user.user_id,
        "new_role_id": new_role
    })

@admin_bp.route("/admin/stats/top-dishes", methods=["GET"])
@jwt_required()
def admin_top_dishes():
    if not is_admin():
        return jsonify({"error": "Доступ лише адміну"}), 403

    stats = db.session.query(
        Dish.dish_name,
        func.sum(OrderItem.quantity).label("total_sold"),
        func.sum(OrderItem.total_item_price).label("total_income")
    ).join(Dish, Dish.dish_id == OrderItem.dish_id) \
     .join(Order, Order.order_id == OrderItem.order_id) \
     .filter(Order.status == "delivered") \
     .group_by(Dish.dish_name) \
     .order_by(func.sum(OrderItem.quantity).desc()) \
     .all()

    result = [{
        "dish_name": row[0],
        "total_sold": int(row[1]),
        "total_income": float(row[2])
    } for row in stats]

    return jsonify(result)


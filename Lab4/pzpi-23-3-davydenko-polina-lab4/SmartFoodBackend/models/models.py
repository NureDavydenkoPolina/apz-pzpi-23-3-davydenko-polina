from config import db
import enum

class OrderStatus(enum.Enum):
    created = "created"
    cooking = "cooking"
    ready = "ready"
    delivered = "delivered"
    paid = "paid"


class Role(db.Model):
    __tablename__ = "Role"
    role_id = db.Column(db.Integer, primary_key=True)
    role_name = db.Column(db.String(50), nullable=False)


class User(db.Model):
    __tablename__ = "User"
    user_id = db.Column(db.Integer, primary_key=True)
    user_name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20))
    email = db.Column(db.String(120), unique=True)
    password = db.Column(db.String(255), nullable=False)
    role_id = db.Column(db.Integer, db.ForeignKey("Role.role_id"), nullable=False)


class Category(db.Model):
    __tablename__ = "Category"
    category_id = db.Column(db.Integer, primary_key=True)
    category_name = db.Column(db.String(50), nullable=False)


class Dish(db.Model):
    __tablename__ = "Dish"
    dish_id = db.Column(db.Integer, primary_key=True)
    dish_name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.String(255))
    price = db.Column(db.Float, nullable=False)
    category_id = db.Column(db.Integer, db.ForeignKey("Category.category_id"), nullable=False)


class Table(db.Model):
    __tablename__ = "Table"
    table_id = db.Column(db.Integer, primary_key=True)
    number = db.Column(db.Integer, nullable=False)
    seats = db.Column(db.Integer, nullable=False)
    waiter_id = db.Column(db.Integer, db.ForeignKey("User.user_id"), nullable=False)


class Order(db.Model):
    __tablename__ = "Order"
    order_id = db.Column(db.Integer, primary_key=True)
    created_at = db.Column(db.DateTime)
    total_price = db.Column(db.Float)
    status = db.Column(db.Enum(OrderStatus), nullable=False, default=OrderStatus.created)
    table_id = db.Column(db.Integer, db.ForeignKey("Table.table_id"), nullable=False)


class OrderItem(db.Model):
    __tablename__ = "OrderItem"
    order_id = db.Column(db.Integer, db.ForeignKey("Order.order_id"), primary_key=True)
    dish_id = db.Column(db.Integer, db.ForeignKey("Dish.dish_id"), primary_key=True)
    quantity = db.Column(db.Integer, nullable=False)
    unit_price = db.Column(db.Float, nullable=False)
    total_item_price = db.Column(db.Float, nullable=False)

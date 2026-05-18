from models.models import Order, OrderItem, OrderStatus
from config import db
from datetime import datetime

def create_order(table_id, total_price=0):
    new_order = Order(
        table_id=table_id,
        total_price=total_price,
        status=OrderStatus.created,
        created_at=datetime.utcnow()
    )
    db.session.add(new_order)
    db.session.commit()
    return new_order

def get_order_by_id(order_id):
    return Order.query.get(order_id)

def update_order_status(order_id, status):
    if status not in OrderStatus._value2member_map_:
        raise ValueError("Неприпустимий статус")
    order = Order.query.get(order_id)
    order.status = OrderStatus(status)
    db.session.commit()
    return order

def calculate_total(order_id):
    items = OrderItem.query.filter_by(order_id=order_id).all()
    total = sum(item.total_item_price for item in items)
    order = Order.query.get(order_id)
    order.total_price = total
    db.session.commit()
    return order.total_price

def get_active_order_by_table(table_id):
    return (Order.query
            .filter_by(table_id=table_id, status=OrderStatus.created)
            .order_by(Order.created_at.desc())
            .first())

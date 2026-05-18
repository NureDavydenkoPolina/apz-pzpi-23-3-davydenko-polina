from models.models import Dish, OrderItem
from config import db

def add_order_item(order_id, dish_id, quantity):
    existing = OrderItem.query.get((order_id, dish_id))

    dish = Dish.query.get(dish_id)
    unit_price = dish.price

    if existing:
        existing.quantity += quantity
        existing.total_item_price = existing.quantity * unit_price
        db.session.commit()
        return existing
    else:
        item = OrderItem(
            order_id=order_id,
            dish_id=dish_id,
            quantity=quantity,
            unit_price=unit_price,
            total_item_price=unit_price * quantity
        )
        db.session.add(item)
        db.session.commit()
        return item

def get_items_by_order(order_id):
    return OrderItem.query.filter_by(order_id=order_id).all()

def delete_order_item(order_id, dish_id):
    item = OrderItem.query.get((order_id, dish_id))
    db.session.delete(item)
    db.session.commit()

def get_items_expanded(order_id):
    rows = (db.session.query(OrderItem, Dish)
            .join(Dish, OrderItem.dish_id == Dish.dish_id)
            .filter(OrderItem.order_id == order_id)
            .all())

    result = []
    for item, dish in rows:
        result.append({
            "dish_id": dish.dish_id,
            "dish_name": dish.dish_name,
            "quantity": item.quantity,
            "unit_price": item.unit_price,
            "total_item_price": item.total_item_price
        })
    return result

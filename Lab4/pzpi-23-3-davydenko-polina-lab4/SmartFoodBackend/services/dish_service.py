from models.models import Dish
from config import db

def get_all_dishes():
    return Dish.query.all()

def get_dish_by_id(dish_id):
    return Dish.query.get(dish_id)

def create_dish(name, description, price, category_id):
    dish = Dish(dish_name=name, description=description, price=price, category_id=category_id)
    db.session.add(dish)
    db.session.commit()
    return dish

def update_dish(dish_id, **kwargs):
    dish = Dish.query.get(dish_id)
    for key, value in kwargs.items():
        setattr(dish, key, value)
    db.session.commit()
    return dish

def delete_dish(dish_id):
    dish = Dish.query.get(dish_id)
    db.session.delete(dish)
    db.session.commit()

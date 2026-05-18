from locust import HttpUser, task, between
import random

class SmartFoodUser(HttpUser):

    wait_time = between(1, 3)

    @task(3)
    def get_menu(self):
        self.client.get("/api/menu")

    @task(2)
    def create_order(self):
        response = self.client.post(
            "/api/order/create",
            json={
                "table_id": random.randint(1, 5),
                "total_price": 0
            }
        )

        if response.status_code == 200:
            data = response.json()
            order_id = data["order_id"]

            self.client.post(
                f"/api/order/{order_id}/add-item",
                json={
                    "dish_id": 1,
                    "quantity": 2
                }
            )

            self.client.get(f"/api/order/{order_id}/items")
package com.example.smartfood

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.interaction.MutableInteractionSource
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.example.smartfood.ui.theme.SmartFoodTheme
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import androidx.compose.foundation.interaction.collectIsPressedAsState

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        setContent {
            SmartFoodTheme {
                MenuScreen()
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun MenuScreen() {
    var dishes by remember { mutableStateOf(listOf<Dish>()) }
    var orderId by remember { mutableStateOf<Int?>(null) }
    var screen by remember { mutableStateOf("menu") }
    var isSubmitted by remember { mutableStateOf(false) }
    var selectedTable by remember { mutableStateOf(1) }
    val tables = listOf(1, 2, 3, 4)
    var expanded by remember { mutableStateOf(false) }

    fun addDish(orderId: Int, dishId: Int) {
        RetrofitClient.api.addItem(
            orderId,
            mapOf("dish_id" to dishId, "quantity" to 1)
        ).enqueue(object : Callback<Map<String, Any>> {
            override fun onResponse(call: Call<Map<String, Any>>, response: Response<Map<String, Any>>) {}
            override fun onFailure(call: Call<Map<String, Any>>, t: Throwable) {}
        })
    }

    LaunchedEffect(Unit) {
        RetrofitClient.api.getMenu().enqueue(object : Callback<List<Dish>> {
            override fun onResponse(call: Call<List<Dish>>, response: Response<List<Dish>>) {
                if (response.isSuccessful) {
                    dishes = response.body() ?: emptyList()
                }
            }

            override fun onFailure(call: Call<List<Dish>>, t: Throwable) {}
        })
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        ExposedDropdownMenuBox(
            expanded = expanded,
            onExpandedChange = { expanded = !expanded }
        ) {

            TextField(
                value = "Стіл №$selectedTable",
                onValueChange = {},
                readOnly = true,
                label = { Text("Оберіть стіл") },
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded) },
                modifier = Modifier.menuAnchor().fillMaxWidth()
            )

            ExposedDropdownMenu(
                expanded = expanded,
                onDismissRequest = { expanded = false }
            ) {
                tables.forEach { table ->
                    DropdownMenuItem(
                        text = { Text("Стіл №$table") },
                        onClick = {
                            selectedTable = table
                            expanded = false
                        }
                    )
                }
            }
        }

        Button(
            onClick = {
                if (orderId != null) screen = "order"
            },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Моє замовлення")
        }

        Spacer(modifier = Modifier.height(16.dp))

        if (screen == "menu") {

            LazyColumn(
                modifier = Modifier.fillMaxSize()
            ) {
                items(dishes) { dish ->

                    Card(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(8.dp)
                    ) {

                        Column(modifier = Modifier.padding(16.dp)) {
                            Text(
                                text = dish.dish_name,
                                style = MaterialTheme.typography.titleLarge.copy(
                                    color = MaterialTheme.colorScheme.primary
                                )
                            )
                            Text("${dish.price} грн")
                            Text(dish.description)

                            val interactionSource = remember { MutableInteractionSource() }
                            val isPressed by interactionSource.collectIsPressedAsState()

                            Button(
                                onClick = {

                                    if (orderId == null) {
                                        RetrofitClient.api.createOrder(mapOf("table_id" to selectedTable))
                                            .enqueue(object : Callback<Map<String, Any>> {

                                                override fun onResponse(
                                                    call: Call<Map<String, Any>>,
                                                    response: Response<Map<String, Any>>
                                                ) {
                                                    val id = (response.body()?.get("order_id") as Double).toInt()
                                                    orderId = id

                                                    addDish(id, dish.dish_id)
                                                }

                                                override fun onFailure(call: Call<Map<String, Any>>, t: Throwable) {}
                                            })
                                    } else {
                                        addDish(orderId!!, dish.dish_id)
                                    }
                                },
                                interactionSource = interactionSource,
                                colors = ButtonDefaults.buttonColors(
                                    containerColor = if (isPressed)
                                        MaterialTheme.colorScheme.primary.copy(alpha = 0.7f)
                                    else
                                        MaterialTheme.colorScheme.primary
                                ),
                                modifier = Modifier.padding(top = 8.dp)
                            ) {
                                Text("Додати")
                            }
                        }
                    }
                }
            }

        } else {

            OrderScreen(orderId!!, dishes, isSubmitted,
                onBack = {
                    screen = "menu"

                    if (isSubmitted) {
                        orderId = null
                        isSubmitted = false
                    }
                },
                onSubmit = {
                    isSubmitted = true
                }
            )
        }
    }
}

@Composable
fun OrderScreen(
    orderId: Int,
    dishes: List<Dish>,
    isSubmitted: Boolean,
    onBack: () -> Unit,
    onSubmit: () -> Unit
) {

    var orderItems by remember { mutableStateOf(listOf<Map<String, Any>>()) }
    var total by remember { mutableStateOf(0.0) }

    fun loadData() {
        RetrofitClient.api.getItems(orderId)
            .enqueue(object : Callback<List<Map<String, Any>>> {
                override fun onResponse(
                    call: Call<List<Map<String, Any>>>,
                    response: Response<List<Map<String, Any>>>
                ) {
                    orderItems = response.body() ?: emptyList()
                }

                override fun onFailure(call: Call<List<Map<String, Any>>>, t: Throwable) {}
            })

        RetrofitClient.api.getTotal(orderId)
            .enqueue(object : Callback<Map<String, Any>> {
                override fun onResponse(
                    call: Call<Map<String, Any>>,
                    response: Response<Map<String, Any>>
                ) {
                    total = (response.body()?.get("total_price") as? Double) ?: 0.0
                }

                override fun onFailure(call: Call<Map<String, Any>>, t: Throwable) {}
            })
    }

    LaunchedEffect(orderId) {
        loadData()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {

        Button(onClick = onBack) {
            Text("Назад")
        }

        Spacer(modifier = Modifier.height(8.dp))

        Text("Моє замовлення", style = MaterialTheme.typography.titleLarge)

        Spacer(modifier = Modifier.height(8.dp))

        LazyColumn {
            items(orderItems) { item ->

                val dishId = (item["dish_id"] as Double).toInt()
                val quantity = (item["quantity"] as Double).toInt()
                val price = item["unit_price"] as Double
                val dishName = dishes.find { it.dish_id == dishId }?.dish_name ?: "Невідомо"

                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(8.dp)
                ) {

                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {

                        Column {
                            Text(dishName, style = MaterialTheme.typography.titleMedium)
                            Text("Кількість: $quantity")
                            Text("Разом: ${price * quantity} грн")
                        }

                        if (!isSubmitted) {
                            Button(
                                onClick = {
                                    RetrofitClient.api.deleteItem(
                                        orderId,
                                        mapOf("dish_id" to dishId)
                                    ).enqueue(object : Callback<Map<String, Any>> {

                                        override fun onResponse(
                                            call: Call<Map<String, Any>>,
                                            response: Response<Map<String, Any>>
                                        ) {
                                            loadData()
                                        }

                                        override fun onFailure(
                                            call: Call<Map<String, Any>>,
                                            t: Throwable
                                        ) {}
                                    })
                                }
                            ) {
                                Text("❌")
                            }
                        }
                    }
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        Text("Сума: $total грн", style = MaterialTheme.typography.titleLarge)

        Spacer(modifier = Modifier.height(16.dp))

        val isOrderValid = total > 0

        if (!isSubmitted) {
            Button(
                onClick = onSubmit,
                modifier = Modifier.fillMaxWidth(),
                enabled = isOrderValid
            ) {
                Text("Відправити замовлення")
            }
        } else {
            Text("Замовлення відправлено ✅")

            Spacer(modifier = Modifier.height(16.dp))

            Button(
                onClick = onBack,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Нове замовлення")
            }
        }
    }
}
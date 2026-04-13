package com.example.smartfood

import retrofit2.Call
import retrofit2.http.Body
import retrofit2.http.DELETE
import retrofit2.http.GET
import retrofit2.http.HTTP
import retrofit2.http.POST
import retrofit2.http.Path

interface ApiService {

    @GET("/api/menu")
    fun getMenu(): Call<List<Dish>>

    @POST("/api/order/create")
    fun createOrder(@Body body: Map<String, Int>): Call<Map<String, Any>>

    @POST("/api/order/{id}/add-item")
    fun addItem(
        @Path("id") orderId: Int,
        @Body body: Map<String, Int>
    ): Call<Map<String, Any>>

    @GET("/api/order/{id}/total")
    fun getTotal(@Path("id") orderId: Int): Call<Map<String, Any>>

    @GET("/api/order/{id}/items")
    fun getItems(@Path("id") orderId: Int): Call<List<Map<String, Any>>>

    @HTTP(method = "DELETE", path = "/api/order/{id}/delete-item", hasBody = true)
    fun deleteItem(
        @Path("id") orderId: Int,
        @Body body: Map<String, Int>
    ): Call<Map<String, Any>>
}

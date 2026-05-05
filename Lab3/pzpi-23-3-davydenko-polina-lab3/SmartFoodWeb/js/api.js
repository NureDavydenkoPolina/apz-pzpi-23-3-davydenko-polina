const API_URL = "http://127.0.0.1:5000/api";

async function apiRequest(endpoint, method = 'GET', body = null) {
    const token = localStorage.getItem('access_token');
    
    const headers = {
        'Content-Type': 'application/json'
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
        method,
        headers
    };

    if (body) {
        config.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_URL}${endpoint}`, config);

        if (response.status === 401 || response.status === 422) {
            console.warn("Сесія завершена або доступ заборонено");
            handleLogoutSilently(); 
            return;
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `Помилка: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("API Error:", error);
        throw error;
    }
}

function handleLogoutSilently() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('user_role_id');
    window.location.href = 'login.html';
}

async function getMenu() {
    return await apiRequest('/menu');
}

async function getOrdersByStatuses(statuses) {
    return await apiRequest(`/orders?statuses=${statuses.join(',')}`);
}

async function updateOrderStatus(orderId, newStatus) {
    return await apiRequest(`/order/${orderId}/status`, 'PUT', { status: newStatus });
}

async function apiDeleteOrder(orderId) {
    return await apiRequest(`/order/${orderId}`, 'DELETE');
}

async function apiCreateDish(dishData) {
    return await apiRequest('/admin/dish', 'POST', dishData);
}

async function apiUpdateDish(dishId, dishData) {
    return await apiRequest(`/admin/dish/${dishId}`, 'PUT', dishData);
}

async function apiDeleteDish(dishId) {
    return await apiRequest(`/admin/dish/${dishId}`, 'DELETE');
}

async function sendOrderToBackend(cartItems, tableId) {
    const total = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    const orderData = await apiRequest('/order/create', 'POST', { 
        table_id: tableId,
        total_price: total 
    });
    
    const orderId = orderData.order_id;

    for (const item of cartItems) {
        await apiRequest(`/order/${orderId}/add-item`, 'POST', {
            dish_id: item.dish_id,
            quantity: item.quantity
        });
    }
    
    return orderId;
}


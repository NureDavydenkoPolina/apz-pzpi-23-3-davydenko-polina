let currentRole = '';
let currentAdminLang = localStorage.getItem('admin_lang') || 'uk';

const roleMap = {
    1: 'admin',
    2: 'waiter',
    3: 'cook'
};

const rolePermissions = {
    cook: ['created', 'cooking', 'ready'],
    waiter: ['ready', 'delivered'],
    admin: ['created', 'cooking', 'ready', 'delivered']
};

async function initAdmin() {
    const roleId = localStorage.getItem('user_role_id');
    const token = localStorage.getItem('access_token');

    if (!token || !roleId) {
        window.location.href = 'login.html';
        return;
    }

    currentRole = roleMap[roleId];

    const userInfo = document.getElementById('user-info');
    if (userInfo && currentRole) {
        userInfo.innerText = currentRole.toUpperCase();
    }

    const adminControls = document.getElementById('admin-controls');
    if (adminControls) {
        adminControls.style.display = currentRole === 'admin' ? 'block' : 'none';
    }
    
    const menuManagement = document.getElementById('menu-management');
    if (currentRole === 'admin') {
        if (menuManagement) {
            menuManagement.style.display = 'block';
        }
        await loadAdminMenu();
    }

    setAdminLanguage(currentAdminLang);
}

function setAdminLanguage(lang) {
    currentAdminLang = lang;
    localStorage.setItem('admin_lang', lang);
    
    document.querySelectorAll('.lang-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.getElementById(`lang-${lang}`);
    if (activeBtn) activeBtn.classList.add('active');

    if (typeof adminTranslations !== 'undefined' && adminTranslations[lang]) {
        const t = adminTranslations[lang];
        document.querySelectorAll('[data-t]').forEach(el => {
            const key = el.getAttribute('data-t');
            if (t[key]) el.innerText = t[key];
        });
        
        if (t.title) document.title = t.title;
    }
    
    refreshOrders();
    if (currentRole === 'admin') loadAdminMenu();
}

async function refreshOrders() {
    const container = document.getElementById('orders-container');
    if (!container) return;

    try {
        const statuses = rolePermissions[currentRole] || [];
        if (statuses.length === 0) return;

        let orders = await getOrdersByStatuses(statuses);

        if (orders && orders.length > 0) {
            orders.reverse(); 
        }

        renderOrders(orders);
        
    } catch (err) {
        console.error("Помилка завантаження замовлень:", err);
        container.innerHTML = `<p style="color:red;">Помилка з'єднання з сервером</p>`;
    }
}

function renderOrders(orders) {
    const container = document.getElementById('orders-container');
    const lang = (typeof adminTranslations !== 'undefined') ? adminTranslations[currentAdminLang] : {};

    if (!container) return;
    if (!orders || orders.length === 0) {
        container.innerHTML = `<p>${lang.noOrders || 'Замовлень немає'}</p>`;
        return;
    }

    container.innerHTML = '';

    orders.forEach((order) => {
        const orderCard = document.createElement('div');
        orderCard.className = `order-card status-${order.status}`;
        orderCard.id = `order-${order.order_id}`;
        
        const itemsHtml = order.items.map(item => {
            let displayName = item.dish_name;
            if (currentAdminLang === 'en' && typeof dishTranslations !== 'undefined' && dishTranslations[item.dish_name]) {
                displayName = dishTranslations[item.dish_name].en;
            }
            return `<div><strong>${displayName}</strong> x${item.quantity}</div>`;
        }).join('');

        orderCard.innerHTML = `
            <h4>${lang.order || 'Order'} #${order.order_id} (${lang.table || 'Table'} ${order.table_number})</h4>
            <div class="items-list">${itemsHtml}</div>
            <p><strong>${lang.total || 'Сума'}:</strong> <span>${order.total_price || 0}</span> ₴</p>
            <p>${lang.status || 'Status'}: <span class="status-badge">${order.status}</span></p>
            <div class="actions">${generateActionButtons(order)}</div>
        `;

        container.appendChild(orderCard);
    });
}

function generateActionButtons(order) {
    const s = order.status;
    const t = (typeof adminTranslations !== 'undefined') ? adminTranslations[currentAdminLang] : {};

    if (currentRole === 'cook') {
        if (s === 'created') return `<button onclick="changeStatus(${order.order_id}, 'cooking')">${t.cookAction || 'Start'}</button>`;
        if (s === 'cooking') return `<button onclick="changeStatus(${order.order_id}, 'ready')">${t.readyAction || 'Ready'}</button>`;
    }
    
    if (currentRole === 'waiter') {
        if (s === 'ready') return `<button onclick="changeStatus(${order.order_id}, 'delivered')">${t.deliverAction || 'Deliver'}</button>`;
    }

    if (currentRole === 'admin') {
        return `
            <button class="btn-reset" onclick="changeStatus(${order.order_id}, 'created')">
                ${t.reset || '🔄 Reset'}
            </button>
            <button class="btn-delete" onclick="deleteOrder(${order.order_id})">
                ${t.delete || '🗑 Delete'}
            </button>
        `;
    }
    return ''; 
}

async function changeStatus(orderId, nextStatus) {
    try {
        await updateOrderStatus(orderId, nextStatus);
        refreshOrders();
    } catch (err) {
        alert("Помилка зміни статусу");
    }
}

async function deleteOrder(orderId) {
    if (!confirm("Видалити замовлення?")) return;
    try {
        await apiDeleteOrder(orderId);
        refreshOrders();
    } catch (err) {
        alert("Помилка видалення");
    }
}

function openModal() { 
    document.getElementById('dish-modal').style.display = 'block'; 
}

function closeModal() { 
    document.getElementById('dish-modal').style.display = 'none';
    
    document.getElementById('modal-title').innerText = currentAdminLang === 'uk' ? "Нова страва" : "New Dish";
    document.getElementById('edit-dish-id').value = '';
    document.getElementById('new-dish-name').value = '';
    document.getElementById('new-dish-price').value = '';
    document.getElementById('new-dish-desc').value = '';
    
    const saveBtn = document.getElementById('modal-save-btn');
    saveBtn.innerText = currentAdminLang === 'uk' ? "Зберегти" : "Save";
    saveBtn.onclick = saveNewDish;
}

async function saveNewDish() {
    const data = {
        dish_name: document.getElementById('new-dish-name').value,
        price: Number(document.getElementById('new-dish-price').value),
        description: document.getElementById('new-dish-desc').value,
        category_id: Number(document.getElementById('new-dish-category').value)
    };

    if (!data.dish_name || data.price < 1) {
        alert("Заповніть назву та ціну!");
        return;
    }

    try {
            await apiCreateDish(data);
            alert("Додано!");
            closeModal();
            loadAdminMenu();
        } catch (err) {
            alert("Помилка: " + err.message);
        }
}

function handleLogout() {
    const lang = (typeof adminTranslations !== 'undefined') ? adminTranslations[currentAdminLang] : {};
    const confirmMsg = lang.logoutConfirm || "Ви впевнені, що хочете вийти?";

    if (confirm(confirmMsg)) {
        localStorage.removeItem('access_token');
        localStorage.removeItem('user_role_id');
        localStorage.removeItem('admin_lang');

        window.location.href = 'login.html';
    }
}

async function loadAdminMenu() {
    const container = document.getElementById('admin-menu-list');
    try {
        const dishes = await getMenu();
        container.innerHTML = dishes.map(dish => `
            <div class="dish-card admin-edit-card">
                <div class="item-info">
                    <h4>${dish.dish_name}</h4>
                    <p><strong>${dish.price} ₴</strong></p>
                    <small>${dish.description || ''}</small>
                </div>
                <div class="admin-actions">
                    <button onclick='prepareEditDish(${JSON.stringify(dish)})' class="edit-btn">✏️</button>
                    <button onclick="deleteDishConfirm(${dish.dish_id})" class="delete-btn">🗑</button>
                </div>
            </div>
        `).join('');
    } catch (err) {
        console.error("Помилка:", err);
    }
}

async function deleteDishConfirm(dish_id) {
    if (!confirm("Ви впевнені?")) return;
    try {
        await apiDeleteDish(dish_id);
        loadAdminMenu();
    } catch (err) {
        alert("Помилка видалення");
    }
}

async function editDishPrompt(id, oldName, oldPrice, oldDesc, oldCat) {
    const newName = prompt("Нова назва:", oldName);
    const newPrice = prompt("Нова ціна:", oldPrice);
    if (!newName || !newPrice) return;

    const token = localStorage.getItem('access_token');
    try {
        const response = await fetch(`http://127.0.0.1:5000/api/admin/dish/${id}`, {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}` 
            },
            body: JSON.stringify({
                dish_name: newName,
                price: Number(newPrice),
                description: oldDesc,
                category_id: oldCat
            })
        });

        if (response.ok) {
            alert("Оновлено!");
            loadAdminMenu();
        }
    } catch (err) {
        alert("Помилка при оновленні");
    }
}

function showSection(sectionName) {
    const ordersSection = document.getElementById('section-orders');
    const menuSection = document.getElementById('section-menu');
    const btnOrders = document.getElementById('btn-orders');
    const btnMenu = document.getElementById('btn-menu');

    if (sectionName === 'menu') {
        ordersSection.style.display = 'none';
        menuSection.style.display = 'block';
        
        btnMenu.classList.add('active');
        btnOrders.classList.remove('active');
        
        loadAdminMenu();
    } else {
        ordersSection.style.display = 'block';
        menuSection.style.display = 'none';
        
        btnOrders.classList.add('active');
        btnMenu.classList.remove('active');
        
        refreshOrders();
    }
}

function prepareEditDish(dish) {
  
    const modal = document.getElementById('dish-modal');
    
    document.getElementById('edit-dish-id').value = dish.dish_id;
    document.getElementById('new-dish-name').value = dish.dish_name;
    document.getElementById('new-dish-price').value = dish.price;
    document.getElementById('new-dish-desc').value = dish.description || "";

    const categorySelect = document.getElementById('new-dish-category');
    
    categorySelect.value = dish.category_id; 

    if (categorySelect.selectedIndex === -1) {
        console.warn("Категорія ID " + dish.category_id + " не знайдена у списку!");
        categorySelect.selectedIndex = 0; 
    }

    document.getElementById('modal-title').innerText = "Редагування: " + dish.dish_name;
    const saveBtn = document.getElementById('modal-save-btn');
    saveBtn.innerText = "Оновити";
    saveBtn.onclick = updateDish;

    modal.style.display = 'block';
}

async function updateDish() {
    const dishId = document.getElementById('edit-dish-id').value;
    const data = {
        dish_name: document.getElementById('new-dish-name').value,
        price: Number(document.getElementById('new-dish-price').value),
        description: document.getElementById('new-dish-desc').value,
        category_id: Number(document.getElementById('new-dish-category').value)
    };

    try {
        await apiUpdateDish(dishId, data); 

        alert(currentAdminLang === 'uk' ? "Оновлено успішно!" : "Updated successfully!");
        closeModal();
        loadAdminMenu(); 
    } catch (err) {
        alert("Помилка: " + err.message);
    }
}

window.onload = initAdmin;
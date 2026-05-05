if (typeof currentLang === 'undefined') {
    window.currentLang = localStorage.getItem('smartfood_lang') || 'uk';
} else {
    currentLang = localStorage.getItem('smartfood_lang') || 'uk';
}

window.cart = JSON.parse(localStorage.getItem('smartfood_cart')) || [];
window.allDishes = []; 

async function initApp() {
    if (typeof translations === 'undefined') {
        setTimeout(initApp, 50); 
        return;
    }

    try {
        const dishes = await getMenu();
        window.allDishes = dishes; 
        
        renderMenu(dishes);
        updateInterface();
        updateCartUI();
        
        const activeBtn = document.getElementById(`lang-${currentLang}`);
        if (activeBtn) activeBtn.classList.add('active');
        
    } catch (err) {
        console.error("Помилка ініціалізації:", err);
    }
}

function renderMenu(dishes) {
    const container = document.getElementById('menu-container');
    if (!container || !translations[currentLang]) return;
    
    const t = translations[currentLang];

    container.innerHTML = dishes.map(dish => {
        let displayName = dish.dish_name;
        let displayDesc = dish.description || '';

        if (currentLang === 'en' && typeof dishTranslations !== 'undefined' && dishTranslations[dish.dish_name]) {
            displayName = dishTranslations[dish.dish_name].en;
            displayDesc = dishTranslations[dish.dish_name].descEn;
        }

        return `
            <div class="dish-card">
                <h3>${displayName}</h3>
                <p>${displayDesc}</p>
                <span class="dish-price">${dish.price} ${t.currency}</span>
                <br><br>
                <button onclick="addToCart(${dish.dish_id}, '${displayName.replace(/'/g, "\\'")}', ${dish.price})">
                    ${t.addBtn}
                </button>
            </div>
        `;
    }).join('');
}

function updateInterface() {
    if (typeof translations === 'undefined' || !translations[currentLang]) return;
    const t = translations[currentLang];
    
    const elements = {
        'page-title': t.title,
        'cart-title': t.cartTitle,
        'checkout-btn': t.checkout,
        'total-label': t.total
    };

    for (let id in elements) {
        const el = document.getElementById(id);
        if (el) el.innerText = elements[id];
    }
    
    document.querySelectorAll('.curr').forEach(span => {
        span.innerText = t.currency;
    });
}

function addToCart(dishId, name, price) {
    const existing = window.cart.find(item => item.dish_id === dishId);
    if (existing) {
        existing.quantity += 1;
    } else {
        window.cart.push({ dish_id: dishId, name: name, price: price, quantity: 1 });
    }
    saveAndRender();
}

function removeFromCart(dishId) {
    window.cart = window.cart.filter(item => item.dish_id !== dishId);
    saveAndRender();
}

function saveAndRender() {
    localStorage.setItem('smartfood_cart', JSON.stringify(window.cart));
    updateCartUI();
}

function updateQuantity(dishId, delta) {
    const item = window.cart.find(item => item.dish_id === dishId);
    if (item) {
        const newQuantity = item.quantity + delta;
        if (newQuantity <= 0) {
            removeFromCart(dishId);
        } else if (newQuantity <= 10) {
            item.quantity = newQuantity;
            saveAndRender();
        }
    }
}

function updateCartUI() {
    if (typeof translations === 'undefined' || !translations[currentLang]) return;

    const t = translations[currentLang];
    const itemsContainer = document.getElementById('cart-items');
    const totalSpan = document.getElementById('cart-total');
    const cartBtn = document.getElementById('cart-btn');
    
    if (!itemsContainer || !cartBtn) return;

    const count = window.cart.reduce((sum, item) => sum + item.quantity, 0);
    cartBtn.innerText = `🛒 ${t.cart} (${count})`;

    if (window.cart.length === 0) {
        itemsContainer.innerHTML = `<p>${t.empty}</p>`;
    } else {
        itemsContainer.innerHTML = window.cart.map(item => {
            let displayName = item.name;
            if (currentLang === 'en' && typeof dishTranslations !== 'undefined' && dishTranslations[item.name]) {
                displayName = dishTranslations[item.name].en;
            }

            return `
                <div class="cart-item">
                    <div class="item-info">
                        <span>${displayName}</span>
                        <div class="quantity-controls">
                            <button onclick="updateQuantity(${item.dish_id}, -1)">-</button>
                            <span class="qty-num">${item.quantity}</span>
                            <button onclick="updateQuantity(${item.dish_id}, 1)">+</button>
                        </div>
                    </div>
                    <span>${(item.price * item.quantity).toFixed(2)} ${t.currency}</span>
                    <button class="remove-btn" onclick="removeFromCart(${item.dish_id})">×</button>
                </div>
            `;
        }).join('');
    }

    const total = window.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    if (totalSpan) totalSpan.innerText = total.toFixed(2);
}

function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('smartfood_lang', lang);

    document.querySelectorAll('.lang-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById(`lang-${lang}`);
    if (activeBtn) activeBtn.classList.add('active');

    updateInterface();
    updateCartUI();

    if (window.allDishes && window.allDishes.length > 0) {
        renderMenu(window.allDishes);
    }
}

function toggleCart() {
    const modal = document.getElementById('cart-modal');
    if (modal) {
        modal.style.display = modal.style.display === 'block' ? 'none' : 'block';
        updateCartUI();
    }
}

window.onload = initApp;

const checkoutBtn = document.getElementById('checkout-btn');
if (checkoutBtn) {
    checkoutBtn.onclick = async function() {
        if (window.cart.length === 0) return;
        try {
            const orderId = await sendOrderToBackend(window.cart, 1);
            alert(currentLang === 'uk' ? `Замовлення №${orderId} прийнято!` : `Order #${orderId} placed!`);
            window.cart = [];
            localStorage.removeItem('smartfood_cart');
            toggleCart();
            updateCartUI();
        } catch (err) {
            console.error(err);
            alert("Помилка при відправці замовлення!");
        }
    };
}
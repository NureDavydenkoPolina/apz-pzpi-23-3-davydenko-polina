const translations = {
    uk: {
        title: "Наше Меню", currency: "₴", addBtn: "Додати", loading: "Завантаження...",
        cart: "Кошик", cartTitle: "Ваш кошик", total: "Разом", checkout: "Оформити", empty: "Кошик порожній"
    },
    en: {
        title: "Our Menu", currency: "$", addBtn: "Add", loading: "Loading...",
        cart: "Cart", cartTitle: "Your Cart", total: "Total", checkout: "Checkout", empty: "Cart is empty"
    }
};

const dishTranslations = {
    "Капучіно": { en: "Cappuccino", descEn: "Espresso with milk foam" },
    "Американо": { en: "Americano", descEn: "Black coffee" },
    "Чізкейк": { en: "Cheesecake", descEn: "Sweet cheese dessert" },
    "Цезар": { en: "Caesar Salad", descEn: "Salad with chicken and Caesar sauce" },
    "Цезар з креветкою": { en: "Prawn Caesar", descEn: "Classic Caesar with prawns" }
};

const adminTranslations = {
    uk: {
        title: "SmartFood - Адмін",
        addDish: "➕ Додати нову страву",
        order: "Замовлення",
        table: "Стіл",
        status: "Статус",
        noOrders: "Поки що активних замовлень немає.",
        save: "Зберегти",
        update: "Оновити",
        cookAction: "👨‍🍳 Почати готувати",
        readyAction: "✅ Готово",
        deliverAction: "🏃 Подати",
        logout: "Вийти",
        logoutConfirm: "Ви впевнені, що хочете вийти?",
        ordersTab: "📋 Замовлення",
        menuTab: "🍔 Керування меню",
        manageMenu: "Керування меню",
        editDish: "Редагувати страву",
        deleteConfirm: "Ви впевнені, що хочете видалити цю страву?",
        category: "Категорія",
        description: "Опис",
        price: "Ціна",
        total: "Сума",
        reset: "🔄 Скинути",
        delete: "🗑 Видалити",
        deleteOrderConfirm: "Видалити замовлення?"
    },
    en: {
        title: "SmartFood Admin",
        addDish: "➕ Add New Dish",
        order: "Order",
        table: "Table",
        status: "Status",
        noOrders: "No active orders for now.",
        save: "Save",
        update: "Update",
        cookAction: "👨‍🍳 Start Cooking",
        readyAction: "✅ Ready",
        deliverAction: "🏃 Deliver",
        logout: "Logout",
        logoutConfirm: "Are you sure you want to logout?",
        ordersTab: "📋 Orders",
        menuTab: "🍔 Manage Menu",
        manageMenu: "Menu Management",
        editDish: "Edit Dish",
        deleteConfirm: "Are you sure you want to delete this dish?",
        category: "Category",
        description: "Description",
        price: "Price",
        total: "Total",
        reset: "🔄 Reset",
        delete: "🗑 Delete",
        deleteOrderConfirm: "Delete this order?"
    }
};

let currentLang = localStorage.getItem('lang') || 'uk';

function changeLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('lang', lang);
    
    updateInterface();
    
    if (window.allDishes) {
        renderMenu(window.allDishes);
    }
    updateCartUI();
}

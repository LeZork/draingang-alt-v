let currentHouse = null;
let isAlt = false;

try {
    isAlt = 'alt' in window;
} catch (e) {
    console.log('Not in alt:V environment');
}

// Инициализация UI
document.addEventListener('DOMContentLoaded', () => {
    if (isAlt) {
        alt.on('house:showInfo', showHouseInfo);
        alt.on('showNotification', showNotification);
        alt.on('garage:showVehicles', showGarageVehicles);
    }
});

// Функция для отображения информации о доме
function showHouseInfo(house) {
    if (!house) {
        console.error('Received null house data');
        return;
    }

    currentHouse = house;
    const houseInfo = document.getElementById('house-info');
    if (!houseInfo) {
        console.error('House info element not found');
        return;
    }
    
    let status = house.isOwner ? 'Ваш дом' : (house.owner_id ? 'Продано' : 'Доступно для покупки');
    let info = `
        <div>
            <p>Статус: ${status}</p>
            <p>Цена: $${house.price.toLocaleString()}</p>
            <p>Гаражных мест: ${house.maxGarageSlots}</p>
        </div>
    `;
    
    houseInfo.innerHTML = info;
    
    // Обновляем видимость кнопок в зависимости от статуса дома
    updateButtons(house.isOwner);
}

// Обновление видимости кнопок
function updateButtons(isOwner) {
    const purchaseBtn = document.querySelector('button[onclick="purchaseHouse()"]');
    const enterBtn = document.querySelector('button[onclick="enterHouse()"]');
    const garageBtn = document.querySelector('button[onclick="enterGarage()"]');
    
    if (isOwner) {
        // Это ваш дом
        purchaseBtn.style.display = 'none';
        enterBtn.style.display = 'block';
        garageBtn.style.display = 'block';
    } else {
        // Дом не ваш
        purchaseBtn.style.display = 'block';
        enterBtn.style.display = 'none';
        garageBtn.style.display = 'none';
    }
}

// Функции для кнопок
function purchaseHouse() {
    if (!currentHouse || !isAlt) return;
    
    alt.emit('houses:tryPurchase', currentHouse.id);
}

function enterHouse() {
    if (!currentHouse || !isAlt) return;
    
    alt.emit('houses:enterHouse', currentHouse.id);
    closeMenu();
}

function enterGarage() {
    if (!currentHouse || !isAlt) return;
    
    alt.emit('houses:enterGarage', currentHouse.id);
    closeMenu();
}

// Закрытие меню
function closeMenu() {
    if (isAlt) {
        try {
            alt.emit('houses:closeMenu');
        } catch (error) {
            console.error('Error closing menu:', error);
        }
    }
}

// Обработчики ответов от сервера
if (isAlt) {
    alt.on('houses:purchaseResponse', (success, message) => {
        if (success) {
            // Обновляем UI после успешной покупки
            currentHouse.owner_id = true; // Временно устанавливаем true для обновления UI
            updateButtons(true);
        }
        showNotification(message);
    });
}

// Вспомогательная функция для отображения уведомлений
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Добавляем обработчик клавиши Escape для закрытия меню
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isAlt) {
        closeMenu();
    }
});

// Добавляем стили для уведомлений
const style = document.createElement('style');
style.textContent = `
    .notification {
        position: fixed;
        bottom: 20px;
        right: 20px;
        background: rgba(0, 0, 0, 0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        animation: fadeIn 0.3s, fadeOut 0.3s 2.7s;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; }
        to { opacity: 0; }
    }
`;
document.head.appendChild(style);

// Добавляем функцию отображения автомобилей
function showGarageVehicles(vehicles) {
    const garageInfo = document.createElement('div');
    garageInfo.className = 'garage-info';
    
    let html = '<h3>Ваши автомобили:</h3>';
    if (vehicles.length === 0) {
        html += '<p>В гараже нет автомобилей</p>';
    } else {
        vehicles.forEach(vehicle => {
            html += `<div class="vehicle-item">
                <p>Модель: ${vehicle.model}</p>
                <p>Номер: ${vehicle.plate}</p>
            </div>`;
        });
    }
    
    garageInfo.innerHTML = html;
    document.body.appendChild(garageInfo);
} 
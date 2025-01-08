let modifications = {};
let currentCategory = null;
let isRotating = false;
let rotationDirection = null;

// Проверяем окружение
const isAlt = typeof alt !== 'undefined';

if (window.alt === undefined) {
    window.alt = {
      emit: () => { },
      on: () => { },
    };
  }

// Создаем HTML для категорий
function createCategoryElement(category) {
    const div = document.createElement('div');
    div.className = 'category';
    div.onclick = () => selectCategory(category.name);

    // Добавляем иконку в зависимости от категории
    const icon = getCategoryIcon(category.name);
    div.innerHTML = `
        <img src="img/icon/${icon}.svg" width="24" height="24">
        <span>${category.displayName}</span>
    `;

    return div;
}

// Получаем иконку для категории
function getCategoryIcon(category) {
    const icons = {
        'engine': 'Engine',
        'brakes': 'Wheels',
        'transmission': 'Engine',
        'suspension': 'Wheels',
        'turbo': 'Engine',
        'spoiler': 'Car',
        'paint': 'Color',
        'wheels': 'Wheels',
        'xenon': 'Light'
    };
    return icons[category] || 'Question';
}

// Выбор категории
function selectCategory(categoryName) {
    currentCategory = categoryName;
    
    // Обновляем активную категорию визуально
    document.querySelectorAll('.category').forEach(cat => {
        cat.classList.remove('active');
        if (cat.querySelector('span').textContent === modifications[categoryName]?.displayName) {
            cat.classList.add('active');
        }
    });

    // Показываем модификации для выбранной категории
    showModifications(categoryName);
}

// Показать модификации для категории
function showModifications(categoryName) {
    const upgradesDiv = document.querySelector('.upgrades');
    upgradesDiv.innerHTML = '';

    const mods = modifications[categoryName];
    if (!mods) return;

    mods.forEach(mod => {
        const modDiv = document.createElement('div');
        modDiv.className = 'modification';
        modDiv.innerHTML = `
            <span class="mod-name">${mod.name}</span>
            <span class="mod-price">$${mod.price}</span>
            <div class="mod-buttons">
                <button class="preview-btn" onclick="previewModification(${mod.id}, '${categoryName}')">Предпросмотр</button>
                <button class="buy-btn" onclick="applyModification(${mod.id}, '${categoryName}', ${mod.price})">Купить</button>
            </div>
        `;
        upgradesDiv.appendChild(modDiv);
    });
}

// Инициализация меню тюнинга
function initializeTuningMenu() {
    console.log('=== Initializing tuning menu ===');
    const categories = document.querySelector('.categories');
    
    if (!categories) {
        console.error('Categories container not found!');
        return;
    }
    
    console.log('Categories container found');
    categories.innerHTML = '';

    console.log('Available modifications:', modifications);
    console.log('Modifications type:', typeof modifications);
    console.log('Modifications keys:', Object.keys(modifications));

    if (Object.keys(modifications).length === 0) {
        console.warn('No modifications available!');
        return;
    }

    // Создаем элементы для каждой категории
    Object.entries(modifications).forEach(([categoryName, mods]) => {
        console.log(`Processing category: ${categoryName}`);
        console.log('Category mods:', mods);
        
        if (mods && mods.length > 0) {
            const category = {
                name: categoryName,
                displayName: getDisplayName(categoryName)
            };
            console.log('Creating category element:', category);
            categories.appendChild(createCategoryElement(category));
        } else {
            console.warn(`Empty mods for category: ${categoryName}`);
        }
    });

    // Выбираем первую категорию по умолчанию
    const firstCategory = Object.keys(modifications)[0];
    if (firstCategory) {
        console.log('Selecting first category:', firstCategory);
        selectCategory(firstCategory);
    } else {
        console.warn('No categories available');
    }
}

// Получаем отображаемое имя категории
function getDisplayName(category) {
    const displayNames = {
        'engine': 'Двигатель',
        'brakes': 'Тормоза',
        'transmission': 'Трансмиссия',
        'suspension': 'Подвеска',
        'turbo': 'Турбо',
        'spoiler': 'Спойлер',
        'frontBumper': 'Передний бампер',
        'rearBumper': 'Задний бампер',
        'sideSkirt': 'Боковые юбки',
        'exhaust': 'Выхлопная система',
        'frame': 'Каркас',
        'grille': 'Решетка',
        'hood': 'Капот',
        'fender': 'Крыло',
        'rightFender': 'Правое крыло',
        'roof': 'Крыша',
        'horns': 'Клаксон',
        'armor': 'Броня',
        'xenon': 'Ксенон',
        'frontWheels': 'Передние колёса',
        'backWheels': 'Задние колёса',
        'plateHolder': 'Рамка номера',
        'trimDesign': 'Дизайн салона',
        'ornaments': 'Украшения',
        'dialDesign': 'Дизайн приборной панели',
        'steeringWheel': 'Руль',
        'shiftLever': 'Рычаг КПП',
        'hydraulics': 'Гидравлика',
        'windows': 'Тонировка',
        'livery': 'Ливрея',
        'paint': 'Покраска',
        'pearlescentColor': 'Перламутр',
        'wheelColor': 'Цвет дисков',
        'neonColor': 'Неон',
        'windowTint': 'Тонировка'
    };
    return displayNames[category] || category;
}

// Обработчики событий от сервера
if (isAlt) {
    alt.on('tuning:receiveMods', (mods) => {
        console.log('Received mods:', mods);
        if (!mods || Object.keys(mods).length === 0) {
            console.error('Received empty mods object!');
            return;
        }
        modifications = mods;
        initializeTuningMenu();
    });

    // Добавляем проверку подключения к alt
    console.log('Alt environment detected:', !!alt);
    console.log('Emitting tuning:requestMods');
    alt.emit('tuning:requestMods');

    alt.on('tuning:error', (message) => {
        console.log('Tuning error:', message);
        showNotification(message);
    });

    alt.on('tuning:modApplied', (category, modId) => {
        showNotification('Модификация успешно установлена!');
        if (isAlt) {
            alt.emit('tuning:requestMods');
        }
    });
}

// Функции вращения
function startRotate(direction) {
    console.log('WebView: Start rotate:', direction);
    if (isAlt) {
        isRotating = true;
        rotationDirection = direction;
        alt.emit('tuning:webview:rotateVehicle', direction);
    }
}

function stopRotate() {
    console.log('WebView: Stop rotate');
    if (isAlt) {
        isRotating = false;
        rotationDirection = null;
        alt.emit('tuning:webview:stopRotate');
    }
}

// Функции модификаций
function previewModification(modId, category) {
    console.log('Preview:', modId, category);
    if (!category) return;
    
    const buttons = document.querySelectorAll('.preview-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
    
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    if (isAlt) {
        // Отправляем событие клиенту
        alt.emit('tuning:webview:previewMod', {
            category: category,
            modId: modId
        });
    }
}

function applyModification(modId, category, price) {
    console.log('Attempting to apply modification:', { modId, category, price });
    if (isAlt) {
        alt.emit('tuning:webview:applyMod', {
            category: category,
            modId: modId,
            price: price
        });
    }
}

// Добавляем функцию отмены предпросмотра
function cancelPreview() {
    if (isAlt) {
        alt.emit('tuning:cancelPreview');
    }
    
    const buttons = document.querySelectorAll('.preview-btn');
    buttons.forEach(btn => btn.classList.remove('active'));
}

// Остальные функции без изменений...

function openTuningMenu() {
    if (isAlt) {
        alt.emit('tuning:requestMods');
    }
}

function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.remove();
    }, 3000);
}

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, requesting mods');
    if (isAlt) {
        alt.emit('tuning:requestMods');
    }
});

// Добавляем обработчик загрузки страницы
document.addEventListener('DOMContentLoaded', checkHTMLStructure);

// Добавляем проверку HTML структуры
function checkHTMLStructure() {
    const categories = document.querySelector('.categories');
    const upgrades = document.querySelector('.upgrades');
    
    if (!categories) {
        console.error('Categories container is missing!');
    }
    
    if (!upgrades) {
        console.error('Upgrades container is missing!');
    }
    
    return categories && upgrades;
}

// Добавляем функции для слайдера
function scrollCategories(direction) {
    const container = document.querySelector('.categories');
    const scrollAmount = 100; // Можно настроить
    
    if (direction === 'left') {
        container.scrollTop -= scrollAmount;
    } else {
        container.scrollTop += scrollAmount;
    }
}

let menuState = {
    isOpen: false,
    currentCategory: null,
    currentModification: null
};

function updateMenuState(newState) {
    menuState = { ...menuState, ...newState };
    // Обновить интерфейс в соответствии с новым состоянием
}

// Добавить обработчик ошибок
if (isAlt) {
    alt.on('tuning:error', (message) => {
        showNotification(message);
    });
}

// Добавляем обработчик клавиши Escape
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        console.log('Escape pressed in WebView');
        if (isAlt) {
            alt.emit('tuning:webview:exit');
        }
    }
});

// Добавляем обработчики для кнопок вращения
document.addEventListener('mousedown', (event) => {
    const target = event.target;
    if (target.classList.contains('rotate-left')) {
        startRotate('left');
    } else if (target.classList.contains('rotate-right')) {
        startRotate('right');
    }
});

document.addEventListener('mouseup', (event) => {
    const target = event.target;
    if (target.classList.contains('rotate-left') || target.classList.contains('rotate-right')) {
        stopRotate();
    }
});

// Добавляем обработчик для остановки вращения при потере фокуса
window.addEventListener('blur', () => {
    if (isRotating) {
        stopRotate();
    }
});

// client/index.js
import * as alt from 'alt-client';
import * as native from 'natives';

const isAlt = true; // На клиенте всегда true

const modCategories = {
    0: { name: 'spoiler' },
    1: { name: 'frontBumper' },
    2: { name: 'rearBumper' },
    3: { name: 'sideSkirt' },
    4: { name: 'exhaust' },
    5: { name: 'frame' },
    6: { name: 'grille' },
    7: { name: 'hood' },
    8: { name: 'fender' },
    9: { name: 'rightFender' },
    10: { name: 'roof' },
    11: { name: 'engine' },
    12: { name: 'brakes' },
    13: { name: 'transmission' },
    14: { name: 'horns' },
    15: { name: 'suspension' },
    16: { name: 'armor' },
    18: { name: 'turbo' },
    22: { name: 'xenon' },
    23: { name: 'frontWheels' },
    24: { name: 'backWheels' },
    25: { name: 'plateHolder' },
    27: { name: 'trimDesign' },
    28: { name: 'ornaments' },
    30: { name: 'dialDesign' },
    33: { name: 'steeringWheel' },
    34: { name: 'shiftLever' },
    38: { name: 'hydraulics' },
    46: { name: 'windows' },
    48: { name: 'livery' }
};

let view = null;
const url = 'http://resource/client/html/index.html';

let vehicle = null;
let shopId = null;
let isActive = false;

// Создаем маркеры при загрузке ресурса
alt.on('connectionComplete', () => {
    alt.emitServer('tuning:requestMarkers');
});

// Получаем данные о маркерах от сервера
alt.onServer('tuning:loadMarkers', (markers) => {
    markers.forEach(shop => {
        const pos = shop.marker_position;
        const color = new alt.RGBA(255, 239, 0); // Желтый цвет для тюнинг-маркера
        const marker = new alt.Marker(1, pos, color);
        marker.setMeta("type", "tuning");
        marker.setMeta("data", { id: shop.id });
    });
});

// Обработчик нажатия клавиши E
alt.on('keyup', (key) => {
    if (isActive) return;
    
    if (key === 69) { // Клавиша E
        alt.log('E pressed');
        const player = alt.Player.local;
        
        alt.log('Vehicle:', player.vehicle ? 'Yes' : 'No');
        if (player.vehicle) {
            alt.log('Seat:', player.seat);
            alt.log('Is driver:', player.vehicle.driver === player);
        }
        
        if (player.vehicle && player.seat === 1) {
            alt.log('Player in vehicle as driver');
            
            let nearestMarker = null;
            let shortestDistance = 999;

            // Проверяем все маркеры
            alt.Marker.all.forEach(marker => {
                if (marker.getMeta("type") === "tuning") {
                    // Используем native.getDistanceBetweenCoords вместо alt.Vector3.distance
                    const dist = native.getDistanceBetweenCoords(
                        player.pos.x, 
                        player.pos.y, 
                        player.pos.z,
                        marker.pos.x,
                        marker.pos.y,
                        marker.pos.z,
                        false
                    );
                    
                    alt.log('Distance to marker:', dist);
                    if (dist < shortestDistance && dist <= 5) {
                        shortestDistance = dist;
                        nearestMarker = marker;
                    }
                }
            });

            if (nearestMarker) {
                alt.log('Found nearest marker');
                isActive = true;
                const data = nearestMarker.getMeta("data");
                shopId = data.id;
                vehicle = player.vehicle;
                openTuningMenu();
            } else {
                alt.log('No nearby markers found');
            }
        } else {
            alt.log('Player is not a driver');
        }
    } else if (key === 27) { // Клавиша Escape
        alt.log('Escape pressed, isActive:', isActive);
        if (isActive) {
            alt.log('Closing tuning menu...');
            closeTuningMenu();
        }
    }
});

function openTuningMenu() {
    if (!vehicle || !shopId) {
        alt.log('Error: Missing vehicle or shop ID');
        return;
    }
    
    alt.log('=== Opening tuning menu ===');
    
    // Отправляем событие входа в тюнинг
    alt.emitServer('tuning:enter');
    
    if (!view) {
        alt.log('Creating new WebView');
        view = new alt.WebView(url);
        setupTuningMenuHandlers();
    }
    
    alt.log('Focusing view');
    view.focus();
    
    if (vehicle) {
        alt.log('Freezing vehicle position');
        native.freezeEntityPosition(vehicle, true);
    }
    
    alt.log('Disabling game controls');
    alt.toggleGameControls(false);
    alt.showCursor(true);

    // Добавляем обработчики событий от WebView
view.on('tuning:webview:previewMod', (data) => {
    alt.log('Received preview request from WebView:', data);
    // Пересылаем событие на сервер
    alt.emitServer('tuning:previewMod', data);
});

view.on('tuning:webview:applyMod', (data) => {
    alt.log('Received apply request from WebView:', data);
    // Проверяем структуру данных перед отправкой
    if (!data || !data.category || data.modId === undefined || !data.price) {
        alt.log('Invalid modification data:', data);
        return;
    }
    alt.emitServer('tuning:applyMod', data);
});

// Добавляем обработчики для вращения
view.on('tuning:webview:rotateVehicle', (direction) => {
    alt.log('Received rotate request:', direction);
    startRotate(direction);
});

view.on('tuning:webview:stopRotate', () => {
    alt.log('Received stop rotate request');
    stopRotate();
});

view.on('tuning:webview:exit', () => {
    alt.log('Exit requested from WebView');
    closeTuningMenu();
});
}

function setupTuningMenuHandlers() {
    alt.log('Setting up tuning menu handlers');
    
    // Запрашиваем модификации при открытии меню
    alt.log('Requesting mods from server');
    alt.emitServer('tuning:requestMods');
    
    // Обработчик получения модификаций
    alt.onServer('tuning:receiveMods', (mods) => {
        alt.log('Received mods from server:', mods);
        if (view) {
            view.emit('tuning:receiveMods', mods);
        } else {
            alt.log('Error: WebView not found when receiving mods');
        }
    });

    view.on('tuning:webview:rotateVehicle', (direction) => {
        alt.log('Received rotate request:', direction);
        startRotate(direction);
    });
    
    view.on('tuning:webview:stopRotate', () => {
        alt.log('Received stop rotate request');
        stopRotate();
    });
}

function closeTuningMenu() {
    alt.log('=== Closing tuning menu ===');
    
    // Останавливаем вращение если оно активно
    if (isRotating) {
        stopRotate();
    }

    if (view) {
        alt.log('Destroying WebView');
        view.unfocus();
        view.destroy();
        view = null;
    }
    
    if (vehicle) {
        alt.log('Unfreezing vehicle position');
        native.freezeEntityPosition(vehicle, false);
    }
    
    alt.log('Enabling game controls');
    alt.toggleGameControls(true);
    alt.showCursor(false);
    
    // Отправляем событие на сервер после всех локальных действий
    alt.emitServer('tuning:exit');
    
    isActive = false;
    vehicle = null;
    shopId = null;
}

// Обработчик для принудительного закрытия
alt.on('tuning:forceClose', () => {
    if (isActive) {
        closeTuningMenu();
    }
});

// Обработчик клавиш для остановки вращения
alt.on('keyup', (key) => {
    if (isActive && isRotating) {
        stopRotate();
    }
});

// Обновляем обработчик для вращения
alt.everyTick(() => {
    if (isRotating && vehicle) {
        const rotation = vehicle.rot;
        const rotationSpeed = 0.5; // Уменьшили скорость вращения
        
        if (rotationDirection === 'left') {
            vehicle.rot = new alt.Vector3(rotation.x, rotation.y, rotation.z + rotationSpeed);
        } else if (rotationDirection === 'right') {
            vehicle.rot = new alt.Vector3(rotation.x, rotation.y, rotation.z - rotationSpeed);
        }
    }
});

// Добавляем обработчики для вращения и модификаций
alt.on('tuning:previewMod', (data) => {
    if (!vehicle) return;
    const { category, modId } = data;
    alt.emitServer('tuning:previewMod', { category, modId });
});

alt.on('tuning:applyMod', (data) => {
    if (!vehicle) return;
    const { category, modId, price } = data;
    alt.emitServer('tuning:applyMod', { category, modId, price });
});

// Обновляем обработчики вращения
alt.on('tuning:rotateVehicle', (direction) => {
    isRotating = true;
    rotationDirection = direction;
});

alt.on('tuning:stopRotate', () => {
    isRotating = false;
    rotationDirection = null;
});

// Добавляем обработчики событий от сервера
alt.onServer('tuning:previewMod', (category, modId) => {
    if (!vehicle) return;
    vehicle.modKit = 1;
    applyModification(vehicle, category, modId);
});

alt.onServer('tuning:modApplied', (category, modId) => {
    if (view) {
        view.emit('tuning:modApplied', category, modId);
        // Запросить обновленный список модификаций
        alt.emitServer('tuning:requestMods');
    }
});

// Добавляем функцию применения модификаций
function applyModification(vehicle, category, modId) {
    try {
        switch(category) {
            case 'paint':
                vehicle.primaryColor = parseInt(modId);
                break;
            case 'pearlescentColor':
                vehicle.pearlescentColor = parseInt(modId);
                break;
            case 'wheelColor':
                vehicle.wheelColor = parseInt(modId);
                break;
            default:
                const modType = getModTypeByCategory(category);
                if (modType !== null) {
                    native.setVehicleMod(vehicle, modType, parseInt(modId), false);
                }
                break;
        }
    } catch (error) {
        alt.log('Error applying modification:', error);
    }
}

// Добавляем вспомогательную функцию
function getModTypeByCategory(category) {
    for (const [modType, data] of Object.entries(modCategories)) {
        if (data.name === category) {
            return parseInt(modType);
        }
    }
    return null;
}

// Обновляем функции для вращения
let rotationInterval = null;
let isRotating = false;
let rotationDirection = null;

function startRotate(direction) {
    alt.log('Starting rotation:', direction);
    
    if (!vehicle) {
        alt.log('No vehicle to rotate');
        return;
    }

    if (isRotating) {
        alt.log('Already rotating');
        return;
    }

    isRotating = true;
    rotationDirection = direction;
    const rotationSpeed = direction === 'left' ? -1.0 : 1.0;

    rotationInterval = alt.setInterval(() => {
        if (!vehicle || !isRotating) {
            stopRotate();
            return;
        }

        const currentRotation = vehicle.rot;
        vehicle.rot = new alt.Vector3(
            currentRotation.x,
            currentRotation.y,
            currentRotation.z + rotationSpeed
        );
    }, 16); // ~60 FPS

    alt.log('Rotation started with interval:', rotationInterval);
}

function stopRotate() {
    alt.log('Stopping rotation');
    
    if (!isRotating) {
        alt.log('Not rotating');
        return;
    }

    if (rotationInterval) {
        alt.clearInterval(rotationInterval);
        rotationInterval = null;
        alt.log('Rotation interval cleared');
    }

    isRotating = false;
    rotationDirection = null;
}

// Добавляем обработчик клавиш для остановки вращения при отпускании кнопки мыши
alt.on('keyup', (key) => {
    if (isActive && isRotating) {
        stopRotate();
    }
});


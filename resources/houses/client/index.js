import * as alt from 'alt-client';
import * as native from 'natives';
import { houses, interactionDistance } from '../shared/config.js';
import './blips.js';

alt.log('Houses client script loaded'); // Отладка

let currentNearestHouse = null;
let view = null;

// Добавляем состояние для отслеживания открытого меню
let isMenuOpen = false;

const DEBUG = false;

function debugLog(...args) {
    if (DEBUG) {
        alt.log('[Houses Debug]', ...args);
    }
}

// Используем в важных местах
debugLog('Player location:', getPlayerLocation(alt.Player.local));
debugLog('Nearest house:', currentNearestHouse);

// Добавляем обработчик события входа в транспорт
alt.on('enteredVehicle', (vehicle, seat) => {
    // Проверяем, находится ли автомобиль в гараже
    if (vehicle.getMeta('garageHouseId')) {
        updateHelpText('Нажмите ~INPUT_CONTEXT~ чтобы выехать из гаража');
    }
});

// Добавляем обработчик события выхода из транспорта
alt.on('leftVehicle', (vehicle, seat) => {
    // Если игрок вышел из машины в гараже, очищаем подсказку
    if (vehicle.getMeta('garageHouseId')) {
        updateHelpText('');
    }
});

alt.everyTick(() => {
    const player = alt.Player.local;
    let tempNearestHouse = null;
    let minDistance = Infinity;
    let helpText = '';
    
    // Если игрок в машине в гараже, показываем подсказку
    if (player.vehicle && player.vehicle.getMeta('garageHouseId')) {
        helpText = 'Нажмите ~INPUT_CONTEXT~ чтобы выехать из гаража';
        // Находим соответствующий дом
        const garageHouseId = player.vehicle.getMeta('garageHouseId');
        const house = houses.find(h => h.id === garageHouseId);
        if (house) {
            tempNearestHouse = { ...house, interactionType: 'garage_exit' };
        }
    } else {
        // Отрисовка маркеров для всех домов
        for (const house of houses) {
            // Маркер входа в дом
            showHouseMarker(house);
            
            // Маркер входа в гараж
            showGarageMarker(house);
            
            // Маркер выхода из дома
            showExitMarker(house.interiorExitPosition);
            
            // Маркер выхода из гаража
            showExitMarker(house.garageInteriorExitPosition);
            
            // Остальная логика проверки расстояний...
            const houseDist = distance(player.pos, house.position);
            const garageDist = distance(player.pos, house.garagePosition);
            
            if (houseDist <= interactionDistance && houseDist < minDistance) {
                minDistance = houseDist;
                tempNearestHouse = { ...house, interactionType: 'house' };
                helpText = 'Нажмите ~INPUT_CONTEXT~ чтобы открыть меню дома';
            }
            if (garageDist <= interactionDistance && garageDist < minDistance) {
                minDistance = garageDist;
                tempNearestHouse = { ...house, interactionType: 'garage' };
                helpText = 'Нажмите ~INPUT_CONTEXT~ чтобы открыть меню гаража';
            }
            
            // Проверяем выходы
            const interiorDist = distance(player.pos, house.interiorExitPosition);
            const garageInteriorDist = distance(player.pos, house.garageInteriorExitPosition);
            
            if (interiorDist <= interactionDistance) {
                helpText = 'Нажмите ~INPUT_CONTEXT~ чтобы выйти из дома';
            }
            
            // Изменяем проверку для гаража
            if (player.vehicle) {
                // Если игрок в машине, проверяем только координаты Z (высоту)
                const zDiff = Math.abs(player.pos.z - house.garageInteriorExitPosition.z);
                if (zDiff < 5.0) { // Допустимая разница по высоте
                    helpText = 'Нажмите ~INPUT_CONTEXT~ чтобы выехать из гаража';
                    tempNearestHouse = { ...house, interactionType: 'garage_exit' };
                }
            } else if (garageInteriorDist <= interactionDistance) {
                // Для пешехода оставляем старую проверку
                helpText = 'Нажмите ~INPUT_CONTEXT~ чтобы выйти из гаража';
                tempNearestHouse = { ...house, interactionType: 'garage_exit' };
            }
        }
    }

    // Обновляем глобальную переменную
    currentNearestHouse = tempNearestHouse;

    // Показываем подсказку
    updateHelpText(helpText);
});

alt.on('keyup', (key) => {
    if (key === 69) { // E
        const player = alt.Player.local;
        
        // Если игрок в машине в гараже
        if (player.vehicle) {
            const garageHouseId = player.vehicle.getMeta('garageHouseId');
            if (garageHouseId) {
                alt.log('Attempting to exit garage in vehicle');
                alt.emitServer('houses:exitGarage', garageHouseId);
                return;
            }
        }
        
        // Проверяем, находится ли игрок рядом с домом
        if (currentNearestHouse) {
            if (currentNearestHouse.interactionType === 'house') {
                alt.log('Attempting to show house menu');
                showHouseMenu(currentNearestHouse);
            } else if (currentNearestHouse.interactionType === 'garage') {
                alt.log('Attempting to show garage menu');
                showHouseMenu(currentNearestHouse);
            } else if (currentNearestHouse.interactionType === 'garage_exit') {
                alt.log('Attempting to exit garage');
                alt.emitServer('houses:exitGarage', currentNearestHouse.id);
            }
            return;
        }
        
        // Проверяем выход из дома/гаража для пешехода
        for (const house of houses) {
            if (distance(player.pos, house.interiorExitPosition) <= interactionDistance) {
                alt.log('Attempting to exit house');
                alt.emitServer('houses:exitHouse', house.id);
                return;
            }
            if (!player.vehicle && distance(player.pos, house.garageInteriorExitPosition) <= interactionDistance) {
                alt.log('Attempting to exit garage');
                alt.emitServer('houses:exitGarage', house.id);
                return;
            }
        }
    }

    if (key === 27 && isMenuOpen) { // ESC
        closeHouseMenu();
    }
});

function showHouseMarker(house) {
    native.drawMarker(
        1, 
        house.position.x, 
        house.position.y, 
        house.position.z - 1.0,
        0, 0, 0, 0, 0, 0, 
        1.0, 1.0, 1.0,
        255, 255, 0, 100,
        false, false, 2, false, null, null, false
    );
}

let cursorVisible = false;

function showHouseMenu(house) {
    try {
        if (!house) {
            alt.log('Error: No house data provided');
            return;
        }

        if (!view) {
            view = new alt.WebView('http://resource/client/ui/house.html');
            
            // Добавляем все необходимые обработчики
            view.on('houses:tryPurchase', (houseId) => {
                alt.emitServer('houses:tryPurchase', houseId);
            });
            
            view.on('houses:enterHouse', (houseId) => {
                alt.emitServer('houses:enterHouse', houseId);
                closeHouseMenu();
            });
            
            view.on('houses:enterGarage', (houseId) => {
                alt.emitServer('houses:enterGarage', houseId);
                closeHouseMenu();
            });

            view.on('houses:closeMenu', () => {
                closeHouseMenu();
            });
        }

        view.focus();
        isMenuOpen = true;
        if (!cursorVisible) {
            alt.showCursor(true);
            cursorVisible = true;
        }
        alt.toggleGameControls(false);
        alt.emitServer('houses:requestHouseInfo', house.id);
    } catch (error) {
        alt.log('Error showing house menu:', error);
        if (view) {
            closeHouseMenu();
        }
    }
}

function closeHouseMenu() {
    if (view) {
        view.unfocus();
        view.destroy();
        view = null;
    }
    isMenuOpen = false;
    if (cursorVisible) {
        alt.showCursor(false);
        cursorVisible = false;
    }
    alt.toggleGameControls(true);
}

// Обработчики ответов от сервера
alt.onServer('houses:purchaseResponse', (success, message) => {
    // Показать уведомление игроку
    showNotification(message);
});

alt.onServer('houses:showGarageVehicles', (vehicles) => {
    // Отобразить UI с транспортом в гараже
    showGarageUI(vehicles);
});

// Добавляем функцию расчета дистанции
function distance(pos1, pos2) {
    return Math.sqrt(
        Math.pow(pos1.x - pos2.x, 2) +
        Math.pow(pos1.y - pos2.y, 2) +
        Math.pow(pos1.z - pos2.z, 2)
    );
}

// Добавляем функцию для отображения UI гаража
function showGarageUI(vehicles) {
    if (view) {
        view.emit('garage:showVehicles', vehicles);
    }
}

function showNotification(message) {
    if (view) {
        view.emit('showNotification', message);
    }
}

// Добавляем функцию для маркера гаража
function showGarageMarker(house) {
    native.drawMarker(
        1, 
        house.garagePosition.x, 
        house.garagePosition.y, 
        house.garagePosition.z - 1.0,
        0, 0, 0, 0, 0, 0, 
        1.0, 1.0, 1.0,
        255, 165, 0, 100, // Оранжевый цвет для гаража
        false, false, 2, false, null, null, false
    );
}

function showExitMarker(position) {
    if (!position) return;

    // Добавляем стрелку над маркером
    native.drawMarker(
        21, // Тип маркера - стрелка
        position.x, 
        position.y, 
        position.z + 1.0, // Поднимаем стрелку выше
        0, 0, 0,
        180.0, 0, 0, // Разворачиваем стрелку вниз
        0.8, 0.8, 0.8, // Уменьшаем размер
        255, 0, 0, 200, // Более яркий красный цвет
        true, false, 2, true, null, null, false
    );

    // Основной маркер
    native.drawMarker(
        1, 
        position.x, 
        position.y, 
        position.z - 1.0,
        0, 0, 0,
        0, 0, 0, 
        1.0, 1.0, 1.0,
        255, 0, 0, 100,
        false, false, 2, false, null, null, false
    );
}

// Добавляем обработчик закрытия меню
alt.on('houses:closeMenu', () => {
    if (view) {
        view.unfocus();
        view.destroy();
        view = null;
        alt.showCursor(false);
        alt.toggleGameControls(true);
    }
});

// Добавляем обработчик получения информации о доме
alt.onServer('houses:receiveHouseInfo', (houseInfo) => {
    if (view) {
        view.emit('house:showInfo', houseInfo);
    }
});

// Обновим обработчики входа в дом и гараж
alt.onServer('houses:enterHouse', () => {
    closeHouseMenu();
});

alt.onServer('houses:enterGarage', () => {
    closeHouseMenu();
});

// Добавим обработчики для подтверждения телепортации
alt.onServer('houses:exitHouse', () => {
    alt.log('Exited house');
});

alt.onServer('houses:exitGarage', () => {
    alt.log('Exited garage');
});

function getPlayerLocation(player) {
    for (const house of houses) {
        // Проверяем выход из дома
        if (distance(player.pos, house.interiorExitPosition) <= interactionDistance) {
            debugLog('Player near house exit:', house.id);
            return { type: 'house_interior', houseId: house.id };
        }
        
        // Проверяем выход из гаража
        if (distance(player.pos, house.garageInteriorExitPosition) <= interactionDistance) {
            debugLog('Player near garage exit:', house.id);
            return { type: 'garage_interior', houseId: house.id };
        }
        
        // Проверяем вход в дом
        if (distance(player.pos, house.position) <= interactionDistance) {
            debugLog('Player near house entrance:', house.id);
            return { type: 'house_entrance', houseId: house.id };
        }
        
        // Проверяем вход в гараж
        if (distance(player.pos, house.garagePosition) <= interactionDistance) {
            debugLog('Player near garage entrance:', house.id);
            return { type: 'garage_entrance', houseId: house.id };
        }
    }
    return { type: 'outside' };
}

function showHelpText(text) {
    if (!text) return;
    
    // Очищаем предыдущий текст
    native.clearPrints();
    
    // Рисуем фон
    const safeZone = native.getSafeZoneSize();
    const screenX = (1.0 - safeZone) * 0.5;
    const screenY = (1.0 - safeZone) * 0.5;
    
    // Увеличиваем ширину фона и смещаем его правее
    native.drawRect(
        0.85, // X позиция (смещаем левее)
        0.05, // Y позиция
        0.3, // Увеличиваем ширину
        0.05, // Высота
        0, // R
        0, // G
        0, // B
        150, // A
        false
    );
    
    // Отображаем текст
    native.beginTextCommandDisplayText('STRING');
    native.addTextComponentSubstringPlayerName(text);
    native.setTextFont(4);
    native.setTextScale(0.4, 0.4);
    native.setTextColour(255, 255, 255, 255);
    native.setTextCentre(true); // Центрируем текст
    native.setTextDropshadow(0, 0, 0, 0, 255);
    native.endTextCommandDisplayText(0.85, 0.03); // Позиционируем текст внутри фона
}

// Обновляем функцию для отображения текста с анимацией
let currentHelpText = '';
let helpTextOpacity = 0;

function updateHelpText(text) {
    if (!text) return;
    
    // Заменяем ~INPUT_CONTEXT~ на E
    text = text.replace('~INPUT_CONTEXT~', 'E');
    
    if (text !== currentHelpText) {
        currentHelpText = text;
        helpTextOpacity = 0;
    }
    
    if (currentHelpText) {
        helpTextOpacity = Math.min(helpTextOpacity + 0.1, 1);
        
        // Сначала рисуем фон
        native.drawRect(
            0.85, // x позиция
            0.05, // y позиция
            0.3, // ширина
            0.035, // высота
            0, // r
            0, // g
            0, // b
            Math.floor(helpTextOpacity * 180), // alpha
            false
        );
        
        // Затем рисуем текст
        native.setTextScale(0.4, 0.4);
        native.setTextFont(4);
        native.setTextColour(255, 255, 255, Math.floor(helpTextOpacity * 255));
        native.setTextCentre(true);
        native.setTextDropshadow(0, 0, 0, 0, 255);
        
        native.beginTextCommandDisplayText('STRING');
        native.addTextComponentSubstringPlayerName(currentHelpText);
        native.endTextCommandDisplayText(0.85, 0.04, 0); // Добавлен третий параметр
    }
} 
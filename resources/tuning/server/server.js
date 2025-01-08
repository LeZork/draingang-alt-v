import * as alt from 'alt-server';
import { SHOP_MARKERS } from './data.js';
import { query } from '../../database/server/index.js';
import { getMoney, addMoney, subtractMoney } from '../../money/server/exports.js';

let previewStates = new Map();
let originalVehicleStates = new Map();

// Полный список категорий с их настройками
const modCategories = {
    0: { name: 'spoiler', displayName: 'Спойлер', basePrice: 3000 },
    1: { name: 'frontBumper', displayName: 'Передний бампер', basePrice: 2500 },
    2: { name: 'rearBumper', displayName: 'Задний бампер', basePrice: 2500 },
    3: { name: 'sideSkirt', displayName: 'Боковые юбки', basePrice: 2000 },
    4: { name: 'exhaust', displayName: 'Выхлопная система', basePrice: 3500 },
    5: { name: 'frame', displayName: 'Каркас', basePrice: 4000 },
    6: { name: 'grille', displayName: 'Решетка', basePrice: 2000 },
    7: { name: 'hood', displayName: 'Капот', basePrice: 3000 },
    8: { name: 'fender', displayName: 'Крыло', basePrice: 2500 },
    9: { name: 'rightFender', displayName: 'Правое крыло', basePrice: 2500 },
    10: { name: 'roof', displayName: 'Крыша', basePrice: 3000 },
    11: { name: 'engine', displayName: 'Двигатель', basePrice: 5000 },
    12: { name: 'brakes', displayName: 'Тормоза', basePrice: 4500 },
    13: { name: 'transmission', displayName: 'Трансмиссия', basePrice: 7500 },
    14: { name: 'horns', displayName: 'Клаксон', basePrice: 1500 },
    15: { name: 'suspension', displayName: 'Подвеска', basePrice: 5000 },
    16: { name: 'armor', displayName: 'Броня', basePrice: 10000 },
    18: { name: 'turbo', displayName: 'Турбонаддув', basePrice: 15000 },
    22: { name: 'xenon', displayName: 'Ксенон', basePrice: 2500 },
    23: { name: 'frontWheels', displayName: 'Передние колёса', basePrice: 3000 },
    24: { name: 'backWheels', displayName: 'Задние колёса', basePrice: 3000 },
    25: { name: 'plateHolder', displayName: 'Рамка номера', basePrice: 1000 },
    27: { name: 'trimDesign', displayName: 'Дизайн салона', basePrice: 5000 },
    28: { name: 'ornaments', displayName: 'Украшения', basePrice: 1500 },
    30: { name: 'dialDesign', displayName: 'Дизайн приборной панели', basePrice: 2000 },
    33: { name: 'steeringWheel', displayName: 'Руль', basePrice: 2000 },
    34: { name: 'shiftLever', displayName: 'Рычаг КПП', basePrice: 1500 },
    38: { name: 'hydraulics', displayName: 'Гидравлика', basePrice: 15000 },
    46: { name: 'windows', displayName: 'Тонировка', basePrice: 2500 },
    48: { name: 'livery', displayName: 'Ливрея', basePrice: 5000 },
    // Специальные категории
    'paint': { name: 'paint', displayName: 'Покраска', basePrice: 2500 },
    'pearlescentColor': { name: 'pearlescentColor', displayName: 'Перламутр', basePrice: 3500 },
    'wheelColor': { name: 'wheelColor', displayName: 'Цвет дисков', basePrice: 1500 },
    'neonColor': { name: 'neonColor', displayName: 'Неоновая подсветка', basePrice: 5000 },
    'windowTint': { name: 'windowTint', displayName: 'Тонировка', basePrice: 2500 }
};

// Функция для получения owner_id игрока
async function getPlayerOwnerId(player) {
    try {
        const [userData] = await query('SELECT id FROM users WHERE username = ?', [player.name]);
        if (!userData) {
            alt.log(`Cannot find user with username: ${player.name}`);
            return null;
        }
        return userData.id;
    } catch (error) {
        alt.log(`Error getting player owner_id: ${error.message}`);
        return null;
    }
}

// Функция для получения всех доступных модификаций
async function getAvailableMods(vehicle, player) {
    if (!vehicle || !player) {
        alt.log('Invalid vehicle or player in getAvailableMods');
        return null;
    }

    const mods = {};
    
    try {
        // Устанавливаем modKit до проверки модификаций
        if (vehicle.modKit !== 1) {
            vehicle.modKit = 1;
        }

        // Обработка стандартных модификаций
        for (const [modType, category] of Object.entries(modCategories)) {
            if (!isNaN(modType)) {
                const numMods = vehicle.getModsCount(parseInt(modType));
                if (numMods > 0) {
                    mods[category.name] = [];
                    
                    // Добавляем стандартный вариант
                    mods[category.name].push({
                        id: -1,
                        name: `Стандартный ${category.name.toLowerCase()}`,
                        price: 0
                    });

                    // Добавляем доступные модификации
                    for (let i = 0; i < numMods; i++) {
                        mods[category.name].push({
                            id: i,
                            name: `${category.name} - Вариант ${i + 1}`,
                            price: Math.round(1000 * (1 + i * 0.5)) // Базовая цена
                        });
                    }
                }
            }
        }

        return mods;
    } catch (error) {
        alt.log('Error in getAvailableMods:', error);
        return null;
    }
}

function generateColorOptions(prefix, basePrice) {
    const colors = [];
    colors.push({ id: -1, name: 'Стандартный цвет', price: 0 });
    
    // Добавляем основные цвета
    const baseColors = [
        'Чёрный', 'Белый', 'Красный', 'Синий', 'Зелёный', 'Жёлтый',
        'Оранжевый', 'Фиолетовый', 'Розовый', 'Серый', 'Коричневый'
    ];

    baseColors.forEach((color, index) => {
        colors.push({
            id: index,
            name: `${color}`,
            price: basePrice
        });
    });

    return colors;
}

async function applyModification(vehicle, category, modId, player) {
    if (!vehicle) {
        alt.log('Error: Vehicle is null in applyModification');
        return false;
    }

    // Получаем ID автомобиля и owner_id из метаданных
    const vehicleId = vehicle.getStreamSyncedMeta('vehicleId');
    const ownerId = vehicle.getStreamSyncedMeta('ownerId');

    if (!vehicleId || !ownerId) {
        alt.log('Error: Vehicle ID or owner ID not found in metadata');
        return false;
    }

    try {
        // Устанавливаем modKit если еще не установлен
        if (vehicle.modKit !== 1) {
            vehicle.modKit = 1;
        }

        let success = false;

        // Применяем модификацию
        switch(category) {
            case 'paint':
                vehicle.primaryColor = parseInt(modId);
                success = true;
                break;
            default:
                const modType = Object.entries(modCategories)
                    .find(([, cat]) => cat.name === category)?.[0];
                
                if (modType) {
                    const modTypeNum = parseInt(modType);
                    if (!isNaN(modTypeNum)) {
                        vehicle.setMod(modTypeNum, parseInt(modId));
                        success = vehicle.getMod(modTypeNum) === parseInt(modId);
                    }
                }
                break;
        }

        // Если модификация успешно применена, пытаемся сохранить в БД
        if (success) {
            try {
                // Получаем текущие моды
                const [vehicleData] = await query(
                    'SELECT mods FROM vehicles WHERE id = ? AND owner_id = ?', 
                    [vehicleId, ownerId]
                );

                let currentMods = {};
                if (vehicleData && vehicleData.mods) {
                    currentMods = JSON.parse(vehicleData.mods);
                }

                // Обновляем моды
                if (category === 'paint') {
                    await query(
                        'UPDATE vehicles SET primary_color = ? WHERE id = ? AND owner_id = ?', 
                        [modId, vehicleId, ownerId]
                    );
                } else {
                    const modType = Object.entries(modCategories)
                        .find(([, cat]) => cat.name === category)?.[0];
                    
                    if (modType) {
                        currentMods[modType] = parseInt(modId);
                        await query(
                            'UPDATE vehicles SET mods = ? WHERE id = ? AND owner_id = ?', 
                            [JSON.stringify(currentMods), vehicleId, ownerId]
                        );
                    }
                }
            } catch (dbError) {
                alt.log('Database error while saving modification:', dbError);
            }
        }

        return success;
    } catch (error) {
        alt.log(`Error in applyModification: ${error.message}`);
        return false;
    }
}

// Добавляем вспомогательную функцию для цветов неона
function getNeonColorByIndex(index) {
    const neonColors = {
        0: new alt.RGBA(255, 255, 255, 255), // Белый
        1: new alt.RGBA(255, 0, 0, 255),     // Красный
        2: new alt.RGBA(0, 0, 255, 255),     // Синий
        3: new alt.RGBA(0, 255, 0, 255),     // Зелёный
        4: new alt.RGBA(255, 255, 0, 255),   // Жёлтый
        5: new alt.RGBA(255, 0, 255, 255)    // Розовый
    };
    return neonColors[index] || neonColors[0];
}

// Добавляем обработчик для отправки маркеров
alt.onClient('tuning:requestMarkers', (player) => {
    alt.emitClient(player, 'tuning:loadMarkers', SHOP_MARKERS);
});

// Обновляем обработчик запроса модификаций
alt.onClient('tuning:requestMods', async (player) => {
    alt.log('Received mods request from player:', player.name);
    
    if (!player.vehicle) {
        alt.log('Player is not in a vehicle');
        alt.emitClient(player, 'tuning:error', 'Вы должны находиться в транспорте');
        return;
    }
    
    try {
        const availableMods = await getAvailableMods(player.vehicle, player);
        
        // Проверяем, что availableMods не null/undefined и содержит данные
        if (!availableMods || Object.keys(availableMods).length === 0) {
            alt.log('No available mods found');
            alt.emitClient(player, 'tuning:error', 'Для данного транспорта нет доступных модификаций');
            return;
        }
        
        alt.log('Sending mods to client:', Object.keys(availableMods));
        alt.emitClient(player, 'tuning:receiveMods', availableMods);
    } catch (error) {
        alt.log('Error processing mods request:', error);
        alt.emitClient(player, 'tuning:error', 'Произошла ошибка при загрузке модификаций');
    }
});

// Функция для сохранения состояния
function saveVehicleState(vehicle) {
    const state = {
        mods: {},
        colors: {
            primary: vehicle.primaryColor,
            secondary: vehicle.secondaryColor,
            pearlescent: vehicle.pearlescentColor,
            wheels: vehicle.wheelColor
        },
        extras: {
            neonEnabled: vehicle.neonEnabled,
            neonColor: vehicle.neonColor,
            windowTint: vehicle.windowTint
        }
    };

    // Сохраняем все модификации
    for (const [modType] of Object.entries(modCategories)) {
        if (!isNaN(modType)) {
            state.mods[modType] = vehicle.getMod(parseInt(modType));
        }
    }

    return state;
}

// Функция для восстановления состояния
function restoreVehicleState(vehicle, state) {
    if (!state) return;

    vehicle.modKit = 1;
    
    // Восстанавливаем модификации
    for (const [modType, modId] of Object.entries(state.mods)) {
        vehicle.setMod(parseInt(modType), modId);
    }

    // Восстанавливаем цвета
    vehicle.primaryColor = state.colors.primary;
    vehicle.secondaryColor = state.colors.secondary;
    vehicle.pearlescentColor = state.colors.pearlescent;
    vehicle.wheelColor = state.colors.wheels;

    // Восстанавливаем дополнительные параметры
    vehicle.neonEnabled = state.extras.neonEnabled;
    if (state.extras.neonEnabled) {
        vehicle.neonColor = state.extras.neonColor;
    }
    vehicle.windowTint = state.extras.windowTint;
}

// Обработчик предпросмотра
alt.onClient('tuning:previewMod', async (player, data) => {
    if (!player || !player.vehicle) {
        alt.emitClient(player, 'tuning:error', 'Ошибка: транспорт не найден');
        return;
    }

    const { category, modId } = data;
    const success = await applyModification(player.vehicle, category, modId, player);
    
    if (!success) {
        alt.emitClient(player, 'tuning:error', 'Ошибка при применении модификации');
    }
});

// Обработчик отмены предпросмотра
alt.onClient('tuning:cancelPreview', (player) => {
    if (!player || !player.vehicle) return;

    const vehicle = player.vehicle;
    const originalState = previewStates.get(vehicle.id);

    if (originalState) {
        restoreVehicleState(vehicle, originalState);
        previewStates.delete(vehicle.id);
    }
});

// Обновляем обработчик покупки модификации
alt.onClient('tuning:applyMod', async (player, data) => {
    alt.log('[Tuning] Received mod purchase request:', data);
    
    if (!player || !player.vehicle) {
        alt.log('[Tuning] Error: No player or vehicle');
        alt.emitClient(player, 'tuning:error', 'Ошибка: транспорт не найден');
        return;
    }

    const { category, modId, price } = data;
    const vehicle = player.vehicle;

    // Проверяем баланс игрока
    const playerMoney = await getMoney(player);
    alt.log(`[Tuning] Player ${player.name} money: ${playerMoney}, required: ${price}`);

    if (playerMoney < price) {
        alt.log(`[Tuning] Insufficient funds: has ${playerMoney}, needs ${price}`);
        alt.emitClient(player, 'tuning:error', 'Недостаточно средств');
        return;
    }

    // Списываем деньги
    if (await subtractMoney(player, price)) {
        const success = await applyModification(vehicle, category, modId, player);
        
        if (success) {
            alt.log(`[Tuning] Successfully applied mod ${category}:${modId} for player ${player.name}`);
            originalVehicleStates.delete(vehicle.id);
            const newState = saveVehicleState(vehicle);
            previewStates.set(vehicle.id, newState);
            
            alt.emitClient(player, 'tuning:modApplied', category, modId);
        } else {
            alt.log(`[Tuning] Failed to apply modification, refunding ${price}`);
            await addMoney(player, price);
            alt.emitClient(player, 'tuning:error', 'Ошибка при установке модификации');
        }
    } else {
        alt.log('[Tuning] Failed to subtract money');
        alt.emitClient(player, 'tuning:error', 'Ошибка при списании средств');
    }
});

// Очистка состояния при закрытии меню
alt.onClient('tuning:exit', (player) => {
    if (!player || !player.vehicle) return;
    
    const vehicle = player.vehicle;
    const originalState = originalVehicleStates.get(vehicle.id);
    
    // Проверяем, были ли куплены модификации
    const hadPurchases = previewStates.has(vehicle.id);
    
    // Если не было покупок и есть оригинальное состояние, восстанавливаем его
    if (!hadPurchases && originalState) {
        restoreVehicleState(vehicle, originalState);
        alt.log(`Restored original state for vehicle ${vehicle.id}`);
    }
    
    // Очищаем сохраненные состояния
    originalVehicleStates.delete(vehicle.id);
    previewStates.delete(vehicle.id);
    
    // Останавливаем вращение если оно активно
    if (rotatingVehicles.has(vehicle.id)) {
        const rotation = rotatingVehicles.get(vehicle.id);
        clearInterval(rotation.interval);
        rotatingVehicles.delete(vehicle.id);
    }
});

// Обновляем обработчик отключения игрока
alt.on('playerDisconnect', (player) => {
    if (player.vehicle) {
        const vehicle = player.vehicle;
        const originalState = previewStates.get(vehicle.id);
        
        if (originalState) {
            restoreVehicleState(vehicle, originalState);
            previewStates.delete(vehicle.id);
        }
    }
});

// Добавляем обработчик для выхода из транспорта
alt.on('playerLeaveVehicle', (player, vehicle) => {
    const originalState = previewStates.get(vehicle.id);
    
    if (originalState) {
        restoreVehicleState(vehicle, originalState);
        previewStates.delete(vehicle.id);
        alt.emitClient(player, 'tuning:forceClose');
    }
});

// Добавляем обработчик смерти игрока
alt.on('playerDeath', (player) => {
    if (player.vehicle) {
        const vehicle = player.vehicle;
        const originalState = previewStates.get(vehicle.id);
        
        if (originalState) {
            restoreVehicleState(vehicle, originalState);
            previewStates.delete(vehicle.id);
            alt.emitClient(player, 'tuning:forceClose');
        }
    }
});

// Выносим опции неона в отдельную функцию
function generateNeonOptions() {
    return [
        { id: -1, name: 'Без неона', price: 0 },
        { id: 0, name: 'Белый неон', price: 5000 },
        { id: 1, name: 'Красный неон', price: 5000 },
        { id: 2, name: 'Синий неон', price: 5000 },
        { id: 3, name: 'Зелёный неон', price: 5000 },
        { id: 4, name: 'Жёлтый неон', price: 5000 },
        { id: 5, name: 'Розовый неон', price: 5000 }
    ];
}

// Выносим опции тонировки в отдельную функцию
function generateWindowTintOptions() {
    return [
        { id: 0, name: 'Нет тонировки', price: 0 },
        { id: 1, name: 'Чистая тонировка', price: 2500 },
        { id: 2, name: 'Тёмная тонировка', price: 3500 },
        { id: 3, name: 'Лимузин', price: 4500 }
    ];
}

// Добавляем карту для хранения состояния вращения
const rotatingVehicles = new Map();

// Обновляем обработчики вращения
alt.onClient('tuning:rotateVehicle', (player, direction) => {
    if (!player || !player.vehicle) return;
    
    const vehicle = player.vehicle;
    const rotationSpeed = direction === 'left' ? -1.0 : 1.0;
    
    // Начинаем вращение
    if (!rotatingVehicles.has(vehicle.id)) {
        rotatingVehicles.set(vehicle.id, {
            interval: setInterval(() => {
                const rot = vehicle.rot;
                vehicle.rot = new alt.Vector3(rot.x, rot.y, rot.z + rotationSpeed);
            }, 16), // ~60 fps
            direction: rotationSpeed
        });
    }
});

alt.onClient('tuning:stopRotate', (player) => {
    if (!player || !player.vehicle) return;
    
    const vehicle = player.vehicle;
    
    // Останавливаем вращение
    if (rotatingVehicles.has(vehicle.id)) {
        const rotation = rotatingVehicles.get(vehicle.id);
        clearInterval(rotation.interval);
        rotatingVehicles.delete(vehicle.id);
    }
});

// Добавляем очистку при выходе из меню
alt.onClient('tuning:exit', (player) => {
    if (!player || !player.vehicle) return;
    
    const vehicle = player.vehicle;
    if (rotatingVehicles.has(vehicle.id)) {
        const rotation = rotatingVehicles.get(vehicle.id);
        clearInterval(rotation.interval);
        rotatingVehicles.delete(vehicle.id);
    }
    // ... остальной код
});

// Очистка при отключении игрока
alt.on('playerDisconnect', (player) => {
    if (player.vehicle) {
        const vehicle = player.vehicle;
        
        // Останавливаем вращение если оно активно
        if (rotatingVehicles.has(vehicle.id)) {
            const rotation = rotatingVehicles.get(vehicle.id);
            clearInterval(rotation.interval);
            rotatingVehicles.delete(vehicle.id);
        }
    }
});

// Обновляем обработчики событий
alt.onClient('tuning:getMods', async (player) => {
    if (!player || !player.vehicle) {
        alt.emitClient(player, 'tuning:error', 'Ошибка: транспорт не найден');
        return;
    }

    const mods = await getAvailableMods(player.vehicle, player);
    alt.emitClient(player, 'tuning:receiveMods', mods);
});

// Обновляем функцию openTuningMenu (или создаем новый обработчик)
alt.onClient('tuning:enter', (player) => {
    if (!player || !player.vehicle) {
        alt.emitClient(player, 'tuning:error', 'Ошибка: транспорт не найден');
        return;
    }

    const vehicle = player.vehicle;
    
    // Сохраняем оригинальное состояние при входе в тюнинг
    originalVehicleStates.set(vehicle.id, saveVehicleState(vehicle));
    
    alt.log(`Saved original state for vehicle ${vehicle.id}`);
});
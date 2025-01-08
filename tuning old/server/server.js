import alt from 'alt-server';
import * as data from "./data.js"
import { getPlayerMoney, subtractMoney } from '../../money/server/money.js';
import { query } from '../../database/database.js'; // Импортируйте функцию для работы с базой данных

const previousModsMap = new Map(); // Хранение предыдущих модификаций для каждого игрока

alt.on("playerConnect", (player) => {
    tuningShopInit(player);
});

export async function tuningShopInit(player) {
    data.SHOP_MARKERS.forEach((shop) => {
        alt.emitClient(player, "client::marker:create", shop.marker_position, "tuningShop", { id: shop.id });
    });
}

alt.onClient('CU::StartTuning', async (player) => {
    // Вызываем getCurrentMods перед входом в меню тюнинга
    const currentMods = await getCurrentMods(player);
    if (currentMods) {
        previousModsMap.set(player.id, currentMods); // Сохраняем текущие модификации
    }
});

alt.onClient('CU::Mods:Install', async (player, mods) => {
    alt.log(`Получен массив модификаций: ${JSON.stringify(mods)}`);

    if (player.vehicle === null) {
        alt.log('Игрок не в транспортном средстве.');
        return;
    }
    
    try {
        // Убедимся, что модификации могут быть установлены
        if (player.vehicle.modKit !== 1) {
            player.vehicle.modKit = 1;
        }

        mods.forEach((mod) => {
            const index = mod.index; // Используем index как индекс модификации

            if (index === undefined || index < 0) {
                alt.log(`Мод не имеет корректного индекса: ${JSON.stringify(mod)}`);
                return; // Пропускаем модификацию без корректного индекса
            }
            
            // Логируем информацию о моде перед установкой
            alt.log(`Попытка установить мод: индекс = ${index}, значение = ${mod.value}`);

            try {
                player.vehicle.setMod(index, mod.value); // Устанавливаем модификацию
                alt.log(`Установлен мод: индекс = ${index}, значение = ${mod.value}`);
            } catch (err) {
                alt.log(`Ошибка при установке мода с индексом ${index}: ${err.message}`);
            }
        });
    } catch (err) {
        alt.log(`Ошибка при установке модификаций: ${err}`);
    }
});

// Обработка запроса на покупку и сохранение модификаций
alt.onClient('CU::Mods:Buy', async (player, mods, totalprice) => {
    alt.log("Получен запрос от клиента на покупку и сохранения тюнинга!!!");

    for (const mod of mods) {
        if (mod.index === undefined || mod.index < 0 || mod.index >= 52) {
            alt.log(`Некорректный индекс модификации: ${JSON.stringify(mod)}`);
            return;
        }
    }

    if (player.vehicle === null) {
        alt.log('Игрок не в транспортном средстве.');
        return;
    }

    const playerMoney = getPlayerMoney(player);
    if (playerMoney < totalprice) {
        alt.log('Недостаточно денег для покупки модификаций.');
        return;
    }

    try {
        if (player.vehicle.modKit !== 1) {
            player.vehicle.modKit = 1;
        }

        const validMods = [];

        mods.forEach(mod => {
            const index = mod.index;
            const value = mod.value;

            if (index === undefined || index < 0) {
                alt.log(`Мод не имеет корректного индекса: ${JSON.stringify(mod)}`);
                return;
            }
                try {
                    player.vehicle.setMod(index, value);
                    alt.log(`Установлен мод: индекс = ${index}, значение = ${value}`);
                    validMods.push(mod);
                } catch (err) {
                    alt.log(`Ошибка при установке мода с индексом ${index}: ${err.message}`);
                }
        });

        if (validMods.length === 0) {
            alt.log('Нет корректных модификаций для сохранения.');
            return;
        }

        const username = player.name;
        const userQuery = 'SELECT id FROM users WHERE username = ?';
        const userResult = await query(userQuery, [username]);

        if (userResult.length === 0) {
            alt.log(`Пользователь с именем ${username} не найден.`);
            return;
        }

        const userId = userResult[0].id;

        const vehicleHash = player.vehicle.model; // Получаем hash автомобиля
        const vehicleQuery = 'SELECT id FROM vehicles WHERE owner_id = ? AND hash = ?';
        const vehicleResult = await query(vehicleQuery, [userId, vehicleHash]);

        if (vehicleResult.length === 0) {
            alt.log(`Автомобиль с моделью ${vehicleModel} не найден для пользователя с ID ${userId}.`);
            return;
        }

        const vehicleId = vehicleResult[0].id;

        alt.log("Попытка сохранить тюнинг в базе данных и закрыть меню тюнинга.");
        await query('UPDATE vehicles SET mods = ? WHERE id = ?', [JSON.stringify(validMods), vehicleId]);
        subtractMoney(player, totalprice);
        alt.emitClient(player, 'CU::Success');

    } catch (err) {
        alt.log(`Ошибка при обработке покупки модификаций: ${err}`);
    }
});

// Закрытие меню тюнинга при выходе из автомобиля
alt.on('playerLeftVehicle', (player) => {
    const previousMods = previousModsMap.get(player.id);
    alt.emitClient(player, 'CU::Close');
    if (previousMods) {
        alt.log("Попытка восстановить предыдущие модификации при выходе из автомобиля.");
        // Восстанавливаем предыдущие модификации
        restoreMods(player.vehicle, previousMods);
    }
});

// Закрытие меню тюнинга при вызове с клиента
alt.onClient('CU::CloseTuning', (player) => {
    const previousMods = previousModsMap.get(player.id);
    alt.emitClient(player, 'CU::Close');
    if (previousMods) {
        alt.log("Попытка восстановить предыдущие модификации при закрытии тюнинга.");
        // Восстанавливаем предыдущие модификации
        restoreMods(player.vehicle, previousMods);
    } else {
        alt.log("Предыдущие модификации отсутствуют.");
    }
});

// Функция для получения текущих модификаций
async function getCurrentMods(player) {
    const username = player.name;
    const userQuery = 'SELECT id FROM users WHERE username = ?';
    const userResult = await query(userQuery, [username]);

    if (userResult.length === 0) {
        alt.log(`Пользователь с именем ${username} не найден.`);
        return null;
    }

    const userId = userResult[0].id;
    const vehicleHash = player.vehicle.model; // Получаем hash автомобиля
    const vehicleQuery = 'SELECT mods FROM vehicles WHERE owner_id = ? AND hash = ?';
    const vehicleResult = await query(vehicleQuery, [userId, vehicleHash]);

    let currentMods = [];
    if (vehicleResult.length > 0) {
        currentMods = JSON.parse(vehicleResult[0].mods); // Получаем модификации
    }
    else{
        alt.log(`Авто с именем ${vehicleHash} не найден.`);
    }
    return currentMods; // Возвращаем текущие модификации
}

// Функция для восстановления модификаций
function restoreMods(vehicle, mods) {
    if (mods) {
        for (const mod of mods) {
            const modType = mod.index; // Индекс модификации
            const modValue = mod.value; // Значение модификации

            // Установка модификации
            try {
                vehicle.setMod(modType, modValue);
                alt.log(`Установлена модификация: индекс = ${modType}, значение = ${modValue}`);
            } catch (error) {
                alt.log(`Ошибка установки модификации ${modType}: ${error.message}`);
            }
        }
    }
}
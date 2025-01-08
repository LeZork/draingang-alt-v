import * as alt from 'alt-server';
import { houses, interiors } from '../shared/config.js';
import { HouseDatabase } from './database.js';
import { query } from '../../database/server/index.js';
import { getMoney, subtractMoney } from '../../money/server/exports.js';

alt.on('resourceStart', () => {
    alt.log('Houses resource starting...');
    
    HouseDatabase.createTables().then(() => {
        return HouseDatabase.initializeHouses();
    }).then(() => {
        alt.log(`Creating blips for ${houses.length} houses...`);
        
        // Создаем блипы для всех домов
        Promise.all(houses.map(house => {
            return HouseDatabase.getHouseOwner(house.id).then(owner => {
                alt.log(`House ${house.id} owner check:`, owner); // Отладка
                return {
                    id: house.id,
                    position: house.position,
                    owned: owner !== null && owner !== undefined
                };
            });
        })).then(housesData => {
            alt.log('Houses data prepared:', housesData);
            alt.emitAllClients('houses:initializeBlips', housesData);
        }).catch(error => {
            alt.logError('Error initializing houses:', error);
        });
    });
});

// Обработчик подключения игрока
alt.on('playerConnect', (player) => {
    alt.log(`Creating house blips for player ${player.name}`);
    
    // Получаем актуальные данные о владении домами
    Promise.all(houses.map(house => {
        return HouseDatabase.getHouseOwner(house.id).then(owner => {
            return {
                id: house.id,
                position: house.position,
                owned: owner !== null && owner !== undefined
            };
        });
    })).then(housesData => {
        alt.emitClient(player, 'houses:initializeBlips', housesData);
    }).catch(error => {
        alt.logError(`Error creating blips for player ${player.name}:`, error);
    });
});

// Обновление блипа при покупке дома
async function updateHouseBlip(houseId) {
    alt.emitAllClients('houses:updateBlip', {
        id: houseId,
        owned: true
    });
}

alt.onClient('houses:tryPurchase', async (player, houseId) => {
    try {
        const house = houses.find(h => h.id === houseId);
        if (!house) {
            alt.emitClient(player, 'houses:purchaseResponse', false, 'Ошибка: дом не найден');
            return;
        }

        // Получаем ID игрока из базы данных
        const [userData] = await query('SELECT id FROM users WHERE username = ?', [player.name]);
        if (!userData) {
            alt.emitClient(player, 'houses:purchaseResponse', false, 'Ошибка: игрок не найден');
            return;
        }
        const playerId = userData.id;

        // Проверяем, не куплен ли уже дом
        const owner = await HouseDatabase.getHouseOwner(houseId);
        if (owner) {
            alt.emitClient(player, 'houses:purchaseResponse', false, 'Этот дом уже куплен');
            return;
        }

        // Проверяем баланс игрока используя новую систему денег
        const playerMoney = await getMoney(player);
        if (playerMoney < house.price) {
            alt.emitClient(player, 'houses:purchaseResponse', false, 'Недостаточно денег');
            return;
        }

        // Снимаем деньги используя новую систему
        const success = await subtractMoney(player, house.price);
        if (!success) {
            alt.emitClient(player, 'houses:purchaseResponse', false, 'Ошибка при оплате');
            return;
        }

        // Записываем покупку в базу данных
        await HouseDatabase.purchaseHouse(houseId, playerId);
        
        // Обновляем блип и отправляем ответ клиенту
        await updateHouseBlip(houseId);
        alt.emitClient(player, 'houses:purchaseResponse', true, 'Дом успешно куплен!');
        alt.log(`[Houses] ${player.name} купил дом #${houseId} за $${house.price}`);

    } catch (error) {
        alt.logError('[Houses] Ошибка при покупке дома:', error);
        alt.emitClient(player, 'houses:purchaseResponse', false, 'Произошла ошибка при покупке дома');
    }
});

alt.onClient('houses:enterHouse', async (player, houseId) => {
    try {
        const house = houses.find(h => h.id === houseId);
        if (!house) {
            alt.emitClient(player, 'houses:notification', 'Ошибка: дом не найден');
            return;
        }

        // Получаем ID игрока из базы данных
        const [userData] = await query('SELECT id FROM users WHERE username = ?', [player.name]);
        if (!userData) {
            alt.emitClient(player, 'houses:notification', 'Ошибка: игрок не найден');
            return;
        }

        const owner = await HouseDatabase.getHouseOwner(houseId);
        
        if (Number(owner) !== Number(userData.id)) {
            alt.emitClient(player, 'houses:notification', 'Это не ваш дом');
            return;
        }

        // Телепортируем игрока внутрь дома
        player.pos = house.interiorPosition;
        alt.emitClient(player, 'houses:enterHouse'); // Отправляем событие для закрытия меню
        alt.emitClient(player, 'houses:notification', 'Вы вошли в дом');
    } catch (error) {
        alt.log('Error in enterHouse:', error);
        alt.emitClient(player, 'houses:notification', 'Произошла ошибка при входе в дом');
    }
});

// Функция для применения тюнинга к автомобилю
function applyVehicleMods(vehicle, modsJson) {
    try {
        if (!modsJson) return;
        
        const mods = JSON.parse(modsJson);
        
        // Сначала устанавливаем модкит
        vehicle.modKit = 1; // Устанавливаем базовый модкит
        
        // Затем применяем моды
        for (const [modType, modIndex] of Object.entries(mods)) {
            try {
                const modTypeInt = parseInt(modType);
                if (!isNaN(modTypeInt) && modIndex !== undefined) {
                    vehicle.setMod(modTypeInt, modIndex);
                }
            } catch (modError) {
                alt.logError(`Error applying mod type ${modType}:`, modError);
            }
        }
        
        alt.log(`Successfully applied mods to vehicle ${vehicle.model}`);
    } catch (error) {
        alt.logError('Error applying vehicle mods:', error);
    }
}

// Обновляем функцию получения машин игрока
async function getPlayerVehicles(playerId) {
    try {
        const vehicles = await query(
            'SELECT id, model, plate, mods, primary_color, secondary_color FROM vehicles WHERE owner_id = ?',
            [playerId]
        );
        return vehicles;
    } catch (error) {
        alt.logError('Error getting player vehicles:', error);
        return [];
    }
}

// Обновляем функцию входа в гараж
alt.onClient('houses:enterGarage', async (player, houseId) => {
    try {
        const house = houses.find(h => h.id === houseId);
        if (!house) {
            alt.emitClient(player, 'houses:notification', 'Ошибка: дом не найден');
            return;
        }

        // Получаем ID игрока
        const [userData] = await query('SELECT id FROM users WHERE username = ?', [player.name]);
        if (!userData) {
            alt.emitClient(player, 'houses:notification', 'Ошибка: игрок не найден');
            return;
        }

        const owner = await HouseDatabase.getHouseOwner(houseId);
        if (Number(owner) !== Number(userData.id)) {
            alt.emitClient(player, 'houses:notification', 'Это не ваш гараж');
            return;
        }

        // Получаем тип гаража на основе maxGarageSlots
        const garageType = house.maxGarageSlots === 2 ? 'garage2Car' : 
                          house.maxGarageSlots === 6 ? 'garage6Car' : 
                          'garage10Car';
        
        // Получаем позиции для спавна из конфига
        const garageSpots = interiors[garageType].spots;

        // Получаем все машины игрока
        const vehicles = await getPlayerVehicles(userData.id);
        
        // Проверяем, не превышает ли количество машин размер гаража
        if (vehicles.length > house.maxGarageSlots) {
            alt.emitClient(player, 'houses:notification', 'У вас слишком много машин для этого гаража');
            return;
        }

        // Удаляем существующие машины в гараже
        const existingVehicles = alt.Vehicle.all.filter(v => 
            v.getMeta('garageHouseId') === houseId
        );
        existingVehicles.forEach(v => v.destroy());

        // Создаем машины в гараже
        vehicles.forEach((vehData, index) => {
            if (index < garageSpots.length) {
                const spot = garageSpots[index];
                const veh = new alt.Vehicle(
                    vehData.model,
                    spot.x,
                    spot.y,
                    spot.z + 0.5,
                    0,
                    0,
                    spot.heading
                );
                
                // Устанавливаем цвета
                veh.primaryColor = vehData.primary_color;
                veh.secondaryColor = vehData.secondary_color;
                
                // Устанавливаем мета-данные
                veh.setMeta('garageHouseId', houseId);
                veh.setMeta('ownerId', userData.id);
                veh.setMeta('vehicleId', vehData.id);
                veh.setStreamSyncedMeta("Nitro", true);
                veh.numberPlateText = vehData.plate || 'GARAGE';
                
                // Применяем тюнинг
                if (vehData.mods) {
                    applyVehicleMods(veh, vehData.mods);
                }

                // Даем машине "приземлиться" и только потом замораживаем
                alt.setTimeout(() => {
                    if (veh && veh.valid) {
                        veh.frozen = true;
                    }
                }, 1000);
            }
        });

        // Телепортируем игрока в гараж
        player.pos = house.garageInteriorPosition;
        alt.emitClient(player, 'houses:enterGarage');
        alt.emitClient(player, 'houses:notification', 'Вы вошли в гараж');

    } catch (error) {
        alt.log('Error in enterGarage:', error);
        alt.emitClient(player, 'houses:notification', 'Произошла ошибка при входе в гараж');
    }
});

// Обновляем функцию выхода из гаража
alt.onClient('houses:exitGarage', async (player, houseId) => {
    try {
        const house = houses.find(h => h.id === houseId);
        if (!house) {
            alt.emitClient(player, 'houses:notification', 'Ошибка: дом не найден');
            return;
        }

        // Проверяем, находится ли игрок в автомобиле
        const vehicle = player.vehicle;
        const isInVehicle = vehicle !== null;

        if (isInVehicle) {
            // Проверяем, принадлежит ли автомобиль этому гаражу
            const garageHouseId = vehicle.getMeta('garageHouseId');
            if (garageHouseId === houseId) {
                // Сначала разблокируем автомобиль и удалим метку гаража
                vehicle.frozen = false;
                vehicle.deleteMeta('garageHouseId');
                
                // Сохраняем игрока в автомобиле
                const seat = player.seat;
                
                // Телепортируем автомобиль вместе с игроком
                vehicle.rot = new alt.Vector3(0, 0, 0);
                vehicle.pos = house.garageExitPosition;
                
                // Убедимся, что игрок остался в автомобиле
                alt.setTimeout(() => {
                    if (!player.vehicle) {
                        player.putIntoVehicle(vehicle, seat);
                    }
                }, 100);
                
                alt.emitClient(player, 'houses:exitGarage');
                alt.emitClient(player, 'houses:notification', 'Вы выехали из гаража');
                return;
            }
        }

        // Если игрок не в машине или в чужой машине, удаляем все машины в гараже
        const garageVehicles = alt.Vehicle.all.filter(v => 
            v.getMeta('garageHouseId') === houseId
        );
        garageVehicles.forEach(v => v.destroy());

        // Телепортируем игрока к выходу из гаража
        player.pos = house.garageExitPosition;
        alt.emitClient(player, 'houses:exitGarage');
        alt.emitClient(player, 'houses:notification', 'Вы вышли из гаража');

    } catch (error) {
        alt.log('Error in exitGarage:', error);
        alt.emitClient(player, 'houses:notification', 'Произошла ошибка при выходе из гаража');
    }
});

// Добавьте новый обработчик
alt.onClient('houses:requestHouseInfo', async (player, houseId) => {
    try {
        const house = houses.find(h => h.id === houseId);
        if (!house) return;

        // Получаем владельца дома
        const owner = await HouseDatabase.getHouseOwner(houseId);
        
        // Получаем ID текущего игрока
        const [userData] = await query('SELECT id FROM users WHERE username = ?', [player.name]);
        
        // Отправляем информацию о доме клиенту
        alt.emitClient(player, 'houses:receiveHouseInfo', {
            ...house,
            isOwner: userData && owner === userData.id
        });
        
    } catch (error) {
        alt.logError('Error in requestHouseInfo:', error);
    }
});

// Обновляем обработчик выхода из дома
alt.onClient('houses:exitHouse', async (player, houseId) => {
    try {
        const house = houses.find(h => h.id === houseId);
        if (!house) {
            alt.emitClient(player, 'houses:notification', 'Ошибка: дом не найден');
            return;
        }

        // Телепортируем игрока к выходу
        player.pos = house.exitPosition;
        alt.emitClient(player, 'houses:exitHouse');
        alt.emitClient(player, 'houses:notification', 'Вы вышли из дома');

    } catch (error) {
        alt.log('Error in exitHouse:', error);
        alt.emitClient(player, 'houses:notification', 'Произошла ошибка при выходе из дома');
    }
}); 
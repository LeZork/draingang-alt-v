import * as alt from "alt-server"; // Импортируем библиотеку alt-server для работы с сервером Alt:V
import * as chat from "chat"; // Импортируем модуль для работы с чатом
import { getMoney, subtractMoney } from '../../money/server/exports.js';

const MOPED_MODEL = 'faggio'; // Модель мопеда
const RENT_COST = 250; // Выносим стоимость аренды в константу
const SPAWN_POINTS = [
    { x: -9.11208724975586, y: 31.46373748779297, z: 70.814697265625 },
    { x: -10.0087890625, y: 31.93846321105957, z: 70.865234375 },
    { x: -11.010990142822266, y: 32.28131866455078, z: 70.9326171875 },
    { x: -13.846153259277344, y: 33.19121170043945, z: 71.10107421875 },
    { x: -16.575824737548828, y: 34.259342193603516, z: 71.218994140625 },
    { x: -17.4989013671875, y: 34.509891510009766, z: 71.2528076171875 },
    { x: -15.61318588256836, y: 33.96923065185547, z: 71.185302734375 },
    { x: -14.86153793334961, y: 33.586814880371094, z: 71.151611328125 },
    { x: -13.015384674072266, y: 32.993408203125, z: 71.050537109375 },
    { x: -12.079120635986328, y: 32.650550842285156, z: 71.016845703125 }
];

let mopeds = []; // Массив для хранения мопедов
let rentedMopeds = {}; // Объект для отслеживания аренды мопедов

/**
 * Функция для спавна мопедов на заданных точках.
 * Удаляет существующие мопеды и спавнит новые.
 */
function spawnMopeds() {
    // Удаляем существующие мопеды
    mopeds.forEach(moped => {
        const existingMoped = alt.Vehicle.getByID(moped.id);
        if (existingMoped) {
            alt.log(`Deleting moped with ID: ${moped.id}`); // Логируем удаление мопеда
            existingMoped.destroy(); // Удаляем мопед
        }
    });
    mopeds = []; // Очищаем массив мопедов

    // Спавним новые мопеды
    for (let i = 0; i < SPAWN_POINTS.length; i++) {
        const spawnPoint = SPAWN_POINTS[i];
        const moped = new alt.Vehicle(MOPED_MODEL, spawnPoint.x, spawnPoint.y, spawnPoint.z, 0, 0, 0);
        mopeds.push(moped); // Добавляем мопед в массив
        rentedMopeds[moped.id] = { isRented: false, player: null }; // Инициализируем информацию о мопеде
        alt.log(`Spawned moped with ID: ${moped.id} at ${spawnPoint.x}, ${spawnPoint.y}, ${spawnPoint.z}`); // Логируем спавн мопеда
    }
}

// Обработчик события начала аренды
alt.onClient('rent:begin', async (player, vehicle) => {
    try {
        if (!vehicle || vehicle.model !== alt.hash(MOPED_MODEL)) {
            return;
        }

        if (player.seat !== 1) {
            return;
        }

        const mopedInfo = rentedMopeds[player.vehicle.id];
        if (!mopedInfo) {
            alt.logError(`[Rent] Не найдена информация о мопеде ${player.vehicle.id}`);
            return;
        }

        if (mopedInfo.isRented) {
            chat.send(player, '{FF0000}Этот мопед уже арендован.');
            return;
        }

        alt.emitClient(player, 'rent:show');
        alt.log(`[Rent] Игрок ${player.name} начал процесс аренды мопеда`);
    } catch (error) {
        alt.logError('[Rent] Ошибка при начале аренды:', error);
    }
});

// Обработка подтверждения аренды
alt.onClient('rent:process', async (player, isConfirmed) => {
    try {
        if (!isConfirmed) {
            chat.send(player, '{FF0000}Вы отказались от аренды мопеда.');
            alt.emitClient(player, "rent:cancel");
            return;
        }

        if (!player.vehicle || !rentedMopeds[player.vehicle.id]) {
            chat.send(player, '{FF0000}Ошибка: мопед не найден.');
            alt.emitClient(player, "rent:cancel");
            return;
        }

        const mopedInfo = rentedMopeds[player.vehicle.id];

        // Проверяем, не арендован ли уже мопед
        if (mopedInfo.isRented) {
            if (mopedInfo.player && mopedInfo.player.id === player.id) {
                return; // Игрок уже арендовал этот мопед
            }
            chat.send(player, '{FF0000}Этот мопед уже арендован другим игроком.');
            alt.emitClient(player, "rent:cancel");
            return;
        }

        // Проверяем баланс игрока используя новую систему денег
        const playerMoney = await getMoney(player);
        if (playerMoney < RENT_COST) {
            chat.send(player, `{FF0000}Недостаточно денег. Требуется: $${RENT_COST}`);
            alt.emitClient(player, "rent:cancel");
            return;
        }

        // Снимаем оплату используя новую систему денег
        const success = await subtractMoney(player, RENT_COST);
        
        if (success) {
            mopedInfo.isRented = true;
            mopedInfo.player = player;
            
            chat.send(player, `{00FF00}Вы арендовали мопед за $${RENT_COST}`);
            alt.log(`[Rent] ${player.name} арендовал мопед за $${RENT_COST}`);
        } else {
            chat.send(player, '{FF0000}Ошибка при оплате аренды.');
            alt.emitClient(player, "rent:cancel");
        }
    } catch (error) {
        alt.logError('[Rent] Ошибка при обработке аренды:', error);
        chat.send(player, '{FF0000}Произошла ошибка при аренде мопеда.');
        alt.emitClient(player, "rent:cancel");
    }
});

// Обработчик события выхода игрока из транспортного средства
alt.on('playerLeftVehicle', (player) => {
    alt.emitClient(player, 'rent:cancel'); // Отмена аренды при выходе из транспортного средства
});

// Уведомляем игроков о пересоздании аренды
function notifyPlayers() {
    const message = `{FFFFFF}Через 5 минут весь арендный транспорт будет пересоздан!`; // Сообщение об уведомлении
    alt.Player.all.forEach((p) => {
        chat.send(p, message); // Отправляем уведомление всем игрокам
    });
}

// Запускаем спавн и уведомление каждый час
alt.setInterval(() => {
    notifyPlayers(); // Уведомляем игроков
    alt.setTimeout(spawnMopeds, 300000); // Уведомление за 5 минут до удаления
}, 3600000); // Каждые 3600000 миллисекунд (1 час)

// Начальный спавн мопедов
spawnMopeds();

// Очистка данных при отключении игрока
alt.on('playerDisconnect', (player) => {
    try {
        // Находим все мопеды, арендованные этим игроком
        for (const [mopedId, info] of Object.entries(rentedMopeds)) {
            if (info.player && info.player.id === player.id) {
                info.isRented = false;
                info.player = null;
                alt.log(`[Rent] Очищена аренда мопеда ${mopedId} при отключении игрока ${player.name}`);
            }
        }
    } catch (error) {
        alt.logError('[Rent] Ошибка при очистке данных отключившегося игрока:', error);
    }
});

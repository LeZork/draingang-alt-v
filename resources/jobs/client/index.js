import alt from 'alt-client';
import native from 'natives'; 

let destinationCheckpoint = null; 
let destinationBlip = null; 
let destination = null; // Объявляем переменную destination
let restaurantBlip = null; 
let restaurantCheckpoint = null; // Объявляем переменную для чекпоинта ресторана
let restaurantPosition = null; // Объявляем переменную для хранения позиции ресторана
let foodObject = null; // Объявляем объект с едой

// Создание маркеров на клиенте
alt.onServer('client::jobmarker:create', (pos, type = null, data = {}) => {
    const color = new alt.RGBA(255, 0, 0, 150);
    const marker = new alt.Marker(1, pos, color);
    marker.setMeta("type", type);
    marker.setMeta("data", data);

    const workBlip = native.addBlipForCoord(pos.x, pos.y, pos.z);
    native.setBlipSprite(workBlip, 207); 
    native.setBlipScale(workBlip, 1.0);
    native.setBlipColour(workBlip, 2);
    native.setBlipAsShortRange(workBlip, true);
    native.beginTextCommandSetBlipName("STRING");
    native.addTextComponentSubstringPlayerName("Работа");
    native.endTextCommandSetBlipName(workBlip);
});

// Показать подсказку для принятия работы
alt.onServer('client::marker:showPrompt', (jobName, jobId) => {
    alt.log(`Нажмите E, чтобы принять работу: ${jobName}`);
});

// Обработка получения работы
alt.on('player:job:accept', (job) => {
    alt.log(`Вы приняли работу: ${job}`);
});

// Обработка завершения работы
alt.on('player:job:complete', () => {
    alt.emitServer('player:job:complete');
    if (destinationCheckpoint) native.deleteCheckpoint(destinationCheckpoint);
    if (destinationBlip) native.removeBlip(destinationBlip);
    destination = null; // Сбрасываем destination при завершении работы
    native.setWaypointOff();
    // Уничтожение объекта с едой
    if (foodObject) {
    native.deleteObject(foodObject);
    foodObject = null; // Устанавливаем переменную в null, чтобы избежать утечек памяти
}
});

// Обработка нажатия клавиши для принятия работы
alt.on('keyup', (key) => {
    if (key === 69) { // E
        alt.Marker.all.forEach(marker => {
            const dist = native.getDistanceBetweenCoords(marker.pos.x, marker.pos.y, marker.pos.z, alt.Player.local.pos.x, alt.Player.local.pos.y, alt.Player.local.pos.z, false);
            const type = marker.getMeta("type");
            if (dist <= 2 && type === "job") {
                alt.emitServer("player:job:accept", marker.getMeta("data").jobId);
            }
        });
    }
});

// Проверка на пересечение чекпоинта назначения
alt.everyTick(() => {
    if (destinationCheckpoint && destination) { // Проверяем, что checkpoint и destination существуют
        const playerPos = alt.Player.local.pos;
        const dist = native.getDistanceBetweenCoords(playerPos.x, playerPos.y, playerPos.z, destination.x, destination.y, destination.z, false);
        if (dist <= 1.0) { // Проверяем, находится ли игрок в пределах 1 метра от чекпоинта
            alt.emit('player:job:complete'); // Завершаем работу
        }
    }

    // Проверка на пересечение чекпоинта ресторана
    if (restaurantPosition) { // Проверяем, что позиция ресторана существует
        const playerPos = alt.Player.local.pos;
        const distToRestaurant = native.getDistanceBetweenCoords(playerPos.x, playerPos.y, playerPos.z, restaurantPosition.x, restaurantPosition.y, restaurantPosition.z, false);
        if (distToRestaurant <= 1.0) { // Проверяем, находится ли игрок в пределах 1 метра от чекпоинта ресторана
            alt.emitServer('player:job:pickup'); // Вызываем событие на сервер для забора еды
        }
    }
});

// Обработчик для создания маркера, чекпоинта и блипа
alt.onServer('client::job:checkpoint', (dest) => {
    native.setWaypointOff();
    if (restaurantBlip) native.removeBlip(restaurantBlip);
    if (restaurantCheckpoint) native.deleteCheckpoint(restaurantCheckpoint); // Удаляем чекпоинт ресторана


    destination = dest; // Сохраняем destination
    destinationCheckpoint = native.createCheckpoint(0, destination.x, destination.y, destination.z, 0, 0, 0, 10.0, 255, 0, 0, 100, 0);
    
    destinationBlip = native.addBlipForCoord(destination.x, destination.y, destination.z);
    native.setBlipSprite(destinationBlip, 162);
    native.setBlipScale(destinationBlip, 1.0);
    native.setBlipColour(destinationBlip, 2);
    native.setBlipAsShortRange(destinationBlip, true);
    native.beginTextCommandSetBlipName("STRING");
    native.addTextComponentSubstringPlayerName("Работа: Доставка");
    native.endTextCommandSetBlipName(destinationBlip);
    native.setNewWaypoint(destination.x, destination.y); // Создаем маршрут в GPS
});

// Обработчик для создания чекпоинта ресторана
alt.onServer('client::job:restaurantCheckpoint', (restaurantPos) => {
    native.setWaypointOff();
    restaurantPosition = restaurantPos; // Сохраняем позицию ресторана
    restaurantCheckpoint = native.createCheckpoint(0, restaurantPos.x, restaurantPos.y, restaurantPos.z, 0, 0, 0, 10.0, 0, 255, 0, 100, 0);
    restaurantBlip = native.addBlipForCoord(restaurantPos.x, restaurantPos.y, restaurantPos.z);
    native.setBlipSprite(restaurantBlip, 1);
    native.setBlipScale(restaurantBlip, 1.0);
    native.setBlipColour(restaurantBlip, 2);
    native.setBlipAsShortRange(restaurantBlip, true);
    native.beginTextCommandSetBlipName("STRING");
    native.addTextComponentSubstringPlayerName("Ресторан");
    native.endTextCommandSetBlipName(restaurantBlip);
    native.setNewWaypoint(restaurantPos.x, restaurantPos.y); // Создаем маршрут в GPS
});

// Обработчик для получения еды (предмета)
alt.onServer('player:job:giveFood', () => {
    const player = alt.Player.local.scriptID; // Получаем ID игрока
    foodObject = native.createObject(1463127915, alt.Player.local.pos.x, alt.Player.local.pos.y, alt.Player.local.pos.z, true, true, true); // Спавним объект
    native.attachEntityToEntity(
        foodObject, // entity1
        player, // entity2
        native.getPedBoneIndex(player, 60309), // boneIndex
        0.0, // xPos
        0.0, // yPos
        0.0, // zPos
        0.0, // xRot
        0.0, // yRot
        0.0, // zRot
        true, // p9
        true, // useSoftPinning
        false, // collision
        true, // isPed
        0, // vertexIndex
        false, // fixedRot
        0 // p15 (можно передать null или другой подходящий параметр)
    ); // Прикрепляем объект к руке игрока
});

import alt from 'alt-client';
import * as native from 'natives'

const name = ['Тюнинг авто']

const modTypes = [
    ['Спойлер'], // 0
    ['Передний бампер'], // 1
    ['Задний бампер'], // 2
    ['Пороги'], // 3
    ['Выхлопные трубы'], // 4
    ['Шасси'], // 5
    ['Решетка радиатора'], // 6
    ['Капот'], // 7
    ['Крылья'], // 8
    ['Правое крыло'], // 9
    ['Крыша'], // 10
    ['Двигатель'], // 11
    ['Тормоза'], // 12
    ['Трансмиссия'], // 13
    ['Гудок'], // 14
    ['Подвеска'], // 15
    ['Броня'], // 16
    ['???'], // 17
    ['Турбо'], // 18
    ['???'], // 19
    ['Дым от шин'], // 20
    ['???'], // 21
    ['Тип фар'], // 22
    ['Передние колеса'], // 23
    ['Задние колеса'], // 24
    ['Номерной знак'], // 25
    ['Цвет номерного знака'], // 26
    ['Отделка'], // 27
    ['Узор'], // 28
    ['Приборная панель'], // 29
    ['???'], // 30
    ['Звук двери'], // 31
    ['Сиденья'], // 32
    ['Руль'], // 33
    ['????'], // 34
    ['???'], // 35
    ['Динамики'], // 36
    ['Багажник'], // 37
    ['Гидравлика'], // 38
    ['Блок двигателя'], // 39
    ['Воздушный фильтр'], // 40
    ['Стойки'], // 41
    ['Крышка арки'], // 42
    ['Антенны'], // 43
    ['Отделка'], // 44
    ['Танк'], // 45
    ['Окна'], // 46
    ['???'], // 47
    ['Наклейка'], // 48 
    ['Тип колеса'], // 49
    ['Цвет 1'], // 50
    ['Цвет 2'], // 51
];

// Массив с ценами для каждого типа модификации
const modPrices = [
    1000, // Цена для Спойлера
    1500, // Цена для Переднего бампера
    1500, // Цена для Заднего бампера
    800,  // Цена для Порогов
    1200, // Цена для Выхлопных труб
    2000, // Цена для Шасси
    900,  // Цена для Решетки радиатора
    2500, // Цена для Капота
    1800, // Цена для Крыльев
    1800, // Цена для Правого крыла
    2200, // Цена для Крыши
    3000, // Цена для Двигателя
    1500, // Цена для Тормозов
    2000, // Цена для Трансмиссии
    500,  // Цена для Гудков
    1200, // Цена для Подвески
    3000, // Цена для Брони
    0,    // Цена для ???
    2500, // Цена для Турбо
    0,    // Цена для ???
    700,  // Цена для Дыма от шин
    0,    // Цена для ???
    600,  // Цена для Типа фар
    1000, // Цена для Передних колес
    1000, // Цена для Задних колес
    300,  // Цена для Номерного знака
    150,  // Цена для Цвета номерного знака
    500,  // Цена для Отделки
    400,  // Цена для Узора
    600,  // Цена для Приборной панели
    0,    // Цена для ???
    50,   // Цена для Звука двери
    700,  // Цена для Сидений
    800,  // Цена для Руля
    0,    // Цена для ????
    0,    // Цена для ???
    900,  // Цена для Динамиков
    1200, // Цена для Багажника
    1500, // Цена для Гидравлики
    2000, // Цена для Блока двигателя
    300,  // Цена для Воздушного фильтра
    400,  // Цена для Стойки
    500,  // Цена для Крышки арки
    300,  // Цена для Антенн
    500,  // Цена для Отделки
    2500, // Цена для Танка
    600,  // Цена для Окон
    0,    // Цена для ???
    200,  // Цена для Наклейки
    1200, // Цена для Типа колеса
    100,  // Цена для Цвета 1
    100,  // Цена для Цвета 2
];

alt.setCamFrozen(false)

let color1 = { r: 0, g: 0, b: 0 };
let color2 = { r: 0, g: 0, b: 0 };

let web = undefined;
let player = alt.Player.local
let vehicle;

let cursour = true;

alt.onServer('CU::Init', Init);

alt.on('keyup', (key) => {
    if (key == 69) {
        alt.Marker.all.forEach(value => {
            const dist = native.getDistanceBetweenCoords(value.pos.x, value.pos.y, value.pos.z, player.pos.x, player.pos.y, player.pos.z, false);
            const type = value.getMeta("type");
            if (dist <= 2 && type == "tuningShop") {
                alt.emitServer("CU::StartTuning")
                Init();
            }
        })
    }
})

function Init() {
    if (web === undefined && player.vehicle != undefined) {
        native.displayRadar(false)
        vehicle = player.vehicle.scriptID;

        web = new alt.WebView('http://resource/client/html/index.html');
        web.focus();

        alt.showCursor(cursour)
        native.freezeEntityPosition(vehicle, cursour);

        web.on('CU::Window:Load', () => OptionLoad())
    }

    web.on('CU::Mods:Return', (data) => {
        // Устанавливаем модификации
        for (let i = 0; i < data.length; i++) {
            if (data[i].value !== undefined) {
                const maxModValue = native.getNumVehicleMods(vehicle, i);
                if (data[i].value <= maxModValue) {
                    native.setVehicleMod(vehicle, i, data[i].value, true);
                    alt.log(`Установлен мод: ${modTypes[i][0]} с индексом ${i} и значением ${data[i].value}`);
                } else {
                    alt.log(`Ошибка: значение модификации ${data[i].value} для ${modTypes[i][0]} превышает максимальное значение ${maxModValue}`);
                }
            }
        }
    
        // Устанавливаем цвет для номера и другие параметры
        native.setVehicleModColor1(vehicle, data[data.length - 2].value, 0, 0);
        native.setVehicleCustomPrimaryColour(vehicle, color1.r, color1.g, color1.b);
        native.setVehicleModColor2(vehicle, data[data.length - 1].value, 0, 0);
        native.setVehicleCustomSecondaryColour(vehicle, color2.r, color2.g, color2.b);
    
        // Отправляем данные на сервер для установки модификаций
        alt.emitServer('CU::Mods:Install', data);
    });

    web.on('CU::Mods:Apply', (data, totalprice) => {
        alt.log("Поступил запрос от WebView на установку тюнинга. Общая цена: " + totalprice)
        native.setVehicleWheelType(vehicle, data[data.length - 3].value);
        native.setVehicleMod(vehicle, 23, data[23].value, true);

        native.setVehicleModColor1(vehicle, data[data.length - 2].value, 0, 0)
        native.setVehicleCustomPrimaryColour(vehicle, color1.r, color1.g, color1.b);
        native.setVehicleModColor2(vehicle, data[data.length - 1].value, 0, 0)
        native.setVehicleCustomSecondaryColour(vehicle, color2.r, color2.g, color2.b);

        alt.log("Отправляю запрос от клиента на сервер с попыткой оплатить и сохранить тюнинг...")
        alt.emitServer('CU::Mods:Buy', data, totalprice)
    })

    web.on('CU::Color:Return', (color) => {
        if (color.type === 1) color1 = { r: color.r, g: color.g, b: color.b }
        else color2 = { r: color.r, g: color.g, b: color.b }
        native.setVehicleCustomPrimaryColour(vehicle, color1.r, color1.g, color1.b);
        native.setVehicleCustomSecondaryColour(vehicle, color2.r, color2.g, color2.b);
    })

    web.on('CU::CloseTuning', (data) => {
        alt.emitServer('CU::CloseTuning')
    });
}

alt.onServer('CU::Close', Close)
function Close() {
    if (web != undefined) {
        resetMods(vehicle)
        alt.setCamFrozen(false)
        alt.showCursor(false)
        native.freezeEntityPosition(vehicle, false);
        vehicle = undefined;
        native.displayRadar(true)
        web.destroy();
        web = undefined;
    }
}

alt.onServer('CU::Success', Success)
function Success() {
    if (web != undefined) {
        alt.setCamFrozen(false)
        alt.showCursor(false)
        native.freezeEntityPosition(vehicle, false);
        vehicle = undefined;
        native.displayRadar(true)
        web.destroy();
        web = undefined;
    }
}

function OptionLoad() {
    native.setVehicleModKit(vehicle, 0);
    native.setVehicleCustomPrimaryColour(vehicle, color1.r, color1.g, color1.b);
    native.setVehicleCustomSecondaryColour(vehicle, color2.r, color2.g, color2.b);

    let mods = modTypes.map((mod, index) => {
        let mod_value = native.getVehicleMod(vehicle, index);
        if (mod_value === -1) mod_value = 0;

        let price = modPrices[index]; // Получаем цену для текущего мода

        if (index === modTypes.length - 1) {
            return {
                index: index, // Добавляем индекс модификации
                name: mod[0],
                value: native.getVehicleModColor2(vehicle)[1] === 6 ? 0 : native.getVehicleModColor2(vehicle)[1],
                max_value: 5,
                price: price, 
                show: false
            };
        } else if (index === modTypes.length - 2) {
            return {
                index: index, // Добавляем индекс модификации
                name: mod[0],
                value: native.getVehicleModColor1(vehicle)[1] === 6 ? 0 : native.getVehicleModColor1(vehicle)[1],
                max_value: 5,
                price: price, 
                show: false
            };
        } else if (index === modTypes.length - 3) {
            return {
                index: index, // Добавляем индекс модификации
                name: mod[0],
                value: 0,
                max_value: 7,
                price: price, 
                show: false
            };
        } else {
            return {
                index: index, // Добавляем индекс модификации
                name: mod[0],
                value: mod_value,
                max_value: native.getNumVehicleMods(vehicle, index),
                price: price, 
                show: false
            };
        }
    });

    web.emit('CU::Mods:Load', mods, name[1]); // Передаем модификации с ценами
}

alt.on('keyup', handleKeyup);

function handleKeyup(key) {
    if (web == undefined) return;

    switch (key) {
        case 8:
            Close()
            break;
        case 192:
            if (cursour == false) {
                cursour = true;
                alt.showCursor(cursour)
                alt.setCamFrozen(cursour)
            } else {
                cursour = false
                alt.setCamFrozen(cursour)
                alt.showCursor(cursour)
            }
            break;
    }
}

function resetMods(veh) {
    alt.log("Сбрасываем модификации");
    // Устанавливаем модификации на начальные значения
    native.setVehicleModKit(veh, 0); // Сбрасываем модификации

    for (let i = 0; i < modTypes.length; i++) {
        native.removeVehicleMod(veh, i); // Удаляем каждую модификацию
    }

    // // Сбрасываем цвета (если необходимо)
    // native.setVehicleCustomPrimaryColour(vehicle, 255, 255, 255); // Установите белый цвет или другой начальный цвет
    // native.setVehicleCustomSecondaryColour(vehicle, 255, 255, 255); // Установите белый цвет или другой начальный цвет
}
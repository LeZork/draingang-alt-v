// resources/bank/client/index.js
import * as alt from 'alt-client';
import * as native from 'natives';

let bankingUI = null;
const BANK_POSITION = new alt.Vector3(235.4784, 216.8464, 106.2868); // Координаты банка
const INTERACTION_DISTANCE = 2;
const BANK_BLIP_SPRITE = 108; // ID спрайта для банка
const BANK_MARKER_TYPE = 1; // Тип маркера
let bankBlip = null;

// Обновляем константы для анимаций
const BANK_ANIMATIONS = {
    ENTER: {
        dict: 'amb@prop_human_atm@male@enter',
        name: 'enter',
        duration: 2500
    },
    EXIT: {
        dict: 'amb@prop_human_atm@male@exit',
        name: 'exit',
        duration: 2500
    },
    IDLE: {
        dict: 'amb@prop_human_atm@male@idle_a',
        name: 'idle_a',
        flags: 1
    },
    WITHDRAW: {
        dict: 'amb@prop_human_atm@male@base',
        name: 'base',
        duration: 4000
    }
};

// Добавляем константы для уведомлений
const NOTIFICATION_TYPES = {
    SUCCESS: {
        color: [76, 175, 80, 200],
        sound: "ATM_WINDOW"
    },
    ERROR: {
        color: [244, 67, 54, 200],
        sound: "ERROR"
    },
    INFO: {
        color: [33, 150, 243, 200],
        sound: "ATM_WINDOW"
    }
};

// Обновляем функцию загрузки анимаций
async function loadAnimDict(dict) {
    return new Promise((resolve, reject) => {
        if (native.hasAnimDictLoaded(dict)) {
            resolve();
            return;
        }

        native.requestAnimDict(dict);
        
        let attempts = 0;
        const maxAttempts = 50;
        
        const interval = alt.setInterval(() => {
            if (native.hasAnimDictLoaded(dict)) {
                alt.clearInterval(interval);
                console.log(`Анимация ${dict} загружена успешно`);
                resolve();
            } else if (attempts >= maxAttempts) {
                alt.clearInterval(interval);
                console.error(`Не удалось загрузить анимацию ${dict}`);
                reject(new Error(`Failed to load animation ${dict}`));
            }
            attempts++;
        }, 200);
    });
}

// Создаем блип при загрузке ресурса
alt.on('connectionComplete', () => {
    // Удаляем старый блип, если он существует
    if (bankBlip) {
        bankBlip.destroy();
    }

    // Создаем новый блип с фиксированными координатами
    bankBlip = new alt.PointBlip(BANK_POSITION.x, BANK_POSITION.y, BANK_POSITION.z);
    bankBlip.sprite = BANK_BLIP_SPRITE;
    bankBlip.name = 'Банк';
    bankBlip.shortRange = true;
    bankBlip.scale = 0.8; // Добавляем размер блипа
    bankBlip.color = 2; // Зеленый цвет (можно изменить)
});

// Добавляем очистку блипа при выгрузке ресурса
alt.on('disconnect', () => {
    if (bankBlip) {
        bankBlip.destroy();
        bankBlip = null;
    }
});

// Добавляем отрисовку маркера в everyTick
alt.everyTick(() => {
    const player = alt.Player.local;
    const dist = distance(player.pos, BANK_POSITION);
    
    if (dist <= 20.0) { // Расстояние видимости маркера
        native.drawMarker(
            BANK_MARKER_TYPE,
            BANK_POSITION.x, BANK_POSITION.y, BANK_POSITION.z - 1.0,
            0, 0, 0,
            0, 0, 0,
            1.0, 1.0, 1.0,
            0, 150, 200, 100,
            false, false, 2,
            false, null, null, false
        );
    }
});

// Добавляем функцию расчета расстояния
function distance(pos1, pos2) {
    return Math.sqrt(
        Math.pow(pos1.x - pos2.x, 2) +
        Math.pow(pos1.y - pos2.y, 2) +
        Math.pow(pos1.z - pos2.z, 2)
    );
}

let webViewState = {
    isLoading: false,
    hasError: false,
    lastError: null
};

function setupBankUIEvents() {
    if (!bankingUI) {
        console.log('Client: WebView не инициализирован');
        return;
    }

    console.log('Client: Настройка обработчиков WebView');

    // Обработчики транзакций
    bankingUI.on('bank:deposit', (amount, pin) => {
        console.log('Client: Получен запрос на депозит:', amount, pin);
        alt.emitServer('bank:deposit', amount, pin);
    });

    bankingUI.on('bank:withdraw', (amount, pin) => {
        console.log('Client: Получен запрос на снятие:', amount, pin);
        alt.emitServer('bank:withdraw', amount, pin);
    });

    bankingUI.on('bank:transfer', (recipientCard, amount, pin) => {
        console.log('Client: Получен запрос на перевод:', recipientCard, amount, pin);
        alt.emitServer('bank:transfer', recipientCard, amount, pin);
    });

    bankingUI.on('bank:close', () => {
        console.log('Client: Получен запрос на закрытие банка');
        closeBankUI();
    });
}

async function showBankUI() {
    try {
        if (bankingUI) {
            console.log('Client: WebView уже существует');
            return;
        }

        console.log('Client: Создание WebView');
        bankingUI = new alt.WebView('http://resource/client/ui/bank.html');
        
        // Ждем загрузки WebView
        await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('WebView load timeout'));
            }, 5000);

            bankingUI.on('load', () => {
                clearTimeout(timeout);
                resolve();
            });
        });

        setupBankUIEvents();
        alt.showCursor(true);
        alt.toggleGameControls(false);
        bankingUI.focus();
        alt.emitServer('bank:checkCard');

    } catch (error) {
        console.error('Client: Ошибка при создании WebView:', error);
        closeBankUI();
    }
}

function closeBankUI() {
    if (bankingUI) {
        console.log('Client: Закрытие банковского интерфейса');
        try {
            alt.showCursor(false);
            alt.toggleGameControls(true);
            bankingUI.unfocus();
            bankingUI.destroy();
            bankingUI = null;
        } catch (error) {
            console.error('Client: Ошибка при закрытии WebView:', error);
        }
    }
}

// Добавляем анимацию для операций с деньгами
async function playTransactionAnimation() {
    const player = alt.Player.local;
    
    native.taskPlayAnim(
        player,
        BANK_ANIMATIONS.WITHDRAW.dict,
        BANK_ANIMATIONS.WITHDRAW.name,
        8.0,
        1.0,
        -1,
        0,
        0,
        false,
        false,
        false
    );
    
    // Проигрываем звук транзакции
    native.playSoundFrontend(-1, "ATM_TRANSACTION", "HUD_FRONTEND_DEFAULT_SOUNDSET", true);
    
    await new Promise(resolve => setTimeout(resolve, BANK_ANIMATIONS.WITHDRAW.duration));
    
    // Возвращаемся к idle анимации
    native.taskPlayAnim(
        player,
        BANK_ANIMATIONS.IDLE.dict,
        BANK_ANIMATIONS.IDLE.name,
        8.0,
        1.0,
        -1,
        BANK_ANIMATIONS.IDLE.flags,
        0,
        false,
        false,
        false
    );
}

// Добавляем обработчик клавиши E
alt.on('keyup', (key) => {
    if (key === 69) { // Клавиша E
        const player = alt.Player.local;
        const dist = distance(player.pos, BANK_POSITION);
        
        if (dist <= INTERACTION_DISTANCE) {
            if (!bankingUI) {
                showBankUI();
            }
        }
    }
});

// Добавляем обработчик клавиши Escape
alt.on('keyup', (key) => {
    if (key === 27) { // ESC
        if (bankingUI) {
            closeBankUI();
        }
    }
});

// Обновляем обработчики событий
alt.onServer('bank:cardInfo', (cardData) => {
    console.log('Client: Получены данные карты от сервера:', cardData);
    if (bankingUI) {
        bankingUI.emit('setCardInfo', cardData);
    }
});

// Добавляем обработчик для истории транзакций
alt.onServer('bank:transactionHistory', (transactions) => {
    console.log('Client: Получена история транзакций:', transactions);
    if (bankingUI) {
        bankingUI.emit('bank:transactionHistory', transactions);
    }
});
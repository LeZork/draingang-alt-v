import * as alt from 'alt-client';
import * as native from 'natives';

let notificationQueue = [];
let isShowingNotification = false;
let lastNotificationTime = 0;
const MIN_NOTIFICATION_INTERVAL = 500;
let currentMoney = 0;

// Добавляем звуковые эффекты
const SOUNDS = {
    ADD: 'HUD_AWARDS',
    REMOVE: 'HUD_FRONTEND_DEFAULT_SOUNDSET'
};

// Заменяем Utils.wait на промис
function wait(ms) {
    return new Promise(resolve => alt.setTimeout(resolve, ms));
}

alt.onServer('money:notification', (type, amount) => {
    try {
        const now = Date.now();
        if (now - lastNotificationTime < MIN_NOTIFICATION_INTERVAL) {
            return;
        }
        lastNotificationTime = now;

        // Добавляем звуковой эффект
        if (type === 'add') {
            native.playSoundFrontend(-1, 'PICK_UP_MONEY', SOUNDS.ADD, true);
        } else {
            native.playSoundFrontend(-1, 'WEAPON_PURCHASE', SOUNDS.REMOVE, true);
        }

        const message = type === 'add' ? 
            `~g~+$${amount.toLocaleString()}` : 
            `~r~-$${amount.toLocaleString()}`;
            
        queueNotification(message);

    } catch (error) {
        alt.log('Error in money notification:', error);
    }
});

function queueNotification(message) {
    notificationQueue.push(message);
    if (!isShowingNotification) {
        showNextNotification();
    }
}

async function showNextNotification() {
    if (notificationQueue.length === 0) {
        isShowingNotification = false;
        return;
    }

    isShowingNotification = true;
    const message = notificationQueue.shift();

    try {
        native.beginTextCommandThefeedPost('STRING');
        native.addTextComponentSubstringPlayerName(message);
        native.endTextCommandThefeedPostTicker(false, true);

        await wait(2000);
        showNextNotification();
    } catch (error) {
        alt.log('Error showing notification:', error);
        isShowingNotification = false;
    }
}

// Улучшаем обработку HUD
alt.onServer('updateHUD', (money) => {
    try {
        if (typeof money !== 'number') return;
        
        // Добавляем анимацию при большом изменении
        const difference = Math.abs(money - currentMoney);
        if (difference > 1000) {
            native.animpostfxPlay('MoneyHUD', 0, false);
            alt.setTimeout(() => {
                native.animpostfxStop('MoneyHUD');
            }, 1500);
        }

        currentMoney = money;
        alt.emit('hud:updateMoney', money.toLocaleString());

    } catch (error) {
        alt.log('Error updating HUD:', error);
    }
});

// Добавляем очистку при остановке ресурса
alt.on('disconnect', () => {
    notificationQueue = [];
    isShowingNotification = false;
});
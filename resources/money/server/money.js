import * as alt from 'alt-server';
import moneySystem from './instance.js';

// Экспортируем методы, используя импортированный экземпляр
export const getMoney = (player) => moneySystem.getMoney(player);
export const setMoney = (player, amount) => moneySystem.setMoney(player, amount);
export const addMoney = (player, amount) => moneySystem.addMoney(player, amount);
export const subtractMoney = (player, amount) => moneySystem.removeMoney(player, amount);
export const transferMoney = (fromPlayer, toPlayer, amount) => moneySystem.transferMoney(fromPlayer, toPlayer, amount);
export const hasEnoughMoney = (player, amount) => moneySystem.hasEnoughMoney(player, amount);

// Регистрируем обработчики событий
alt.on('playerDisconnect', (player) => {
    moneySystem.clearCache(player);
});

alt.on('resourceStop', () => {
    moneySystem.cleanup();
});

alt.on('playerConnect', async (player) => {
    try {
        // Ждем пока игрок авторизуется
        if (!player.getSyncedMeta('isAuth')) {
            return;
        }
        
        const money = await moneySystem.getMoney(player);
        moneySystem.moneyCache.set(player.id, money);
        alt.emitClient(player, 'updateHUD', money);
        alt.log(`[Money] Initialized balance for ${player.name}: $${money}`);
    } catch (error) {
        alt.logError(`[Money] Failed to initialize money for ${player.name}:`, error);
    }
});

// Добавляем обработчик синхронизации после авторизации
alt.on('syncedMetaChange', async (player, key, value) => {
    if (key === 'isAuth' && value === true) {
        try {
            const money = await moneySystem.getMoney(player);
            moneySystem.moneyCache.set(player.id, money);
            alt.emitClient(player, 'updateHUD', money);
            alt.log(`[Money] Initialized balance for ${player.name} after auth: $${money}`);
        } catch (error) {
            alt.logError(`[Money] Failed to initialize money after auth for ${player.name}:`, error);
        }
    }
});

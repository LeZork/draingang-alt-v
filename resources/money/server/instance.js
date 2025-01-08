import * as alt from 'alt-server';
import { query } from '../../database/server/index.js';

let isInitialized = false;

class MoneySystem {
    constructor() {
        if (isInitialized) {
            alt.log('[Money] System already initialized');
            return;
        }
        
        this.moneyCache = new Map();
        this.MAX_MONEY = 999999999;
        this.lastSave = Date.now();
        
        this.saveInterval = alt.setInterval(() => {
            this.saveAllMoney();
        }, 5 * 60 * 1000);
        
        this.initDatabase();
        isInitialized = true;
        alt.log('[Money] System initialized successfully');
    }

    async initDatabase() {
        if (isInitialized) return;
        
        try {
            await query(`
                CREATE TABLE IF NOT EXISTS users (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    username VARCHAR(255) NOT NULL UNIQUE,
                    money INTEGER DEFAULT 0,
                    lastupdate TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);
            alt.log('[Money] Database initialized');
        } catch (error) {
            alt.logError('[Money] Database initialization error:', error);
        }
    }

    async getMoney(player) {
        if (!player || !player.valid) return 0;

        try {
            // Проверяем кэш
            if (this.moneyCache.has(player.id)) {
                return this.moneyCache.get(player.id);
            }

            // Получаем из БД
            const [result] = await query('SELECT money FROM users WHERE username = ?', [player.name]);
            const money = result ? parseInt(result.money) : 0;
            
            // Сохраняем в кэш
            this.moneyCache.set(player.id, money);
            
            return money;
        } catch (error) {
            alt.logError(`[Money] Error getting money for ${player.name}:`, error);
            return 0;
        }
    }

    async setMoney(player, amount) {
        if (!player || !player.valid) return false;
        
        try {
            amount = Math.max(0, Math.min(parseInt(amount), this.MAX_MONEY));
            const currentMoney = await this.getMoney(player);
            
            // Обновляем кэш
            this.moneyCache.set(player.id, amount);
            
            // Сразу сохраняем в базу данных
            await query('UPDATE users SET money = ?, lastupdate = CURRENT_TIMESTAMP WHERE username = ?', 
                [amount, player.name]
            );
            
            // Отправляем уведомление
            if (amount !== currentMoney) {
                const type = amount > currentMoney ? 'add' : 'remove';
                const diff = Math.abs(amount - currentMoney);
                alt.emitClient(player, 'money:notification', type, diff);
            }
            
            // Обновляем HUD
            alt.emitClient(player, 'updateHUD', amount);
            
            return true;
        } catch (error) {
            alt.logError(`[Money] Error setting money for ${player.name}:`, error);
            return false;
        }
    }

    async addMoney(player, amount) {
        if (!player || !player.valid) return false;
        
        try {
            amount = Math.max(0, parseInt(amount));
            const currentMoney = await this.getMoney(player);
            return await this.setMoney(player, currentMoney + amount);
        } catch (error) {
            alt.logError(`[Money] Error adding money for ${player.name}:`, error);
            return false;
        }
    }

    async removeMoney(player, amount) {
        if (!player || !player.valid) return false;
        
        try {
            amount = Math.max(0, parseInt(amount));
            const currentMoney = await this.getMoney(player);
            
            if (currentMoney < amount) {
                return false;
            }
            
            return await this.setMoney(player, currentMoney - amount);
        } catch (error) {
            alt.logError(`[Money] Error removing money for ${player.name}:`, error);
            return false;
        }
    }

    async transferMoney(fromPlayer, toPlayer, amount) {
        if (!fromPlayer || !fromPlayer.valid || !toPlayer || !toPlayer.valid) return false;
        
        try {
            amount = Math.max(0, parseInt(amount));
            
            if (await this.removeMoney(fromPlayer, amount)) {
                await this.addMoney(toPlayer, amount);
                return true;
            }
            
            return false;
        } catch (error) {
            alt.logError(`[Money] Error transferring money from ${fromPlayer.name} to ${toPlayer.name}:`, error);
            return false;
        }
    }

    async saveAllMoney() {
        try {
            const promises = [];
            
            for (const [playerId, money] of this.moneyCache) {
                const player = alt.Player.getByID(playerId);
                if (player && player.valid) {
                    promises.push(
                        query('UPDATE users SET money = ?, lastupdate = CURRENT_TIMESTAMP WHERE username = ?', 
                            [money, player.name]
                        )
                    );
                }
            }
            
            await Promise.all(promises);
            this.lastSave = Date.now();
            
            alt.log('[Money] All balances saved successfully');
        } catch (error) {
            alt.logError('[Money] Error saving balances:', error);
        }
    }

    clearCache(player) {
        if (player && player.valid) {
            this.moneyCache.delete(player.id);
        }
    }

    cleanup() {
        try {
            // Сохраняем все балансы перед выключением
            this.saveAllMoney();
            
            // Очищаем интервал автосохранения
            if (this.saveInterval) {
                alt.clearInterval(this.saveInterval);
                this.saveInterval = null;
            }
            
            // Очищаем кэш
            this.moneyCache.clear();
            this.initialized = false;
            
            alt.log('[Money] System cleaned up successfully');
        } catch (error) {
            alt.logError('[Money] Error during cleanup:', error);
        }
    }

    // Добавим метод для проверки баланса
    async hasEnoughMoney(player, amount) {
        if (!player || !player.valid) return false;
        
        try {
            const currentMoney = await this.getMoney(player);
            return currentMoney >= amount;
        } catch (error) {
            alt.logError(`[Money] Error checking balance for ${player.name}:`, error);
            return false;
        }
    }
}

// Создаем и экспортируем единственный экземпляр как default
const moneySystem = new MoneySystem();
export default moneySystem; 
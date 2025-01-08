import * as alt from 'alt-server';
import { getMoney } from '../../money/server/exports.js';

class HUDServer {
    constructor() {
        this.timeInterval = null;
        this.initializeEvents();
        this.startTimeSync();
    }

    initializeEvents() {
        // Обновляем обработчики
        alt.onClient('hud:requestInitialData', this.handleInitialDataRequest.bind(this));
        alt.onClient('playSeatbeltSound', this.handleSeatbeltSound.bind(this));
        alt.on('moneyUpdate', this.handleMoneyUpdate.bind(this));
    }

    async handleInitialDataRequest(player) {
        try {
            if (!player || !player.valid || !player.getSyncedMeta('isAuth')) {
                alt.logError(`Invalid player or not authorized: ${player?.id}`);
                return;
            }
            
            const money = await getMoney(player);
            const health = player.health || 200;
            
            // Отправляем начальные данные
            alt.emitClient(player, 'updateHUD', parseInt(money), health);
            
            // Форматируем и отправляем текущее время
            const date = new Date();
            const formattedDate = {
                hours: date.getHours().toString().padStart(2, '0'),
                minutes: date.getMinutes().toString().padStart(2, '0'),
                date: date.toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                })
            };
            
            alt.emitClient(player, 'updateServerTime', formattedDate);
            
            alt.log(`HUD initialized for player ${player.name}`);
        } catch (error) {
            alt.logError('Error in handleInitialDataRequest:', error);
        }
    }

    handleMoneyUpdate(player, newAmount) {
        if (!player || !player.valid) return;
        
        try {
            const amount = parseInt(newAmount);
            if (isNaN(amount)) {
                alt.logError('Invalid money amount:', newAmount);
                return;
            }
            alt.emitClient(player, 'updateHUD', amount, player.health);
        } catch (error) {
            alt.logError('Error in handleMoneyUpdate:', error);
        }
    }

    handleSeatbeltSound(player, isBuckling) {
        // Воспроизводим звук для всех игроков в радиусе
        const sound = isBuckling ? 'seatbelt_buckle' : 'seatbelt_unbuckle';
        alt.emitClient(player, 'playSound', sound);
    }

    startTimeSync() {
        this.timeInterval = alt.setInterval(() => {
            const date = new Date();
            const hours = date.getHours();
            const minutes = date.getMinutes();
            
            // Форматируем дату в строку
            const formattedDate = {
                hours: hours.toString().padStart(2, '0'),
                minutes: minutes.toString().padStart(2, '0'),
                date: date.toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                })
            };
            
            alt.Player.all.forEach(player => {
                if (player && player.valid) {
                    try {
                        alt.emitClient(player, 'updateServerTime', formattedDate);
                    } catch (error) {
                        alt.logError(`Error updating time for player ${player.name}:`, error);
                    }
                }
            });
        }, 1000);
    }

    cleanup() {
        if (this.timeInterval) {
            alt.clearInterval(this.timeInterval);
            this.timeInterval = null;
        }
    }
}

// Создаем экземпляр серверной части HUD
const hudServer = new HUDServer(); 

// Добавим обработку выключения ресурса
alt.on('resourceStop', () => {
    hudServer.cleanup();
}); 
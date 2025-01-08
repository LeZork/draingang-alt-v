import * as alt from 'alt-server';
import { query } from '../../database/server/index.js';

// Проверяем права при подключении игрока
alt.on('playerConnect', async (player) => {
    try {
        // Проверяем уровень доступа в БД
        const [result] = await query('SELECT access_level FROM users WHERE username = ?', [player.name]);
        
        // Если access_level >= 1, считаем игрока админом
        const isAdmin = result && result.access_level >= 1;
        
        // Отправляем статус админа клиенту
        alt.emitClient(player, 'noclip:setAdmin', isAdmin);
        
    } catch (error) {
        alt.logError(`[NoClip] Error checking admin rights for ${player.name}:`, error);
    }
});

// Обновляем права при изменении уровня доступа
alt.on('playerAccessLevelChanged', async (player) => {
    try {
        const [result] = await query('SELECT access_level FROM users WHERE username = ?', [player.name]);
        const isAdmin = result && result.access_level >= 1;
        alt.emitClient(player, 'noclip:setAdmin', isAdmin);
    } catch (error) {
        alt.logError(`[NoClip] Error updating admin rights for ${player.name}:`, error);
    }
}); 
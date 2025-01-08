import alt from 'alt-server';
import { query } from '../../database/server/index.js';

class NametagsSystem {
    constructor() {
        this.initEvents();
    }

    initEvents() {
        alt.on('playerConnect', this.handlePlayerConnect.bind(this));
        alt.on('playerDisconnect', this.handlePlayerDisconnect.bind(this));
    }

    async handlePlayerConnect(player) {
        try {
            // Проверяем права администратора
            const isAdmin = await this.checkAdminStatus(player);
            player.setStreamSyncedMeta('isAdmin', isAdmin);
            
            // Проверяем, говорит ли игрок
            player.setStreamSyncedMeta('isTalking', false);
            
            alt.log(`[Nametags] Player ${player.name} connected. Admin: ${isAdmin}`);
        } catch (error) {
            alt.logError(`[Nametags] Error handling player connect:`, error);
        }
    }

    handlePlayerDisconnect(player) {
        try {
            // Очищаем метаданные при отключении
            if (player && player.valid) {
                player.deleteStreamSyncedMeta('isAdmin');
                player.deleteStreamSyncedMeta('isTalking');
            }
        } catch (error) {
            alt.logError(`[Nametags] Error handling player disconnect:`, error);
        }
    }

    async checkAdminStatus(player) {
        try {
            if (!player || !player.valid) return false;

            const [result] = await query(
                'SELECT admin_level FROM users WHERE username = ?',
                [player.name]
            );

            return result && result.admin_level > 0;
        } catch (error) {
            alt.logError(`[Nametags] Failed to check admin status for ${player.name}:`, error);
            return false;
        }
    }
}

// Инициализация системы
const nametagsSystem = new NametagsSystem();
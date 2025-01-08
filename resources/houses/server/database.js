import * as alt from 'alt-server';
import { query } from '../../database/server/index.js';
import { houses } from '../shared/config.js';

export class HouseDatabase {
    static async createTables() {
        try {
            // Создаем таблицу для домов
            await query(`
                CREATE TABLE IF NOT EXISTS houses (
                    id INT PRIMARY KEY,
                    owner_id INT NULL,
                    purchase_date DATETIME DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (owner_id) REFERENCES users(id)
                )
            `);
            
            alt.log('Houses tables created successfully');
        } catch (error) {
            alt.logError('Error creating houses tables:', error);
        }
    }

    static async initializeHouses() {
        try {
            // Проверяем каждый дом из конфига
            for (const house of houses) {
                const [existing] = await query('SELECT id FROM houses WHERE id = ?', [house.id]);
                
                if (!existing) {
                    // Если дома нет в БД, добавляем его
                    await query('INSERT INTO houses (id) VALUES (?)', [house.id]);
                    alt.log(`Initialized house ${house.id}`);
                }
            }
            
            alt.log('Houses initialized successfully');
        } catch (error) {
            alt.logError('Error initializing houses:', error);
        }
    }

    static async getHouseOwner(houseId) {
        try {
            const [result] = await query('SELECT owner_id FROM houses WHERE id = ?', [houseId]);
            return result ? result.owner_id : null;
        } catch (error) {
            alt.logError('Error getting house owner:', error);
            return null;
        }
    }

    static async purchaseHouse(houseId, playerId) {
        try {
            await query(
                'UPDATE houses SET owner_id = ?, purchase_date = CURRENT_TIMESTAMP WHERE id = ?',
                [playerId, houseId]
            );
            alt.log(`House ${houseId} purchased by player ${playerId}`);
            return true;
        } catch (error) {
            alt.logError('Error purchasing house:', error);
            return false;
        }
    }

    static async getPlayerHouses(playerId) {
        try {
            const results = await query('SELECT id FROM houses WHERE owner_id = ?', [playerId]);
            return results.map(row => row.id);
        } catch (error) {
            alt.logError('Error getting player houses:', error);
            return [];
        }
    }
} 
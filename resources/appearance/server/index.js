import * as alt from "alt-server";
import { query } from '../../database/server/index.js';

// Константы
const CONFIG = {
    SPAWN: {
        POSITION: { x: -1039.0, y: -2740.0, z: 20.0 },
        DIMENSION_OFFSET: 1
    },
    QUERIES: {
        GET_CHARACTER: 'SELECT * FROM characters WHERE user_id = ? LIMIT 1',
        CHECK_CHARACTER: 'SELECT id FROM characters WHERE user_id = ?',
        UPDATE_CHARACTER: `
            UPDATE characters 
            SET model = ?, face = ?, skin_tone = ?, hair = ?, hair_color = ?,
                eyebrows = ?, eyebrows_color = ?, facial_hair = ?, facial_hair_color = ?,
                ageing = ?, complexion = ?, nose_width = ?, nose_height = ?,
                lip_thickness = ?, jaw_width = ?, cheekbone_height = ?
            WHERE user_id = ?
        `,
        INSERT_CHARACTER: `
            INSERT INTO characters (
                user_id, model, face, skin_tone, hair, hair_color,
                eyebrows, eyebrows_color, facial_hair, facial_hair_color,
                ageing, complexion, nose_width, nose_height,
                lip_thickness, jaw_width, cheekbone_height
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `
    }
};

class AppearanceSystem {
    constructor() {
        // Привязываем методы к контексту класса
        this.handleCharacterDataRequest = this.handleCharacterDataRequest.bind(this);
        this.handleCharacterDataSave = this.handleCharacterDataSave.bind(this);
        this.handleSaveCharacter = this.handleSaveCharacter.bind(this);
        
        this.setupEvents();
    }

    setupEvents() {
        alt.onClient('appearance:requestCharacterData', this.handleCharacterDataRequest);
        alt.onClient('appearance:saveCharacterData', this.handleCharacterDataSave);
        alt.onClient('appearance:save', this.handleSaveCharacter);
    }

    async handleCharacterDataRequest(player) {
        try {
            const userId = player.getMeta('userId');
            alt.log(`[Appearance] Requesting character data for player ${player.id}, userId: ${userId}`);

            if (!userId) {
                this.handleNoUserId(player);
                return;
            }

            const character = await this.getCharacterData(userId);
            
            if (!character) {
                this.initializeCharacterCreator(player);
                return;
            }

            this.sendCharacterData(player, character);

        } catch (error) {
            alt.logError('[Appearance] Error:', error);
            this.handleError(player);
        }
    }

    handleNoUserId(player) {
        alt.logError(`[Appearance] No userId found for player ${player.id}`);
        alt.emitClient(player, 'auth:init:login');
    }

    async getCharacterData(userId) {
        const results = await query(CONFIG.QUERIES.GET_CHARACTER, [userId]);
        return results[0];
    }

    initializeCharacterCreator(player) {
        alt.log(`No character found for player ${player.id}, redirecting to character creator`);
        alt.emitClient(player, 'appearance:showCharacterCreator');
        this.setPlayerCreatorState(player);
    }

    setPlayerCreatorState(player) {
        player.dimension = player.id + CONFIG.SPAWN.DIMENSION_OFFSET;
        const { x, y, z } = CONFIG.SPAWN.POSITION;
        player.spawn(x, y, z);
    }

    sendCharacterData(player, character) {
        const appearance = this.parseAppearance(character);
        alt.emitClient(player, 'appearance:loadCharacterData', appearance);
        alt.log(`Loaded appearance for player ${player.id}`);
    }

    parseAppearance(character) {
        return typeof character.appearance === 'string' 
            ? JSON.parse(character.appearance) 
            : character.appearance;
    }

    async handleCharacterDataSave(player, characterData) {
        try {
            const userId = player.getMeta('userId');
            if (!userId) {
                alt.logError(`No userId found for player ${player.id}`);
                return;
            }

            await this.saveCharacterData(userId, characterData);
            this.handleSuccessfulSave(player, characterData);

        } catch (error) {
            this.handleSaveError(player, error);
        }
    }

    async handleSaveCharacter(player, characterData) {
        try {
            const userId = player.getMeta('userId');
            if (!userId) {
                alt.logError(`No userId found for player ${player.id}`);
                return;
            }

            await this.saveCharacterData(userId, characterData);
            this.handleSuccessfulSave(player, characterData);

        } catch (error) {
            this.handleSaveError(player, error);
        }
    }

    async saveCharacterData(userId, characterData) {
        const stringifiedData = JSON.stringify(characterData);
        await query(
            'INSERT INTO characters (user_id, appearance) VALUES (?, ?) ON DUPLICATE KEY UPDATE appearance = ?',
            [userId, stringifiedData, stringifiedData]
        );
    }

    handleSuccessfulSave(player, characterData) {
        alt.log(`Saved appearance for player ${player.id}`);
        player.dimension = 0;
        const { x, y, z } = CONFIG.SPAWN.POSITION;
        player.spawn(x, y, z);
        alt.emitClient(player, 'appearance:loadCharacterData', characterData);
        alt.emitClient(player, 'appearance:characterCreated');
    }

    handleSaveError(player, error) {
        alt.logError('Error saving character data:', error);
        alt.emitClient(player, 'appearance:error', 'Ошибка сохранения данных персонажа');
    }

    handleError(player) {
        alt.emitClient(player, 'appearance:showCharacterCreator');
        this.setPlayerCreatorState(player);
    }

    async loadCharacter(player) {
        try {
            const userId = player.getMeta('userId');
            alt.log(`[Appearance] Loading character for player ${player.id}, userId: ${userId}`);

            if (!userId) {
                alt.logError(`[Appearance] No userId found for player ${player.id}`);
                return null;
            }

            const character = await this.getCharacterData(userId);

            if (character) {
                alt.emitClient(player, 'appearance:loadCharacter', character);
                return character;
            }

            this.initializeCharacterCreator(player);
            return null;

        } catch (error) {
            alt.logError('[Appearance] Load character error:', error);
            return null;
        }
    }
}

export default new AppearanceSystem();

import * as alt from 'alt-server';
import { query } from '../../database/server/index.js';
import bcrypt from 'bcryptjs';

class AuthSystem {
    constructor() {
        this.setupEventHandlers();
    }

    setupEventHandlers() {
        // Авторизация
        alt.onClient('auth:login', this.handleLogin.bind(this));
        alt.onClient('auth:register', this.handleRegister.bind(this));
        alt.onClient('auth:retry', this.handleRetry.bind(this));
        alt.onClient('auth:resetDimension', this.resetPlayerDimension.bind(this));
        alt.onClient('auth:requestHUDInit', this.handleHUDInit.bind(this));
        alt.onClient('auth:logError', this.logError.bind(this));

        // Подключение/отключение игрока
        alt.on('playerConnect', this.handleConnect.bind(this));
        alt.on('playerDisconnect', this.handleDisconnect.bind(this));
    }

    async handleLogin(player, email, password) {
        if (!player || !player.valid) return;

        try {
            const results = await query('SELECT * FROM users WHERE email = ? LIMIT 1', [email]);
            
            if (results.length === 0) {
                player.emit('auth:response', 'Аккаунт не найден');
                return;
            }

            const user = results[0];
            const isValidPassword = await bcrypt.compare(password, user.password);
            
            if (!isValidPassword) {
                player.emit('auth:response', 'Неверный пароль');
                return;
            }

            // Сохраняем userId в мета-данных
            player.setMeta('userId', user.id);
            
            // Проверяем, что userId установлен
            const userId = player.getMeta('userId');
            alt.log(`[Auth] Verification - userId after setMeta: ${userId}`);

            player.setSyncedMeta('isAuth', true);
            player.setSyncedMeta('userId', user.id);
            
            player.emit('auth:loginSuccess');
            alt.log(`[Auth] Player ${player.id} logged in successfully`);

        } catch (error) {
            alt.logError('Login error:', error);
            player.emit('auth:response', 'Произошла ошибка при входе');
        }
    }

    async handleRegister(player, email, password) {
        if (!player || !player.valid) return;

        try {
            const exists = await query('SELECT id FROM users WHERE email = ? LIMIT 1', [email]);
            
            if (exists.length > 0) {
                player.emit('auth:response', 'Email уже зарегистрирован');
                return;
            }

            // Хешируем пароль
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(password, salt);

            await query('INSERT INTO users (email, password) VALUES (?, ?)', [email, hashedPassword]);
            
            player.emit('auth:response', 'Регистрация успешна');
            alt.log(`[Auth] New player registered: ${email}`);

        } catch (error) {
            alt.logError('Register error:', error);
            player.emit('auth:response', 'Произошла ошибка при регистрации');
        }
    }

    handleConnect(player) {
        if (!player || !player.valid) return;
        
        player.dimension = player.id + 500;
        player.emit('client::auth::init::login');
        alt.log(`[Auth] Player connected: ${player.id}`);
    }

    handleDisconnect(player) {
        if (!player || !player.valid) return;
        alt.log(`[Auth] Player disconnected: ${player.id}`);
    }

    handleRetry(player) {
        if (!player || !player.valid) return;
        player.emit('client::auth::init::login');
    }

    resetPlayerDimension(player) {
        if (!player || !player.valid) return;
        player.dimension = 0;
    }

    handleHUDInit(player) {
        if (!player || !player.valid) return;
        
        if (player.getSyncedMeta('isAuth')) {
            player.emit('auth:confirmed');
            alt.log(`[Auth] HUD initialized for player: ${player.id}`);
        }
    }

    logError(player, error) {
        if (!player || !player.valid) return;
        alt.logError(`[Auth] Client error from player ${player.id}:`, error);
    }
}

export default new AuthSystem();

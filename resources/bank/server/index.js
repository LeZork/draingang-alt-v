// resources/bank/server/index.js
import * as alt from 'alt-server';
import { query } from '../../database/server/index.js';
import bcrypt from 'bcryptjs';
import { getMoney, addMoney, subtractMoney } from '../../money/server/exports.js';

// Добавляем константы для лимитов
const TRANSACTION_LIMITS = {
    MIN_AMOUNT: 1,
    MAX_AMOUNT: 1000000,
    MAX_DAILY_TRANSACTIONS: 10,
    MAX_DAILY_AMOUNT: 5000000
};

// Добавляем кэш для защиты от брутфорса PIN-кода
const pinAttempts = new Map();

// Добавляем константы для блокировки карты
const SUSPICIOUS_ACTIVITY = {
    MAX_FAILED_PINS: 3,
    BLOCK_DURATION: 30 * 60 * 1000, // 30 минут
    SUSPICIOUS_AMOUNT: 1000000,
    MAX_TRANSACTIONS_PER_HOUR: 10
};

// Добавляем Map для хранения заблокированных карт
const blockedCards = new Map();

// Добавляем константы для кэшбэка и бонусов
const REWARDS = {
    CASHBACK: {
        REGULAR: 0.005, // 0.5%
        SILVER: 0.01,   // 1%
        GOLD: 0.015,    // 1.5%
        PLATINUM: 0.02   // 2%
    },
    BONUS_POINTS: {
        TRANSACTION_POINTS: 10,    // За каждую транзакцию
        MIN_AMOUNT_FOR_POINTS: 1000, // Минимальная сумма для начисления
        POINTS_PER_1000: 5        // Количество очков за каждые 1000
    },
    STATUS_REQUIREMENTS: {
        SILVER: 50000,    // Общая сумма транзакций
        GOLD: 250000,
        PLATINUM: 1000000
    }
};

// Добавим Map для отслеживания текущих транзакций
const activeTransactions = new Map();

// Функция для проверки состояния транзакции
function checkTransactionState(cardId) {
    if (activeTransactions.has(cardId)) {
        return false; // Транзакция уже выполняется
    }
    activeTransactions.set(cardId, Date.now());
    return true;
}

// Функция для завершения транзакции
function finishTransaction(cardId) {
    activeTransactions.delete(cardId);
}

// Функция для проверки попыток ввода PIN-кода
function checkPinAttempts(playerId) {
    const attempts = pinAttempts.get(playerId) || { count: 0, timestamp: Date.now() };
    
    // Сброс попыток после 30 минут
    if (Date.now() - attempts.timestamp > 30 * 60 * 1000) {
        attempts.count = 0;
        attempts.timestamp = Date.now();
    }
    
    if (attempts.count >= 3) {
        return false;
    }
    
    attempts.count++;
    pinAttempts.set(playerId, attempts);
    return true;
}

// Добавим функцию для проверки синхронизации
function validateClientServerSync(player, cardData) {
    try {
        // Проверяем, что клиент получает актуальные данные
        alt.emitClient(player, 'bank:cardInfo', {
            cardNumber: cardData.card_number.slice(-4).padStart(16, '*'),
            balance: cardData.balance,
            createdDate: cardData.created_date,
            status: cardData.card_status,
            bonusPoints: cardData.bonus_points
        });
        
        return true;
    } catch (error) {
        alt.logError('Sync validation error:', error);
        return false;
    }
}

// Обновляем функцию логирования транзакций
async function logTransaction(cardId, type, amount, oldBalance, newBalance, player) {
    try {
        const transactionCode = generateTransactionCode();
        const description = getTransactionDescription(type, amount);
        
        await query(`
            INSERT INTO bank_transactions 
            (card_id, type, amount, old_balance, new_balance, transaction_code, description)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [cardId, type, amount, oldBalance, newBalance, transactionCode, description]);

        // Логируем для аудита
        alt.log(`[Bank] Transaction: ${transactionCode} | Player: ${player.name} | Type: ${type} | Amount: $${amount}`);
        
        return transactionCode;
    } catch (error) {
        alt.logError('[Bank] Failed to log transaction:', error);
        throw new Error('Ошибка при записи транзакции');
    }
}

// Функция для генерации уникального кода транзакции
function generateTransactionCode() {
    return 'TX' + Date.now().toString(36).toUpperCase() + 
           Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Функция для генерации описания транзакции
function getTransactionDescription(type, amount) {
    const descriptions = {
        'deposit': `Внесение наличных: $${amount}`,
        'withdraw': `Снятие наличных: $${amount}`,
        'transfer-in': `Входящий перевод: $${amount}`,
        'transfer-out': `Исходящий перевод: $${amount}`
    };
    return descriptions[type] || `Операция: ${type} - $${amount}`;
}

// Функция для проверки дневных лимитов
async function checkDailyLimits(cardId) {
    const [dailyStats] = await query(`
        SELECT 
            COUNT(*) as transaction_count,
            SUM(amount) as total_amount
        FROM bank_transactions
        WHERE card_id = ?
        AND created_at >= CURDATE()
        AND created_at < CURDATE() + INTERVAL 1 DAY
    `, [cardId]);

    return {
        canMakeTransaction: dailyStats.transaction_count < TRANSACTION_LIMITS.MAX_DAILY_TRANSACTIONS,
        remainingDailyAmount: TRANSACTION_LIMITS.MAX_DAILY_AMOUNT - (dailyStats.total_amount || 0)
    };
}

// Функция для проверки блокировки карты
async function checkCardBlock(cardId) {
    const [cardData] = await query('SELECT is_blocked, block_until, block_reason FROM bank_cards WHERE id = ?', [cardId]);
    
    if (cardData.is_blocked) {
        if (cardData.block_until && new Date(cardData.block_until) < new Date()) {
            // Автоматически разблокируем карту
            await query('UPDATE bank_cards SET is_blocked = 0, block_until = NULL WHERE id = ?', [cardId]);
            return { blocked: false };
        }
        return {
            blocked: true,
            reason: cardData.block_reason,
            until: cardData.block_until
        };
    }
    return { blocked: false };
}

// Функция для блокировки карты
function blockCard(cardId, reason) {
    blockedCards.set(cardId, {
        timestamp: Date.now(),
        reason: reason
    });
}

// Обновляем функцию проверки подозрительной активности
async function checkSuspiciousActivity(cardId, amount) {
    // Проверяем блокировку
    const blockStatus = await checkCardBlock(cardId);
    if (blockStatus.blocked) {
        return `Карта заблокирована: ${blockStatus.reason}. Осталось минут: ${blockStatus.remainingTime}`;
    }

    // Проверяем количество неудачных попыток ввода PIN
    const failedAttempts = pinAttempts.get(cardId)?.count || 0;
    if (failedAttempts >= SUSPICIOUS_ACTIVITY.MAX_FAILED_PINS) {
        blockCard(cardId, 'Превышено количество неудачных попыток ввода PIN');
        return 'Карта заблокирована из-за неверного ввода PIN';
    }

    // Проверяем количество транзакций за час
    const [hourlyTransactions] = await query(`
        SELECT COUNT(*) as count
        FROM bank_transactions
        WHERE card_id = ?
        AND created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
    `, [cardId]);

    if (hourlyTransactions.count >= SUSPICIOUS_ACTIVITY.MAX_TRANSACTIONS_PER_HOUR) {
        blockCard(cardId, 'Превышен лимит транзакций за час');
        return 'Карта заблокирована из-за превышения лимита транзакций';
    }

    // Проверяем подозрительно крупные транзакции
    if (amount >= SUSPICIOUS_ACTIVITY.SUSPICIOUS_AMOUNT) {
        blockCard(cardId, 'Подозрительно крупная транзакция');
        return 'Карта заблокирована из-за подозрительной активности';
    }

    return null;
}

// Обновляем обработчик создания карты
alt.onClient('bank:createCard', async (player, pin) => {
    try {
        console.log('Получен запрос на создание карты с PIN:', pin);
        
        // Проверка формата PIN-кода
        if (!/^\d{4}$/.test(pin)) {
            console.log('Неверный формат PIN:', pin);
            alt.emitClient(player, 'bank:error', 'PIN-код должен состоять из 4 цифр');
            return;
        }

        const [userData] = await query('SELECT id FROM users WHERE username = ?', [player.name]);
        if (!userData) {
            console.log('Пользователь не найден:', player.name);
            alt.emitClient(player, 'bank:error', 'Ошибка: игрок не найден');
            return;
        }

        // Проверка на существующую карту
        const [existingCard] = await query('SELECT id FROM bank_cards WHERE user_id = ?', [userData.id]);
        if (existingCard) {
            console.log('У игрока уже есть карта:', player.name);
            alt.emitClient(player, 'bank:error', 'У вас уже есть банковская карта');
            return;
        }

        const cardNumber = generateCardNumber();
        const hashedPin = await bcrypt.hash(pin, 10);

        await query(
            'INSERT INTO bank_cards (user_id, card_number, pin_code) VALUES (?, ?, ?)',
            [userData.id, cardNumber, hashedPin]
        );

        console.log('Карта успешно создана для игрока:', player.name);
        alt.emitClient(player, 'bank:cardCreated', cardNumber);
        alt.log(`New bank card created for player ${player.name}`);
    } catch (error) {
        console.error('Ошибка при создании карты:', error);
        alt.logError('Error creating bank card:', error);
        alt.emitClient(player, 'bank:error', 'Произошла ошибка при создании карты');
    }
});

// Обновляем обработчик депозита
alt.onClient('bank:deposit', async (player, amount, pin) => {
    try {
        console.log(`[Bank] Deposit request from ${player.name}: $${amount}`);
        
        amount = Math.floor(Number(amount));
        if (!amount || amount <= 0) {
            alt.emitClient(player, 'bank:error', 'Некорректная сумма');
            return;
        }

        // Проверяем баланс игрока используя новую систему денег
        const playerMoney = await getMoney(player);
        if (playerMoney < amount) {
            alt.emitClient(player, 'bank:error', 'Недостаточно средств');
            return;
        }

        const [userData] = await query('SELECT id FROM users WHERE username = ?', [player.name]);
        const [cardData] = await query('SELECT * FROM bank_cards WHERE user_id = ?', [userData.id]);

        if (!cardData) {
            alt.emitClient(player, 'bank:error', 'У вас нет банковской карты');
            return;
        }

        await query('START TRANSACTION');

        try {
            // Снимаем деньги у игрока используя новую систему
            if (await subtractMoney(player, amount)) {
                const [currentBalance] = await query('SELECT balance FROM bank_cards WHERE id = ? FOR UPDATE', [cardData.id]);
                const newBalance = Number(currentBalance.balance) + amount;
                
                await query('UPDATE bank_cards SET balance = ? WHERE id = ?', [newBalance, cardData.id]);
                await logTransaction(cardData.id, 'deposit', amount, currentBalance.balance, newBalance, player);
                
                await query('COMMIT');
                
                alt.emitClient(player, 'bank:transactionComplete', 'deposit', amount);
                alt.emitClient(player, 'bank:updateBalance', newBalance);
                
                alt.log(`[Bank] ${player.name} deposited $${amount}. New balance: $${newBalance}`);
            } else {
                await query('ROLLBACK');
                alt.emitClient(player, 'bank:error', 'Ошибка при снятии денег');
            }
        } catch (error) {
            await query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        alt.logError('[Bank] Deposit error:', error);
        alt.emitClient(player, 'bank:error', 'Произошла ошибка при депозите');
    }
});

// Обновляем обработчик снятия денег
alt.onClient('bank:withdraw', async (player, amount, pin) => {
    try {
        amount = Math.floor(Number(amount));
        if (!amount || amount <= 0) {
            alt.emitClient(player, 'bank:error', 'Некорректная сумма');
            return;
        }

        const [userData] = await query('SELECT id FROM users WHERE username = ?', [player.name]);
        const [cardData] = await query('SELECT * FROM bank_cards WHERE user_id = ?', [userData.id]);

        if (!cardData) {
            alt.emitClient(player, 'bank:error', 'У вас нет банковской карты');
            return;
        }

        if (cardData.balance < amount) {
            alt.emitClient(player, 'bank:error', 'Недостаточно средств на карте');
            return;
        }

        await query('START TRANSACTION');

        try {
            const newBalance = cardData.balance - amount;
            await query('UPDATE bank_cards SET balance = ? WHERE id = ?', [newBalance, cardData.id]);
            
            // Добавляем деньги игроку используя новую систему
            if (await addMoney(player, amount)) {
                await logTransaction(cardData.id, 'withdraw', amount, cardData.balance, newBalance, player);
                await query('COMMIT');
                
                alt.emitClient(player, 'bank:transactionComplete', 'withdraw', amount);
                alt.emitClient(player, 'bank:updateBalance', newBalance);
                
                alt.log(`[Bank] ${player.name} withdrew $${amount}. New balance: $${newBalance}`);
            } else {
                await query('ROLLBACK');
                alt.emitClient(player, 'bank:error', 'Ошибка при добавлении денег');
            }
        } catch (error) {
            await query('ROLLBACK');
            throw error;
        }
    } catch (error) {
        alt.logError('[Bank] Withdraw error:', error);
        alt.emitClient(player, 'bank:error', 'Произошла ошибка при снятии денег');
    }
});

// Обновляем обработчик проверки карты
alt.onClient('bank:checkCard', async (player) => {
    try {
        console.log('Сервер: Проверка карты для игрока:', player.name);
        
        // Проверяем существование игрока в базе данных
        const [userData] = await query('SELECT id FROM users WHERE username = ?', [player.name]);
        if (!userData) {
            console.log('Сервер: Игрок не найден в БД:', player.name);
            alt.emitClient(player, 'bank:noCard');
            return;
        }

        // Проверяем наличие карты
        const [cardData] = await query(`
            SELECT 
                id,
                card_number,
                balance,
                DATE_FORMAT(created_at, '%d.%m.%Y') as created_date
            FROM bank_cards 
            WHERE user_id = ?
        `, [userData.id]);

        console.log('Сервер: Результат запроса карты:', cardData);

        if (cardData && cardData.card_number) {
            console.log('Сервер: Отправка данных карты клиенту');
            const cardInfo = {
                cardNumber: cardData.card_number.slice(-4).padStart(16, '*'),
                balance: parseInt(cardData.balance) || 0,
                createdDate: cardData.created_date
            };
            console.log('Сервер: Подготовленные данные карты:', cardInfo);
            alt.emitClient(player, 'bank:cardInfo', cardInfo);
        } else {
            console.log('Сервер: Карта не найдена, отправляем событие bank:noCard');
            alt.emitClient(player, 'bank:noCard');
        }
    } catch (error) {
        console.error('Сервер: Ошибка при проверке карты:', error);
        alt.logError('Error checking card:', error);
        alt.emitClient(player, 'bank:error', 'Произошла ошибка при проверке карты');
    }
});

// Добавляем обработчик получения баланса
alt.onClient('bank:getBalance', async (player) => {
    try {
        const [userData] = await query('SELECT id FROM users WHERE username = ?', [player.name]);
        const [cardData] = await query('SELECT balance FROM bank_cards WHERE user_id = ?', [userData.id]);

        if (cardData) {
            alt.emitClient(player, 'bank:updateBalance', cardData.balance);
        } else {
            alt.emitClient(player, 'bank:error', 'У вас нет банковской карты');
        }
    } catch (error) {
        alt.logError('Error getting balance:', error);
        alt.emitClient(player, 'bank:error', 'Произошла ошибка при получении баланса');
    }
});

// Добавляем обработчик перевода денег
alt.onClient('bank:transfer', async (player, recipientCard, amount, pin) => {
    try {
        // Проверки лимитов и PIN-кода как в других транзакциях
        
        const [senderData] = await query('SELECT * FROM bank_cards WHERE user_id = ?', [userData.id]);
        const [recipientData] = await query('SELECT * FROM bank_cards WHERE card_number = ?', [recipientCard]);

        if (!recipientData) {
            alt.emitClient(player, 'bank:error', 'Карта получателя не найдена');
            return;
        }

        if (senderData.id === recipientData.id) {
            alt.emitClient(player, 'bank:error', 'Нельзя перевести деньги самому себе');
            return;
        }

        // Проверяем баланс отправителя
        if (senderData.balance < amount) {
            alt.emitClient(player, 'bank:error', 'Недостаточно средств');
            return;
        }

        // Выполняем перевод
        await query('START TRANSACTION');

        await query('UPDATE bank_cards SET balance = balance - ? WHERE id = ?', [amount, senderData.id]);
        await query('UPDATE bank_cards SET balance = balance + ? WHERE id = ?', [amount, recipientData.id]);

        // Логируем транзакции для обоих участников
        await logTransaction(senderData.id, 'transfer-out', amount, senderData.balance, senderData.balance - amount, player);
        await logTransaction(recipientData.id, 'transfer-in', amount, recipientData.balance, recipientData.balance + amount, player);

        await query('COMMIT');

        alt.emitClient(player, 'bank:updateBalance', senderData.balance - amount);
        
        // Уведомляем получателя, если он онлайн
        const recipientPlayer = alt.Player.all.find(p => p.name === recipientData.username);
        if (recipientPlayer) {
            alt.emitClient(recipientPlayer, 'bank:notification', `Вы получили перевод на сумму $${amount}`);
        }

    } catch (error) {
        await query('ROLLBACK');
        alt.logError('Error transferring money:', error);
        alt.emitClient(player, 'bank:error', 'Произошла ошибка при переводе денег');
    }
});

// Добавляем обработчик получения истории транзакций
alt.onClient('bank:getTransactionHistory', async (player) => {
    try {
        const [userData] = await query('SELECT id FROM users WHERE username = ?', [player.name]);
        const [cardData] = await query('SELECT id FROM bank_cards WHERE user_id = ?', [userData.id]);

        const transactions = await query(`
            SELECT 
                type,
                amount,
                balance_before,
                balance_after,
                created_at
            FROM bank_transactions 
            WHERE card_id = ?
            ORDER BY created_at DESC
            LIMIT 50
        `, [cardData.id]);

        alt.emitClient(player, 'bank:transactionHistory', transactions);
    } catch (error) {
        alt.logError('Error getting transaction history:', error);
        alt.emitClient(player, 'bank:error', 'Произошла ошибка при получении истории транзакций');
    }
});

// Добавляем обработчик разблокировки карты
alt.onClient('bank:unblockCard', async (player, cardId, adminPin) => {
    try {
        // Проверяем права администратора
        if (!player.hasPermission('bank.admin')) {
            alt.emitClient(player, 'bank:error', 'Недостаточно прав');
            return;
        }

        // Проверяем PIN администратора
        const [adminCard] = await query('SELECT pin_code FROM bank_cards WHERE user_id = ?', [player.id]);
        const validPin = await bcrypt.compare(adminPin, adminCard.pin_code);
        
        if (!validPin) {
            alt.emitClient(player, 'bank:error', 'Неверный PIN администратора');
            return;
        }

        blockedCards.delete(cardId);
        pinAttempts.delete(cardId);

        alt.emitClient(player, 'bank:notification', 'Карта успешно разблокирована', 'SUCCESS');
        
        // Логируем разблокировку
        alt.log(`Admin ${player.name} unblocked card ${cardId}`);

    } catch (error) {
        alt.logError('Error unblocking card:', error);
        alt.emitClient(player, 'bank:error', 'Произошла ошибка при разблокировке карты');
    }
});

// Функция для расчета и начисления кэшбэка
async function processCashback(cardId, amount, transactionType) {
    try {
        // Получаем статус карты и текущий баланс бонусов
        const [cardData] = await query(`
            SELECT 
                c.id,
                c.balance,
                c.bonus_points,
                COALESCE(SUM(t.amount), 0) as total_transactions
            FROM bank_cards c
            LEFT JOIN bank_transactions t ON t.card_id = c.id
            WHERE c.id = ?
            GROUP BY c.id
        `, [cardId]);

        // Определяем статус карты
        let status = 'REGULAR';
        if (cardData.total_transactions >= REWARDS.STATUS_REQUIREMENTS.PLATINUM) {
            status = 'PLATINUM';
        } else if (cardData.total_transactions >= REWARDS.STATUS_REQUIREMENTS.GOLD) {
            status = 'GOLD';
        } else if (cardData.total_transactions >= REWARDS.STATUS_REQUIREMENTS.SILVER) {
            status = 'SILVER';
        }

        // Рассчитываем кэшбэк
        const cashbackRate = REWARDS.CASHBACK[status];
        const cashbackAmount = Math.floor(amount * cashbackRate);

        // Рассчитываем бонусные очки
        let bonusPoints = REWARDS.BONUS_POINTS.TRANSACTION_POINTS;
        if (amount >= REWARDS.BONUS_POINTS.MIN_AMOUNT_FOR_POINTS) {
            bonusPoints += Math.floor(amount / 1000) * REWARDS.BONUS_POINTS.POINTS_PER_1000;
        }

        // Обновляем баланс и бонусные очки
        await query(`
            UPDATE bank_cards 
            SET 
                balance = balance + ?,
                bonus_points = bonus_points + ?,
                card_status = ?
            WHERE id = ?
        `, [cashbackAmount, bonusPoints, status, cardId]);

        return {
            cashbackAmount,
            bonusPoints,
            newStatus: status
        };
    } catch (error) {
        alt.logError('Error processing cashback:', error);
        return null;
    }
}

function generateCardNumber() {
    return Math.floor(Math.random() * 9000000000000000 + 1000000000000000).toString();
}

// Функция для обновления статуса карты
async function updateCardStatus(cardId, totalTransactions) {
    let newStatus = 'REGULAR';
    
    if (totalTransactions >= REWARDS.STATUS_REQUIREMENTS.PLATINUM) {
        newStatus = 'PLATINUM';
    } else if (totalTransactions >= REWARDS.STATUS_REQUIREMENTS.GOLD) {
        newStatus = 'GOLD';
    } else if (totalTransactions >= REWARDS.STATUS_REQUIREMENTS.SILVER) {
        newStatus = 'SILVER';
    }

    await query('UPDATE bank_cards SET card_status = ? WHERE id = ?', [newStatus, cardId]);
    return newStatus;
}

// Добавляем периодическую проверку статусов карт
setInterval(async () => {
    try {
        const cards = await query('SELECT id, total_transactions, card_status FROM bank_cards');
        for (const card of cards) {
            const newStatus = await updateCardStatus(card.id, card.total_transactions);
            if (newStatus !== card.card_status) {
                // Отправляем уведомление игроку, если он онлайн
                const [userData] = await query('SELECT username FROM users WHERE id = (SELECT user_id FROM bank_cards WHERE id = ?)', [card.id]);
                const player = alt.Player.all.find(p => p.name === userData.username);
                if (player) {
                    alt.emitClient(player, 'bank:notification', `Поздравляем! Ваш банковский статус повышен до ${newStatus}!`, 'SUCCESS');
                }
            }
        }
    } catch (error) {
        alt.logError('Error updating card statuses:', error);
    }
}, 3600000); // Проверка каждый час

async function processTransaction(player, type, amount, options = {}) {
    const connection = await getConnection();
    
    try {
        await connection.beginTransaction();

        // Проверяем лимиты
        const limits = await checkDailyLimits(options.cardId);
        if (!limits.canMakeTransaction) {
            throw new Error('Превышен дневной лимит транзакций');
        }
        if (amount > limits.remainingDailyAmount) {
            throw new Error('Превышен дневной лимит суммы');
        }

        // Проверяем блокировку
        const blockStatus = await checkCardBlock(options.cardId);
        if (blockStatus.blocked) {
            throw new Error(`Карта заблокирована: ${blockStatus.reason}`);
        }

        // Выполняем транзакцию
        switch (type) {
            case 'deposit':
                await handleDeposit(connection, player, amount, options);
                break;
            case 'withdraw':
                await handleWithdraw(connection, player, amount, options);
                break;
            case 'transfer':
                await handleTransfer(connection, player, amount, options);
                break;
            default:
                throw new Error('Неизвестный тип транзакции');
        }

        await connection.commit();
        
        // Отправляем уведомление
        alt.emitClient(player, 'bank:transactionComplete', type, amount);
        
    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
}

const cardCache = new Map();
const CACHE_LIFETIME = 60000; // 1 минута

async function getCardData(userId, forceRefresh = false) {
    const cacheKey = `card_${userId}`;
    const cached = cardCache.get(cacheKey);
    
    if (!forceRefresh && cached && (Date.now() - cached.timestamp < CACHE_LIFETIME)) {
        return cached.data;
    }

    const [cardData] = await query('SELECT * FROM bank_cards WHERE user_id = ?', [userId]);
    
    if (cardData) {
        cardCache.set(cacheKey, {
            data: cardData,
            timestamp: Date.now()
        });
    }

    return cardData;
}
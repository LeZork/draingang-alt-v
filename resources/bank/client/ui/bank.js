let currentPin = '';
let currentMenu = '';
let transactionType = '';

// Инициализация при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    console.log('UI: DOM загружен');
    
    // Инициализируем обработчики событий от alt:V
    if ('alt' in window) {
        console.log('UI: alt:V обнаружен, настраиваем обработчики');
        
        alt.on('setCardInfo', (cardData) => {
            console.log('UI: Получены данные карты:', cardData);
            window.currentCardData = cardData; // Сохраняем данные карты
            showMainMenu(cardData);
        });

        alt.on('showCreateCardOffer', () => {
            console.log('UI: Показываем предложение создать карту');
            showCreateCardOffer();
        });

        alt.on('bank:error', (message) => {
            console.log('UI: Получена ошибка:', message);
            showError(message);
        });

        // Добавляем отладочное событие
        alt.emit('debug:log', 'UI: Обработчики событий настроены');
    } else {
        console.error('UI: alt:V не обнаружен');
    }
});

// Проверка наличия карты и показ соответствующего меню
function checkForCard() {
    console.log('UI: Запрос проверки карты');
    alt.emit('bank:checkCard');
}

// Управление PIN-кодом
function addPinDigit(digit) {
    debugPinInput('добавление', digit);
    if (currentPin.length < 4) {
        currentPin += digit;
        updatePinDisplay();
        playSound('BUTTON_CLICK');
    }
}

function clearPin() {
    debugPinInput('очистка', '');
    currentPin = '';
    updatePinDisplay();
    playSound('BUTTON_CLICK');
}

function updatePinDisplay() {
    let displayId;
    switch (currentMenu) {
        case 'create':
            displayId = 'new-pin-display';
            break;
        case 'transaction':
            displayId = 'pin-display';
            break;
        case 'transfer':
            displayId = 'transfer-pin-display';
            break;
        default:
            return;
    }

    const display = document.getElementById(displayId);
    if (display) {
        display.textContent = '*'.repeat(currentPin.length) + '_'.repeat(4 - currentPin.length);
    }
}

// Управление меню
function showCreateCardMenu() {
    hideAllMenus();
    document.getElementById('create-card-menu').style.display = 'block';
    currentMenu = 'create';
    clearPin();
}

function showMainMenu(cardData) {
    console.log('UI: Показываем главное меню с данными:', cardData);
    
    if (!cardData) {
        console.error('UI: Нет данных карты для отображения');
        showBankNotification('Ошибка получения данных карты', 'error');
        return;
    }
    
    hideAllMenus();
    
    const bankUI = document.querySelector('.bank-ui');
    let mainMenu = document.getElementById('main-menu');
    
    if (!mainMenu) {
        console.log('UI: Создание элемента main-menu');
        mainMenu = document.createElement('div');
        mainMenu.id = 'main-menu';
        mainMenu.className = 'bank-menu';
        bankUI.appendChild(mainMenu);
    }

    mainMenu.innerHTML = `
        <h2>Банковская карта</h2>
        <div class="card-info">
            <p>Номер карты: ${cardData.cardNumber}</p>
            <p>Баланс: $${cardData.balance.toLocaleString()}</p>
            <p>Дата выпуска: ${cardData.createdDate}</p>
        </div>
        <div class="quick-actions">
            <button class="action-button" onclick="showDepositMenu()">Внести</button>
            <button class="action-button" onclick="showWithdrawMenu()">Снять</button>
            <button class="action-button" onclick="showTransferMenu()">Перевести</button>
            <button class="action-button" onclick="showTransactionHistory()">История</button>
            <button class="action-button" onclick="closeBank()">Закрыть</button>
        </div>
    `;
    
    mainMenu.style.display = 'block';
    currentMenu = 'main';
    console.log('UI: Главное меню отображено');
}

function showDepositMenu() {
    console.log('UI: Открытие меню депозита');
    hideAllMenus();
    
    const depositMenu = createBankMenu('deposit-menu');
    depositMenu.innerHTML = `
        <h2>Внесение средств</h2>
        <div class="transaction-form">
            <input type="number" id="amount" placeholder="Сумма" min="1" step="1" class="amount-input">
            <div class="quick-amounts">
                <button class="quick-amount" data-amount="100">$100</button>
                <button class="quick-amount" data-amount="500">$500</button>
                <button class="quick-amount" data-amount="1000">$1000</button>
            </div>
            <div class="pin-section">
                <p>Введите PIN-код:</p>
                <div class="pin-display" id="pin-display">____</div>
                <div class="pin-pad">
                    ${generatePinPadHTML()}
                </div>
            </div>
            <div class="quick-actions">
                <button class="action-button confirm-button" onclick="confirmTransaction()">Подтвердить</button>
                <button class="action-button" onclick="showMainMenu(window.currentCardData)">Назад</button>
            </div>
        </div>
    `;

    depositMenu.style.display = 'block';
    currentMenu = 'transaction';
    transactionType = 'deposit';
    currentPin = '';
    updatePinDisplay();

    // Добавляем обработчики
    setupPinPadHandlers(depositMenu);
    setupQuickAmounts(depositMenu);
}

function showWithdrawMenu() {
    console.log('UI: Открытие меню снятия');
    hideAllMenus();
    
    const withdrawMenu = createBankMenu('withdraw-menu');
    withdrawMenu.innerHTML = `
        <h2>Снятие наличных</h2>
        <div class="transaction-form">
            <input type="number" id="amount" placeholder="Сумма" min="1" step="1" class="amount-input">
            <div class="quick-amounts">
                <button class="quick-amount" data-amount="100">$100</button>
                <button class="quick-amount" data-amount="500">$500</button>
                <button class="quick-amount" data-amount="1000">$1000</button>
            </div>
            <div class="pin-section">
                <p>Введите PIN-код:</p>
                <div class="pin-display" id="pin-display">____</div>
                <div class="pin-pad">
                    ${generatePinPadHTML()}
                </div>
            </div>
            <div class="quick-actions">
                <button class="action-button confirm-button" onclick="confirmTransaction()">Подтвердить</button>
                <button class="action-button" onclick="showMainMenu(window.currentCardData)">Назад</button>
            </div>
        </div>
    `;

    withdrawMenu.style.display = 'block';
    currentMenu = 'transaction';
    transactionType = 'withdraw';
    currentPin = '';
    updatePinDisplay();

    // Добавляем обработчики для быстрых сумм
    document.querySelectorAll('.quick-amount').forEach(button => {
        button.addEventListener('click', () => {
            const amount = button.dataset.amount;
            document.getElementById('amount').value = amount;
        });
    });
}

function showTransferMenu() {
    console.log('UI: Открытие меню перевода');
    hideAllMenus();
    
    const transferMenu = createBankMenu('transfer-menu');
    transferMenu.innerHTML = `
        <h2>Перевод средств</h2>
        <div class="transaction-form">
            <input type="text" id="recipient-card" placeholder="Номер карты получателя" class="card-input" maxlength="16">
            <input type="number" id="transfer-amount" placeholder="Сумма" min="1" step="1" class="amount-input">
            <div class="quick-amounts">
                <button class="quick-amount" data-amount="100">$100</button>
                <button class="quick-amount" data-amount="500">$500</button>
                <button class="quick-amount" data-amount="1000">$1000</button>
            </div>
            <div class="pin-section">
                <p>Введите PIN-код:</p>
                <div class="pin-display" id="pin-display">____</div>
                <div class="pin-pad">
                    ${generatePinPadHTML()}
                </div>
            </div>
            <div class="quick-actions">
                <button class="action-button confirm-button" onclick="confirmTransfer()">Подтвердить</button>
                <button class="action-button" onclick="showMainMenu(window.currentCardData)">Назад</button>
            </div>
        </div>
    `;

    transferMenu.style.display = 'block';
    currentMenu = 'transfer';
    currentPin = '';
    updatePinDisplay();

    // Добавляем обработчики для быстрых сумм
    document.querySelectorAll('.quick-amount').forEach(button => {
        button.addEventListener('click', () => {
            const amount = button.dataset.amount;
            document.getElementById('transfer-amount').value = amount;
        });
    });
}

function showTransactionHistory() {
    console.log('UI: Открытие истории транзакций');
    hideAllMenus();
    
    const bankUI = document.querySelector('.bank-ui');
    let historyMenu = document.getElementById('history-menu');
    
    if (!historyMenu) {
        console.log('UI: Создание меню истории транзакций');
        historyMenu = document.createElement('div');
        historyMenu.id = 'history-menu';
        historyMenu.className = 'bank-menu';
        bankUI.appendChild(historyMenu);
    }

    historyMenu.innerHTML = `
        <h2>История операций</h2>
        <div id="transaction-list" class="transaction-list">
            <p>Загрузка истории...</p>
        </div>
        <div class="quick-actions">
            <button class="action-button" onclick="showMainMenu(window.currentCardData)">Назад</button>
        </div>
    `;
    
    historyMenu.style.display = 'block';
    currentMenu = 'history';

    console.log('UI: Запрос истории транзакций');
    if ('alt' in window) {
        alt.emit('bank:getTransactionHistory');
    }
}

function hideAllMenus() {
    const menus = document.querySelectorAll('.bank-menu');
    menus.forEach(menu => menu.style.display = 'none');
}

// Подтверждение операций
function confirmPin() {
    console.log('UI: Подтверждение PIN-кода:', currentPin.length);
    
    if (currentPin.length !== 4) {
        console.log('UI: Ошибка - PIN должен состоять из 4 цифр');
        showError('PIN-код должен состоять из 4 цифр');
        return;
    }

    if (currentMenu === 'create') {
        console.log('UI: Отправка запроса на создание карты с PIN:', currentPin);
        alt.emit('bank:createCard', currentPin);
    } else if (currentMenu === 'transaction') {
        confirmTransaction();
    } else if (currentMenu === 'transfer') {
        confirmTransfer();
    }
}

function confirmTransaction() {
    console.log('UI: Подтверждение транзакции');
    
    if (currentPin.length !== 4) {
        showBankNotification('Введите PIN-код', 'error');
        return;
    }

    const amountInput = document.getElementById('amount');
    if (!amountInput) {
        showBankNotification('Ошибка: поле суммы не найдено', 'error');
        return;
    }

    const amount = parseInt(amountInput.value);
    if (!amount || amount <= 0) {
        showBankNotification('Введите корректную сумму', 'error');
        return;
    }

    console.log('UI: Отправка транзакции:', { type: transactionType, amount, pin: currentPin });
    
    if ('alt' in window) {
        console.log(`UI: Отправка события bank:${transactionType}:`, amount, currentPin);
        alt.emit(`bank:${transactionType}`, amount, currentPin);
        
        // Добавляем обратную связь для пользователя
        showBankNotification('Обработка транзакции...', 'info');
        
        // Блокируем кнопку подтверждения на время обработки
        const confirmButton = document.querySelector('.confirm-button');
        if (confirmButton) {
            confirmButton.disabled = true;
            setTimeout(() => {
                confirmButton.disabled = false;
            }, 3000);
        }
    } else {
        console.error('UI: alt:V не обнаружен');
        showBankNotification('Ошибка связи с сервером', 'error');
    }
}

function showBalance() {
    alt.emit('bank:getBalance');
}

function closeBank() {
    console.log('UI: Закрытие банка');
    emitAltEvent('bank:close');
}

function confirmTransfer() {
    if (currentPin.length !== 4) {
        showError('Введите PIN-код');
        return;
    }

    const recipientCard = document.getElementById('recipient-card').value;
    if (!/^\d{16}$/.test(recipientCard)) {
        showError('Неверный номер карты получателя');
        return;
    }

    const amount = parseInt(document.getElementById('transfer-amount').value);
    if (!amount || amount <= 0) {
        showError('Введите корректную сумму');
        return;
    }

    alt.emit('bank:transfer', recipientCard, amount, currentPin);
}

// Обработка ответов от сервера
alt.on('bank:cardCreated', (cardNumber) => {
    console.log('UI: Карта успешно создана:', cardNumber);
    // После создания карты запрашиваем информацию о ней
    alt.emit('bank:checkCard');
});

alt.on('bank:updateBalance', (balance) => {
    document.getElementById('card-info').textContent = `Баланс: $${balance}`;
    showMainMenu();
});

alt.on('bank:error', (message) => {
    console.error('UI: Ошибка банка:', message);
    showBankNotification(message, 'error');
});

// Добавляем обработчики ответов сервера
alt.on('bank:cardInfo', (cardData) => {
    console.log('UI: Получены данные карты:', cardData);
    if (bankingUI) {
        bankingUI.emit('bank:cardInfo', cardData);
    } else {
        console.error('UI: WebView не инициализирован');
    }
});

alt.on('bank:noCard', () => {
    console.log('UI: Получено событие bank:noCard');
    if (bankingUI) {
        bankingUI.emit('bank:noCard');
    } else {
        console.error('UI: WebView не инициализирован');
    }
});

// Обновляем функцию showError для красивого отображения
function showError(message) {
    console.log('UI: Показ ошибки:', message);
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    errorDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        background-color: rgba(255, 0, 0, 0.8);
        color: white;
        padding: 10px 20px;
        border-radius: 5px;
        z-index: 1000;
    `;
    
    document.body.appendChild(errorDiv);
    
    setTimeout(() => {
        errorDiv.style.opacity = '0';
        setTimeout(() => errorDiv.remove(), 500);
    }, 3000);
}

// Обновляем обработчик получения истории транзакций
alt.on('bank:transactionHistory', (transactions) => {
    console.log('UI: Получены данные истории:', transactions);
    const container = document.getElementById('transaction-list');
    
    if (!container) {
        console.error('UI: Не найден контейнер для истории транзакций');
        return;
    }

    if (!transactions || transactions.length === 0) {
        container.innerHTML = '<p class="no-transactions">История операций пуста</p>';
        return;
    }

    const transactionsList = transactions.map(transaction => {
        const date = new Date(transaction.created_at).toLocaleString('ru-RU');
        const amount = transaction.type.includes('withdraw') || transaction.type.includes('transfer-out') 
            ? `-$${transaction.amount.toLocaleString()}`
            : `+$${transaction.amount.toLocaleString()}`;
        
        let typeText = '';
        switch(transaction.type) {
            case 'deposit': typeText = 'Пополнение'; break;
            case 'withdraw': typeText = 'Снятие'; break;
            case 'transfer-out': typeText = 'Перевод'; break;
            case 'transfer-in': typeText = 'Получение'; break;
            default: typeText = transaction.type;
        }
        
        return `
            <div class="transaction-item ${transaction.type}">
                <div class="transaction-info">
                    <span class="transaction-date">${date}</span>
                    <span class="transaction-type">${typeText}</span>
                </div>
                <span class="${amount.startsWith('-') ? 'amount-negative' : 'amount-positive'}">${amount}</span>
            </div>
        `;
    }).join('');

    container.innerHTML = transactionsList;

    // Добавляем стили для транзакций
    const style = document.createElement('style');
    style.textContent = `
        .transaction-list {
            max-height: 400px;
            overflow-y: auto;
            margin: 10px 0;
            padding: 10px;
        }
        
        .transaction-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            margin: 5px 0;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 5px;
        }
        
        .transaction-info {
            display: flex;
            flex-direction: column;
            align-items: flex-start;
        }
        
        .transaction-date {
            font-size: 0.9em;
            color: #ccc;
        }
        
        .transaction-type {
            font-size: 0.8em;
            color: #999;
        }
        
        .amount-positive {
            color: #4CAF50;
            font-weight: bold;
        }
        
        .amount-negative {
            color: #f44336;
            font-weight: bold;
        }
        
        .no-transactions {
            text-align: center;
            color: #999;
            padding: 20px;
        }
    `;
    document.head.appendChild(style);
});

// Добавляем обработчики быстрых операций
document.querySelectorAll('.quick-amount').forEach(button => {
    button.addEventListener('click', () => {
        const amount = parseInt(button.dataset.amount);
        if (currentMenu === 'transaction') {
            document.getElementById('amount').value = amount;
        } else if (currentMenu === 'transfer') {
            document.getElementById('transfer-amount').value = amount;
        }
    });
});

// Добавляем функцию для сохранения частых получателей
let frequentRecipients = JSON.parse(localStorage.getItem('frequentRecipients') || '[]');

function addFrequentRecipient(cardNumber) {
    if (!frequentRecipients.includes(cardNumber)) {
        frequentRecipients.unshift(cardNumber);
        if (frequentRecipients.length > 5) {
            frequentRecipients.pop();
        }
        localStorage.setItem('frequentRecipients', JSON.stringify(frequentRecipients));
        updateFrequentRecipientsList();
    }
}

function updateFrequentRecipientsList() {
    const container = document.getElementById('frequent-recipients');
    if (!container) return;

    container.innerHTML = frequentRecipients.map(card => `
        <div class="frequent-recipient" onclick="selectRecipient('${card}')">
            <span>${maskCardNumber(card)}</span>
        </div>
    `).join('');
}

function maskCardNumber(card) {
    return '*'.repeat(12) + card.slice(-4);
}

function selectRecipient(card) {
    document.getElementById('recipient-card').value = card;
}

// Добавляем звуковые эффекты
const SOUNDS = {
    BUTTON_CLICK: 'CLICK_BACK',
    BUTTON_HOVER: 'NAV_UP_DOWN',
    TRANSACTION_SUCCESS: 'ATM_WINDOW',
    TRANSACTION_ERROR: 'ERROR'
};

function playSound(soundName) {
    alt.emit('bank:playSound', SOUNDS[soundName]);
}

// Добавляем обработчики звуков для всех кнопок
document.querySelectorAll('button').forEach(button => {
    button.addEventListener('click', () => playSound('BUTTON_CLICK'));
    button.addEventListener('mouseenter', () => playSound('BUTTON_HOVER'));
});

// Обновляем функцию showBankNotification
function showBankNotification(message, type = 'info', duration = 5000) {
    console.log('UI: Показ уведомления:', message, type);
    
    // Проверяем существование центра уведомлений
    let notificationCenter = document.getElementById('notificationCenter');
    if (!notificationCenter) {
        console.log('UI: Создание центра уведомлений');
        notificationCenter = document.createElement('div');
        notificationCenter.id = 'notificationCenter';
        notificationCenter.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 1000;
        `;
        document.body.appendChild(notificationCenter);
    }

    const notification = document.createElement('div');
    notification.className = `bank-notification ${type}`;
    notification.style.cssText = `
        background-color: ${type === 'error' ? 'rgba(255,0,0,0.8)' : 'rgba(0,150,0,0.8)'};
        color: white;
        padding: 10px 20px;
        margin-bottom: 10px;
        border-radius: 5px;
        opacity: 1;
        transition: opacity 0.3s;
    `;
    
    notification.innerHTML = `
        <div class="notification-content">
            <p style="margin: 0;">${message}</p>
        </div>
    `;
    
    notificationCenter.appendChild(notification);
    
    // Проигрываем звук
    if ('alt' in window) {
        alt.emit('bank:playSound', type === 'error' ? 'TRANSACTION_ERROR' : 'TRANSACTION_SUCCESS');
    }
    
    // Удаляем уведомление через указанное время
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, duration);
}

// Добавим функцию для обработки ошибок UI
function handleUIError(error) {
    console.error('UI Error:', error);
    showBankNotification('Произошла ошибка интерфейса', 'error');
    
    // Пробуем восстановить состояние UI
    try {
        hideAllMenus();
        showMainMenu();
    } catch (e) {
        console.error('Failed to recover UI:', e);
        alt.emit('bank:close'); // Закрываем банк в случае критической ошибки
    }
}

// Добавим глобальный обработчик ошибок
window.onerror = function(message, source, lineno, colno, error) {
    handleUIError(error);
    return true;
};

// Добавляем обработчики для всех кнопок пин-пада
document.querySelectorAll('.pin-button').forEach(button => {
    button.addEventListener('click', (e) => {
        const value = e.target.textContent;
        if (value === 'C') {
            clearPin();
        } else if (value === '✓') {
            confirmPin();
        } else {
            addPinDigit(value);
        }
    });
});

// Добавим функцию для отладки
function debugPinInput(action, value) {
    console.log(`PIN действие: ${action}, значение: ${value}, текущий PIN: ${currentPin}, текущее меню: ${currentMenu}`);
}

// Обновляем функцию showCreateCardOffer
function showCreateCardOffer() {
    console.log('UI: Показываем предложение создать карту');
    hideAllMenus();
    
    const createCardMenu = document.getElementById('create-card-menu');
    if (!createCardMenu) {
        console.error('UI: Не найден элемент create-card-menu');
        return;
    }

    createCardMenu.innerHTML = `
        <h2>Банковская карта не найдена</h2>
        <p>У вас нет активной банковской карты.</p>
        <p>Хотите создать новую карту?</p>
        <div class="quick-actions">
            <button class="action-button" onclick="startCardCreation()">Создать карту</button>
            <button class="action-button" onclick="closeBank()">Отмена</button>
        </div>
    `;
    
    createCardMenu.style.display = 'block';
    currentMenu = 'create-offer';
    console.log('UI: Меню создания карты отображено');
}

// Обновляем функцию startCardCreation
function startCardCreation() {
    console.log('UI: Начало создания карты');
    hideAllMenus();
    
    const createCardMenu = document.getElementById('create-card-menu');
    if (!createCardMenu) {
        console.error('UI: Не найден элемент create-card-menu');
        return;
    }

    createCardMenu.innerHTML = `
        <h2>Создание карты</h2>
        <p>Придумайте PIN-код для вашей карты</p>
        <div class="pin-display" id="pin-display">____</div>
        <div class="pin-pad">
            ${generatePinPadHTML()}
        </div>
    `;
    
    createCardMenu.style.display = 'block';
    currentMenu = 'create';
    setupPinPadHandlers();
}

// Обновляем функцию setupPinPadHandlers
function setupPinPadHandlers(menuElement) {
    console.log('UI: Настройка обработчиков пин-пада');
    
    const pinButtons = menuElement.querySelectorAll('.pin-button');
    pinButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const value = e.target.dataset.value;
            console.log('UI: Нажата кнопка пин-пада:', value);
            
            if (value === 'C') {
                clearPin();
            } else if (value === '✓') {
                confirmPin();
            } else {
                addPinDigit(value);
            }
        });
    });
}

// Добавляем функцию для создания пин-пада
function createPinPad() {
    return `
        <div class="pin-pad">
            <button class="pin-button">1</button>
            <button class="pin-button">2</button>
            <button class="pin-button">3</button>
            <button class="pin-button">4</button>
            <button class="pin-button">5</button>
            <button class="pin-button">6</button>
            <button class="pin-button">7</button>
            <button class="pin-button">8</button>
            <button class="pin-button">9</button>
            <button class="pin-button">C</button>
            <button class="pin-button">0</button>
            <button class="pin-button">✓</button>
        </div>
    `;
}

// Добавляем обработчик кликов для всего документа
document.addEventListener('click', (event) => {
    console.log('UI: Клик обработан:', event.target);
});

// Обновляем функцию setupBankUIEvents
function setupBankUIEvents() {
    if (!bankingUI) {
        console.error('UI: Невозможно настроить обработчики - WebView не инициализирован');
        return;
    }

    console.log('UI: Настройка обработчиков событий WebView');

    bankingUI.on('bank:close', () => {
        console.log('UI: Получен запрос на закрытие банка');
        closeBankUI();
    });

    bankingUI.on('bank:createCard', (pin) => {
        console.log('UI: Получен запрос на создание карты');
        alt.emitServer('bank:createCard', pin);
    });

    bankingUI.on('bank:checkCard', () => {
        console.log('UI: Получен запрос на проверку карты');
        alt.emitServer('bank:checkCard');
    });

    // Добавляем обработчик для отладки
    bankingUI.on('debug:log', (message) => {
        console.log('WebView Debug:', message);
    });
}

// Обновляем функцию showBankUI
async function showBankUI() {
    if (!bankingUI) {
        try {
            console.log('UI: Инициализация банковского интерфейса');
            bankingUI = new alt.WebView('http://resource/client/ui/bank.html');
            
            // Ждем загрузки WebView
            await new Promise(resolve => {
                bankingUI.on('load', () => {
                    console.log('UI: WebView загружен');
                    resolve();
                });
            });

            setupBankUIEvents();
            bankingUI.focus();
            alt.showCursor(true);
            alt.toggleGameControls(false);

            console.log('UI: Отправка запроса на проверку карты');
            alt.emitServer('bank:checkCard');
        } catch (error) {
            console.error('UI: Ошибка при создании WebView:', error);
            closeBankUI();
        }
    }
}

// Обновляем функцию для отправки событий в alt:V
function emitAltEvent(eventName, ...args) {
    if ('alt' in window) {
        console.log(`UI: Отправка события ${eventName}:`, ...args);
        try {
            alt.emit(eventName, ...args);
        } catch (error) {
            console.error(`UI: Ошибка при отправке события ${eventName}:`, error);
            showBankNotification('Произошла ошибка при отправке данных', 'error');
        }
    } else {
        console.error(`UI: Невозможно отправить событие ${eventName} - alt:V не обнаружен`);
        showBankNotification('Ошибка связи с сервером', 'error');
    }
}

// Добавляем функцию для генерации HTML пин-пада
function generatePinPadHTML() {
    return `
        <button class="pin-button" data-value="1">1</button>
        <button class="pin-button" data-value="2">2</button>
        <button class="pin-button" data-value="3">3</button>
        <button class="pin-button" data-value="4">4</button>
        <button class="pin-button" data-value="5">5</button>
        <button class="pin-button" data-value="6">6</button>
        <button class="pin-button" data-value="7">7</button>
        <button class="pin-button" data-value="8">8</button>
        <button class="pin-button" data-value="9">9</button>
        <button class="pin-button" data-value="C">C</button>
        <button class="pin-button" data-value="0">0</button>
        <button class="pin-button" data-value="✓">✓</button>
    `;
}

// Обновляем функцию для обработки наград
function showRewardNotification(rewards) {
    console.log('UI: Показ уведомления о наградах:', rewards);
    
    const notification = document.createElement('div');
    notification.className = 'reward-notification';
    notification.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background-color: rgba(0, 150, 0, 0.9);
        color: white;
        padding: 20px;
        border-radius: 10px;
        z-index: 1001;
        text-align: center;
    `;
    
    notification.innerHTML = `
        <h4 style="margin: 0 0 10px 0;">🎉 Поздравляем!</h4>
        <p style="margin: 5px 0;">Вы получили:</p>
        <ul style="list-style: none; padding: 0; margin: 10px 0;">
            ${rewards.cashback > 0 ? `<li>Кэшбэк: $${rewards.cashback.toLocaleString()}</li>` : ''}
            ${rewards.points > 0 ? `<li>Бонусные очки: +${rewards.points}</li>` : ''}
            ${rewards.status !== 'REGULAR' ? `<li>Новый статус: ${rewards.status}</li>` : ''}
        </ul>
    `;
    
    document.body.appendChild(notification);
    
    if ('alt' in window) {
        alt.emit('bank:playSound', 'TRANSACTION_SUCCESS');
    }
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 500);
    }, 5000);
}

// Добавляем функцию для создания меню
function createBankMenu(id, className = 'bank-menu') {
    console.log(`UI: Создание меню ${id}`);
    const bankUI = document.querySelector('.bank-ui');
    let menu = document.getElementById(id);
    
    if (!menu) {
        menu = document.createElement('div');
        menu.id = id;
        menu.className = className;
        bankUI.appendChild(menu);
    }
    
    return menu;
}

// Добавляем функцию для настройки быстрых сумм
function setupQuickAmounts(menuElement) {
    menuElement.querySelectorAll('.quick-amount').forEach(button => {
        button.addEventListener('click', () => {
            const amount = button.dataset.amount;
            document.getElementById('amount').value = amount;
        });
    });
}

// Добавляем обработчики ответов от сервера
alt.on('bank:transactionComplete', (type, amount) => {
    console.log('UI: Транзакция выполнена:', type, amount);
    showBankNotification(`Операция выполнена успешно: $${amount}`, 'success');
    
    // Запрашиваем обновление баланса
    alt.emit('bank:checkCard');
    
    // Возвращаемся в главное меню
    setTimeout(() => {
        showMainMenu(window.currentCardData);
    }, 1500);
});

alt.on('bank:error', (message) => {
    console.error('UI: Ошибка банка:', message);
    showBankNotification(message, 'error');
});

// Обновляем функцию showBankNotification
function showBankNotification(message, type = 'info') {
    console.log(`UI: Показ уведомления: ${message} ${type}`);
    const notification = document.createElement('div');
    notification.className = `bank-notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 500);
    }, 3000);
}
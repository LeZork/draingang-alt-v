import * as alt from 'alt-client';
import * as native from 'natives';

let webView = null;
let isCameraFixed = false;
let loginAttempts = 0; // Добавляем счетчик попыток входа
const MAX_LOGIN_ATTEMPTS = 3; // Максимальное количество попыток
const LOGIN_COOLDOWN = 300000; // 5 минут в миллисекундах
let lastLoginAttempt = 0;

// Добавляем таймаут для запросов
const REQUEST_TIMEOUT = 10000; // 10 секунд

let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 2000; // 2 секунды

// Добавляем константы для звуков
const SOUNDS = {
    ERROR: 'html/sounds/error.mp3',
    SUCCESS: 'html/sounds/success.mp3',
    CLICK: 'html/sounds/click.mp3',
    HOVER: 'html/sounds/hover.mp3'
};

alt.log('Auth client script loaded');

// Добавляем функцию setupEventHandlers
function setupEventHandlers() {
    if (!webView) return;

    webView.on('auth:login', handleLogin);
    webView.on('auth:register', handleRegister);
    webView.on('auth:switchToRegister', () => {
        playSound('CLICK');
        createRegisterWebView();
    });
    webView.on('auth:switchToLogin', () => {
        playSound('CLICK');
        createLoginWebView();
    });
}

// Создание WebView для логина
function createLoginWebView() {
    try {
        if (webView) {
            webView.destroy();
            webView = null;
        }
        
        alt.showCursor(true);
        alt.toggleGameControls(false);
        
        webView = new alt.WebView('http://resource/client/html/login.html');
        webView.focus();
        
        // Убираем вызов native.transitionToBlurred
        setupCamera();
        setupEventHandlers();
        
    } catch (error) {
        alt.logError('[Auth Error in createLoginWebView]:', error);
    }
}

// Создание WebView для регистрации
function createRegisterWebView() {
    try {
        if (webView) {
            webView.destroy();
            webView = null;
        }

        // Настройка камеры и контроллов
        setupCamera();
        if (alt.cursorVisible == false) {
            alt.showCursor(true);
        }
        alt.toggleGameControls(false);

        // Создание WebView
        webView = new alt.WebView("http://resource/client/html/register.html");
        webView.focus(); // Добавляем фокус
        
        // Обработчики событий
        webView.on('auth:register', handleRegister);
        webView.on('auth:switchToLogin', () => createLoginWebView());

        return true;
    } catch (error) {
        alt.log('Error creating register WebView:', error);
        return false;
    }
}

// Обработчик входа
function handleLogin(email, password) {
    try {
        if (!canMakeRequest()) {
            webView.emit('auth:response', 'Пожалуйста, подождите перед следующей попыткой');
            return;
        }

        setLoadingState(true);
        
        const currentTime = Date.now();
        
        if (loginAttempts >= MAX_LOGIN_ATTEMPTS) {
            if (currentTime - lastLoginAttempt < LOGIN_COOLDOWN) {
                const remainingTime = Math.ceil((LOGIN_COOLDOWN - (currentTime - lastLoginAttempt)) / 1000 / 60);
                webView.emit('auth:response', `Слишком много попыток. Подождите ${remainingTime} минут`);
                setLoadingState(false);
                return;
            }
            loginAttempts = 0;
        }

        const timeoutId = alt.setTimeout(() => {
            setLoadingState(false);
            webView.emit('auth:response', 'Превышено время ожидания ответа от сервера');
            loginAttempts--;
        }, REQUEST_TIMEOUT);

        alt.emitServer('auth:login', email, password);
        alt.LocalStorage.set('loginTimeoutId', timeoutId);
        
        loginAttempts++;
        lastLoginAttempt = currentTime;

    } catch (error) {
        handleError(error, 'handleLogin');
        setLoadingState(false);
    }
}

// Добавляем валидацию email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Обработчик регистрации
function handleRegister(email, password) {
    alt.emitServer('auth:register', email, password);
}

// Добавим эффекты камеры
function setupCamera() {
    try {
        isCameraFixed = true;
        const player = alt.Player.local;

        if (player && player.valid) {
            // Скрываем игрока
            native.setEntityAlpha(player.scriptID, 0, false);
            native.setEntityCollision(player.scriptID, false, false);
            native.freezeEntityPosition(player.scriptID, true);
        }

        // Создаем первую камеру
        currentCam = createNewCamera(cameraPositions[0]);

        // Добавляем эффект размытия через другие нативы
        native.triggerScreenblurFadeIn(1000.0);
        native.animpostfxPlay('MenuMGHeistIn', 0, true);

        // Отключаем HUD
        native.displayHud(false);
        native.displayRadar(false);

    } catch (error) {
        handleError(error, 'setupCamera');
    }
}

// Сброс камеры
function resetCamera() {
    const player = alt.Player.local;
    if (!player.valid) return;

    isCameraFixed = false;
    
    // Очищаем интервал камеры
    const interval = alt.LocalStorage.get('cameraInterval');
    if (interval) {
        alt.clearInterval(interval);
        alt.LocalStorage.delete('cameraInterval');
    }
    
    // Возвращаем видимость игрока
    native.setEntityAlpha(player.scriptID, 255, false);
    native.setEntityCollision(player.scriptID, true, true);
    
    // Размораживаем игрока
    native.freezeEntityPosition(player.scriptID, false);
    
    // Возвращаем управление камерой игроку
    native.renderScriptCams(false, false, 0, true, false, 0);
    native.destroyAllCams(true);
    
    // Включаем управление
    alt.toggleGameControls(true);
}

// Обработка ответов сервера
alt.onServer('auth:response', (message) => {
    // Очищаем таймаут при получении ответа
    const timeoutId = alt.LocalStorage.get('loginTimeoutId');
    if (timeoutId) {
        clearTimeout(timeoutId);
        alt.LocalStorage.delete('loginTimeoutId');
    }

    if (webView) {
        webView.emit('auth:response', message);
    }
});

// Закрытие WebView (исправим название события)
alt.onServer('auth:closeWebView', () => {
    if (webView) {
        destroyWebView();
    }
    
    resetCamera();
    
    // Дополнительная проверка и скрытие курсора
    if (alt.cursorVisible) {
        alt.showCursor(false);
    }
    
    // Включаем управление игрой
    alt.toggleGameControls(true);
});

// Фиксация камеры каждый кадр
alt.everyTick(() => {
    if (isCameraFixed) {
        native.disableAllControlActions(0);
        native.setGameplayCamRelativePitch(0.0, 1.0);
        native.setGameplayCamRelativeHeading(0.0);
    }
});

// Автоматическое открытие окна логина при подключении
alt.on('connectionComplete', () => {
    alt.log('Connection complete, showing login window');
    createLoginWebView();
});

// // Тестовая команда для отладки (F5)
// alt.on('keyup', (key) => {
//     if (key === 0x74) { // F5
//         createLoginWebView();
//     }
// });

// Инициализация логина (добавим обработчик)
alt.onServer('client::auth::init::login', () => {
    alt.log('Received login init event');
    createLoginWebView();
});

function destroyWebView() {
    if (!webView) return;
    
    try {
        // Сначала скрываем курсор
        if (alt.cursorVisible) {
            alt.showCursor(false);
        }
        
        // Отключаем все обработчики
        if (webView.valid) {
            webView.off('auth:login', handleLogin);
            webView.off('auth:register', handleRegister);
            webView.off('auth:switchToRegister', createRegisterWebView);
            webView.off('auth:switchToLogin', createLoginWebView);
        }
        
        // Уничтожаем WebView
        if (webView.valid) {
            webView.unfocus();
            webView.destroy();
        }
        webView = null;
        
        // Очищаем таймауты
        const timeoutId = alt.LocalStorage.get('loginTimeoutId');
        if (timeoutId) {
            clearTimeout(timeoutId);
            alt.LocalStorage.delete('loginTimeoutId');
        }
        
        // Включаем управление игрой
        alt.toggleGameControls(true);
        
        // Сбрасываем камеру
        resetCamera();
        
        // Финальная проверка курсора
        if (alt.cursorVisible) {
            alt.showCursor(false);
        }
        
    } catch (error) {
        alt.logError('Error in destroyWebView:', error);
        // Пытаемся очистить состояние даже при ошибке
        webView = null;
        if (alt.cursorVisible) {
            alt.showCursor(false);
        }
        alt.toggleGameControls(true);
        resetCamera();
    }
}

// Обновляем обработчик успешного входа
alt.onServer('auth:loginSuccess', () => {
    try {
        loginAttempts = 0;
        
        // Сначала уничтожаем WebView авторизации
        if (webView && webView.valid) {
            destroyWebView();
        }
        
        // Размораживаем персонажа
        const player = alt.Player.local;
        if (player && player.valid) {
            native.freezeEntityPosition(player.scriptID, false);
            native.setEntityAlpha(player.scriptID, 255, false); // Возвращаем видимость игрока
        }
        
        // Убираем эффекты размытия
        native.triggerScreenblurFadeOut(1000.0);
        native.animpostfxStop('MenuMGHeistIn');
        
        // Включаем HUD и радар
        native.displayHud(true);
        native.displayRadar(true);
        
        // Сбрасываем камеру
        isCameraFixed = false;
        resetCamera();
        
        // Принудительно скрываем курсор
        if (alt.cursorVisible) {
            alt.showCursor(false);
        }
        
        // Включаем управление игрой
        alt.toggleGameControls(true);
        
        // Запрашиваем применение внешнего вида
        alt.emitServer('appearance:requestCharacterData');
        
        // Сбрасываем dimension
        alt.emitServer('auth:resetDimension');
        
        alt.log('Auth success, waiting for server confirmation...');
        
        // Ждем подтверждения от сервера перед инициализацией HUD
        alt.emitServer('auth:requestHUDInit');
        
    } catch (error) {
        alt.logError('Error in loginSuccess handler:', error);
    }
});

// Добавляем новый обработчик для подтверждения авторизации
alt.onServer('auth:confirmed', () => {
    try {
        // Принудительно скрываем курсор
        if (alt.cursorVisible) {
            alt.showCursor(false);
        }
        
        alt.log('Auth confirmed, initializing HUD...');
        
        // Инициализируем HUD
        alt.emit('hud:init');
        
        // Дополнительная проверка курсора через небольшой промежуток
        alt.setTimeout(() => {
            if (alt.cursorVisible) {
                alt.showCursor(false);
            }
        }, 500);
        
    } catch (error) {
        alt.logError('Error in auth confirmation handler:', error);
    }
});

function canMakeRequest() {
    const now = Date.now();
    if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
        return false;
    }
    lastRequestTime = now;
    return true;
}

// Обновляем функцию воспроизведения звука
function playSound(soundName) {
    if (!webView) return;
    
    try {
        const soundPath = SOUNDS[soundName.toUpperCase()];
        if (soundPath) {
            webView.emit('playSound', soundPath);
        }
    } catch (error) {
        handleError(error, 'playSound');
    }
}

// Улучшим обработку ошибок
function handleError(error, context = '') {
    alt.logError(`[Auth Error${context ? ` in ${context}` : ''}]:`, error);
    
    if (webView) {
        webView.emit('auth:response', 'Произошла ошибка. Попробуйте позже.');
    }
    
    // Отправляем ошибку на сервер для логирования
    alt.emitServer('auth:logError', error.message);
}

// Добавим анимации при переходах
function switchForm(fromForm, toForm) {
    if (webView) {
        webView.emit('animateTransition', fromForm, toForm);
    }
}

// Обновляем обработчик отключения
alt.on('disconnect', () => {
    if (isCameraFixed) {
        resetCamera();
    }
    if (webView && webView.valid) {
        destroyWebView();
    }
});

// Добавляем функцию для плавного перехода между формами
function animateFormTransition(fromForm, toForm) {
    if (!webView) return;

    webView.emit('startTransition');
    
    alt.setTimeout(() => {
        if (fromForm === 'login') {
            createRegisterWebView();
        } else {
            createLoginWebView();
        }
        
        alt.setTimeout(() => {
            if (webView) {
                webView.emit('endTransition');
            }
        }, 300);
    }, 300);
}

// Улучшаем обработку ошибок сети
let connectionTimeout = null;

function setupNetworkErrorHandling() {
    alt.on('connectionComplete', () => {
        if (connectionTimeout) {
            alt.clearTimeout(connectionTimeout);
        }
    });

    connectionTimeout = alt.setTimeout(() => {
        if (webView) {
            webView.emit('auth:response', 'Ошибка подключения к серверу');
        }
    }, 10000);
}

// Добавляем обработку состояния загрузки
function setLoadingState(isLoading) {
    if (!webView) return;

    webView.emit('setLoading', isLoading);
    
    if (isLoading) {
        native.triggerScreenblurFadeIn(300.0);
    } else {
        native.triggerScreenblurFadeOut(300.0);
    }
}

const cameraPositions = [
    { pos: { x: -1039.0, y: -2740.0, z: 20.0 }, rot: { x: -20.0, y: 0.0, z: 50.0 } },
    { pos: { x: -1039.0, y: -2740.0, z: 25.0 }, rot: { x: -30.0, y: 0.0, z: 100.0 } },
    { pos: { x: -1039.0, y: -2740.0, z: 30.0 }, rot: { x: -40.0, y: 0.0, z: 150.0 } }
];

let currentCam = null;
let currentPos = 0;

function createNewCamera(config) {
    try {
        const cam = native.createCamWithParams(
            'DEFAULT_SCRIPTED_CAMERA',
            config.pos.x,
            config.pos.y,
            config.pos.z,
            config.rot.x,
            config.rot.y,
            config.rot.z,
            60.0,
            true,
            0
        );

        native.setCamActive(cam, true);
        native.renderScriptCams(true, true, 1000, true, false, 0);

        return cam;
    } catch (error) {
        handleError(error, 'createNewCamera');
        return null;
    }
}

function updateCamera() {
    if (!isCameraFixed || !currentCam) return;

    try {
        // Плавное перемещение камеры
        currentPos = (currentPos + 1) % cameraPositions.length;
        const nextPos = cameraPositions[currentPos];
        
        const cam = native.createCamWithParams(
            'DEFAULT_SCRIPTED_CAMERA',
            nextPos.pos.x,
            nextPos.pos.y,
            nextPos.pos.z,
            nextPos.rot.x,
            nextPos.rot.y,
            nextPos.rot.z,
            60.0,
            true,
            0
        );

        native.setCamActiveWithInterp(cam, currentCam, 5000, 1, 1);
        native.renderScriptCams(true, true, 5000, true, false, 0);
        
        // Удаляем старую камеру
        const oldCam = currentCam;
        currentCam = cam;
        
        alt.setTimeout(() => {
            if (oldCam) {
                native.destroyCam(oldCam, false);
            }
        }, 5000);

    } catch (error) {
        handleError(error, 'updateCamera');
    }
}

// Добавляем интервал обновления камеры
alt.setInterval(updateCamera, 10000);

alt.on('webview:blur', () => {
    if (webView && webView.valid) {
        webView.focus();
        playSound('ERROR');
    }
});

let networkRetryCount = 0;
const MAX_NETWORK_RETRIES = 3;

function handleNetworkError() {
    if (networkRetryCount < MAX_NETWORK_RETRIES) {
        networkRetryCount++;
        alt.setTimeout(() => {
            if (webView) {
                webView.emit('auth:response', `Повторная попытка подключения... (${networkRetryCount}/${MAX_NETWORK_RETRIES})`);
                alt.emitServer('auth:retry');
            }
        }, 2000 * networkRetryCount);
    } else {
        if (webView) {
            webView.emit('auth:response', 'Не удалось подключиться к серверу. Попробуйте позже.');
            playSound('ERROR');
        }
    }
}

// Сброс счетчика при успешном подключении
alt.on('connectionComplete', () => {
    networkRetryCount = 0;
});

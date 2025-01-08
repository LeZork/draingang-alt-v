let backgroundMusic;

// В начале файла добавим таймаут для запросов
const REQUEST_TIMEOUT = 10000; // 10 секунд

// Создадим переменную для хранения обработчика
let responseHandler = null;

if (window.alt === undefined) {
    window.alt = {
        emit: () => { },
        on: () => { },
    };
}

function isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
}

function showMessage(message, type = 'error') {
    const messageElement = document.getElementById('message');
    messageElement.textContent = message;
    messageElement.className = type;
    
    // Добавляем анимацию
    messageElement.style.animation = 'none';
    messageElement.offsetHeight; // Trigger reflow
    messageElement.style.animation = 'fadeIn 0.3s ease-out';
}

function validateInput(email, password) {
    if (!email || !password) {
        showMessage('Пожалуйста, заполните все поля');
        return false;
    }

    if (!isValidEmail(email)) {
        showMessage('Пожалуйста, введите корректный email');
        return false;
    }

    if (password.length < 6) {
        showMessage('Пароль должен содержать минимум 6 символов');
        return false;
    }

    return true;
}

// Добавим индикатор загрузки
function showLoader(show) {
    const button = document.querySelector('button');
    if (show) {
        button.innerHTML = '<span class="loader"></span>';
        button.disabled = true;
    } else {
        button.innerHTML = button.dataset.originalText || 'Отправить';
        button.disabled = false;
    }
}

// Улучшим функции login и register
function login() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    if (!validateInput(email, password)) return;

    const button = document.querySelector('button');
    button.dataset.originalText = button.innerHTML;
    showLoader(true);

    // Удаляем предыдущий обработчик, если он существует
    if (responseHandler) {
        alt.off('auth:response', responseHandler);
    }

    // Создаем новый обработчик
    responseHandler = (message) => {
        clearTimeout(timeoutId);
        showLoader(false);
        
        if (message.includes('успешно')) {
            toggleMusic(false);
        }
        showMessage(message, message.includes('успешно') ? 'success' : 'error');
    };

    // Регистрируем новый обработчик
    alt.on('auth:response', responseHandler);

    const timeoutId = setTimeout(() => {
        showLoader(false);
        showMessage('Превышено время ожидания ответа от сервера');
        // Удаляем обработчик при таймауте
        if (responseHandler) {
            alt.off('auth:response', responseHandler);
            responseHandler = null;
        }
    }, REQUEST_TIMEOUT);

    if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
    }

    alt.emit('auth:login', email, password);
}

function register() {
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    if (!validateInput(email, password)) return;

    if (password !== confirmPassword) {
        showMessage('Пароли не совпадают');
        return;
    }

    const button = document.querySelector('button');
    button.dataset.originalText = button.innerHTML;
    showLoader(true);

    // Удаляем предыдущий обработчик, если он существует
    if (responseHandler) {
        alt.off('auth:response', responseHandler);
    }

    // Создаем новый обработчик
    responseHandler = (message) => {
        clearTimeout(timeoutId);
        showLoader(false);
        
        if (message.includes('успешно')) {
            toggleMusic(false);
        }
        showMessage(message, message.includes('успешно') ? 'success' : 'error');
    };

    // Регистрируем новый обработчик
    alt.on('auth:response', responseHandler);

    const timeoutId = setTimeout(() => {
        showLoader(false);
        showMessage('Превышено время ожидания ответа от сервера');
        // Удаляем обработчик при таймауте
        if (responseHandler) {
            alt.off('auth:response', responseHandler);
            responseHandler = null;
        }
    }, REQUEST_TIMEOUT);

    if (backgroundMusic) {
        backgroundMusic.pause();
        backgroundMusic.currentTime = 0;
    }

    alt.emit('auth:register', email, password);
}

// Инициализация фоновой музыки
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Создаем элемент аудио
        backgroundMusic = new Audio('http://resource/client/sounds/login_music.mp3');
        
        // Настройки аудио
        backgroundMusic.volume = 0.1;
        backgroundMusic.loop = true;
        
        // Добавляем обработчик ошибок
        backgroundMusic.onerror = (error) => {
            console.error('Music loading error:', error);
            console.error('Error code:', backgroundMusic.error.code);
            console.error('Error message:', backgroundMusic.error.message);
        };

        // Добавляем обработчик успешной загрузки
        backgroundMusic.oncanplaythrough = () => {
            console.log('Music loaded successfully');
            // Пробуем воспроизвести музыку после взаимодействия пользователя
            document.addEventListener('click', () => {
                if (backgroundMusic) {
                    backgroundMusic.play().catch(error => {
                        console.log('Playback error:', error);
                    });
                }
            }, { once: true }); // once: true означает, что обработчик сработает только один раз
        };

        // Проверяем путь к файлу
        console.log('Music source:', backgroundMusic.src);
        
        // Добавьте эти строки после инициализации backgroundMusic
        backgroundMusic.addEventListener('error', (e) => {
            console.error('Audio error:', e);
            console.error('Error code:', backgroundMusic.error?.code);
            console.error('Error message:', backgroundMusic.error?.message);
            console.error('Source:', backgroundMusic.src);
        });

        backgroundMusic.addEventListener('loadeddata', () => {
            console.log('Audio loaded successfully');
        });

        // Добавьте проверку состояния аудио
        function checkAudioState() {
            console.log('Audio ready state:', backgroundMusic.readyState);
            console.log('Audio paused:', backgroundMusic.paused);
            console.log('Audio src:', backgroundMusic.src);
            console.log('Audio volume:', backgroundMusic.volume);
        }

        // Вызовите после создания аудио
        checkAudioState();
        
    } catch (error) {
        console.error('Music initialization error:', error);
    }

    // Добавляем обработчик Enter для полей ввода
    const inputs = document.querySelectorAll('input');
    inputs.forEach(input => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const isLoginPage = !document.getElementById('confirmPassword');
                if (isLoginPage) {
                    login();
                } else {
                    register();
                }
            }
        });
    });
});

// Добавляем функцию для управления музыкой
function toggleMusic(play = true) {
    if (!backgroundMusic) return;
    
    try {
        if (play) {
            backgroundMusic.play().catch(error => {
                console.log('Play error:', error);
            });
        } else {
            backgroundMusic.pause();
            backgroundMusic.currentTime = 0;
        }
    } catch (error) {
        console.error('Music toggle error:', error);
    }
}

// Добавляем звуки
const SOUNDS = {
    click: new Audio('sounds/click.ogg'),
    success: new Audio('sounds/success.ogg'),
    error: new Audio('sounds/error.ogg'),
    hover: new Audio('sounds/hover.ogg')
};

// Предзагрузка звуков
Object.values(SOUNDS).forEach(sound => {
    sound.load();
    sound.volume = 0.3;
});

// Добавляем обработчики для звуков
document.querySelectorAll('button, a').forEach(element => {
    element.addEventListener('mouseenter', () => SOUNDS.hover.play());
    element.addEventListener('click', () => SOUNDS.click.play());
});

// Обработка ответов
alt.on('auth:response', (message) => {
    if (message.includes('успешно')) {
        SOUNDS.success.play();
    } else {
        SOUNDS.error.play();
    }
    // ... существующий код обработки ответа ...
});
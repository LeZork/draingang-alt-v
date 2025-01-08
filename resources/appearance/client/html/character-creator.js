// Инициализация alt для тестирования
if (window.alt === undefined) {
    window.alt = {
        emit: () => console.log('Alt emit mock'),
        on: () => console.log('Alt on mock')
    };
}

// Константы для моделей и параметров
const CONFIG = {
    MODELS: {
        male: 'mp_m_freemode_01',
        female: 'mp_f_freemode_01'
    },
    ROTATION: {
        STEP: 45,
        INTERVAL: 100 // Увеличил интервал для большей стабильности
    },
    UPDATE: {
        DELAY: 150, // Увеличил задержку обновления
        ERROR_DISPLAY: 3000
    },
    ANIMATION: {
        DURATION: 100,
        SCALE: 1.05
    }
};

// Конфигурация персонажа
const CHARACTER_CONFIG = {
    fields: {
        integer: ['face', 'skinTone', 'hair', 'hairColor', 'eyebrows', 
                 'eyebrowsColor', 'facialHair', 'facialHairColor', 
                 'ageing', 'complexion'],
        float: ['noseWidth', 'noseHeight', 'lipThickness', 
                'jawWidth', 'cheekboneHeight']
    },
    required: ['face', 'skinTone', 'hair']
};

// Состояние приложения
const AppState = {
    rotation: 0,
    timers: {
        update: null,
        rotation: null
    },
    flags: {
        isSaving: false
    }
};

// Утилиты
const Utils = {
    clamp: (value, min, max) => Math.min(Math.max(value, min), max),
    normalizeRotation: (rotation) => ((rotation % 360) + 360) % 360,
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};

// Улучшенный контроллер персонажа
const CharacterController = {
    async setGender(gender) {
        try {
            // Добавляем проверку валидности значения
            if (!CONFIG.MODELS[gender]) {
                throw new Error('Invalid gender value');
            }
            
            // Блокируем интерфейс на время смены пола
            UI.setInterfaceLocked(true);
            
            // Отправляем событие смены пола
            alt.emit('character:setGender', gender);
            
            // Ждем подтверждения от клиента
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Обновляем интерфейс
            UI.setInterfaceLocked(false);
            Audio.play('success');
        } catch (error) {
            console.error('Gender change error:', error);
            UI.showError('Ошибка при смене пола персонажа');
            Audio.play('error');
        }
    },

    update: Utils.debounce(async () => {
        if (UI.isLocked()) return;
        
        try {
            const data = CharacterController.collectData();
            alt.emit('character:update', data);
            UI.animateSlider(document.activeElement);
        } catch (error) {
            console.error('Update error:', error);
            UI.showError('Ошибка обновления внешности');
        }
    }, CONFIG.UPDATE.DELAY),

    // Улучшенный сборщик данных с проверками
    collectData() {
        const data = {};
        let hasErrors = false;

        // Собираем целочисленные значения
        CHARACTER_CONFIG.fields.integer.forEach(field => {
            const element = document.getElementById(field);
            if (element) {
                const value = parseInt(element.value);
                if (!isNaN(value)) {
                    data[field] = value;
                }
            }
        });

        // Добавляем сбор float значений
        CHARACTER_CONFIG.fields.float.forEach(field => {
            const element = document.getElementById(field);
            if (element) {
                const value = parseFloat(element.value);
                if (!isNaN(value)) {
                    data[field] = value;
                }
            }
        });

        return data;
    },

    rotate(direction) {
        AppState.rotation += direction === 'left' ? -CONFIG.ROTATION.STEP : CONFIG.ROTATION.STEP;
        AppState.rotation = Utils.normalizeRotation(AppState.rotation);
        alt.emit('character:rotate', AppState.rotation);
    },

    async save() {
        if (AppState.flags.isSaving) return;
        
        try {
            AppState.flags.isSaving = true;
            UI.showSaving();
            
            const data = {
                ...this.collectData(),
                gender: document.getElementById('gender')?.value
            };

            if (this.validate(data)) {
                Audio.play('success');
                alt.emit('character:save', data);
                
                // Показываем анимацию успешного сохранения
                UI.showSuccess('Персонаж успешно создан');
                
                // Даем время для отображения сообщения
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // Закрываем окно создания персонажа
                alt.emit('character:created');
            }
        } catch (error) {
            console.error('Save error:', error);
            UI.showError('Ошибка сохранения');
            Audio.play('error');
        } finally {
            AppState.flags.isSaving = false;
        }
    },

    validate(data) {
        const missingFields = CHARACTER_CONFIG.required.filter(field => 
            data[field] === undefined || data[field] === null
        );

        if (missingFields.length > 0) {
            UI.showError('Заполните обязательные поля');
            return false;
        }
        return true;
    }
};

// Улучшенный UI контроллер
const UI = {
    locked: false,

    setInterfaceLocked(state) {
        this.locked = state;
        document.querySelectorAll('input, select, button').forEach(el => {
            el.disabled = state;
        });
    },

    isLocked() {
        return this.locked;
    },

    showSaving() {
        const saveBtn = document.getElementById('save-btn');
        if (!saveBtn) return;
        
        saveBtn.disabled = true;
        saveBtn.innerHTML = '<span class="loader"></span> Сохранение...';
    },

    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        
        // Удаляем предыдущие сообщения об ошибках
        document.querySelectorAll('.error-message').forEach(el => el.remove());
        
        document.body.appendChild(errorDiv);
        setTimeout(() => errorDiv.remove(), CONFIG.UPDATE.ERROR_DISPLAY);
    },

    animateSlider(element) {
        if (element?.type === 'range') {
            element.style.transform = `scale(${CONFIG.ANIMATION.SCALE})`;
            setTimeout(() => {
                element.style.transform = 'scale(1)';
            }, CONFIG.ANIMATION.DURATION);
        }
    },

    showSuccess(message) {
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.textContent = message;
        
        document.querySelectorAll('.success-message').forEach(el => el.remove());
        
        document.body.appendChild(successDiv);
        setTimeout(() => successDiv.remove(), CONFIG.UPDATE.ERROR_DISPLAY);
    }
};

// Аудио контроллер
const Audio = {
    play(type) {
        try {
            // Отправляем событие на клиент для воспроизведения звука
            alt.emit('character:playSound', type);
        } catch (error) {
            console.error('Sound play error:', error);
        }
    }
};

// Улучшенные обработчики событий
function initEventListeners() {
    let lastWheelEvent = 0;
    
    // Оптимизированный обработчик колесика мыши
    document.addEventListener('wheel', (event) => {
        const now = Date.now();
        if (now - lastWheelEvent < 50) return; // Защита от слишком частых событий
        
        lastWheelEvent = now;
        alt.emit('character:zoom', event.deltaY < 0 ? 'in' : 'out');
    });

    // Оптимизированные обработчики поворота
    document.querySelectorAll('.rotation-btn').forEach(btn => {
        const direction = btn.dataset.direction;
        let isRotating = false;
        
        const startRotation = () => {
            if (isRotating || UI.isLocked()) return;
            
            isRotating = true;
            CharacterController.rotate(direction);
            
            AppState.timers.rotation = setInterval(() => {
                CharacterController.rotate(direction);
            }, CONFIG.ROTATION.INTERVAL);
        };
        
        const stopRotation = () => {
            isRotating = false;
            if (AppState.timers.rotation) {
                clearInterval(AppState.timers.rotation);
                AppState.timers.rotation = null;
            }
        };
        
        btn.addEventListener('mousedown', startRotation);
        btn.addEventListener('mouseup', stopRotation);
        btn.addEventListener('mouseleave', stopRotation);
    });

    // Обработчики alt событий
    alt.on('character:updateUI', (data) => {
        Object.entries(data).forEach(([key, value]) => {
            const element = document.getElementById(key);
            if (element) element.value = value;
        });
    });

    alt.on('character:updateGender', (gender) => {
        const element = document.getElementById('gender');
        if (element) element.value = gender;
    });
}

// Инициализация приложения
initEventListeners();

// Экспорт функций для использования в HTML
window.setGender = CharacterController.setGender;
window.updateCharacter = CharacterController.update;
window.rotateCharacter = CharacterController.rotate;
window.saveCharacter = () => CharacterController.save();

// В основном клиентском файле добавляем обработчик звуков
alt.on('character:playSound', (type) => {
    try {
        const soundId = type === 'error' ? 'ERROR_SOUND' : 'SUCCESS_SOUND';
        native.playSoundFrontend(-1, soundId, 'HUD_FRONTEND_DEFAULT_SOUNDSET', true);
    } catch (error) {
        alt.log('Error playing sound:', error);
    }
});

// Добавьте эти функции
window.zoomIn = () => {
    alt.emit('character:zoom', 'in');
};

window.zoomOut = () => {
    alt.emit('character:zoom', 'out');
};

// Добавить обработчик инициализации
document.addEventListener('DOMContentLoaded', () => {
    // Инициализация слайдеров и других элементов управления
    setupEventListeners();
});

// Добавить функцию настройки слушателей событий
function setupEventListeners() {
    document.querySelectorAll('input[type="range"], select').forEach(element => {
        element.addEventListener('change', () => updateCharacter());
        element.addEventListener('input', () => updateCharacter());
    });
}
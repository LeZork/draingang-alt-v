import * as alt from 'alt-client';
import * as native from 'natives';

// Добавляем утилиты в начало файла
const Utils = {
    clamp: (value, min, max) => Math.min(Math.max(value, min), max),
    wait: (ms) => new Promise(resolve => setTimeout(resolve, ms))
};

// Константы
const CONFIG = {
    PLAYER: {
        MODEL: {
            MALE: 'mp_m_freemode_01',
            FEMALE: 'mp_f_freemode_01'
        },
        POSITION: {
            x: -1039.0,
            y: -2740.0,
            z: 20.0
        }
    },
    CAMERA: {
        OFFSET: {
            x: 1.5,
            y: 0.5,
            z: 0.5
        },
        FOV: 60,
        BONE: 31086 // Кость головы
    },
    TIMEOUTS: {
        INITIAL_DELAY: 1000,
        MODEL_CHECK: 500,
        MODEL_LOAD: 5000,
        WEBVIEW_FOCUS: 100
    }
};

// Состояние приложения
const AppState = {
    view: null,
    camera: null,
    ped: null,
    modelLoadingInterval: null,
    rotation: 0,
    currentGender: 'male',
    isUpdating: false
};

// Добавляем константы для компонентов внешности
const APPEARANCE_COMPONENTS = {
    face: 0,
    hair: 2,
    eyebrows: 2,
    facialHair: 1,
};

// Добавляем константы для зума
const ZOOM_CONFIG = {
    MIN: 0.5,
    MAX: 2.0,
    STEP: 0.1,
    DEFAULT: 1.0
};

let currentZoom = ZOOM_CONFIG.DEFAULT;

// Основные функции
alt.onServer('appearance:showCharacterCreator', () => {
    try {
        alt.log('[Appearance] Showing character creator');
        alt.setTimeout(loadPlayerModel, CONFIG.TIMEOUTS.INITIAL_DELAY);
    } catch (error) {
        alt.logError('[Appearance] Error:', error);
    }
});

function loadPlayerModel() {
    try {
        const player = alt.Player.local;
        if (!player) {
            throw new Error('Player not found');
        }

        const modelHash = alt.hash(CONFIG.PLAYER.MODEL.MALE);
        native.requestModel(modelHash);
        
        let attempts = 0;
        const maxAttempts = 10;
        
        AppState.modelLoadingInterval = alt.setInterval(() => {
            if (native.hasModelLoaded(modelHash)) {
                cleanupModelLoading();
                setupPlayer(player, modelHash);
                initializeWebView();
            } else if (++attempts >= maxAttempts) {
                cleanupModelLoading();
                throw new Error('Failed to load model after maximum attempts');
            }
        }, CONFIG.TIMEOUTS.MODEL_CHECK);

    } catch (error) {
        alt.logError('[Appearance] Error loading player model:', error);
        cleanupModelLoading();
    }
}

function cleanupModelLoading() {
    if (AppState.modelLoadingInterval) {
        alt.clearInterval(AppState.modelLoadingInterval);
        AppState.modelLoadingInterval = null;
    }
}

function setupPlayer(player, modelHash) {
    try {
        setPlayerPosition(player);
        native.setPlayerModel(player.scriptID, modelHash);
        
        alt.setTimeout(() => {
            setupPlayerAppearance(player);
            initializeCharacterCreator();
        }, CONFIG.TIMEOUTS.MODEL_LOAD);
        
    } catch (error) {
        alt.logError('[Appearance] Error setting up player:', error);
    }
}

function setPlayerPosition(player) {
    try {
        const { x, y, z } = CONFIG.PLAYER.POSITION;
        native.setEntityCoords(player.scriptID, x, y, z, false, false, false, false);
        
        // Убеждаемся, что rotation определен и является числом
        const heading = typeof AppState.rotation === 'number' ? AppState.rotation : 0;
        native.setEntityHeading(player.scriptID, heading);
        
        native.freezeEntityPosition(player.scriptID, true);
    } catch (error) {
        alt.logError('[Appearance] Error setting player position:', error);
    }
}

function setupPlayerAppearance(player) {
    try {
        native.setPedDefaultComponentVariation(player.scriptID);
        native.setPedHeadBlendData(player.scriptID, 0, 0, 0, 0, 0, 0, 0, 0, 0, false);
        native.setEntityAlpha(player.scriptID, 255, false);
        native.setEntityVisible(player.scriptID, true, false);
    } catch (error) {
        alt.logError('[Appearance] Error setting up appearance:', error);
    }
}

function initializeCharacterCreator() {
    try {
        createWebView();
        setupCamera();
        setupEventHandlers();
    } catch (error) {
        alt.logError('[Appearance] Error initializing character creator:', error);
    }
}

function createWebView() {
    if (AppState.view) {
        AppState.view.destroy();
    }

    AppState.view = new alt.WebView('http://resource/client/html/character-creator.html', true);
    
    alt.setTimeout(() => {
        if (AppState.view?.valid) {
            AppState.view.focus();
            alt.log('[Appearance] WebView focused');
        }
    }, CONFIG.TIMEOUTS.WEBVIEW_FOCUS);

    alt.showCursor(true);
    alt.toggleGameControls(false);
}

function setupCamera() {
    try {
        const player = alt.Player.local;
        if (!player) return;

        const { x, y, z } = CONFIG.PLAYER.POSITION;
        
        // Обновляем смещение камеры для лучшего угла обзора
        const CAMERA_CONFIG = {
            OFFSET: {
                x: 0.0,      // Смещение вперед/назад
                y: 1.0,      // Смещение влево/вправо (положительное значение - перед лицом)
                z: 0.9       // Увеличиваем высоту камеры для лучшего угла
            },
            FOV: 20,         // Сохраняем узкий FOV для детального вида
            BONE: 31086      // Кость головы
        };

        // Создаем камеру с новыми параметрами
        AppState.camera = native.createCamWithParams(
            'DEFAULT_SCRIPTED_CAMERA',
            x + CAMERA_CONFIG.OFFSET.x,
            y + CAMERA_CONFIG.OFFSET.y,
            z + CAMERA_CONFIG.OFFSET.z,
            0, 0, 0,         // Rotation
            CAMERA_CONFIG.FOV,
            true,
            0
        );

        // Направляем камеру на голову персонажа, немного ниже уровня глаз
        native.pointCamAtPedBone(
            AppState.camera,
            player.scriptID,
            CAMERA_CONFIG.BONE,
            0.0, 0.0, -0.05,  // Небольшое смещение вниз для лучшего угла
            true
        );

        native.setCamActive(AppState.camera, true);
        native.renderScriptCams(true, false, 1000, true, false, 0);

        setupLighting(player);
    } catch (error) {
        alt.logError('[Appearance] Camera setup error:', error);
    }
}

function setupLighting(player) {
    native.clearPedBloodDamage(player.scriptID);
    native.clearPedDecorations(player.scriptID);
    native.setPedAoBlobRendering(player.scriptID, true);
    native.setTimecycleModifier('MP_corona_tournament');
}

// Обработчики событий
function setupEventHandlers() {
    if (!AppState.view) return;
    
    AppState.view.on('character:update', updateCharacterAppearance);
    AppState.view.on('character:setGender', setCharacterGender);
    AppState.view.on('character:rotate', rotateCharacter);
    AppState.view.on('character:save', saveCharacter);
    AppState.view.on('character:zoom', handleZoom);
}

function rotateCharacter(direction) {
    try {
        const player = alt.Player.local;
        if (!player || !player.valid) return;

        // Определяем шаг поворота
        const ROTATION_STEP = 45; // градусов
        const rotationChange = direction === 'left' ? -ROTATION_STEP : ROTATION_STEP;

        // Обновляем rotation в AppState
        AppState.rotation = ((AppState.rotation + rotationChange) % 360 + 360) % 360;
        
        // Применяем поворот
        native.setEntityHeading(player.scriptID, AppState.rotation);
    } catch (error) {
        alt.log('[Appearance] Error rotating character:', error);
    }
}

const GENDER_MODELS = {
    male: alt.hash('mp_m_freemode_01'),
    female: alt.hash('mp_f_freemode_01')
};

async function setCharacterGender(gender) {
    try {
        const model = GENDER_MODELS[gender];
        if (!model) {
            throw new Error('Invalid gender model');
        }

        const player = alt.Player.local;
        if (!player) return;

        // Запрашиваем загрузку модели
        native.requestModel(model);

        // Ждем загрузки модели
        const startTime = Date.now();
        while (!native.hasModelLoaded(model)) {
            await alt.Utils.wait(50);
            if (Date.now() - startTime > 5000) {
                throw new Error('Model load timeout');
            }
        }

        // Очищаем все декорации перед сменой модели
        native.clearPedDecorations(player.scriptID);
        native.clearAllPedProps(player.scriptID);

        // Сбрасываем все компоненты
        for (let i = 0; i < 12; i++) {
            native.setPedComponentVariation(player.scriptID, i, 0, 0, 0);
        }

        // Устанавливаем новую модель
        native.setPlayerModel(player.scriptID, model);
        
        // Ждем применения модели
        await alt.Utils.wait(100);

        // Устанавливаем базовые настройки для новой модели
        native.setPedDefaultComponentVariation(player.scriptID);
        native.setPedHeadBlendData(player.scriptID, 0, 0, 0, 0, 0, 0, 0.5, 0.5, 0, false);

        // Освобождаем модель
        native.setModelAsNoLongerNeeded(model);

        return true;
    } catch (error) {
        alt.log('[Appearance] Error setting gender:', error);
        return false;
    }
}

// Обработчик события смены пола
alt.on('character:setGender', async (gender) => {
    try {
        const success = await setCharacterGender(gender);
        if (!success) {
            throw new Error('Failed to set gender');
        }
    } catch (error) {
        alt.log('[Appearance] Gender change error:', error);
        // Отправляем ошибку обратно в UI
        if (AppState.view) {
            AppState.view.emit('character:genderError');
        }
    }
});

// Добавляем функцию обновления внешности
async function updateCharacterAppearance(data) {
    try {
        const player = alt.Player.local;
        if (!player || !player.valid) return;

        // Обновляем основные черты лица
        if (data.face !== undefined) {
            native.setPedHeadBlendData(
                player.scriptID,
                data.face,
                data.face,
                0,
                data.skinTone || 0,
                data.skinTone || 0,
                0,
                0.5,
                0.5,
                0,
                false
            );
        }

        // Обновляем прическу
        if (data.hair !== undefined) {
            native.setPedComponentVariation(player.scriptID, 2, data.hair, 0, 0);
            if (data.hairColor !== undefined) {
                native.setPedHairTint(player.scriptID, data.hairColor, data.hairColor);
            }
        }

        // Обновляем брови
        if (data.eyebrows !== undefined) {
            native.setPedHeadOverlay(player.scriptID, 2, data.eyebrows, 1.0);
            if (data.eyebrowsColor !== undefined) {
                native.setPedHeadOverlayTint(
                    player.scriptID,
                    2,
                    1,
                    data.eyebrowsColor,
                    data.eyebrowsColor
                );
            }
        }

        // Обновляем бороду
        if (data.facialHair !== undefined) {
            native.setPedHeadOverlay(player.scriptID, 1, data.facialHair, 1.0);
            if (data.facialHairColor !== undefined) {
                native.setPedHeadOverlayTint(
                    player.scriptID,
                    1,
                    1,
                    data.facialHairColor,
                    data.facialHairColor
                );
            }
        }

        // Обновляем черты лица
        if (data.noseWidth !== undefined) native.setFaceFeature(player.scriptID, 0, parseFloat(data.noseWidth));
        if (data.noseHeight !== undefined) native.setFaceFeature(player.scriptID, 1, parseFloat(data.noseHeight));
        if (data.lipThickness !== undefined) native.setFaceFeature(player.scriptID, 12, parseFloat(data.lipThickness));
        if (data.jawWidth !== undefined) native.setFaceFeature(player.scriptID, 13, parseFloat(data.jawWidth));
        if (data.cheekboneHeight !== undefined) native.setFaceFeature(player.scriptID, 19, parseFloat(data.cheekboneHeight));

        // Обновляем старение и комплекцию
        if (data.ageing !== undefined) native.setPedHeadOverlay(player.scriptID, 3, data.ageing, 1.0);
        if (data.complexion !== undefined) native.setPedHeadOverlay(player.scriptID, 6, data.complexion, 1.0);

    } catch (error) {
        alt.log('[Appearance] Error updating character:', error);
    }
}

// Обработчик обновления внешности
alt.on('character:update', async (data) => {
    if (AppState.isUpdating) return;
    
    try {
        AppState.isUpdating = true;
        await updateCharacterAppearance(data);
    } catch (error) {
        alt.log('[Appearance] Update error:', error);
    } finally {
        AppState.isUpdating = false;
    }
});

// Обработчик звуков
alt.on('character:playSound', (type) => {
    try {
        const player = alt.Player.local;
        if (!player || !player.valid) return;

        const soundId = type === 'error' ? 'ERROR' : 'SELECT';
        native.playSoundFrontend(-1, soundId, 'HUD_FRONTEND_DEFAULT_SOUNDSET', true);
    } catch (error) {
        alt.log('[Appearance] Sound error:', error);
    }
});

// Добавляем обработчик для отладки
alt.on('character:debug', (data) => {
    alt.log('Received appearance update:', JSON.stringify(data, null, 2));
});

function saveCharacter(data) {
    try {
        alt.emitServer('appearance:save', data);
    } catch (error) {
        alt.logError('[Appearance] Error saving character:', error);
    }
}

// Очистка ресурсов
function cleanup() {
    try {
        if (AppState.view?.valid) {
            AppState.view.destroy();
            AppState.view = null;
        }

        if (AppState.camera) {
            native.destroyCam(AppState.camera, true);
            native.renderScriptCams(false, true, 3000, true, false, 0);
            AppState.camera = null;
        }

        const player = alt.Player.local;
        if (player?.valid) {
            native.freezeEntityPosition(player.scriptID, false);
            native.clearTimecycleModifier();
            native.setPedAoBlobRendering(player.scriptID, false);
        }

        alt.showCursor(false);
        alt.toggleGameControls(true);
    } catch (error) {
        alt.log('[Appearance] Cleanup error:', error);
    }
}

// Добавляем обработчики очистки
alt.on('disconnect', cleanup);
alt.onServer('appearance:closeCreator', cleanup);

const SPAWN_POSITION = { x: -888.8746, y: -2313.2836, z: 6.0003 }; // Координаты спавна
const SPAWN_HEADING = 90.0; // Направление взгляда при спавне

// Обработчик успешного создания персонажа
alt.on('appearance:characterCreated', async () => {
    try {
        // Закрываем окно создания персонажа
        if (AppState.view) {
            AppState.view.destroy();
            AppState.view = null;
        }

        // Отключаем камеру создания персонажа
        if (AppState.camera) {
            game.renderScriptCams(false, false, 0, true, false);
            game.destroyCam(AppState.camera, true);
            AppState.camera = null;
        }

        // Включаем управление персонажем
        alt.toggleGameControls(true);
        
        // Телепортируем игрока на точку спавна
        const player = alt.Player.local;
        if (player) {
            player.pos = SPAWN_POSITION;
            player.rot = new alt.Vector3(0, 0, SPAWN_HEADING);
        }

        // Плавно проявляем экран
        game.doScreenFadeIn(1000);
        
        // Сообщаем о выходе из редактора персонажа
        alt.emit('character:editor:exit');
        
        // Ждем небольшую задержку для плавности
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Инициализируем HUD и другие системы
        alt.emit('hud:init'); // Инициализируем HUD
        alt.emit('chat:activate'); // Активируем чат
        alt.emit('nametags:start'); // Включаем отображение ников
        alt.emit('voice:initialize'); // Инициализируем голосовой чат

        // Уведомляем сервер о готовности игрока
        alt.emitServer('character:spawned');

    } catch (error) {
        alt.logError('[Appearance] Error in character:created handler:', error);
    }
});

alt.emit('character:editor:enter'); // Сообщаем о входе в редактор

// В обработчике успешного создания персонажа (где происходит закрытие редактора)
alt.onServer('auth:closeWebView', () => {
    if (webView) {
        destroyWebView();
    }
    
    resetCamera();
    
    if (alt.cursorVisible) {
        alt.showCursor(false);
    }
    
    alt.toggleGameControls(true);
    
    // Сообщаем о выходе из редактора
    alt.emit('character:editor:exit');
});
// Добавляем функцию для сброса поворота
function resetCharacterRotation() {
    try {
        const player = alt.Player.local;
        if (!player || !player.valid) return;

        AppState.rotation = 0;
        native.setEntityHeading(player.scriptID, 0.0);
    } catch (error) {
        alt.log('[Appearance] Error resetting rotation:', error);
    }
}

// Добавить инициализацию WebView
function initializeWebView() {
    if (AppState.view) return;
    
    AppState.view = new alt.WebView('http://resource/client/html/character-creator.html');
    setupEventHandlers();
}

// Функция обработки зума
function handleZoom(direction) {
    try {
        if (!AppState.camera) return;

        const zoomChange = direction === 'in' ? ZOOM_CONFIG.STEP : -ZOOM_CONFIG.STEP;
        currentZoom = Utils.clamp(
            currentZoom + zoomChange,
            ZOOM_CONFIG.MIN,
            ZOOM_CONFIG.MAX
        );

        // Обновляем FOV камеры
        const newFOV = CONFIG.CAMERA.FOV * currentZoom;
        native.setCamFov(AppState.camera, newFOV);
        native.renderScriptCams(true, false, 0, true, false, 0);
    } catch (error) {
        alt.log('[Appearance] Zoom error:', error);
    }
}

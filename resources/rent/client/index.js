import * as alt from "alt-client";
import * as native from 'natives';

const CONTROLS = {
    TOGGLE_RENT: 0x46, // F key
    CAMERA_DISTANCE: 3.5,
    CAMERA_HEIGHT: 0.5
};

class RentSystem {
    constructor() {
        this.webview = null;
        this.vehicle = null;
        this.camera = null;
        this.originalCameraPos = null;
        
        this.initEvents();
    }

    initEvents() {
        alt.on('keydown', this.handleKeyPress.bind(this));
        alt.onServer('rent:show', this.showRentUI.bind(this));
        alt.onServer('rent:cancel', this.cancelRent.bind(this));
    }

    async handleKeyPress(key) {
        if (key === CONTROLS.TOGGLE_RENT) {
            if (alt.Player.local.vehicle) {
                await this.sleep(200); // Небольшая задержка
                alt.emitServer('rent:begin', alt.Player.local.vehicle);
            }
        }
    }

    async showRentUI() {
        try {
            if (this.webview) return;

            this.vehicle = alt.Player.local.vehicle;
            if (!this.vehicle) return;

            // Создаем WebView
            this.webview = new alt.WebView('resource/client/html/index.html');
            this.webview.focus();
            
            // Замораживаем транспорт
            native.freezeEntityPosition(this.vehicle.scriptID, true);
            
            // Настраиваем камеру
            this.setupCamera();
            
            // Показываем курсор
            alt.showCursor(true);
            alt.toggleGameControls(false);

            // Обработчик подтверждения
            this.webview.on('rent:confirm', this.handleConfirm.bind(this));

        } catch (error) {
            alt.log('Error in showRentUI:', error);
            this.cleanup();
        }
    }

    setupCamera() {
        // Сохраняем оригинальную позицию камеры
        this.originalCameraPos = native.getGameplayCamCoord();
        
        // Создаем новую камеру
        const vehiclePos = native.getEntityCoords(this.vehicle.scriptID, true);
        const vehicleRot = native.getEntityRotation(this.vehicle.scriptID, 2);
        
        const cameraPos = {
            x: vehiclePos.x - (Math.sin(vehicleRot.z * Math.PI / 180) * CONTROLS.CAMERA_DISTANCE),
            y: vehiclePos.y + (Math.cos(vehicleRot.z * Math.PI / 180) * CONTROLS.CAMERA_DISTANCE),
            z: vehiclePos.z + CONTROLS.CAMERA_HEIGHT
        };

        this.camera = native.createCamWithParams(
            'DEFAULT_SCRIPTED_CAMERA',
            cameraPos.x, cameraPos.y, cameraPos.z,
            0, 0, vehicleRot.z + 180,
            60,
            true,
            0
        );

        native.pointCamAtEntity(this.camera, this.vehicle.scriptID, 0, 0, 0, true);
        native.setCamActive(this.camera, true);
        native.renderScriptCams(true, false, 0, true, false);
    }

    handleConfirm(isConfirmed) {
        alt.emitServer('rent:process', isConfirmed);
        this.cleanup();
    }

    cancelRent() {
        const player = alt.Player.local;
        if (player.vehicle) {
            native.taskLeaveVehicle(player.scriptID, player.vehicle.scriptID, 0);
        }
        this.cleanup();
    }

    cleanup() {
        if (this.webview) {
            this.webview.destroy();
            this.webview = null;
        }

        if (this.vehicle) {
            native.freezeEntityPosition(this.vehicle.scriptID, false);
            this.vehicle = null;
        }

        if (this.camera) {
            native.destroyCam(this.camera, true);
            native.renderScriptCams(false, false, 0, true, false);
            this.camera = null;
        }

        alt.showCursor(false);
        alt.toggleGameControls(true);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Инициализация системы
const rentSystem = new RentSystem();

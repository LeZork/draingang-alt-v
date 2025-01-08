import * as alt from 'alt-client';
import * as native from 'natives';

class HUDSystem {
    constructor() {
        this.webView = null;
        this.isVehicle = false;
        this.belt = false;
        this.lastHealth = 200;
        this.lastMoney = 0;
        this.updateInterval = null;
        this.isAuthorized = false;
        this.isInCharacterCreator = false;
        
        this.init();
    }

    init() {
        alt.on('character:editor:enter', () => {
            this.isInCharacterCreator = true;
            this.hideHUD();
        });

        alt.on('character:editor:exit', () => {
            this.isInCharacterCreator = false;
            if (this.isAuthorized) {
                this.showHUD();
            }
        });

        alt.on('hud:init', () => {
            if (!this.isInCharacterCreator) {
                this.isAuthorized = true;
                alt.log('HUD initialization requested');
                this.createHUD();
            }
        });
        
        alt.on('disconnect', this.destroyHUD.bind(this));
        
        // Обработчики событий
        alt.onServer('updateHUD', this.updateHUDData.bind(this));
        alt.onServer('updateSpeedometer', this.updateSpeedometerData.bind(this));
        alt.onServer('updateServerTime', this.updateTimeData.bind(this));
        
        // Обработка входа/выхода из транспорта
        alt.on('enteredVehicle', this.handleVehicleEnter.bind(this));
        alt.on('leftVehicle', this.handleVehicleExit.bind(this));
        
        // Обработка ремня безопасности
        alt.on('keyup', (key) => {
            if (key === 66 && this.isVehicle) { // Клавиша B
                this.toggleSeatbelt();
            }
        });
    }

    createHUD() {
        if (this.webView) return;
        
        try {
            alt.log('Creating HUD WebView...');
            this.webView = new alt.WebView('http://resource/client/hud.html');
            
            // Запрашиваем начальные данные с сервера
            alt.emitServer('hud:requestInitialData');
            
            // Запускаем регулярное обновление
            this.updateInterval = alt.setInterval(this.updateHUD.bind(this), 100);
            
            alt.log('HUD created successfully');
        } catch (error) {
            alt.logError('Error creating HUD:', error);
        }
    }

    destroyHUD() {
        try {
            if (this.updateInterval) {
                alt.clearInterval(this.updateInterval);
                this.updateInterval = null;
            }
            
            // Очищаем все обработчики событий
            alt.off('connectionComplete', this.createHUD);
            alt.off('disconnect', this.destroyHUD);
            alt.off('enteredVehicle', this.handleVehicleEnter);
            alt.off('leftVehicle', this.handleVehicleExit);
            
            if (this.webView && this.webView.valid) {
                this.webView.destroy();
                this.webView = null;
            }
        } catch (error) {
            alt.logError('Error destroying HUD:', error);
        }
    }

    updateHUD() {
        if (!this.isAuthorized || this.isInCharacterCreator || !this.webView || !alt.Player.local.valid) return;

        const player = alt.Player.local;
        
        // Обновление здоровья
        const currentHealth = player.health;
        if (currentHealth !== this.lastHealth) {
            this.lastHealth = currentHealth;
            this.webView.emit('updateHealth', currentHealth);
        }

        // Обновление спидометра если в машине
        if (this.isVehicle && player.vehicle && player.vehicle.valid) {
            const vehicle = player.vehicle;
            
            // Добавим try-catch для native функций
            try {
                const speed = Math.round(native.getEntitySpeed(vehicle.scriptID) * 3.6);
                const engineStatus = vehicle.engineOn;
                const lightsStatus = native.getVehicleLightsState(vehicle.scriptID);
                const doorsStatus = native.getVehicleDoorLockStatus(vehicle.scriptID);
                
                this.webView.emit('updateSpeedometer', {
                    speed,
                    engine: engineStatus,
                    seatbelt: this.belt,
                    lights: lightsStatus[1],
                    doors: doorsStatus === 2
                });
            } catch (error) {
                alt.logError('Error updating vehicle data:', error);
            }
        }
    }

    updateHUDData(money, health) {
        if (!this.isAuthorized || !this.webView) return;
        
        if (typeof money === 'number' && !isNaN(money)) {
            this.lastMoney = money;
            this.webView.emit('updateMoney', money);
        }
        
        if (typeof health === 'number' && !isNaN(health)) {
            this.lastHealth = health;
            this.webView.emit('updateHealth', health);
        }
    }

    updateSpeedometerData(data) {
        if (!this.webView) return;
        this.webView.emit('updateSpeedometer', data);
    }

    updateTimeData(data) {
        if (!this.webView) return;
        
        try {
            this.webView.emit('updateTime', {
                hours: data.hours,
                minutes: data.minutes,
                date: data.date
            });
        } catch (error) {
            alt.logError('Error updating time data:', error);
        }
    }

    handleVehicleEnter(vehicle) {
        this.isVehicle = true;
        this.belt = false;
        if (this.webView) {
            this.webView.emit('vehicleEntered');
        }
    }

    handleVehicleExit() {
        this.isVehicle = false;
        this.belt = false;
        if (this.webView) {
            this.webView.emit('vehicleExited');
        }
    }

    toggleSeatbelt() {
        if (!this.isVehicle) return;
        
        this.belt = !this.belt;
        if (this.webView) {
            this.webView.emit('updateSeatbelt', this.belt);
        }
        
        // Звук пристегивания/отстегивания
        alt.emitServer('playSeatbeltSound', this.belt);
    }

    hideHUD() {
        if (this.webView && this.webView.valid) {
            this.webView.emit('hideHUD');
        }
    }

    showHUD() {
        if (this.webView && this.webView.valid) {
            this.webView.emit('showHUD');
        }
    }
}

// Создаем экземпляр системы HUD
const hudSystem = new HUDSystem(); 
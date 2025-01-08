import * as alt from 'alt';
import * as native from 'natives';

class RadioSystem {
    constructor() {
        this.browser = null;
        this.player = alt.Player.local;
        this.focused = false;
        this.isInVehicle = false;
        this.stationsQueue = [];
        this.mounted = false;
        this.usedVehicle = new Map();
        this.currentVehicleRadio = 0;
        
        this.CONTROLS = {
            RADIO_TOGGLE: 152, // Z key
            VOLUME_UP: 81,    // Q key
            VOLUME_DOWN: 82,  // E key
            MIN_VOLUME: 0.1,
            MAX_VOLUME: 1.0,
            VOLUME_STEP: 0.1
        };

        // Инициализируем события после определения всех методов
        alt.setTimeout(() => {
            this.initEvents();
            this.initAudio();
        }, 1000);
    }

    handleVehicleEnter = (vehicle, seat) => {
        if (!this.player.vehicle) return;

        alt.emitServer('radio:GetRadioStations');
        this.browser = new alt.WebView('http://resource/ui/radio.html');
        this.isInVehicle = true;

        this.setupBrowserEvents();
    }

    handleVehicleExit = (vehicle, seat) => {
        try {
            if (this.player.vehicle && this.usedVehicle.has(this.player.vehicle.id)) {
                const radio = this.usedVehicle.get(this.player.vehicle.id);
                radio.clear();
                this.usedVehicle.delete(this.player.vehicle.id);
            }

            if (this.browser) {
                this.browser.emit('exitCar');
                this.browser.destroy();
                this.browser = null;
            }

            this.isInVehicle = false;
            this.mounted = false;
            this.focused = false;

        } catch (error) {
            alt.logError('Error in handleVehicleExit:', error);
        }
    }

    handleKeyDown = (key) => {
        // Реализация обработки нажатия клавиш
    }

    handleKeyUp = (key) => {
        // Реализация обработки отпускания клавиш
    }

    handleMetaChange = (entity, key, value) => {
        // Реализация обработки изменения метаданных
    }

    handleTick = () => {
        // Реализация обработки тика
    }

    async initAudio() {
        try {
            if (alt.AudioCategory && typeof alt.AudioCategory.getForName === 'function') {
                const category = alt.AudioCategory.getForName("radio");
                if (category) {
                    category.volume = 30;
                }
            }
            
            if (native && typeof native.startAudioScene === 'function') {
                native.startAudioScene('DLC_MPHEIST_TRANSITION_TO_APT_FADE_IN_RADIO_SCENE');
            }
        } catch (error) {
            alt.logError('Error initializing audio:', error);
        }
    }

    initEvents() {
        try {
            alt.on('playerEnteredVehicle', this.handleVehicleEnter);
            alt.on('playerLeftVehicle', this.handleVehicleExit);
            alt.on('keydown', this.handleKeyDown);
            alt.on('keyup', this.handleKeyUp);
            alt.on('streamSyncedMetaChange', this.handleMetaChange);
            alt.everyTick(this.handleTick);
        } catch (error) {
            alt.logError('Error initializing events:', error);
        }
    }

    setupBrowserEvents() {
        this.browser.on('radio:isplaying', (radiostat) => {
            try {
                if (this.usedVehicle.has(this.player.vehicle.id)) {
                    const existingRadio = this.usedVehicle.get(this.player.vehicle.id);
                    if (existingRadio.audio) {
                        existingRadio.audio.volume = this.CONTROLS.MIN_VOLUME;
                        existingRadio.audio.play();
                        return;
                    }
                }

                if (radiostat === "off") {
                    this.usedVehicle.set(this.player.vehicle.id, new Radio("off"));
                    return;
                }

                const output = new alt.AudioOutputAttached(this.player.vehicle);
                const audio = new alt.Audio(radiostat, this.CONTROLS.MIN_VOLUME, true);
                
                audio.on("error", (error) => {
                    alt.logError(`Radio error: ${error}`);
                    this.handleRadioError();
                });

                audio.addOutput(output);
                audio.play();

                const newRadio = new Radio(radiostat, audio.volume, true, audio, output);
                this.usedVehicle.set(this.player.vehicle.id, newRadio);

            } catch (error) {
                alt.logError('Error in radio:isplaying:', error);
                this.handleRadioError();
            }
        });

        // ... остальные обработчики событий браузера ...
    }

    handleRadioError() {
        if (this.browser) {
            this.browser.emit('radioError');
        }
        // Можно добавить дополнительную обработку ошибок
    }

    // ... остальные методы класса ...
}

class Radio {
    constructor(station, volume = 0, playing = false, audio = null, output = null) {
        this.station = station;
        this.volume = volume;
        this.playing = playing;
        this.audio = audio;
        this.output = output;
    }

    clear() {
        if (this.audio) {
            this.audio.pause();
            this.audio.destroy();
        }
        if (this.output) {
            this.output.destroy();
        }
    }
}

// Создаем экземпляр класса только после загрузки всех зависимостей
alt.on('connectionComplete', () => {
    const radioSystem = new RadioSystem();
});
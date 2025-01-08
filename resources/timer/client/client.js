import * as alt from 'alt-client';
import * as native from 'natives';

class TimeWeatherClient {
    static instance = null;

    constructor() {
        if (TimeWeatherClient.instance) {
            return TimeWeatherClient.instance;
        }
        TimeWeatherClient.instance = this;

        this.oldWeather = 'EXTRASUNNY';
        this.currentWeather = null;
        this.weatherTransitionInterval = null;
        this.lastUpdate = Date.now();

        this.initializeEvents();
        this.initializeTime();
    }

    initializeEvents() {
        alt.onServer('syncWeather', this.setWeather.bind(this));
        alt.onServer('syncTime', this.setTime.bind(this));
        alt.onServer('setcarwandertime', this.setCarWanderTime.bind(this));

        alt.everyTick(() => {
            this.updateTimeSmooth();
        });
    }

    initializeTime() {
        alt.emitServer('settime');
    }

    setWeather(weather, transitionTime) {
        if (!weather) return;
        
        this.currentWeather = weather;

        const actualTransitionTime = Math.max(transitionTime, 15);

        if (transitionTime === 0) {
            native.setWeatherTypeNowPersist(weather);
            this.oldWeather = weather;
            return;
        }

        if (this.oldWeather !== this.currentWeather) {
            if (this.weatherTransitionInterval) {
                alt.clearInterval(this.weatherTransitionInterval);
            }

            let progress = 0;
            this.weatherTransitionInterval = alt.setInterval(() => {
                progress++;
                if (progress < 100) {
                    native.setCurrWeatherState(
                        native.getHashKey(this.oldWeather),
                        native.getHashKey(this.currentWeather),
                        progress / 100
                    );
                } else {
                    alt.clearInterval(this.weatherTransitionInterval);
                    this.weatherTransitionInterval = null;
                    this.oldWeather = this.currentWeather;
                }
            }, actualTransitionTime * 10);
        }

        this.updateWeatherEffects(weather);
    }

    updateWeatherEffects(weather) {
        const isSnow = weather === 'SNOW' || weather === 'BLIZZARD' || weather === 'SNOWLIGHT';
        native.useSnowWheelVfxWhenUnsheltered(isSnow);
        native.useSnowFootVfxWhenUnsheltered(isSnow);

        switch(weather) {
            case 'RAIN':
            case 'THUNDER':
                native.setRainFx(1.0);
                break;
            case 'CLEARING':
                native.setRainFx(0.2);
                break;
            default:
                native.setRainFx(0.0);
                break;
        }
    }

    setTime(time, msPerMinute) {
        if (!time) return;
        
        this.lastUpdate = Date.now();
        this.serverTime = time;
        this.msPerMinute = msPerMinute;

        native.setClockTime(time.hour, time.minute, time.second);
        
        if (msPerMinute !== alt.getMsPerGameMinute()) {
            alt.setMsPerGameMinute(msPerMinute);
        }
    }

    updateTimeSmooth() {
        if (!this.serverTime) return;

        const now = new Date();
        const vladivostokOffset = 10; // часов
        const vladivostokTime = new Date(now.getTime() + (vladivostokOffset * 60 * 60 * 1000));
        
        native.setClockTime(
            vladivostokTime.getUTCHours(),
            vladivostokTime.getUTCMinutes(),
            vladivostokTime.getUTCSeconds()
        );
    }

    setCarWanderTime(time) {
        const hour = this.serverTime?.hour || 0;
        const isNight = hour >= 22 || hour <= 5;
        const multiplier = isNight ? time * 0.5 : time;

        native.setRandomVehicleDensityMultiplierThisFrame(multiplier);
        native.setParkedVehicleDensityMultiplierThisFrame(multiplier);
        native.setVehicleDensityMultiplierThisFrame(multiplier);
    }
}

// Создаем экземпляр клиента
new TimeWeatherClient();
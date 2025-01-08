import * as alt from 'alt-server';
import fetch from 'node-fetch';

class TimeWeatherSystem {
    static instance = null;

    constructor() {
        if (TimeWeatherSystem.instance) {
            return TimeWeatherSystem.instance;
        }
        TimeWeatherSystem.instance = this;

        // Владивосток
        this.cityId = '2013348'; // ID города Владивосток
        this.apiKey = 'c54dbcf820899b0ebece81866827a410'; // Нужно получить ключ на openweathermap.org
        this.timeZoneOffset = 10; // UTC+10 для Владивостока

        this.currentWeather = 'EXTRASUNNY';
        this.weathers = [
            'EXTRASUNNY', 'CLEAR', 'CLOUDS', 
            'SMOG', 'FOGGY', 'OVERCAST', 
            'RAIN', 'THUNDER', 'CLEARING', 
            'SNOW', 'BLIZZARD', 'SNOWLIGHT'
        ];
        
        this.time = {
            hour: 0,
            minute: 0,
            second: 0
        };
        
        this.msPerMinute = 60000;
        this.weatherInterval = 60000 * 30; // Каждые 30 минут
        this.timeInterval = 60000; // Каждую минуту

        this.initializeEvents();
        this.startIntervals();
        this.syncRealTime();
        this.updateWeatherFromAPI();
    }

    initializeEvents() {
        alt.onClient('settime', this.handleInitialSync.bind(this));
        alt.on('changeCurrentWeather', this.changeCurrentWeather.bind(this));
        alt.on('changeCurrentTime', this.changeCurrentTime.bind(this));
    }

    startIntervals() {
        // Синхронизация времени каждую минуту
        setInterval(() => {
            this.syncRealTime();
        }, this.timeInterval);

        // Обновление погоды каждые 30 минут
        setInterval(() => {
            this.updateWeatherFromAPI();
        }, this.weatherInterval);
    }

    async updateWeatherFromAPI() {
        try {
            const response = await fetch(`http://api.openweathermap.org/data/2.5/weather?id=${this.cityId}&appid=${this.apiKey}`);
            const data = await response.json();
            
            // Конвертация погоды из API в игровую погоду
            const gameWeather = this.convertWeatherToGame(data.weather[0].main);
            this.changeCurrentWeather(gameWeather, 30);
            
            console.log(`[TIMER] Updated weather from API: ${data.weather[0].main} -> ${gameWeather}`);
        } catch (error) {
            console.error('[TIMER] Failed to fetch weather:', error);
        }
    }

    convertWeatherToGame(apiWeather) {
        const weatherMap = {
            'Clear': 'EXTRASUNNY',
            'Clouds': 'CLOUDS',
            'Rain': 'RAIN',
            'Drizzle': 'RAIN',
            'Thunderstorm': 'THUNDER',
            'Snow': 'SNOW',
            'Mist': 'FOGGY',
            'Smoke': 'SMOG',
            'Haze': 'FOGGY',
            'Dust': 'SMOG',
            'Fog': 'FOGGY',
            'Sand': 'SMOG',
            'Ash': 'SMOG',
            'Squall': 'THUNDER',
            'Tornado': 'THUNDER'
        };

        return weatherMap[apiWeather] || 'EXTRASUNNY';
    }

    syncRealTime() {
        // Получаем текущее время
        const now = new Date();
        
        // Конвертируем в часовой пояс Владивостока (UTC+10)
        const vladivostokOffset = 10; // часов
        const vladivostokTime = new Date(now.getTime() + (vladivostokOffset * 60 * 60 * 1000));
        
        this.time = {
            hour: vladivostokTime.getUTCHours(),
            minute: vladivostokTime.getUTCMinutes(),
            second: vladivostokTime.getUTCSeconds()
        };

        this.syncTimeToAll();
    }

    handleInitialSync(player) {
        if (!player || !player.valid) return;
        
        alt.emitClientRaw(player, 'syncWeather', this.currentWeather, 0);
        alt.emitClientRaw(player, 'syncTime', this.time, this.msPerMinute);
    }

    changeCurrentWeather(weather, transitionTime = 0) {
        if (!this.weathers.includes(weather)) {
            console.log(`[TIMER] Invalid weather type: ${weather}`);
            return;
        }

        this.currentWeather = weather;
        console.log(`[TIMER] Changed weather to ${weather}`);
        
        alt.Player.all.forEach(player => {
            if (player && player.valid) {
                alt.emitClient(player, 'syncWeather', this.currentWeather, transitionTime);
            }
        });
    }

    changeCurrentTime(hour, minute, second) {
        hour = Math.max(0, Math.min(23, hour));
        minute = Math.max(0, Math.min(59, minute));
        second = Math.max(0, Math.min(59, second));

        this.time = { hour, minute, second };
        this.syncTimeToAll();
    }

    syncTimeToAll() {
        alt.Player.all.forEach(player => {
            if (player && player.valid) {
                alt.emitClient(player, 'syncTime', this.time, this.msPerMinute);
            }
        });
    }
}

// Создаем экземпляр системы
new TimeWeatherSystem();


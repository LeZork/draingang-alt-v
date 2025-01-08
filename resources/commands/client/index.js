import * as alt from 'alt-client';
import * as native from 'natives';

alt.onServer('weather:set', (weatherType) => {
    try {
        native.setWeatherTypeNow(weatherType);
    } catch (error) {
        alt.logError('Error setting weather:', error);
    }
});

alt.onServer('time:set', (hours, minutes) => {
    try {
        native.setClockTime(hours, minutes, 0);
        native.pauseClock(true);
    } catch (error) {
        alt.logError('Error setting time:', error);
    }
}); 
import * as alt from 'alt';
import radioList from './config.mjs';

class RadioServer {
    constructor() {
        this.initEvents();
        this.radioStations = new Map(); // Для хранения состояний радио
    }

    initEvents() {
        alt.on('playerEnteredVehicle', this.handleVehicleEnter.bind(this));
        alt.on('playerLeftVehicle', this.handleVehicleExit.bind(this));
        alt.on('playerChangedVehicleSeat', this.handleSeatChange.bind(this));
        alt.onClient('vehicle:RadioChanged', this.handleRadioChange.bind(this));
        alt.onClient('radio:GetRadioStations', this.sendRadioStations.bind(this));
    }

    handleVehicleEnter(player, vehicle, seat) {
        try {
            // Сохраняем состояние радио для автомобиля
            if (!this.radioStations.has(vehicle.id)) {
                this.radioStations.set(vehicle.id, 0); // 0 = выключено
            }
            
            alt.emitClient(player, 'playerEnteredVehicle', vehicle, seat);
        } catch (error) {
            alt.logError(`Radio error on vehicle enter: ${error}`);
        }
    }

    handleVehicleExit(player, vehicle, seat) {
        alt.emitClient(player, 'playerLeftVehicle', vehicle, seat);
    }

    handleSeatChange(player, vehicle, oldSeat, newSeat) {
        alt.emitClient(player, 'playerChangedVehicleSeat', vehicle, oldSeat, newSeat);
    }

    handleRadioChange(player, vehicle, radioStation) {
        if (!vehicle || !player) return;
        
        try {
            this.radioStations.set(vehicle.id, radioStation);
            vehicle.setStreamSyncedMeta('radioStation', radioStation);
        } catch (error) {
            alt.logError(`Radio change error: ${error}`);
        }
    }

    sendRadioStations(player) {
        try {
            radioList.forEach(station => {
                alt.emitClient(player, 'radio:AddStation', station);
            });
        } catch (error) {
            alt.logError(`Error sending radio stations: ${error}`);
        }
    }
}

// Инициализация сервера
const radioServer = new RadioServer();


alt.on('playerEnteredVehicle', (player, vehicle, seat) => {
    alt.emitClient(player, 'playerEnteredVehicle', vehicle, seat);
});

alt.on('playerLeftVehicle', (player, vehicle, seat) => {
    alt.emitClient(player, 'playerLeftVehicle', vehicle, seat);
});

alt.on('playerChangedVehicleSeat', (player, vehicle, oldSeat, newSeat) => {
    alt.emitClient(player, 'playerChangedVehicleSeat', vehicle, oldSeat, newSeat);
});

alt.onClient('vehicle:RadioChanged', (player, vehicle, radioStation) => {
    vehicle.setStreamSyncedMeta('radioStation', radioStation);
});

alt.onClient('radio:GetRadioStations', player => {
    radioList.forEach((station, index) => {
        alt.emitClient(player, 'radio:AddStation', station);
    });
});


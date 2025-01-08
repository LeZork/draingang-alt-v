import * as alt from 'alt-client';
import * as native from "natives";

const NITRO = {
    KEY: 16, // Left Shift
    COOLDOWN: 15000, // 15 секунд
    MAX_USAGE: 5000, // 5 секунд
    POWER: 5.0,
    CAMERA_SHAKE: 2.5,
    PARTICLE_ASSET: 'veh_xs_vehicle_mods',
    SOUND_VOLUME: 0.4
};

class NitroSystem {
    constructor() {
        this.lastUseTime = Date.now();
        this.isActive = false;
        this.isDriverSeat = false;
        
        this.initEvents();
    }

    initEvents() {
        alt.on('enteredVehicle', this.handleVehicleEnter.bind(this));
        alt.on('leftVehicle', this.handleVehicleExit.bind(this));
        alt.on('keydown', this.handleKeyDown.bind(this));
        alt.on('keyup', this.handleKeyUp.bind(this));
        alt.on('gameEntityCreate', this.syncNitro.bind(this));
        alt.on('streamSyncedMetaChange', this.syncNitro.bind(this));
        alt.everyTick(this.handleTick.bind(this));
    }

    handleVehicleEnter(vehicle, seat) {
        this.isDriverSeat = seat === -1;
    }

    handleVehicleExit(vehicle, seat) {
        this.stopNitro();
        this.isDriverSeat = false;
    }

    handleKeyDown(key) {
        if (key !== NITRO.KEY || !alt.Player.local.vehicle) return;

        const vehicle = alt.Player.local.vehicle;
        if (!vehicle.getStreamSyncedMeta("Nitro")) return;
        
        const class_id = native.getVehicleClass(vehicle);
        if ([14, 15, 16, 21].includes(class_id)) {
            return;
        }

        const currentTime = Date.now();
        if (currentTime - this.lastUseTime < NITRO.COOLDOWN) {
            alt.emit('notify', 'Нитро перезаряжается');
            return;
        }

        this.startNitro();
        this.lastUseTime = currentTime;
    }

    handleKeyUp(key) {
        if (key !== NITRO.KEY || !alt.Player.local.vehicle) return;
        this.stopNitro();
    }

    handleTick() {
        const player = alt.Player.local;
        if (!player.vehicle) return;
        if (!player.vehicle.hasStreamSyncedMeta("nitroMode")) return;
        if (!this.isDriverSeat) return;

        const currentTime = Date.now();
        if (currentTime - this.lastUseTime > NITRO.MAX_USAGE) {
            this.stopNitro();
            return;
        }

        if (this.isActive) {
            native.setVehicleCheatPowerIncrease(player.vehicle, NITRO.POWER);
            this.updateParticles(player.vehicle);
        }
    }

    startNitro() {
        if (this.isActive) return;
        
        const vehicle = alt.Player.local.vehicle;
        if (!vehicle) return;

        this.isActive = true;
        alt.emitServer("Server:Nitro:On", vehicle);
        native.shakeGameplayCam("ROAD_VIBRATION_SHAKE", NITRO.CAMERA_SHAKE);
        alt.emit('playHowl2d', 'nos.ogg', NITRO.SOUND_VOLUME);
        
        // Добавляем эффект выхлопа
        this.initParticles(vehicle);
    }

    stopNitro() {
        if (!this.isActive) return;
        
        const vehicle = alt.Player.local.vehicle;
        if (vehicle) {
            alt.emitServer("Server:Nitro:Off", vehicle);
        }
        
        native.stopGameplayCamShaking(true);
        this.isActive = false;
    }

    syncNitro(entity) {
        if (!(entity instanceof alt.Vehicle)) return;

        if (entity.hasStreamSyncedMeta("nitroMode")) {
            native.requestNamedPtfxAsset(NITRO.PARTICLE_ASSET);
            native.setOverrideNitrousLevel(entity, true, 0.0, 0.0, 0, true);
            return;
        }

        native.setOverrideNitrousLevel(entity, false, 0.0, 0.0, 0, true);
    }

    initParticles(vehicle) {
        if (!native.hasNamedPtfxAssetLoaded(NITRO.PARTICLE_ASSET)) {
            native.requestNamedPtfxAsset(NITRO.PARTICLE_ASSET);
            alt.setTimeout(() => this.initParticles(vehicle), 100);
            return;
        }
    }

    updateParticles(vehicle) {
        if (!native.hasNamedPtfxAssetLoaded(NITRO.PARTICLE_ASSET)) return;
        
        native.useParticleFxAssetNextCall(NITRO.PARTICLE_ASSET);
        
        // Получаем позиции выхлопных труб
        const exhausts = [];
        for (let i = 0; i < 8; i++) {
            if (native.doesExtraExist(vehicle, i)) {
                const pos = native.getWorldPositionOfEntityBone(vehicle, native.getEntityBoneIndexByName(vehicle, `exhaust_${i + 1}`));
                if (pos) exhausts.push(pos);
            }
        }

        // Если не нашли выхлопные трубы, используем дефолтную позицию
        if (exhausts.length === 0) {
            const pos = native.getEntityCoords(vehicle, false);
            const rot = native.getEntityRotation(vehicle, 2);
            exhausts.push({
                x: pos.x - Math.sin(rot.z * Math.PI / 180) * 2,
                y: pos.y + Math.cos(rot.z * Math.PI / 180) * 2,
                z: pos.z - 0.5
            });
        }

        // Создаем эффекты для каждой выхлопной трубы
        exhausts.forEach(pos => {
            native.startParticleFxNonLoopedAtCoord(
                'veh_nitrous',
                pos.x,
                pos.y,
                pos.z,
                0,
                0,
                0,
                1.0,
                false,
                false,
                false
            );
        });
    }
}

// Инициализация системы
const nitroSystem = new NitroSystem();

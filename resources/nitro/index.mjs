import * as alt from 'alt-server';

const NITRO_CONFIG = {
    MAX_USES: 3,
    REFILL_TIME: 300000 // 5 минут
};

class NitroServer {
    constructor() {
        this.nitroUses = new Map();
        this.initEvents();
    }

    initEvents() {
        alt.onClient('Server:Nitro:On', this.handleNitroOn.bind(this));
        alt.onClient('Server:Nitro:Off', this.handleNitroOff.bind(this));
    }

    handleNitroOn(player, vehicle) {
        if (!vehicle || !player || !this.canUseNitro(player)) return;
        
        vehicle.setStreamSyncedMeta("nitroMode", true);
        this.trackNitroUse(player);
    }

    handleNitroOff(player, vehicle) {
        if (!vehicle) return;
        vehicle.deleteStreamSyncedMeta("nitroMode");
    }

    canUseNitro(player) {
        const uses = this.nitroUses.get(player.id) || 0;
        return uses < NITRO_CONFIG.MAX_USES;
    }

    trackNitroUse(player) {
        const currentUses = this.nitroUses.get(player.id) || 0;
        this.nitroUses.set(player.id, currentUses + 1);

        // Сброс использований через REFILL_TIME
        alt.setTimeout(() => {
            const uses = this.nitroUses.get(player.id);
            if (uses > 0) {
                this.nitroUses.set(player.id, uses - 1);
            }
        }, NITRO_CONFIG.REFILL_TIME);
    }
}

const nitroServer = new NitroServer();
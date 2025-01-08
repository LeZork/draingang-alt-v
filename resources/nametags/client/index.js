import alt from 'alt-client';
import * as native from 'natives';

const SETTINGS = {
    DISTANCE: 15,
    BASE_SCALE: 0.5,
    UPDATE_INTERVAL: 50, // ms
    HEALTH_BAR: {
        WIDTH: 0.03,
        HEIGHT: 0.004,
        OFFSET: 0.005
    },
    ARMOR_BAR: {
        WIDTH: 0.03,
        HEIGHT: 0.004,
        OFFSET: 0.01
    },
    COLORS: {
        HEALTH: { r: 255, g: 50, b: 50 },
        ARMOR: { r: 50, g: 150, b: 255 },
        ADMIN: { r: 255, g: 50, b: 50 },
        NORMAL: { r: 255, g: 255, b: 255 },
        TALKING: { r: 255, g: 255, b: 0 }
    }
};

let localPlayer = alt.Player.local;
let lastUpdate = 0;

alt.everyTick(() => {
    const now = Date.now();
    if (now - lastUpdate < SETTINGS.UPDATE_INTERVAL) return;
    lastUpdate = now;

    const players = alt.Player.all;

    players.forEach(player => {
        if (player === localPlayer) return;
        drawNametag(player);
    });
});

function drawNametag(player) {
    try {
        const dist = distance(localPlayer.pos, player.pos);
        if (dist > SETTINGS.DISTANCE) return;

        // Позиция над головой
        const pos = {...player.pos};
        pos.z += 1.0;

        const [visible, x, y] = native.getScreenCoordFromWorldCoord(pos.x, pos.y, pos.z);
        if (!visible) return;

        const scale = SETTINGS.BASE_SCALE * (1 - (dist / SETTINGS.DISTANCE));

        // Отрисовка имени
        const nameColor = getPlayerNameColor(player);
        drawText(
            `${player.name} [${player.id}]`,
            x,
            y - 0.02,
            scale,
            4,
            0.1,
            nameColor.r,
            nameColor.g,
            nameColor.b,
            255,
            true
        );

        // Полоска здоровья
        const healthPercent = player.health / 200;
        drawBar(
            x, 
            y,
            SETTINGS.HEALTH_BAR.WIDTH,
            SETTINGS.HEALTH_BAR.HEIGHT,
            healthPercent,
            SETTINGS.COLORS.HEALTH
        );

        // Полоска брони
        if (player.armour > 0) {
            const armorPercent = player.armour / 100;
            drawBar(
                x,
                y + SETTINGS.ARMOR_BAR.OFFSET,
                SETTINGS.ARMOR_BAR.WIDTH,
                SETTINGS.ARMOR_BAR.HEIGHT,
                armorPercent,
                SETTINGS.COLORS.ARMOR
            );
        }

    } catch (error) {
        alt.log('Error in drawNametag:', error);
    }
}

function drawBar(x, y, width, height, percent, color) {
    // Фон
    native.drawRect(
        x,
        y,
        width,
        height,
        0,
        0,
        0,
        150
    );

    // Заполнение
    native.drawRect(
        x - width / 2 + (width * percent) / 2,
        y,
        width * percent,
        height,
        color.r,
        color.g,
        color.b,
        255
    );
}

function getPlayerNameColor(player) {
    if (player.getStreamSyncedMeta('isAdmin')) return SETTINGS.COLORS.ADMIN;
    if (player.getStreamSyncedMeta('isTalking')) return SETTINGS.COLORS.TALKING;
    return SETTINGS.COLORS.NORMAL;
}

function drawText(msg, x, y, scale, fontType, layer, r, g, b, a, textAlign) {
    native.setTextScale(scale, scale);
    native.setTextFont(fontType);
    native.setTextProportional(true);
    native.setTextColour(r, g, b, a);
    native.setTextDropshadow(0, 0, 0, 0, 255);
    native.setTextEdge(2, 0, 0, 0, 150);
    native.setTextDropshadow();
    native.setTextOutline();
    native.setTextCentre(textAlign);
    native.beginTextCommandDisplayText('STRING');
    native.addTextComponentSubstringPlayerName(msg);
    native.endTextCommandDisplayText(x, y, layer);
}

function distance(pos1, pos2) {
    return Math.sqrt(
        Math.pow(pos1.x - pos2.x, 2) +
        Math.pow(pos1.y - pos2.y, 2) +
        Math.pow(pos1.z - pos2.z, 2)
    );
}
import * as alt from 'alt-client';
import * as native from 'natives';

class NoClip {
    static enabled = false;
    static speed = 1.5;
    static everyTick = null;
    static isAdmin = false;
    static lastNotifyTime = 0;

    static KEYS = {
        FORWARD: 32,
        BACKWARD: 33,
        LEFT: 34,
        RIGHT: 35,
        UP: 22,
        DOWN: 36,
        SHIFT: 21,
        CTRL: 326,
        TOGGLE: 289,
        SPEED_UP: 96,
        SPEED_DOWN: 97
    };

    static SPEEDS = {
        MIN: 0.5,
        MAX: 10.0,
        DEFAULT: 1.5
    };

    static start() {
        if (!NoClip.isAdmin) {
            NoClip.notify('NoClip: Недостаточно прав');
            return;
        }

        if (NoClip.enabled) return;

        try {
            NoClip.enabled = true;
            const player = alt.Player.local;
            
            if (player && player.valid) {
                native.freezeEntityPosition(player.scriptID, true);
                native.setEntityCollision(player.scriptID, false, false);
                native.setEntityVisible(player.scriptID, false, false);
            }

            this.everyTick = alt.everyTick(NoClip.keyHandler);
            NoClip.notify('NoClip включен');
        } catch (error) {
            alt.logError('NoClip start error:', error);
        }
    }

    static stop() {
        if (!NoClip.enabled) return;

        try {
            NoClip.enabled = false;
            const player = alt.Player.local;
            
            if (player && player.valid) {
                native.freezeEntityPosition(player.scriptID, false);
                native.setEntityCollision(player.scriptID, true, true);
                native.setEntityVisible(player.scriptID, true, false);
            }

            if (this.everyTick) {
                alt.clearEveryTick(this.everyTick);
                this.everyTick = null;
            }

            NoClip.notify('NoClip выключен');
        } catch (error) {
            alt.logError('NoClip stop error:', error);
        }
    }

    static keyHandler() {
        try {
            const player = alt.Player.local;
            if (!player || !player.valid) return;

            let currentPos = player.pos;
            let speed = NoClip.speed;
            
            if (native.isDisabledControlPressed(0, NoClip.KEYS.SHIFT)) {
                speed *= 3;
            } else if (native.isDisabledControlPressed(0, NoClip.KEYS.CTRL)) {
                speed *= 0.5;
            }

            if (native.isDisabledControlJustPressed(0, NoClip.KEYS.SPEED_UP)) {
                NoClip.speed = Math.min(NoClip.speed + 0.5, NoClip.SPEEDS.MAX);
                NoClip.notify(`Скорость: ${NoClip.speed.toFixed(1)}`);
            }
            if (native.isDisabledControlJustPressed(0, NoClip.KEYS.SPEED_DOWN)) {
                NoClip.speed = Math.max(NoClip.speed - 0.5, NoClip.SPEEDS.MIN);
                NoClip.notify(`Скорость: ${NoClip.speed.toFixed(1)}`);
            }

            let rot = native.getGameplayCamRot(2);
            let dirForward = NoClip.camVectorForward(rot);
            let dirRight = NoClip.camVectorRight(rot);

            if (native.isDisabledControlPressed(0, NoClip.KEYS.FORWARD)) {
                currentPos = NoClip.addSpeedToVector(currentPos, dirForward, speed);
            }
            if (native.isDisabledControlPressed(0, NoClip.KEYS.BACKWARD)) {
                currentPos = NoClip.addSpeedToVector(currentPos, dirForward, -speed);
            }
            if (native.isDisabledControlPressed(0, NoClip.KEYS.LEFT)) {
                currentPos = NoClip.addSpeedToVector(currentPos, dirRight, -speed, true);
            }
            if (native.isDisabledControlPressed(0, NoClip.KEYS.RIGHT)) {
                currentPos = NoClip.addSpeedToVector(currentPos, dirRight, speed, true);
            }

            let zModifier = 0;
            if (native.isDisabledControlPressed(0, NoClip.KEYS.UP)) {
                zModifier += speed;
            }
            if (native.isDisabledControlPressed(0, NoClip.KEYS.DOWN)) {
                zModifier -= speed;
            }

            const newPos = new alt.Vector3(currentPos.x, currentPos.y, currentPos.z + zModifier);
            if (!NoClip.isVectorEqual(newPos, player.pos)) {
                player.pos = newPos;
            }
        } catch (error) {
            alt.logError('NoClip keyHandler error:', error);
            NoClip.stop();
        }
    }

    static notify(message) {
        const currentTime = Date.now();
        if (currentTime - NoClip.lastNotifyTime > 1000) {
            alt.emit('notify', message);
            NoClip.lastNotifyTime = currentTime;
        }
    }

    static addSpeedToVector(vector1, vector2, speed, lr = false) {
        return new alt.Vector3(
            vector1.x + vector2.x * speed,
            vector1.y + vector2.y * speed,
            lr === true ? vector1.z : vector1.z + vector2.z * speed
        );
    }

    static camVectorForward(camRot) {
        const rotInRad = {
            x: camRot.x * (Math.PI / 180),
            y: camRot.y * (Math.PI / 180),
            z: camRot.z * (Math.PI / 180) + Math.PI / 2
        };
        return {
            x: Math.cos(rotInRad.z),
            y: Math.sin(rotInRad.z),
            z: Math.sin(rotInRad.x)
        };
    }

    static camVectorRight(camRot) {
        const rotInRad = {
            x: camRot.x * (Math.PI / 180),
            y: camRot.y * (Math.PI / 180),
            z: camRot.z * (Math.PI / 180)
        };
        return {
            x: Math.cos(rotInRad.z),
            y: Math.sin(rotInRad.z),
            z: Math.sin(rotInRad.x)
        };
    }

    static isVectorEqual(vector1, vector2) {
        return (
            Math.abs(vector1.x - vector2.x) < 0.001 &&
            Math.abs(vector1.y - vector2.y) < 0.001 &&
            Math.abs(vector1.z - vector2.z) < 0.001
        );
    }
}

alt.onServer('noclip:setAdmin', (isAdmin) => {
    NoClip.isAdmin = isAdmin;
    alt.log(`NoClip: Админ права ${isAdmin ? 'получены' : 'отозваны'}`);
    
    if (!isAdmin && NoClip.enabled) {
        NoClip.stop();
    }
});

alt.everyTick(() => {
    if (native.isControlJustPressed(0, NoClip.KEYS.TOGGLE)) {
        if (!NoClip.isAdmin) {
            NoClip.notify('NoClip: Недостаточно прав');
            return;
        }

        if (NoClip.enabled) {
            NoClip.stop();
        } else {
            NoClip.start();
        }
    }
});

alt.on('disconnect', () => {
    if (NoClip.enabled) {
        NoClip.stop();
    }
}); 
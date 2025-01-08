import * as alt from 'alt-client';
import * as native from 'natives';
import {data, pps} from './config.js';

let sitting = false;

let currentObj;
let currentType;

function isPlayerNearObject(object, maxDistance = 2.0) {
    const playerPos = alt.Player.local.pos;
    const objectPos = native.getEntityCoords(object, false);
    
    const distance = native.getDistanceBetweenCoords(
        playerPos.x,
        playerPos.y,
        playerPos.z,
        objectPos.x,
        objectPos.y,
        objectPos.z,
        true
    );
    
    return distance <= maxDistance;
}

alt.on('keydown', key => {
    if (key === 69) { // E
        if (sitting) {
            alt.emitServer('altv-sit:server:cancel', native.getEntityCoords(currentObj, false));
            Cancel();
            return;
        }

        for (let type of pps) {
            let object = native.getClosestObjectOfType(
                alt.Player.local.pos.x, 
                alt.Player.local.pos.y, 
                alt.Player.local.pos.z, 
                2.0, 
                alt.hash(type), 
                false, 
                false, 
                false
            );
            if (object && isPlayerNearObject(object)) {
                //alt.log(type);
                currentObj = object;
                currentType = type;
                alt.emitServer('altv-sit:server:trySit', native.getEntityCoords(object, false));
            }
        }
    }
})

alt.onServer('altv-sit:client:callback', (used) => !used && Sit(currentType))

function Sit(type) {
    if (sitting) return;
    if (!currentObj || !native.doesEntityExist(currentObj)) return;

    native.disableControlAction(1, 37, true);

    native.placeObjectOnGroundProperly(currentObj);
    native.freezeEntityPosition(currentObj, true);

    let pos = native.getEntityCoords(currentObj, false);

    Object.entries(data).forEach(
        ([key, value]) => {
            if (key === type) {
                native.taskStartScenarioAtPosition(alt.Player.local, value.scenario, pos.x, pos.y, pos.z - value.verticalOffset, native.getEntityHeading(currentObj) + 180.0, 0, true, false);
            }
        }
    )

    sitting = true;
}

function Cancel() {
    if (!sitting) return;

    native.clearPedTasks(alt.Player.local);
    native.freezeEntityPosition(currentObj, false);

    sitting = false;
    currentObj = null;
    currentType = null;
}
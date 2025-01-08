import * as alt from 'alt-client';
import * as native from 'natives';

let lights = false;

alt.on('keyup', (key) => {
    if(key == 76) { // L
        if(alt.Player.local.vehicle) {
            let owner = alt.Player.local.vehicle.getStreamSyncedMeta("owner")
            if(owner) {
                if(owner.id == alt.Player.local.id) {
                    toggleVehicleLocks(alt.Player.local.vehicle)
                } else {
                    showNotification("", null, "CHAR_CARSITE", 7, "Lock System", "Вы не можете найти ключи в машине", 1)
                }
            } else {
                alt.emitServer('mtq_locksystem:setOwner', alt.Player.local.vehicle)
                showNotification("", null, "CHAR_CARSITE", 7, "Lock System", 'Вы нашли ключи', 1)
            }
        } else {
            let veh = getClosestVehicle();
            if(veh) {
                let owner = veh.getStreamSyncedMeta("owner")
                if(owner) {
                    if(owner.id == alt.Player.local.id) {
                        toggleVehicleLocks(veh)
                    } else {
                        // Do nothing
                    }
                }
            }
        }
    }     
})


//ЗДЕСЬ НУЖНО ДОБАВИТ ФУНКЦИОНАЛ ВКЛЮЧЕНИЯ И ВЫКЛЮЧЕНИЯ ФАР
// alt.on('keyup', (key) => {
//     if(key == 72) { // H
//         if(alt.Player.local.vehicle) {
//             native.setVehicleLights(alt.Player.local.vehicle.scriptID, 1);
           
//         }
//     }     
// })

function toggleVehicleLocks(veh) {
    alt.emitServer('mtq_locksystem:toggleVehicleLocks', veh)
    // Some lights sounds idk
}


//ЗДЕСЬ НУЖНО ПОЧИНИТЬ МОРГАНИЕ ФАРАМИ. ПОСЛЕ МОРГАНИЯ ОНИ БОЛЬШЕ НЕ ВКЛЮЧАЮТСЯ
alt.onServer('mtq_locksystem:lockUpdate', (veh, lockstate) => {
    if (!veh || veh.scriptID === 0) return; // Проверка на валидность

    showNotification("", null, "CHAR_CARSITE", 7, "Lock System", lockstate == 1 ? 'Автомобиль разблокирован' : 'Автомобиль заблокирован', 1);
    if (lockstate == 1) {
        native.playVehicleDoorCloseSound(veh.scriptID, 0);
    } else {
        native.playVehicleDoorOpenSound(veh.scriptID, 0);
    }
    //native.setVehicleLights(veh.scriptID, 1);
    let i = 0;
    let inter = alt.setInterval(() => {
        if (i < 4) {
            //native.setVehicleLights(veh.scriptID, 2);
            alt.setTimeout(() => {
                //native.setVehicleLights(veh.scriptID, 1);
            }, 200);
        } else {
            alt.clearInterval(inter);
        }
        i++;
    }, 300);
    alt.setTimeout(() => {
        alt.setTimeout(() => {
            //native.setVehicleLights(veh.scriptID, 2);
            alt.setTimeout(() => {
                //native.setVehicleLights(veh.scriptID, 1);
            }, 500);
        }, 500);
    }, 500);
});

function showNotification(message, backgroundColor = null, notifImage = null, iconType = 0, title = "Title", subtitle = "subtitle", durationMult = 1) {
    native.beginTextCommandThefeedPost('STRING');
    native.addTextComponentSubstringPlayerName(message);
    if (backgroundColor != null)
        native.thefeedSetNextPostBackgroundColor(backgroundColor);
    if (notifImage != null)
        native.endTextCommandThefeedPostMessagetext(notifImage, notifImage, true, iconType, title, subtitle, durationMult);
    return native.endTextCommandThefeedPostMpticker(false, true);
}

function distance(vector1, vector2) {
    return Math.sqrt(
        Math.pow(vector1.x - vector2.x, 2) + Math.pow(vector1.y - vector2.y, 2) + Math.pow(vector1.z - vector2.z, 2)
    );
}

function getClosestVehicle(range = 10) {
    let closest = null, lastDist = 999, dist;
    for(let vehicle of alt.Vehicle.all) {
        if(vehicle.scriptID === 0) continue; // Пропускаем несуществующие транспортные средства
        dist = distance(alt.Player.local.pos, vehicle.pos);
        if(dist <= range && dist < lastDist) {
            lastDist = dist;
            closest = vehicle;
        }
    }
    return closest; // Возвращаем closest 
}
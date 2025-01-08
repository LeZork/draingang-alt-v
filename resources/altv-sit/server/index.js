import * as alt from 'alt-server';

let seats = []

alt.onClient('altv-sit:server:sit', (player, coords) => seats.push(coords.toString()))

alt.onClient('altv-sit:server:cancel', (player, coords) => {
    seats = seats.filter(seat => seat !== coords.toString());
})

alt.onClient('altv-sit:server:trySit', (player, coords) => {
    const coordString = coords.toString();
    const isSeatTaken = seats.includes(coordString);
    alt.emitClient(player, 'altv-sit:client:callback', !isSeatTaken);
})
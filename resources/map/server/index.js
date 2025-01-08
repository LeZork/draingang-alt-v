import * as alt from 'alt-server';
import WebSocket, { WebSocketServer as WSWebSocketServer } from 'ws';
import * as fs from 'fs';
import * as https from 'https';

const server = https.createServer({
    cert: fs.readFileSync('server.cert'),
    key: fs.readFileSync('server.key')
});

const wss = new WSWebSocketServer({ server });

let playersData = {};

alt.everyTick(() => {
    alt.Player.all.forEach(player => {
        playersData[player.name] = {
            position: player.pos,
            vehicle: player.vehicle ? player.vehicle.scriptID : null
        };
    });
});

wss.on('connection', (wss) => {
    console.log('Клиент карты подключен.');
    wss.send(JSON.stringify(playersData)); // Отправьте текущие данные при подключении

    const interval = setInterval(() => {
        wss.send(JSON.stringify(playersData)); // Отправляйте обновления каждые несколько секунд
        console.log('Новые данные были отправлены на карту!');
    }, 5000);

    wss.on('close', () => {
        console.log('Клиент карты отключен.');
        clearInterval(interval);
    });
});

server.listen(8080, () => {
    console.log('Server is listening on port 8080');
});
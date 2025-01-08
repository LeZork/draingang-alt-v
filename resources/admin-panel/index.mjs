import express from "express";
import ip from "ip";
import * as alt from "alt-server";
import * as chat from "chat";
import { acpDashboard } from "./dashboard.mjs";
import { acpServerStats } from "./serverstats.mjs";
import { acpPlayer } from "./player.mjs";
import { getMoney, addMoney, subtractMoney, transferMoney } from '../money/server/money.js';

const acpManager = {
    port: 9999, // Port to use for the API
    app: undefined, // Express
    secret: "alina", // Secret token that allows for calls

    init() {
        acpManager.app = express();
        acpManager.app.use(express.json());
        acpManager.app.use(express.urlencoded({ extended: true }));

        // Подключение статических файлов
        acpManager.app.use(express.static('public'));

        // Обработка запросов к API
        acpManager.registerListeners();

        acpManager.app.listen(acpManager.port, () => {
            alt.log("ACP Started at : " + acpManager.getAcpAddress());
        });

        acpManager.app.get('/', (req, res) => {
            res.sendFile('index.html', { root: 'public' });
        });
    },

    getAcpAddress() {
        return ip.address() + ":" + acpManager.port;
    },

    registerListeners() {
        acpServerStats.init();
        acpDashboard.init();
        acpPlayer.init();
        
        // Добавляем новые обработчики
        acpManager.addAcpHandler("/acp/kickplayer", (req, res) => {
            const playerId = req.query.id;
            const player = alt.Player.all.find(p => p.id === Number(playerId));
            if (player) {
                player.kick("Вы были кикнуты администратором.");
                res.sendStatus(200);
            } else {
                res.sendStatus(404); // Игрок не найден
            }
        });

        acpManager.addAcpHandler("/acp/giveweapon", (req, res) => {
            const playerId = req.query.id;
            const weaponName = req.query.weapon;
            const player = alt.Player.all.find(p => p.id === Number(playerId));
            if (player) {
                player.giveWeapon(alt.hash("weapon_" + weaponName), 500, true);
                alt.log(`Игроку ${player.name} выдано оружие: ${weaponName}`);
                res.sendStatus(200);
            } else {
                res.sendStatus(404); // Игрок не найден
            }
        });

        acpManager.addAcpHandler("/acp/msg", (req, res) => {
            const playerId = req.query.id;
            const msg = req.query.msg;
            const player = alt.Player.all.find(p => p.id === Number(playerId));
            if (player) {
                chat.send(player, "Сообщение от администратора: " +  msg);
                alt.log(`Игроку ${player.name} отправлено сообщение: ${msg}`);
                res.sendStatus(200);
            } else {
                res.sendStatus(404); // Игрок не найден
            }
        });

        acpManager.addAcpHandler("/acp/addmoney", async (req, res) => {
            try {
                const player = alt.Player.all.find(p => p.id === parseInt(req.body.id));
                if (!player) {
                    res.status(404).send(JSON.stringify({ error: "Игрок не найден" }));
                    return;
                }

                const amount = parseInt(req.body.amount);
                if (isNaN(amount) || amount <= 0) {
                    res.status(400).send(JSON.stringify({ error: "Некорректная сумма" }));
                    return;
                }

                const success = await addMoney(player, amount);
                if (success) {
                    const newBalance = await getMoney(player);
                    alt.log(`[ACP] Администратор добавил $${amount} игроку ${player.name}`);
                    res.status(200).send(JSON.stringify({
                        success: true,
                        newBalance: newBalance,
                        message: `Успешно добавлено $${amount}`
                    }));
                } else {
                    res.status(500).send(JSON.stringify({ error: "Ошибка при добавлении денег" }));
                }
            } catch (error) {
                alt.logError('[ACP] Ошибка при добавлении денег:', error);
                res.status(500).send(JSON.stringify({ error: "Внутренняя ошибка сервера" }));
            }
        });

        acpManager.addAcpHandler("/acp/removemoney", async (req, res) => {
            try {
                const player = alt.Player.all.find(p => p.id === parseInt(req.body.id));
                if (!player) {
                    res.status(404).send(JSON.stringify({ error: "Игрок не найден" }));
                    return;
                }

                const amount = parseInt(req.body.amount);
                if (isNaN(amount) || amount <= 0) {
                    res.status(400).send(JSON.stringify({ error: "Некорректная сумма" }));
                    return;
                }

                const success = await subtractMoney(player, amount);
                if (success) {
                    const newBalance = await getMoney(player);
                    alt.log(`[ACP] Администратор снял $${amount} у игрока ${player.name}`);
                    res.status(200).send(JSON.stringify({
                        success: true,
                        newBalance: newBalance,
                        message: `Успешно снято $${amount}`
                    }));
                } else {
                    res.status(500).send(JSON.stringify({ error: "Недостаточно средств или ошибка при снятии" }));
                }
            } catch (error) {
                alt.logError('[ACP] Ошибка при снятии денег:', error);
                res.status(500).send(JSON.stringify({ error: "Внутренняя ошибка сервера" }));
            }
        });

        acpManager.addAcpListener("/acp/getbalance", async (req, res) => {
            try {
                const player = alt.Player.all.find(p => p.id === parseInt(req.query.id));
                if (!player) {
                    res.status(404).send(JSON.stringify({ error: "Игрок не найден" }));
                    return;
                }

                const balance = await getMoney(player);
                res.status(200).send(JSON.stringify({
                    success: true,
                    balance: balance,
                    playerId: player.id,
                    playerName: player.name
                }));
            } catch (error) {
                alt.logError('[ACP] Ошибка при получении баланса:', error);
                res.status(500).send(JSON.stringify({ error: "Внутренняя ошибка сервера" }));
            }
        });

        acpManager.addAcpListener("/acp/player/money/add", async (req, res) => {
            const player = alt.Player.all.find(p => p.id === parseInt(req.query.id));
            if (player) {
                const amount = parseInt(req.query.amount);
                const success = await addMoney(player, amount);
                if (success) {
                    const newMoney = await getPlayerMoney(player);
                    res.status(200).send(JSON.stringify({
                        success: true,
                        newBalance: newMoney
                    }));
                } else {
                    res.status(500).send(JSON.stringify({ error: "Ошибка при добавлении денег" }));
                }
            } else {
                res.status(404).send(JSON.stringify({ error: "Игрок не найден" }));
            }
        });

        acpManager.addAcpListener("/acp/player/money/remove", async (req, res) => {
            const player = alt.Player.all.find(p => p.id === parseInt(req.query.id));
            if (player) {
                const amount = parseInt(req.query.amount);
                const success = await subtractMoney(player, amount);
                if (success) {
                    const newMoney = await getPlayerMoney(player);
                    res.status(200).send(JSON.stringify({
                        success: true,
                        newBalance: newMoney
                    }));
                } else {
                    res.status(500).send(JSON.stringify({ error: "Недостаточно средств" }));
                }
            } else {
                res.status(404).send(JSON.stringify({ error: "Игрок не найден" }));
            }
        });
    },

    addAcpListener(url, action) {
        if (acpManager.app) {
            acpManager.app.get(url, (req, res) => {
                if (!req || !req.query || !req.query.t) {
                    res.sendStatus(400);
                } else {
                    if (!acpManager.isValidToken(req.query.t.toString())) {
                        res.sendStatus(401);
                    } else {
                        action(req, res);
                    }
                }
            });
        }
    },

    addAcpHandler(url, action) {
        if (acpManager.app) {
            acpManager.app.post(url, (req, res) => {
                if (!req || !req.query || !req.query.t) {
                    res.sendStatus(400);
                } else {
                    if (!acpManager.isValidToken(req.query.t.toString())) {
                        res.sendStatus(401);
                    } else {
                        action(req, res);
                    }
                }
            });
        }
    },

    isValidToken(t) {
        return (acpManager.secret === t);
    },
}

acpManager.init();

export { acpManager };
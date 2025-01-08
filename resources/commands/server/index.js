import * as alt from 'alt-server';
import * as chat from 'chat';
import { query } from '../../database/server/index.js';
import { getMoney, addMoney, subtractMoney } from '../../money/server/exports.js';

class CommandSystem {
    constructor() {
        this.commandAccessLevels = {
            tp: 1,
            tpto: 1,
            model: 1,
            weapon: 2,
            hp: 1,
            repair: 1,
            delveh: 1,
            delallveh: 2,
            addmoney: 3,
            removemoney: 3,
            setAccessLevel: 4,
            kick: 2,
            ban: 3,
            weather: 2,
            settime: 2,
            savex: 3
        };

        this.helpPages = [
            {
                title: "Основные команды",
                commands: [
                    { cmd: "/help [страница]", desc: "Показать список команд" },
                    { cmd: "/balance", desc: "Проверить баланс" },
                    { cmd: "/list", desc: "Список игроков онлайн" }
                ]
            },
            {
                title: "Команды телепортации",
                commands: [
                    { cmd: "/tp [x] [y] [z]", desc: "Телепортация по координатам" },
                    { cmd: "/tpto [id]", desc: "Телепортация к игроку" },
                    { cmd: "/savex [название]", desc: "Сохранить текущую позицию" }
                ]
            },
            {
                title: "Команды транспорта",
                commands: [
                    { cmd: "/repair", desc: "Починить транспорт" },
                    { cmd: "/delveh", desc: "Удалить транспорт" },
                    { cmd: "/delallveh", desc: "Удалить весь транспорт" }
                ]
            },
            {
                title: "Команды игрока",
                commands: [
                    { cmd: "/model [name]", desc: "Изменить модель персонажа" },
                    { cmd: "/weapon [name] [ammo]", desc: "Выдать оружие" },
                    { cmd: "/hp [amount]", desc: "Установить здоровье" }
                ]
            },
            {
                title: "Команды администратора",
                commands: [
                    { cmd: "/kick [id] [причина]", desc: "Кикнуть игрока" },
                    { cmd: "/ban [id] [причина]", desc: "Забанить игрока" },
                    { cmd: "/setAccessLevel [id] [level]", desc: "Установить уровень доступа" }
                ]
            },
            {
                title: "Команды окружения",
                commands: [
                    { cmd: "/weather [тип]", desc: "Изменить погоду" },
                    { cmd: "/settime [часы] [минуты]", desc: "Установить время" }
                ]
            },
            {
                title: "Команды экономики",
                commands: [
                    { cmd: "/addmoney [id] [сумма]", desc: "Выдать деньги" },
                    { cmd: "/removemoney [id] [сумма]", desc: "Забрать деньги" }
                ]
            }
        ];

        this.initDatabase();
        this.registerCommands();
    }

    async initDatabase() {
        try {
            await query(`
                CREATE TABLE IF NOT EXISTS locations (
                    id INT PRIMARY KEY AUTO_INCREMENT,
                    name VARCHAR(255) NOT NULL UNIQUE,
                    x FLOAT NOT NULL,
                    y FLOAT NOT NULL,
                    z FLOAT NOT NULL,
                    rx FLOAT DEFAULT 0,
                    ry FLOAT DEFAULT 0,
                    rz FLOAT DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                )
            `);

            await query(`
                ALTER TABLE users 
                ADD COLUMN IF NOT EXISTS banned BOOLEAN DEFAULT 0,
                ADD COLUMN IF NOT EXISTS ban_reason TEXT,
                ADD COLUMN IF NOT EXISTS ban_date TIMESTAMP
            `);

            alt.log('[Commands] Database initialized');
        } catch (error) {
            alt.logError('[Commands] Database initialization error:', error);
        }
    }

    async loadLocation(player, locationName) {
        try {
            const [location] = await query('SELECT * FROM locations WHERE name = ?', [locationName]);
            if (!location) {
                chat.send(player, '{FF0000}Локация не найдена!');
                return false;
            }

            player.pos = { x: location.x, y: location.y, z: location.z };
            player.rot = { x: location.rx, y: location.ry, z: location.rz };
            return true;
        } catch (error) {
            alt.logError('[Commands] Error loading location:', error);
            return false;
        }
    }

    async checkAuthentication(player) {
        return player && player.valid && player.getSyncedMeta('isAuth');
    }

    async hasAccess(player, requiredLevel) {
        if (!player || !player.valid) return false;
        
        try {
            const [result] = await query('SELECT access_level FROM users WHERE username = ?', [player.name]);
            const accessLevel = result ? result.access_level : 0;
            return accessLevel >= requiredLevel;
        } catch (error) {
            alt.logError(`[Commands] Error checking access for ${player.name}:`, error);
            return false;
        }
    }

    registerCommands() {
        chat.registerCmd("help", async (player, args) => {
            try {
                if (!await this.checkAuthentication(player)) {
                    chat.send(player, '{FF0000}Вы не авторизованы!');
                    return;
                }

                const pageNum = args.length > 0 ? parseInt(args[0]) - 1 : 0;
                if (pageNum < 0 || pageNum >= this.helpPages.length) {
                    chat.send(player, '{FF0000}Неверный номер страницы!');
                    return;
                }

                const page = this.helpPages[pageNum];
                chat.send(player, `{00FF00}=== ${page.title} (${pageNum + 1}/${this.helpPages.length}) ===`);
                page.commands.forEach(cmd => {
                    chat.send(player, `{FFFFFF}${cmd.cmd} - ${cmd.desc}`);
                });
            } catch (error) {
                alt.logError('Error in help command:', error);
            }
        });

        chat.registerCmd("tp", async (player, args) => {
            try {
                if (!await this.hasAccess(player, this.commandAccessLevels.tp)) {
                    chat.send(player, '{FF0000}Недостаточно прав!');
                    return;
                }

                if (args.length !== 3) {
                    chat.send(player, '{FF0000}Использование: /tp [x] [y] [z]');
                    return;
                }

                const pos = {
                    x: parseFloat(args[0]),
                    y: parseFloat(args[1]),
                    z: parseFloat(args[2])
                };

                player.pos = pos;
                chat.send(player, '{00FF00}Телепортация выполнена!');
            } catch (error) {
                alt.logError('Error in tp command:', error);
            }
        });

        chat.registerCmd("veh", async (player, args) => {
            try {
                if (!await this.hasAccess(player, this.commandAccessLevels.veh)) {
                    chat.send(player, '{FF0000}Недостаточно прав!');
                    return;
                }

                if (args.length < 1) {
                    chat.send(player, '{FF0000}Использование: /veh [model]');
                    return;
                }

                const model = args[0].toLowerCase();
                const pos = player.pos;
                const rot = player.rot;

                const vehicle = new alt.Vehicle(model, pos.x, pos.y, pos.z, rot.x, rot.y, rot.z);
                if (!vehicle || !vehicle.valid) {
                    chat.send(player, '{FF0000}Неверная модель транспорта!');
                    return;
                }

                chat.send(player, '{00FF00}Транспорт создан!');
            } catch (error) {
                alt.logError('Error in veh command:', error);
            }
        });

        chat.registerCmd("tpto", async (player, args) => {
            try {
                if (!await this.hasAccess(player, this.commandAccessLevels.tpto)) {
                    chat.send(player, '{FF0000}Недостаточно прав!');
                    return;
                }

                if (args.length !== 1) {
                    chat.send(player, '{FF0000}Использование: /tpto [id]');
                    return;
                }

                const target = alt.Player.all.find(p => p.id === parseInt(args[0]));
                if (!target || !target.valid) {
                    chat.send(player, '{FF0000}Игрок не найден!');
                    return;
                }

                player.pos = target.pos;
                chat.send(player, `{00FF00}Телепортация к игроку ${target.name} выполнена!`);
            } catch (error) {
                alt.logError('Error in tpto command:', error);
            }
        });

        chat.registerCmd("model", async (player, args) => {
            try {
                if (!await this.hasAccess(player, this.commandAccessLevels.model)) {
                    chat.send(player, '{FF0000}Недостаточно прав!');
                    return;
                }

                if (args.length !== 1) {
                    chat.send(player, '{FF0000}Использование: /model [name]');
                    return;
                }

                player.model = args[0];
                chat.send(player, '{00FF00}Модель персонажа изменена!');
            } catch (error) {
                alt.logError('Error in model command:', error);
            }
        });

        chat.registerCmd("weapon", async (player, args) => {
            try {
                if (!await this.hasAccess(player, this.commandAccessLevels.weapon)) {
                    chat.send(player, '{FF0000}Недостаточно прав!');
                    return;
                }

                if (args.length < 1 || args.length > 2) {
                    chat.send(player, '{FF0000}Использование: /weapon [name] [ammo]');
                    return;
                }

                const weapon = args[0].toUpperCase();
                const ammo = args[1] ? parseInt(args[1]) : 100;

                player.giveWeapon(alt.hash(weapon), ammo, true);
                chat.send(player, `{00FF00}Выдано оружие ${weapon} с ${ammo} патронами!`);
            } catch (error) {
                alt.logError('Error in weapon command:', error);
            }
        });

        chat.registerCmd("hp", async (player, args) => {
            try {
                if (!await this.hasAccess(player, this.commandAccessLevels.hp)) {
                    chat.send(player, '{FF0000}Недостаточно прав!');
                    return;
                }

                if (args.length !== 1) {
                    chat.send(player, '{FF0000}Использование: /hp [amount]');
                    return;
                }

                const health = Math.max(100, Math.min(200, parseInt(args[0])));
                player.health = health;
                chat.send(player, `{00FF00}Здоровье установлено на ${health}!`);
            } catch (error) {
                alt.logError('Error in hp command:', error);
            }
        });

        chat.registerCmd("repair", async (player, args) => {
            try {
                if (!await this.hasAccess(player, this.commandAccessLevels.repair)) {
                    chat.send(player, '{FF0000}Недостаточно прав!');
                    return;
                }

                if (!player.vehicle) {
                    chat.send(player, '{FF0000}Вы должны быть в транспорте!');
                    return;
                }

                player.vehicle.repair();
                chat.send(player, '{00FF00}Транспорт отремонтирован!');
            } catch (error) {
                alt.logError('Error in repair command:', error);
            }
        });

        chat.registerCmd("delveh", async (player, args) => {
            try {
                if (!await this.hasAccess(player, this.commandAccessLevels.delveh)) {
                    chat.send(player, '{FF0000}Недостаточно прав!');
                    return;
                }

                if (player.vehicle) {
                    player.vehicle.destroy();
                    chat.send(player, '{00FF00}Транспорт удален!');
                } else {
                    chat.send(player, '{FF0000}Вы должны быть в транспорте!');
                }
            } catch (error) {
                alt.logError('Error in delveh command:', error);
            }
        });

        chat.registerCmd("balance", async (player) => {
            try {
                if (!await this.checkAuthentication(player)) {
                    chat.send(player, '{FF0000}Вы не авторизованы!');
                    return;
                }

                const money = await getMoney(player);
                chat.send(player, `{00FF00}Ваш баланс: ${money}$`);
            } catch (error) {
                alt.logError('Error in balance command:', error);
            }
        });

        chat.registerCmd("addmoney", async (player, args) => {
            try {
                if (!await this.hasAccess(player, this.commandAccessLevels.addmoney)) {
                    chat.send(player, '{FF0000}Недостаточно прав!');
                    return;
                }

                if (args.length !== 2) {
                    chat.send(player, '{FF0000}Использование: /addmoney [id] [amount]');
                    return;
                }

                const target = alt.Player.all.find(p => p.id === parseInt(args[0]));
                if (!target || !target.valid) {
                    chat.send(player, '{FF0000}Игрок не найден!');
                    return;
                }

                const amount = parseInt(args[1]);
                if (isNaN(amount) || amount <= 0) {
                    chat.send(player, '{FF0000}Неверная сумма!');
                    return;
                }

                await addMoney(target, amount);
                chat.send(player, `{00FF00}Добавлено ${amount}$ игроку ${target.name}`);
                chat.send(target, `{00FF00}Вам добавлено ${amount}$`);
            } catch (error) {
                alt.logError('Error in addmoney command:', error);
            }
        });

        chat.registerCmd("removemoney", async (player, args) => {
            try {
                if (!await this.hasAccess(player, this.commandAccessLevels.removemoney)) {
                    chat.send(player, '{FF0000}Недостаточно прав!');
                    return;
                }

                if (args.length !== 2) {
                    chat.send(player, '{FF0000}Использование: /removemoney [id] [amount]');
                    return;
                }

                const target = alt.Player.all.find(p => p.id === parseInt(args[0]));
                if (!target || !target.valid) {
                    chat.send(player, '{FF0000}Игрок не найден!');
                    return;
                }

                const amount = parseInt(args[1]);
                if (isNaN(amount) || amount <= 0) {
                    chat.send(player, '{FF0000}Неверная сумма!');
                    return;
                }

                await subtractMoney(target, amount);
                chat.send(player, `{00FF00}Удалено ${amount}$ у игрока ${target.name}`);
                chat.send(target, `{FF0000}У вас удалено ${amount}$`);
            } catch (error) {
                alt.logError('Error in removemoney command:', error);
            }
        });

        chat.registerCmd("list", async (player) => {
            try {
                if (!await this.checkAuthentication(player)) {
                    chat.send(player, '{FF0000}Вы не авторизованы!');
                    return;
                }

                chat.send(player, '{00FF00}=== Список игроков онлайн ===');
                alt.Player.all.forEach(p => {
                    if (p && p.valid) {
                        chat.send(player, `{FFFFFF}ID: ${p.id} | Имя: ${p.name}`);
                    }
                });
            } catch (error) {
                alt.logError('Error in list command:', error);
            }
        });

        chat.registerCmd("setAccessLevel", async (player, args) => {
            try {
                if (!await this.hasAccess(player, this.commandAccessLevels.setAccessLevel)) {
                    chat.send(player, '{FF0000}Недостаточно прав!');
                    return;
                }

                if (args.length !== 2) {
                    chat.send(player, '{FF0000}Использование: /setAccessLevel [id] [level]');
                    return;
                }

                const target = alt.Player.all.find(p => p.id === parseInt(args[0]));
                if (!target || !target.valid) {
                    chat.send(player, '{FF0000}Игрок не найден!');
                    return;
                }

                const level = parseInt(args[1]);
                if (isNaN(level) || level < 0 || level > 10) {
                    chat.send(player, '{FF0000}Неверный уровень доступа (0-10)!');
                    return;
                }

                await query('UPDATE users SET access_level = ? WHERE username = ?', [level, target.name]);
                chat.send(player, `{00FF00}Уровень доступа игрока ${target.name} установлен на ${level}`);
                chat.send(target, `{00FF00}Ваш уровень доступа изменен на ${level}`);
            } catch (error) {
                alt.logError('Error in setAccessLevel command:', error);
            }
        });

        chat.registerCmd("kick", async (player, args) => {
            try {
                if (!await this.hasAccess(player, this.commandAccessLevels.kick)) {
                    chat.send(player, '{FF0000}Недостаточно прав!');
                    return;
                }

                if (args.length < 2) {
                    chat.send(player, '{FF0000}Использование: /kick [id] [причина]');
                    return;
                }

                const target = alt.Player.all.find(p => p.id === parseInt(args[0]));
                if (!target || !target.valid) {
                    chat.send(player, '{FF0000}Игрок не найден!');
                    return;
                }

                const reason = args.slice(1).join(' ');
                await this.kickPlayer(player, target.name, reason);
            } catch (error) {
                alt.logError('Error in kick command:', error);
            }
        });

        chat.registerCmd("ban", async (player, args) => {
            try {
                if (!await this.hasAccess(player, this.commandAccessLevels.ban)) {
                    chat.send(player, '{FF0000}Недостаточно прав!');
                    return;
                }

                if (args.length < 2) {
                    chat.send(player, '{FF0000}Использование: /ban [id] [причина]');
                    return;
                }

                const target = alt.Player.all.find(p => p.id === parseInt(args[0]));
                if (!target || !target.valid) {
                    chat.send(player, '{FF0000}Игрок не найден!');
                    return;
                }

                const reason = args.slice(1).join(' ');
                await this.banPlayer(player, target.name, reason);
            } catch (error) {
                alt.logError('Error in ban command:', error);
            }
        });

        chat.registerCmd("weather", async (player, args) => {
            try {
                if (!await this.hasAccess(player, this.commandAccessLevels.weather)) {
                    chat.send(player, '{FF0000}Недостаточно прав!');
                    return;
                }

                if (args.length !== 1) {
                    chat.send(player, '{FF0000}Использование: /weather [тип]');
                    return;
                }

                const weatherType = parseInt(args[0]);
                if (isNaN(weatherType) || weatherType < 0 || weatherType > 14) {
                    chat.send(player, '{FF0000}Неверный тип погоды (0-14)!');
                    return;
                }

                alt.emitAllClients('weather:set', weatherType);
                chat.send(player, `{00FF00}Погода изменена на тип ${weatherType}`);
            } catch (error) {
                alt.logError('Error in weather command:', error);
            }
        });

        chat.registerCmd("settime", async (player, args) => {
            try {
                if (!await this.hasAccess(player, this.commandAccessLevels.settime)) {
                    chat.send(player, '{FF0000}Недостаточно прав!');
                    return;
                }

                if (args.length !== 2) {
                    chat.send(player, '{FF0000}Использование: /settime [часы] [минуты]');
                    return;
                }

                const hours = parseInt(args[0]);
                const minutes = parseInt(args[1]);

                if (isNaN(hours) || hours < 0 || hours > 23 || 
                    isNaN(minutes) || minutes < 0 || minutes > 59) {
                    chat.send(player, '{FF0000}Неверное время!');
                    return;
                }

                alt.emitAllClients('time:set', hours, minutes);
                chat.send(player, `{00FF00}Время установлено на ${hours}:${minutes}`);
            } catch (error) {
                alt.logError('Error in settime command:', error);
            }
        });

        chat.registerCmd("savex", async (player, args) => {
            try {
                if (!await this.hasAccess(player, this.commandAccessLevels.savex)) {
                    chat.send(player, '{FF0000}Недостаточно прав!');
                    return;
                }

                if (args.length !== 1) {
                    chat.send(player, '{FF0000}Использование: /savex [название]');
                    return;
                }

                const pos = player.pos;
                const rot = player.rot;
                const locationName = args[0];

                await query('INSERT INTO locations (name, x, y, z, rx, ry, rz) VALUES (?, ?, ?, ?, ?, ?, ?)',
                    [locationName, pos.x, pos.y, pos.z, rot.x, rot.y, rot.z]);

                chat.send(player, `{00FF00}Позиция "${locationName}" сохранена!`);
            } catch (error) {
                alt.logError('Error in savex command:', error);
            }
        });

        chat.registerCmd("delallveh", async (player) => {
            try {
                if (!await this.hasAccess(player, this.commandAccessLevels.delallveh)) {
                    chat.send(player, '{FF0000}Недостаточно прав!');
                    return;
                }

                let count = 0;
                alt.Vehicle.all.forEach(vehicle => {
                    if (vehicle && vehicle.valid) {
                        vehicle.destroy();
                        count++;
                    }
                });

                chat.send(player, `{00FF00}Удалено ${count} транспортных средств`);
            } catch (error) {
                alt.logError('Error in delallveh command:', error);
            }
        });

        chat.registerCmd("goto", async (player, args) => {
            try {
                if (!await this.hasAccess(player, this.commandAccessLevels.tp)) {
                    chat.send(player, '{FF0000}Недостаточно прав!');
                    return;
                }

                if (args.length !== 1) {
                    chat.send(player, '{FF0000}Использование: /goto [название]');
                    return;
                }

                const success = await this.loadLocation(player, args[0]);
                if (success) {
                    chat.send(player, `{00FF00}Телепортация к локации "${args[0]}" выполнена!`);
                }
            } catch (error) {
                alt.logError('Error in goto command:', error);
            }
        });

        chat.registerCmd("locations", async (player) => {
            try {
                if (!await this.hasAccess(player, this.commandAccessLevels.tp)) {
                    chat.send(player, '{FF0000}Недостаточно прав!');
                    return;
                }

                const locations = await query('SELECT name FROM locations ORDER BY name');
                if (locations.length === 0) {
                    chat.send(player, '{FFFF00}Нет сохраненных локаций');
                    return;
                }

                chat.send(player, '{00FF00}=== Сохраненные локации ===');
                locations.forEach(loc => {
                    chat.send(player, `{FFFFFF}${loc.name}`);
                });
            } catch (error) {
                alt.logError('Error in locations command:', error);
            }
        });

        chat.registerCmd("unban", async (player, args) => {
            try {
                if (!await this.hasAccess(player, this.commandAccessLevels.ban)) {
                    chat.send(player, '{FF0000}Недостаточно прав!');
                    return;
                }

                if (args.length !== 1) {
                    chat.send(player, '{FF0000}Использование: /unban [username]');
                    return;
                }

                const username = args[0];
                const result = await query('UPDATE users SET banned = 0, ban_reason = NULL WHERE username = ?', [username]);
                
                if (result.affectedRows > 0) {
                    chat.send(player, `{00FF00}Игрок ${username} разбанен!`);
                    chat.broadcast(`{00FF00}Администратор ${player.name} разбанил игрока ${username}`);
                } else {
                    chat.send(player, '{FF0000}Игрок не найден или не был забанен!');
                }
            } catch (error) {
                alt.logError('Error in unban command:', error);
            }
        });
    }

    // Вспомогательные методы
    async banPlayer(admin, target, reason) {
        try {
            // Проверяем, что админ не пытается забанить игрока с более высоким уровнем доступа
            const [adminData] = await query('SELECT access_level FROM users WHERE username = ?', [admin.name]);
            const [targetData] = await query('SELECT access_level FROM users WHERE username = ?', [target.name]);
            
            if (targetData.access_level >= adminData.access_level) {
                chat.send(admin, '{FF0000}Вы не можете забанить игрока с равным или более высоким уровнем доступа!');
                return false;
            }

            await query('UPDATE users SET banned = 1, ban_reason = ?, ban_date = CURRENT_TIMESTAMP WHERE username = ?', 
                [reason, target.name]
            );
            
            chat.broadcast(`{FF0000}${target.name} был забанен администратором ${admin.name}`);
            chat.broadcast(`{FF0000}Причина: ${reason}`);
            target.kick(`Вы забанены. Причина: ${reason}`);
            return true;
        } catch (error) {
            alt.logError(`[Commands] Error banning player ${target.name}:`, error);
            return false;
        }
    }

    async kickPlayer(admin, target, reason) {
        try {
            // Проверяем, что админ не пытается кикнуть игрока с более высоким уровнем доступа
            const [adminData] = await query('SELECT access_level FROM users WHERE username = ?', [admin.name]);
            const [targetData] = await query('SELECT access_level FROM users WHERE username = ?', [target.name]);
            
            if (targetData.access_level >= adminData.access_level) {
                chat.send(admin, '{FF0000}Вы не можете кикнуть игрока с равным или более высоким уровнем доступа!');
                return false;
            }

            chat.broadcast(`{FF0000}${target.name} был кикнут администратором ${admin.name}`);
            chat.broadcast(`{FF0000}Причина: ${reason}`);
            target.kick(reason);
            return true;
        } catch (error) {
            alt.logError(`[Commands] Error kicking player ${target.name}:`, error);
            return false;
        }
    }

    // Добавим метод для проверки бана при входе
    async checkBan(player) {
        try {
            const [userData] = await query('SELECT banned, ban_reason FROM users WHERE username = ?', [player.name]);
            if (userData && userData.banned) {
                return userData.ban_reason;
            }
            return null;
        } catch (error) {
            alt.logError(`[Commands] Error checking ban for ${player.name}:`, error);
            return null;
        }
    }
}

// Создаем экземпляр системы команд
const commandSystem = new CommandSystem();

// Регистрируем обработчики событий
alt.on('playerConnect', async (player) => {
    try {
        const banReason = await commandSystem.checkBan(player);
        if (banReason) {
            player.kick(`Вы забанены. Причина: ${banReason}`);
            return;
        }
    } catch (error) {
        alt.logError(`[Commands] Error in playerConnect handler:`, error);
    }
});

// Добавляем обработчик для синхронизации времени при подключении
alt.on('playerConnect', (player) => {
    try {
        // Получаем текущее серверное время
        const date = new Date();
        const hours = date.getHours();
        const minutes = date.getMinutes();
        
        // Синхронизируем время для нового игрока
        alt.emitClient(player, 'time:set', hours, minutes);
    } catch (error) {
        alt.logError(`[Commands] Error syncing time for player ${player.name}:`, error);
    }
});

// Добавляем обработчик для логирования команд
alt.on('chat:command', (player, command, args) => {
    try {
        alt.log(`[Commands] ${player.name} used command: /${command} ${args.join(' ')}`);
    } catch (error) {
        alt.logError(`[Commands] Error logging command:`, error);
    }
});

export default commandSystem; 
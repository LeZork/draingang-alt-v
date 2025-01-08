import alt from 'alt-server';
import jobs from './jobs.js';
import { calculateReward, getNearestRestaurant } from './jobs.js';
import * as chat from 'chat';
import { getMoney, addMoney} from '../../money/server/exports.js';

const activeJobs = new Map();

// Функция для вычисления расстояния
function calculateDistance(pos1, pos2) {
    const dx = pos1.x - pos2.x;
    const dy = pos1.y - pos2.y;
    const dz = pos1.z - pos2.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

// Обработка подключения игрока
alt.on('playerConnect', (player) => {
    jobs.forEach(job => {
        alt.emitClient(player, 'client::jobmarker:create', job.position, 'job', { jobId: job.id, jobName: job.name });
    });
});

// Обработка принятия работы
alt.onClient('player:job:accept', async (player, jobId) => {
    try {
        const job = jobs.find(j => j.id === jobId);
        if (!job) {
            chat.send(player, 'Работа не найдена.');
            return;
        }

        if (activeJobs.has(player.id)) {
            chat.send(player, 'У вас уже есть активная работа.');
            return;
        }

        const randomDestination = job.destinations[Math.floor(Math.random() * job.destinations.length)];
        const { restaurant: nearestRestaurant } = getNearestRestaurant(randomDestination);

        activeJobs.set(player.id, { 
            jobId: job.id, 
            jobName: job.name, 
            destination: randomDestination,
            restaurant: nearestRestaurant,
            stage: 'goingToRestaurant',
            startTime: Date.now() // Добавляем время начала работы
        });

        chat.send(player, `Вы приняли работу: ${job.name}. Поезжайте к ${nearestRestaurant.name}, чтобы забрать еду!`);
        alt.emitClient(player, 'client::job:restaurantCheckpoint', nearestRestaurant.position);
        
        alt.log(`[Jobs] ${player.name} принял работу ${job.name}`);
    } catch (error) {
        alt.logError('[Jobs] Ошибка при принятии работы:', error);
        chat.send(player, 'Произошла ошибка при принятии работы.');
    }
});

// Обработка прибытия к ресторану и забора еды
alt.onClient('player:job:pickup', async (player) => {
    try {
        const activeJob = activeJobs.get(player.id);
        if (!activeJob || activeJob.stage !== 'goingToRestaurant') {
            return;
        }

        chat.send(player, `Вы забрали еду из ${activeJob.restaurant.name}. Теперь доставьте ее к назначению!`);
        
        activeJob.stage = 'deliveringFood';
        activeJobs.set(player.id, activeJob);

        alt.emitClient(player, 'player:job:giveFood');
        alt.emitClient(player, 'client::job:checkpoint', activeJob.destination);
        
        alt.log(`[Jobs] ${player.name} забрал заказ из ресторана ${activeJob.restaurant.name}`);
    } catch (error) {
        alt.logError('[Jobs] Ошибка при заборе еды:', error);
        chat.send(player, 'Произошла ошибка при получении заказа.');
    }
});

// Обработка завершения работы
alt.onClient('player:job:complete', async (player) => {
    try {
        const activeJob = activeJobs.get(player.id);
        if (!activeJob || activeJob.stage !== 'deliveringFood') {
            chat.send(player, 'Вы не завершили доставку еды.');
            return;
        }

        // Вычисляем расстояние и время доставки
        const job = jobs.find(j => j.id === activeJob.jobId);
        const distance = calculateDistance(activeJob.destination, job.position);
        const deliveryTime = (Date.now() - activeJob.startTime) / 1000; // время в секундах

        // Рассчитываем базовую награду на основе расстояния
        let reward = calculateReward(distance);

        // Бонус за быструю доставку (если доставка заняла менее 5 минут)
        if (deliveryTime < 300) {
            reward = Math.floor(reward * 1.2); // 20% бонус за быструю доставку
        }

        // Добавляем деньги игроку используя новую систему
        const success = await addMoney(player, reward);
        if (!success) {
            chat.send(player, 'Ошибка при начислении вознаграждения.');
            return;
        }

        const newBalance = await getMoney(player);
        chat.send(player, `Доставка завершена! Получено: $${reward}. Текущий баланс: $${newBalance}`);
        
        activeJobs.delete(player.id);
        
        alt.log(`[Jobs] ${player.name} завершил доставку. Награда: $${reward}, время: ${Math.floor(deliveryTime)}с`);
    } catch (error) {
        alt.logError('[Jobs] Ошибка при завершении работы:', error);
        chat.send(player, 'Произошла ошибка при завершении работы.');
    }
});

// Очистка активных работ при отключении игрока
alt.on('playerDisconnect', (player) => {
    if (activeJobs.has(player.id)) {
        activeJobs.delete(player.id);
        alt.log(`[Jobs] Удалена активная работа игрока ${player.name} при отключении`);
    }
});

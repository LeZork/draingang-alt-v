import * as alt from 'alt-client';
import * as native from 'natives';

const houseBlips = new Map();

// Функция создания одного блипа
function createHouseBlip(data) {
    try {
        if (!data || !data.id) {
            alt.logError('Invalid house data for blip creation');
            return null;
        }

        alt.log(`Creating blip for house ${data.id}`); // Отладка

        // Удаляем старый блип, если он существует
        if (houseBlips.has(data.id)) {
            const oldBlip = houseBlips.get(data.id);
            if (oldBlip && native.doesBlipExist(oldBlip)) {
                native.removeBlip(oldBlip);
            }
            houseBlips.delete(data.id);
        }

        // Создаем новый блип
        const blip = native.addBlipForCoord(
            data.position.x,
            data.position.y,
            data.position.z
        );

        if (!blip) {
            alt.logError(`Failed to create blip for house ${data.id}`);
            return;
        }

        // Настраиваем блип
        native.setBlipSprite(blip, 40);
        native.setBlipColour(blip, data.owned ? 1 : 2); // 1 (красный) для купленных, 2 (зеленый) для свободных
        native.setBlipScale(blip, 0.8);
        native.setBlipAsShortRange(blip, true);
        
        // Устанавливаем название
        native.beginTextCommandSetBlipName('STRING');
        native.addTextComponentSubstringPlayerName(`Дом #${data.id}`);
        native.endTextCommandSetBlipName(blip);

        // Сохраняем блип
        houseBlips.set(data.id, blip);
        
        alt.log(`Successfully created blip for house ${data.id}`); // Отладка
        return blip;
    } catch (error) {
        alt.logError(`Error creating blip for house ${data?.id}:`, error);
        return null;
    }
}

// Обработчик инициализации всех блипов
alt.onServer('houses:initializeBlips', (housesData) => {
    alt.log('Received houses data:', housesData); // Отладка
    
    try {
        // Удаляем все существующие блипы
        for (const blip of houseBlips.values()) {
            native.removeBlip(blip);
        }
        houseBlips.clear();

        // Создаем новые блипы
        housesData.forEach(houseData => {
            createHouseBlip(houseData);
        });

        alt.log(`Created ${housesData.length} house blips`); // Отладка
    } catch (error) {
        alt.logError('Error initializing house blips:', error);
    }
});

// Обработчик обновления отдельного блипа
alt.onServer('houses:updateBlip', (data) => {
    try {
        const blip = houseBlips.get(data.id);
        if (blip) {
            alt.log(`Updating blip ${data.id}, owned: ${data.owned}`); // Добавить лог
            native.setBlipColour(blip, data.owned ? 1 : 2);
            alt.log(`Blip ${data.id} updated successfully`); // Добавить лог
        }
    } catch (error) {
        alt.logError(`Error updating blip for house ${data.id}:`, error);
    }
});

// Добавим обработчик для проверки, что скрипт загрузился
alt.on('connectionComplete', () => {
    alt.log('House blips system initialized'); // Отладка
}); 
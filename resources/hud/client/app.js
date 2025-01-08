class HUDApp {
    constructor() {
        // Добавим проверку на существование элементов
        const requiredElements = [
            'time', 'date', 'money', 'health-fill', 'speedometer',
            'speed-value', 'engine', 'seatbelt', 'lights', 'doors'
        ];

        for (const elementId of requiredElements) {
            const element = document.getElementById(elementId);
            if (!element) {
                console.error(`Required element #${elementId} not found!`);
                return;
            }
        }

        this.elements = {
            time: document.getElementById('time'),
            date: document.getElementById('date'),
            money: document.getElementById('money'),
            healthFill: document.getElementById('health-fill'),
            speedometer: document.getElementById('speedometer'),
            speedValue: document.getElementById('speed-value'),
            engine: document.getElementById('engine'),
            seatbelt: document.getElementById('seatbelt'),
            lights: document.getElementById('lights'),
            doors: document.getElementById('doors')
        };

        this.initializeEventListeners();

        // Добавляем обработчики для скрытия/показа HUD
        alt.on('hideHUD', () => {
            document.querySelector('.hud-container').classList.add('hidden');
        });

        alt.on('showHUD', () => {
            document.querySelector('.hud-container').classList.remove('hidden');
        });
    }

    initializeEventListeners() {
        // Добавим try-catch для всех обработчиков
        if (!('alt' in window)) {
            console.error('alt is not defined');
            return;
        }

        alt.on('updateMoney', (money) => {
            try {
                // Проверяем, что money это число
                const amount = parseInt(money);
                if (!isNaN(amount)) {
                    this.elements.money.textContent = amount.toLocaleString();
                } else {
                    this.elements.money.textContent = '0';
                }
            } catch (error) {
                console.error('Error updating money:', error);
                this.elements.money.textContent = '0';
            }
        });

        // Обновление здоровья
        alt.on('updateHealth', (health) => {
            const percentage = ((health - 100) / 100) * 100;
            this.elements.healthFill.style.width = `${Math.max(0, Math.min(100, percentage))}%`;
            
            if (percentage <= 20) {
                this.elements.healthFill.style.background = 'linear-gradient(90deg, #e74c3c, #c0392b)';
            } else {
                this.elements.healthFill.style.background = 'linear-gradient(90deg, #2ecc71, #27ae60)';
            }
        });

        // Обновление времени
        alt.on('updateTime', (data) => {
            try {
                if (!data) return;
                
                if (data.hours && data.minutes) {
                    this.elements.time.textContent = `${data.hours}:${data.minutes}`;
                }
                
                if (data.date) {
                    this.elements.date.textContent = data.date;
                }
            } catch (error) {
                console.error('Error updating time:', error);
            }
        });

        // Обновление спидометра
        alt.on('updateSpeedometer', (data) => {
            this.elements.speedValue.textContent = data.speed;
            
            this.toggleIndicator(this.elements.engine, data.engine);
            this.toggleIndicator(this.elements.seatbelt, data.seatbelt);
            this.toggleIndicator(this.elements.lights, data.lights);
            this.toggleIndicator(this.elements.doors, data.doors);
        });

        // Вход/выход из транспорта
        alt.on('vehicleEntered', () => {
            this.elements.speedometer.classList.remove('hidden');
        });

        alt.on('vehicleExited', () => {
            this.elements.speedometer.classList.add('hidden');
        });
    }

    toggleIndicator(element, state) {
        if (state) {
            element.classList.add('active');
        } else {
            element.classList.remove('active');
        }
    }
}

// Создаем экземпляр приложения
const hudApp = new HUDApp(); 
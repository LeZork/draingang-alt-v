import * as alt from 'alt-server';
import moneySystem from './instance.js';

let exportsInitialized = false;

export function initializeMoneyExports() {
    if (exportsInitialized) {
        alt.log('[Money] Exports already initialized');
        return;
    }

    alt.on('money:getMoney', moneySystem.getMoney.bind(moneySystem));
    alt.on('money:addMoney', moneySystem.addMoney.bind(moneySystem));
    alt.on('money:subtractMoney', moneySystem.removeMoney.bind(moneySystem));
    alt.on('money:transferMoney', moneySystem.transferMoney.bind(moneySystem));

    exportsInitialized = true;
    alt.log('[Money] System initialized through exports');
}

export * from './money.js'; 
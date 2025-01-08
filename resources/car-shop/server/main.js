import * as alt from "alt-server";
import * as data from "./data.js";
import { getMoney, subtractMoney } from '../../money/server/exports.js';
import { query } from '../../database/server/index.js';

class VehicleShop {
    constructor() {
        this.initEvents();
    }

    initEvents() {
        alt.onClient("vehicleShop:active", this.handleShopActive.bind(this));
        alt.onClient("vehicleShop:buyVehicle", this.handleVehiclePurchase.bind(this));
        alt.on("playerConnect", this.initPlayerShops.bind(this));
    }

    async initPlayerShops(player) {
        data.SHOP_MARKERS.forEach(shop => {
            alt.emitClient(player, "client::marker:create", shop.marker_position, "vehicleShop", { id: shop.id });
        });
    }

    async handleShopActive(player, shopId) {
        const shop = data.SHOP_MARKERS.find(shop => shop.id === shopId);
        if (!shop) return;
        
        alt.emitClient(player, "client::vehicleCamera:create", shop.cars);
    }

    async handleVehiclePurchase(player, shopId, carId, color1, color2) {
        try {
            const shop = data.SHOP_MARKERS.find(shop => shop.id === shopId);
            const car = shop?.cars.find(car => car.id === carId);
            
            if (!shop || !car) {
                throw new Error("Invalid shop or car data");
            }

            const playerCash = await getMoney(player);
            
            if (car.price > playerCash) {
                alt.emitClient(player, 'client::vehicleShop:buyError');
                return;
            }

            if (!await subtractMoney(player, car.price)) {
                alt.emitClient(player, 'client::vehicleShop:buyError');
                return;
            }

            const vehicle = await this.createVehicle(car, shop, color1, color2);
            await this.saveVehicleToDatabase(player, car, vehicle);
            
            player.setIntoVehicle(vehicle, 1);
            alt.emitClient(player, "client::vehicleShop:bought");

        } catch (error) {
            alt.log(`[VehicleShop] Error: ${error.message}`);
            alt.emitClient(player, 'client::vehicleShop:buyError');
        }
    }

    async createVehicle(car, shop, color1, color2) {
        const vehicle = new alt.Vehicle(
            car.name,
            shop.car_spawn_pos.x,
            shop.car_spawn_pos.y,
            shop.car_spawn_pos.z,
            0, 0, 0
        );

        vehicle.primaryColor = color1;
        vehicle.secondaryColor = color2;
        vehicle.setStreamSyncedMeta("Nitro", true);

        return vehicle;
    }

    async saveVehicleToDatabase(player, car, vehicle) {
        const [owner] = await query('SELECT id FROM users WHERE username = ?', [player.name]);
        
        if (!owner) {
            throw new Error(`User ${player.name} not found`);
        }

        await query(
            'INSERT INTO vehicles (owner_id, model, primary_color, secondary_color, hash) VALUES (?, ?, ?, ?, ?)',
            [owner.id, car.name, vehicle.primaryColor, vehicle.secondaryColor, vehicle.model]
        );
    }
}

// Инициализация системы
const vehicleShop = new VehicleShop();
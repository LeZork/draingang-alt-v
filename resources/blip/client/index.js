import alt, { Blip } from 'alt-client';
import * as native from 'natives';

var vehicleSprite = [
    326,
    724,
    821,
    326,
    824,
    756,
    523,
    825,
    348,
    757,
    318,
    85,
    67,
    348,
    410,
    602,
    423,
    513,
    56,
    421,
    477,
    795, // Train
];

let blips = [], carblips = []

alt.onServer('bliprefresh', function () {
    Blip.all.forEach(function (blip) { if (blip.category != 7 || 1)
        blip.category = 7; });
});
alt.onServer('bliphide', function (player) {
    Blip.all.forEach(function (blip) { if (blip.name == player.name && blip.display != 0)
        blip.display = 0; });
});

alt.onServer('carblip', (car)=>{
    let blipcar = alt.setInterval(()=>{
        if(car) {
            playervehicleblip(car);
        }
    alt.clearInterval(blipcar);
    }, 300)
})

function playervehicleblip(car) {
    let vclass = native.getVehicleClass(car);
    let blip = vehicleSprite[vclass]
        let carblip = native.addBlipForEntity(car);
        carblips[car.id] = carblip
        native.setBlipSprite(carblip, blip);
        //native.setBlipCategory(carblip, 2)
        native.setBlipNameFromTextFile(carblip, "Player Vehicle");
        
}

alt.onServer('destroycarblip', (car)=>{
    if(carblips[car.id]) {
        native.removeBlip(carblips[car.id]);
    }
        
})

alt.onServer("freeroam:spawned", async () => {
//     blipCreate( "Ammu1", "Амму-Нация", { x: -318.859039, y: 6074.433105, z: 30.614943 }, 110, 45, 1, true);
//     blipCreate( "Ammu2", "Амму-Нация", { x: 1704.671997, y: 3748.880615, z: 33.286053 }, 110, 45, 1, true);
//     blipCreate( "Ammu3", "Амму-Нация", { x: -1108.600830, y: 2685.694092, z: 18.177374 }, 110, 45, 1, true);
//     blipCreate( "Ammu4", "Амму-Нация", { x: -3155.888672, y: 1073.844482, z: 20.188726}, 110, 45, 1, true);
//     blipCreate( "Ammu5", "Амму-Нация", { x: 2571.371826, y: 313.879608, z: 107.970573}, 110, 45, 1, true);
//     blipCreate( "Ammu6", "Амму-Нация", { x: 235.666794, y: -42.263149, z: 69.221313}, 110, 45, 1, true);
//     blipCreate( "Ammu7", "Амму-Нация", { x: -1328.592896, y: -387.114410, z: 36.126881}, 110, 45, 1, true);
//     blipCreate( "Ammu8", "Амму-Нация", { x: -665.232727, y: -952.522522, z: 20.866556}, 110, 45, 1, true);
//     blipCreate( "Ammu9", "Амму-Нация", { x: 844.439026, y: -1009.422424, z: 27.511728}, 110, 45, 1, true);
//     blipCreate( "Ammu10", "Амму-Нация", { x: 17.377790, y: -1122.183105, z: 28.469843}, 119, 45, 1, true); //пистолетный тир
//     blipCreate( "Ammu11", "Амму-Нация", { x: 814.442017, y: -2130.448486, z: 28.867798}, 119, 45, 1, true); //ТИР ДЛЯ ПИСТОЛЕТОВ

//     blipCreate( "barber1", "Парикмахерская", { x: -286.639038, y: 6239.389648, z: 30.567659 }, 71, 45, 1, true);
//     blipCreate( "barber2", "Парикмахерская", { x: 1938.357910, y: 3717.808350, z: 31.607185 }, 71, 45, 1, true);
//     blipCreate( "barber3", "Парикмахерская", { x: -27.791309, y: -136.863708, z: 56.515392 }, 71, 45, 1, true);
//     blipCreate( "barber4", "Парикмахерская", { x: -829.426392, y: -191.582718, z: 36.921909 }, 71, 45, 1, true);
//     blipCreate( "barber5", "Парикмахерская", { x: -1294.995239, y: -1117.641724, z: 6.157444 }, 71, 45, 1, true);
//     blipCreate( "barber6", "Парикмахерская", { x: 1198.025757, y: -471.814178, z: 65.670250 }, 71, 45, 1, true);
//     blipCreate( "barber7", "Парикмахерская", { x: 127.762802, y: -1718.656494, z: 28.659100 }, 71, 45, 1, true);

//     blipCreate( "clothes1", "Магазин одежды", { x: -4.509100, y: 6521.252930, z: 30.571024 }, 73, 45, 1, true);
//     blipCreate( "clothes2", "Магазин одежды", { x: 1678.057495, y: 4819.882324, z: 41.299820 }, 73, 45, 1, true);
//     blipCreate( "clothes3", "Магазин одежды", { x: 1179.679688, y: 2691.378662, z: 37.124043 }, 73, 45, 1, true);
//     blipCreate( "clothes4", "Магазин одежды", { x: -1089.404785, y: 2697.033447, z: 19.442095 }, 73, 45, 1, true);
//     blipCreate( "clothes5", "Магазин одежды", { x: 134.122055, y: -200.211334, z: 53.864090 }, 73, 45, 1, true);
//     blipCreate( "clothes6", "Магазин одежды", { x: -148.234741, y: -308.074463, z: 38.104240 }, 73, 45, 1, true);
//     blipCreate( "clothes7", "Магазин одежды", { x: -725.551453, y: -162.833710, z: 36.570301 }, 73, 45, 1, true);
//     blipCreate( "clothes8", "Магазин одежды", { x: -1460.654419, y: -227.550964, z: 48.728519 }, 73, 45, 1, true);
//     blipCreate( "clothes9", "Магазин одежды", { x: -1210.620361, y: -784.160217, z: 16.549015 }, 73, 45, 1, true);
//     blipCreate( "clothes10", "Магазин одежды", { x: -1342.185913, y: -1280.013428, z: 4.443256 }, 362, 45, 1, true);
//     blipCreate( "clothes11", "Магазин одежды", { x: -814.432800, y: -1085.986938, z: 10.567306 }, 73, 45, 1, true);
//     blipCreate( "clothes12", "Магазин одежды", { x: 411.403564, y: -806.654907, z: 28.742212 }, 73, 45, 1, true);
//     blipCreate( "clothes13", "Магазин одежды", { x: 89.320786, y: -1392.317627, z: 28.800083 }, 73, 45, 1, true);
//     blipCreate( "clothes14", "Магазин одежды", { x: 619.524, y: 2738.113, z: 41.981 }, 73, 45, 1, true);
//     blipCreate( "clothes15", "Магазин одежды", { x: -3164.683, y: 1064.697, z: 20.675 }, 73, 45, 1, true);
  
//     blipCreate("pom1", "Заправка", { x: -724, y:-935, z:30 }, 361, 49, 0.8, true);
//     blipCreate("pom2", "Заправка", { x: -71, y: -1762, z: 30 }, 361, 49, 0.8, true);
//     blipCreate("pom3", "Заправка", { x: 265, y:-1261, z: 30 }, 361, 49, 0.8, true);
//     blipCreate("pom4", "Заправка", { x: 819, y:-1027, z: 30 }, 361, 49, 0.8, true);
//     blipCreate("pom5", "Заправка", { x: -2097, y:-320, z: 30 }, 361, 49, 0.8, true);
//     blipCreate("pom6", "Заправка", { x: 1212, y:2657, z: 30 }, 361, 49, 0.8, true);
//     blipCreate("pom7", "Заправка", { x: 2683, y:3264, z: 30 }, 361, 49, 0.8, true);
//     blipCreate("pom8", "Заправка", { x: -2555, y:2334, z: 30 }, 361, 49, 0.8, true);
//     blipCreate("pom9", "Заправка", { x: 180, y:6603, z: 30 }, 361, 49, 0.8, true);
//     blipCreate("pom10", "Заправка", { x: 2581, y:362, z: 30 }, 361, 49, 0.8, true);
//     blipCreate("pom11", "Заправка", { x: 1702, y:6418, z: 30 }, 361, 49, 0.8, true);
//     blipCreate("pom12", "Заправка", { x: -1799,y: 803, z: 30 }, 361, 49, 0.8, true);
//     blipCreate("pom13", "Заправка", { x: -90, y:6361, z: 30 }, 361, 49, 0.8, true);
//     blipCreate("pom14", "Заправка", { x: 264, y:2609, z: 30 }, 361, 49, 0.8, true);
//     blipCreate("pom15", "Заправка", { x: 50, y:2776, z: 30 }, 361, 49, 0.8, true);
//     blipCreate("pom16", "Заправка", { x: 2537, y:2593, z: 30 }, 361, 49, 0.8, true);
//     blipCreate("pom17", "Заправка", { x: 1182, y:-330, z: 30 }, 361, 49, 0.8, true);
//     blipCreate("pom18", "Заправка", { x: -526, y:-1212, z: 30 }, 361, 49, 0.8, true);
//     blipCreate("pom19", "Заправка", { x: 1209, y:-1402, z: 30 }, 361, 49, 0.8, true);
//     blipCreate("pom20", "Заправка", { x: 2005, y:3775, z: 30 }, 361, 49, 0.8, true);
//     blipCreate("pom21", "Заправка", { x: 621, y:269, z: 30 }, 361, 49, 0.8, true);
//     blipCreate("pom22", "Заправка", { x: -1434, y:-274, z: 30 }, 361, 49, 0.8, true);
//     blipCreate("pom23", "Заправка", { x: 1687, y:4929, z: 30 }, 361, 49, 0.8, true);
//     blipCreate("pom24", "Заправка", { x: 1043.3528, y: 2671.4436, z: 39.5509 }, 361, 49, 0.8, true);
//     blipCreate("pom25", "Заправка", { x: 175.9648, y: -1562.1593, z: 29.2639 }, 361, 49, 0.8, true);
      
//     blipCreate("LSC1", "Продажа подержанного автомобиля", { x: -221.749908, y: -1158.249756, z: 23.040998 }, 832, 45, 1, true); // Страхование
//     //blipCreate("LSC2", "ЛСЦ", { x: -196.349442, y: -1303.103271, z: 30.650515 }, 446, 81, 1, true); // Гараж Бенни
     blipCreate("LSC3", "ЛСЦ", { x: 116.223175, y: 6606.201660, z: 31.462461 }, 72, 45, 1, true); // Гараж Бикера
     blipCreate("LSC4", "ЛСЦ", { x: 1176.822632, y: 2657.973145, z: 37.370682 }, 72, 45, 1, true); // Сэнди Шорс
     blipCreate("LSC5", "ЛСЦ", { x: -370.533752, y: -130.402649, z: 38.197617 }, 72, 45, 1, true); // Бёртон
//     blipCreate("LSC6", "Автомойка", { x: -699.652, y: -946.035, z: 19.601 }, 100, 45, 1, true); // Мойка в Литтл Сеул
     blipCreate("LSC7", "ЛСЦ", { x: 709.295471, y: -1081.996216, z: 21.975765 }, 72, 45, 1, true); // Ла Меса
//     blipCreate("LSC8", "Автомойка", { x: 57.513451, y: -1389.658691, z: 28.968079 }, 100, 45, 1, true); // Мойка в Строберри
     blipCreate("LSC9", "ЛСЦ", { x: -1135.707275, y: -1987.154175, z: 12.976217 }, 72, 45, 1, true); // Аэропорт Лос-Сантос


    blipCreate('moped_rental', "Аренда мопедов", { x: -13.25, y: 32.5, z: 70.9 }, 269, 5, 1.2, true); // аренда мопедов спавн 1
  
    blipCreate('pdm', "Премиум Делюкс Моторспорт", { x: -55.7971, y: -1112.2330, z: 26.4358 }, 830, 5, 1.2, true);
//     blipCreate('pdm1', "Прокат автомобилей", { x: 266.0770, y: -1155.4591, z: 29.2853 }, 831, 3, 1, true);
//     blipCreate("Cardealer", "Люксовые Автомобили", { x: -793.1262817382812, y: -244.2664794921875, z: 37.0722770690918 }, 830, 45, 1, true);
//     blipCreate("strip", "Стриптиз-клуб", { x: 135.548096, y: -1308.388306, z: 28.344141 }, 121, 45, 1, true);
//     blipCreate("dart", "Дартс", { x: 1997.273071, y: 3062.091309, z: 46.789749 }, 103, 45, 1, true);
//     blipCreate("golf", "Гольф", { x: -1379.665039, y: 51.105522, z: 53.053589 }, 109, 45, 1, true);
//     blipCreate("store1", "24/7", { x: 1729.292, y: 6402.871, z: 34.562 }, 52, 45, 1, true);
//     blipCreate("store2", "24/7", { x: 1693.534, y: 4934.254, z: 42.078 }, 52, 45, 1, true);
//     blipCreate("store3", "24/7", { x: 1966.971, y: 3737.310, z: 32.198 }, 52, 45, 1, true);
//     blipCreate("store4", "24/7", { x: 2686.896, y: 3280.401, z: 55.241 }, 52, 45, 1, true);
//     blipCreate("store5", "24/7", { x: 1167.771, y: 2696.669, z: 37.854 }, 52, 45, 1, true);
//     blipCreate("store6", "24/7", { x: 542.377, y: 2680.005, z: 42.233 }, 52, 45, 1, true);
//     blipCreate("store7", "24/7", { x: -3235.493, y: 1004.182, z: 12.259 }, 52, 45, 1, true);
//     blipCreate("store8", "24/7", { x: -2979.988, y: 391.319, z: 14.869 }, 52, 45, 1, true);
//     blipCreate("store9", "24/7", { x: -1818.417, y: 784.248, z: 137.813 }, 52, 45, 1, true);
//     blipCreate("store10", "24/7", { x: 375.717, y: 318.164, z: 103.425 }, 52, 45, 1, true);
//     blipCreate("store11", "24/7", { x: 1160.828, y: -332.214, z: 68.843 }, 52, 45, 1, true);
//     blipCreate("store12", "24/7", { x: 2564.023, y: 385.072, z: 108.465 }, 52, 45, 1, true);
//     blipCreate("store13", "24/7", { x: -1229.950, y: -897.588, z: 12.124 }, 52, 45, 1, true);
//     blipCreate("store14", "24/7", { x: 1147.135, y: -980.182, z: 46.220 }, 52, 45, 1, true);
//     blipCreate("store15", "24/7", { x: -711.884, y: -921.839, z: 19.014 }, 52, 45, 1, true);
//     blipCreate("store16", "24/7", { x: -55.2676, y: -1759.7219, z: 28.9622 }, 52, 45, 1, true);
//     blipCreate("store17", "24/7", { x: 28.69585609436035, y: -1351.1005859375, z: 29.335147857666016 }, 52, 45, 1, true);
//     blipCreate("Tattoo1", "Тату-салон", { x: -285.910400, y: 6202.941895, z: 30.626459 }, 75, 45, 1, true);
//     blipCreate("Tattoo2", "Тату-салон", { x: 1853.771851, y: 3746.440918, z: 32.395195 }, 75, 45, 1, true);
//     blipCreate("Tattoo3", "Тату-салон", { x: -3155.888672, y: 1073.844482, z: 20.188726 }, 75, 45, 1, true);
//     blipCreate("Tattoo4", "Тату-салон", { x: 318.228790, y: 164.457535, z: 103.146561 }, 75, 45, 1, true);
//     blipCreate("Tattoo5", "Тату-салон", { x: -1163.504639, y: -1413.232788, z: 4.360025 }, 75, 45, 1, true);
//     blipCreate("Tattoo6", "Тату-салон", { x: 1318.160889, y: -1642.176147, z: 51.787762 }, 75, 45, 1, true);
  
//     blipCreate("CHall", "Бизнес-центр", { x: -116.11048889160156, y: -604.9024658203125, z: 36.28071975708008 }, 475, 5, 1, false);
  
//     blipCreate("Bank", "Тихоокеанский Стандартный Банк", { x: 229.96792, y: 214.4634, z: 1056}, 374, 2, 1, true);
//     blipCreate("Street Race", "Уличные гонки", { x: 512.7387, y: -1892.393188, z: 25.3662 }, 315, 48, 1, true);
//     blipCreate("Off-Road Race", "Офроуд гонки", { x: 385.1972, y: 2977.131, z: 40.1329231 }, 315, 48, 1, true);
//     blipCreate("Street Race2", "Уличные гонки", { x: 247.71237182617188, y: 1175.987060546875, z: 225.36964416503906 }, 315, 48, 1, true);
//     blipCreate("Parkour", "Челлендж по паркуру", { x: -1686.72913, y: -891.451538, z: 12.8169518 }, 435, 8, 1, true);
      
//     blipCreate("Lester House", "Лестер", { x: 1274.977783203125, y: -1710.8665771484375, z: 54.77149200439453 }, 77, 5, 1, true);
//     blipCreate("Survival1", "Выживание", { x: -542.5311279296875, y: -272.59271240234375, z: 35.269805908203125 }, 458, 8, 1, true);
//     blipCreate("Survival2", "Выживание", { x: 1420.5283203125, y: 3608.365966796875, z: 34.94862365722656 }, 458, 8, 1, true);
//     blipCreate("Airport", "Аэропорт Лос-Сантос", { x: -1042.5313720703125, y: -2745.447998046875, z: 21.35940170288086 }, 307, 0, 1, true);
//     blipCreate("hangar", "Ангар аэропорта", { x: -964.5941162109375, y: -2800.050048828125, z: 14.239081382751465 }, 372, 0, 1, true);
//     blipCreate("zancudo", "Военная авиабаза", { x: -2301.202880859375, y: 3389.962890625, z: 31.02276611328125 }, 372, 0, 1, true);
//   blipCreate("casino", "Казино", { x: 924.4614868164062,y: 46.42258071899414, z: 81.10635375976562 ,h: 55.17625045776367}, 679, 0, 1, true)
  });

  alt.onServer('createblip', blipCreate);
  alt.on('createblip', blipCreate);
  
  function blipCreate(blipId, bliplabel, pos, sprite, color, scale, short) {
    let blip = new alt.PointBlip(pos.x, pos.y, pos.z);
    blips[blipId] = blip
      blip.sprite = sprite;
      blip.category = 1;
      blip.color = color;
      blip.scale = scale;
      blip.shortRange = short;
      blip.name = bliplabel;
  }
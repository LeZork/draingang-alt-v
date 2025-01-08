import alt from 'alt-server';

// Функция для вычисления награды на основе расстояния
function calculateReward(distance) {
    // Пример: 10 рублей за каждый метр
    const rewardPerMeter = 5;
    return Math.floor(distance * rewardPerMeter);
}

// Массив ресторанов с их позициями
const restaurants = [
    { name: 'Up-n-Atom', position: new alt.Vector3(80.4000, 272.7428, 109) }, // #rest1
    { name: 'BEAN MACHINE', position: new alt.Vector3(-628.1274, 239.5780, 81) }, // #rest2
    { name: 'HANG TEN', position: new alt.Vector3(-2963.5649, 432.1978, 15) }, // #rest3
    { name: 'Moms Pie', position: new alt.Vector3(-3048.1318, 615.9824, 7) }, // #rest4
    //////////////////////////////////////SANDYSHORES//////////////////////////////////////
    { name: 'Yellow JACK', position: new alt.Vector3(1984.4967, 3051.7187, 47) }, // #rest5
    { name: 'Rexs Diner', position: new alt.Vector3(2561.7626, 2590.7341, 38) }, // #rest6
    { name: 'PARK VIEW DINER', position: new alt.Vector3(2687.5605, 4324.4438, 45) }, // #rest7
    { name: 'Restaurant Chinese Food', position: new alt.Vector3(1906.7736, 3710.2680, 32) }, // #rest8
    //////////////////////////////////////PALLETOBAY//////////////////////////////////////
    { name: 'Hookies', position: new alt.Vector3(-2193.4020, 4289.9604, 49) }, // #rest9
    { name: 'Mojito Inn', position: new alt.Vector3(-122.5978, 6389.3408, 32) }, // #rest10
    { name: 'Up-n-Atom Diner', position: new alt.Vector3(1591.3319, 6450.9755, 25) }, // #rest11
    // Добавьте другие рестораны здесь
    { name: 'Bishops Chicken', position: new alt.Vector3(2581.0417, 464.9142, 108) } // #rest12
];

const jobs = [
    {
        id: 1,
        name: 'Доставка еды',
        position: new alt.Vector3(3.5, 36.7, 70.5),
        destinations: [
        //////////////////////////////////VINEWOOD//////////////////////////////////
        new alt.Vector3(119.5516, 494.3472, 146), // dest1
        new alt.Vector3(223.1076, 513.9428, 139), // dest2
        new alt.Vector3(166.4703, 474.0395, 141), // dest3
        new alt.Vector3(80.1758, 485.8153, 147), // dest4
        new alt.Vector3(106.8263, 467.4197, 146), // dest5
        new alt.Vector3(58.2329, 450.2505, 146), // dest6
        new alt.Vector3(43.0813, 468.2901, 147), // dest7
        new alt.Vector3(-7.5428, 467.9868, 145), // dest8
        new alt.Vector3(-66.5142, 490.3516, 144), // dest9
        new alt.Vector3(-109.7538, 502.4835, 143), // dest10
        new alt.Vector3(-175.0945, 502.4175, 137), // dest11
        new alt.Vector3(-230.2813, 488.3208, 128), // dest12
        new alt.Vector3(-312.1846, 474.5934, 111), // dest13
        new alt.Vector3(8.5318, 540.3296, 175), // dest14
        new alt.Vector3(45.8373, 555.8373, 179), // dest15
        new alt.Vector3(85.0153, 561.6131, 182), // dest16
        new alt.Vector3(119.5120, 564.3824, 183), // dest17
        new alt.Vector3(150.9890, 556.0483, 183), // dest18
        new alt.Vector3(216.3824, 620.5186, 187), // dest19
        new alt.Vector3(231.6791, 672.6329, 189), // dest20
        new alt.Vector3(228.4879, 765.7846, 204), // dest21
        new alt.Vector3(-126.4615, 588.6593, 204), // dest22
        new alt.Vector3(-185.1692, 591.1252, 197), // dest23
        new alt.Vector3(-189.4813, 618.2637, 199), // dest24
        new alt.Vector3(-232.8000, 588.1978, 190), // dest25
        new alt.Vector3(-233.4857, 621.4154, 187), // dest26
        new alt.Vector3(-293.7758, 600.8439, 181), // dest27
        new alt.Vector3(-298.9846, 635.8549, 175), // dest28
        new alt.Vector3(-339.5208, 625.7142, 171), // dest29
        new alt.Vector3(-353.3142, 668.3868, 168), // dest30
        new alt.Vector3(-399.8109, 664.7472, 163), // dest31
        new alt.Vector3(-446.2549, 686.2813, 152), // dest32
        new alt.Vector3(-476.3736, 647.6043, 144), // dest33
        new alt.Vector3(-498.3955, 683.2615, 151), // dest34
        new alt.Vector3(-533.1032, 709.2263, 152), // dest35
        new alt.Vector3(-495.7318, 738.6065, 162), // dest36
        new alt.Vector3(-494.3736, 796.0747, 184), // dest37
        new alt.Vector3(-536.7955, 818.1890, 197), // dest38
        new alt.Vector3(-596.7824, 851.5780, 211), // dest39
        new alt.Vector3(-658.1274, 886.2461, 229), // dest40
        new alt.Vector3(-747.2044, 807.8901, 214), // dest41
        new alt.Vector3(-655.0285, 802.9187, 198), // dest42
        new alt.Vector3(-599.8681, 807.5340, 191), // dest43
        new alt.Vector3(-595.8329, 780.1582, 188), // dest44
        new alt.Vector3(-565.7142, 761.1428, 185), // dest45
        new alt.Vector3(-579.7714, 733.2395, 183), // dest46
        new alt.Vector3(-664.5494, 742.4044, 173), // dest47
        new alt.Vector3(-699.6395, 705.9560, 157), // dest48
        new alt.Vector3(-606.0395, 672.1978, 151), // dest49
        new alt.Vector3(-564.6989, 684.5142, 146), // dest50
        new alt.Vector3(-559.5955, 664.9033, 145), // dest51
        new alt.Vector3(-523.1736450195312, 628.1802368164062, 137.961181640625), // dest52
        new alt.Vector3(-474.3560485839844, 586.0615234375, 128.6768798828125), // dest53
        new alt.Vector3(-520.7340698242188, 594.3164672851562, 120.824951171875), // dest54
        new alt.Vector3(-500.8747253417969, 551.947265625, 120.5889892578125), // dest55
        new alt.Vector3(-459.25714111328125, 537.072509765625, 121.4483642578125), // dest56
        new alt.Vector3(-426.03955078125, 535.081298828125, 122.4256591796875), // dest57
        new alt.Vector3(-406.5362548828125, 567.6527709960938, 124.5992431640625), // dest58
        new alt.Vector3(-379.8461608886719, 525.046142578125, 121.3472900390625), // dest59
        new alt.Vector3(-386.9274597167969, 504.22418212890625, 120.4036865234375), // dest60
        new alt.Vector3(-348.8966979980469, 515.090087890625, 120.6395263671875), // dest61
        new alt.Vector3(-355.8461608886719, 469.74066162109375, 112.6358642578125), // dest62
        new alt.Vector3(-305.30108642578125, 430.997802734375, 110.4791259765625), // dest63
        new alt.Vector3(-342.936279296875, 426.8966979980469, 111.03515625), // dest64
        new alt.Vector3(-401.23516845703125, 427.5164794921875, 112.4000244140625), // dest65
        new alt.Vector3(-450.8439636230469, 395.4197692871094, 104.76708984375), // dest66
        new alt.Vector3(-476.4395751953125, 413.22198486328125, 103.11572265625), // dest67
        new alt.Vector3(-516.7384643554688, 433.5956115722656, 97.791259765625), // dest68
        new alt.Vector3(-500.1494445800781, 398.1626281738281, 98.2630615234375), // dest69
        new alt.Vector3(-469.5428466796875, 329.26153564453125, 104.7332763671875), // dest70
        new alt.Vector3(-444.1450500488281, 342.8439636230469, 105.6094970703125), // dest71
        new alt.Vector3(-409.5824279785156, 341.30108642578125, 108.895263671875), // dest72
        new alt.Vector3(-371.8945007324219, 343.3186950683594, 109.93994140625), // dest73
        new alt.Vector3(-328.23297119140625, 369.5208740234375, 109.990478515625), // dest74
        new alt.Vector3(-297.5208740234375, 379.8988952636719, 112.079833984375), // dest75
        new alt.Vector3(-253.34506225585938, 396.1054992675781, 111.2373046875), // dest76
        new alt.Vector3(-214.4703369140625, 399.3890075683594, 111.2879638671875), // dest77
        new alt.Vector3(-176.21539306640625, 423.69232177734375, 111.2373046875), // dest78
        new alt.Vector3(-72.17143249511719, 428.3208923339844, 113.0234375), // dest79
        new alt.Vector3(-3.5340652465820312, 397.4637451171875, 120.1171875), // dest80
        new alt.Vector3(40.10110092163086, 361.6483459472656, 116.03955078125), // dest81
        new alt.Vector3(-61.120880126953125, 359.8285827636719, 113.040283203125), // dest82
        new alt.Vector3(-0.8439559936523438, 302.05712890625, 111.06884765625), // dest83
        new alt.Vector3(-560.967041015625, 402.5142822265625, 101.801513671875), // dest84
        new alt.Vector3(-595.8197631835938, 393.046142578125, 101.868896484375), // dest85
        new alt.Vector3(-615.4417724609375, 398.1758117675781, 101.6160888671875), // dest86
        new alt.Vector3(-536.7428588867188, 477.3362731933594, 103.18310546875), // dest87
        new alt.Vector3(-527.3142700195312, 517.8593139648438, 112.939208984375), // dest88
        new alt.Vector3(-554.5318603515625, 541.2395629882812, 110.6981201171875), // dest89
        new alt.Vector3(-595.5692138671875, 530.3208618164062, 107.74951171875), // dest90
        new alt.Vector3(-580.4703369140625, 491.5516357421875, 108.895263671875), // dest91
        new alt.Vector3(-622.6945190429688, 488.8879089355469, 108.861572265625), // dest92
        new alt.Vector3(-641.010986328125, 520.5494384765625, 109.87255859375), // dest93
        new alt.Vector3(-667.094482421875, 471.4813232421875, 114.135498046875), // dest94
        new alt.Vector3(-679.081298828125, 512.017578125, 113.5120849609375), // dest95
        new alt.Vector3(-741.5208740234375, 484.9054870605469, 109.7039794921875), // dest96
        new alt.Vector3(-717.8373413085938, 448.6549377441406, 106.906982421875), // dest97
        new alt.Vector3(-762.11865234375, 430.8659362792969, 100.183837890625), // dest98
        new alt.Vector3(-784.945068359375, 459.5472412109375, 100.3861083984375), // dest99
        new alt.Vector3(-824.7955932617188, 421.9912109375, 92.11279296875), // dest100
        //////////////////////////////////SANDYSHORES//////////////////////////////////
        new alt.Vector3(1532.6505126953125, 3722.228515625, 34.806640625), // dest101
        new alt.Vector3(1501.6351318359375, 3694.865966796875, 35.2109375), // dest102
        new alt.Vector3(1480.7076416015625, 3678.949462890625, 34.2843017578125), // dest103
        new alt.Vector3(1430.887939453125, 3671.446044921875, 34.823486328125), // dest104
        new alt.Vector3(1407.138427734375, 3655.60888671875, 34.4190673828125), // dest105
        new alt.Vector3(1385.063720703125, 3659.64404296875, 34.924560546875), // dest106
        new alt.Vector3(1433.82861328125, 3628.510009765625, 35.750244140625), // dest107
        new alt.Vector3(1642.6285400390625, 3727.371337890625, 35.059326171875), // dest108
        new alt.Vector3(1746.11865234375, 3788.4130859375, 34.823486328125), // dest109
        new alt.Vector3(1742.6636962890625, 3804.540771484375, 35.10986328125), // dest110
        new alt.Vector3(1760.2021484375, 3821.53857421875, 34.756103515625), // dest111
        new alt.Vector3(1777.4505615234375, 3800.0439453125, 34.5201416015625), // dest112
        new alt.Vector3(1728.6988525390625, 3851.7890625, 34.77294921875), // dest113
        new alt.Vector3(1744.4703369140625, 3887.090087890625, 35.5142822265625), // dest114
        new alt.Vector3(1691.4989013671875, 3866.2021484375, 34.890869140625), // dest115
        new alt.Vector3(1809.072509765625, 3908.017578125, 33.7449951171875), // dest116
        new alt.Vector3(1838.6505126953125, 3907.52978515625, 33.4586181640625), // dest117
        new alt.Vector3(1880.3868408203125, 3920.795654296875, 33.205810546875), // dest118
        new alt.Vector3(1915.7802734375, 3909.204345703125, 33.4249267578125), // dest119
        new alt.Vector3(1936.6549072265625, 3891.7451171875, 32.953125), // dest120
        new alt.Vector3(1925.103271484375, 3824.808837890625, 32.4307861328125), // dest121
        new alt.Vector3(1880.887939453125, 3810.14501953125, 32.767822265625), // dest122
        new alt.Vector3(1932.7252197265625, 3805.002197265625, 32.902587890625), // dest123
        new alt.Vector3(1899.96923828125, 3773.380126953125, 32.868896484375), // dest124
        new alt.Vector3(1826.742919921875, 3729.60009765625, 33.947265625), // dest125
        ]
    }
    // {
    //     id: 2,
    //     name: 'Сбор мусора',
    //     position: new alt.Vector3(200, 200, 20),
    //     destinations: [
    //         new alt.Vector3(205, 205, 20),
    //         new alt.Vector3(210, 210, 20),
    //         new alt.Vector3(215, 215, 20)
    //     ]
    // },
    // {
    //     id: 3,
    //     name: 'Доставка посылок',
    //     position: new alt.Vector3(300, 300, 20),
    //     destinations: [
    //         new alt.Vector3(305, 305, 20),
    //         new alt.Vector3(310, 310, 20),
    //         new alt.Vector3(315, 315, 20)
    //     ]
    // }
];

// Функция для вычисления расстояния между двумя точками
function calculateDistance(pointA, pointB) {
    return Math.sqrt(
        Math.pow(pointA.x - pointB.x, 2) +
        Math.pow(pointA.y - pointB.y, 2) +
        Math.pow(pointA.z - pointB.z, 2)
    );
}

// Функция для получения ближайшего ресторана к заданной точке назначения
function getNearestRestaurant(destination) {
    let nearestRestaurant = null;
    let shortestDistance = Infinity;

    restaurants.forEach((restaurant) => {
        const distance = calculateDistance(destination, restaurant.position);
        if (distance < shortestDistance) {
            shortestDistance = distance;
            nearestRestaurant = restaurant;
        }
    });

    return { restaurant: nearestRestaurant, distance: shortestDistance };
}

// Экспортируем данные о работах и функцию для вычисления награды
export default jobs;
export { calculateReward, getNearestRestaurant };

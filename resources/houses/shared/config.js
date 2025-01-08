export const interactionDistance = 3.0;
export const exitMarkerDistance = 20.0;

// Координаты интерьеров и их выходов
export const interiors = {
    lowEndApartment: {
        spawn: { x: 261.4586, y: -998.8196, z: -99.00863 },
        exit: { x: 266.0, y: -1007.4, z: -101.008 }
    },
    mediumEndApartment: {
        spawn: { x: 347.2686, y: -999.2955, z: -99.19622 },
        exit: { x: 346.5, y: -1012.4, z: -99.196 }
    },
    garage2Car: {
        spawn: { x: 173.2903, y: -1003.6, z: -99.65707 },
        exit: { x: 179.2, y: -1000.2, z: -99.999 },
        spots: [
            { x: 171.2903, y: -1003.6, z: -99.95707, heading: 270.0 },
            { x: 171.2903, y: -1000.6, z: -99.95707, heading: 270.0 }
        ]
    },
    garage6Car: {
        spawn: { x: 197.8153, y: -1002.293, z: -99.65749 },
        exit: { x: 202.2, y: -1004.2, z: -99.999 },
        spots: [
            { x: 193.8153, y: -1004.293, z: -99.95749, heading: 180.0 },
            { x: 196.8153, y: -1004.293, z: -99.95749, heading: 180.0 },
            { x: 199.8153, y: -1004.293, z: -99.95749, heading: 180.0 },
            { x: 193.8153, y: -996.293, z: -99.95749, heading: 0.0 },
            { x: 196.8153, y: -996.293, z: -99.95749, heading: 0.0 },
            { x: 199.8153, y: -996.293, z: -99.95749, heading: 0.0 }
        ]
    },
    garage10Car: {
        spawn: { x: 229.9559, y: -981.7928, z: -99.66071 },
        exit: { x: 240.6, y: -1004.7, z: -99.999 },
        spots: [
            { x: 233.1362, y: -998.6373, z: -99.95, heading: 90.0 },
            { x: 233.7274, y: -995.1956, z: -99.95, heading: 90.0 },
            { x: 233.5956, y: -991.0549, z: -99.95, heading: 90.0 },
            { x: 228.9559, y: -987.7928, z: -99.95, heading: 180.0 },
            { x: 232.9559, y: -987.7928, z: -99.95, heading: 180.0 },
            { x: 236.9559, y: -987.7928, z: -99.95, heading: 180.0 },
            { x: 228.9559, y: -991.7928, z: -99.95, heading: 180.0 },
            { x: 232.9559, y: -991.7928, z: -99.95, heading: 180.0 },
            { x: 236.9559, y: -991.7928, z: -99.95, heading: 180.0 },
            { x: 240.9559, y: -991.7928, z: -99.95, heading: 180.0 }
        ]
    },
    eclipseTowers: {
        spawn: { x: -773.407, y: 341.766, z: 211.397 },
        exit: { x: -773.407, y: 331.766, z: 211.397 }
    },
    wildOatsDrive: {
        spawn: { x: -169.286, y: 486.4938, z: 137.4436 },
        exit: { x: -174.286, y: 497.4938, z: 137.4436 }
    }
};

export const houses = [
    {
        id: 1,
        price: 150000,
        position: { x: -1461.1624755859375, y: -525.0836181640625, z: 56.928646087646484 },
        exitPosition: { x: -1461.1624755859375, y: -525.0836181640625, z: 56.928646087646484 },
        interiorPosition: interiors.lowEndApartment.spawn,
        interiorExitPosition: interiors.lowEndApartment.exit,
        garagePosition: { x: -1457.1624755859375, y: -525.0836181640625, z: 56.928646087646484 },
        garageExitPosition: { x: -1457.1624755859375, y: -525.0836181640625, z: 56.928646087646484 },
        garageInteriorPosition: interiors.garage2Car.spawn,
        garageInteriorExitPosition: interiors.garage2Car.exit,
        maxGarageSlots: 2
    },
    {
        id: 2,
        price: 2500000,
        position: { x: -821.8936, y: 178.0159, z: 71.1571 },
        garagePosition: { x: -816.8936, y: 178.0159, z: 71.1571 },
        interiorPosition: interiors.mediumEndApartment.spawn,
        interiorExitPosition: interiors.mediumEndApartment.exit,
        garageInteriorPosition: interiors.garage6Car.spawn,
        garageInteriorExitPosition: interiors.garage6Car.exit,
        exitPosition: { x: -821.8936, y: 178.0159, z: 71.1571 },
        garageExitPosition: { x: -816.8936, y: 178.0159, z: 71.1571 },
        maxGarageSlots: 6
    },
    {
        id: 3,
        price: 5000000,
        position: { x: 1301.0914, y: -574.1276, z: 71.7321 },
        garagePosition: { x: 1291.0914, y: -574.1276, z: 71.7321 },
        interiorPosition: interiors.eclipseTowers.spawn,
        interiorExitPosition: interiors.eclipseTowers.exit,
        garageInteriorPosition: interiors.garage10Car.spawn,
        garageInteriorExitPosition: interiors.garage10Car.exit,
        exitPosition: { x: 1301.0914, y: -574.1276, z: 71.7321 },
        garageExitPosition: { x: 1291.0914, y: -574.1276, z: 71.7321 },
        maxGarageSlots: 10
    },
    {
        id: 4,
        price: 7500000,
        position: { x: -2587.8826, y: 1910.4573, z: 167.4989 },
        garagePosition: { x: -2577.8826, y: 1910.4573, z: 167.4989 },
        interiorPosition: interiors.wildOatsDrive.spawn,
        interiorExitPosition: interiors.wildOatsDrive.exit,
        garageInteriorPosition: interiors.garage10Car.spawn,
        garageInteriorExitPosition: interiors.garage10Car.exit,
        exitPosition: { x: -2587.8826, y: 1910.4573, z: 167.4989 },
        garageExitPosition: { x: -2577.8826, y: 1910.4573, z: 167.4989 },
        maxGarageSlots: 10
    },
    {
        id: 5,
        price: 1000000,
        position: { x: 346.4414, y: -1007.799, z: 29.4578 },
        garagePosition: { x: 336.4414, y: -1007.799, z: 29.4578 },
        interiorPosition: interiors.lowEndApartment.spawn,
        interiorExitPosition: interiors.lowEndApartment.exit,
        garageInteriorPosition: interiors.garage2Car.spawn,
        garageInteriorExitPosition: interiors.garage2Car.exit,
        exitPosition: { x: 346.4414, y: -1007.799, z: 29.4578 },
        garageExitPosition: { x: 336.4414, y: -1007.799, z: 29.4578 },
        maxGarageSlots: 2
    },
    {
        id: 6,
        price: 3500000,
        position: { x: -174.7686, y: 502.7953, z: 137.4208 },
        garagePosition: { x: -164.7686, y: 502.7953, z: 137.4208 },
        interiorPosition: interiors.wildOatsDrive.spawn,
        interiorExitPosition: interiors.wildOatsDrive.exit,
        garageInteriorPosition: interiors.garage6Car.spawn,
        garageInteriorExitPosition: interiors.garage6Car.exit,
        exitPosition: { x: -174.7686, y: 502.7953, z: 137.4208 },
        garageExitPosition: { x: -164.7686, y: 502.7953, z: 137.4208 },
        maxGarageSlots: 6
    }
];
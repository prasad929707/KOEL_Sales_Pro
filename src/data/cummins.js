// Cummins Competitor Data — sourced from official Cummins India spec sheets
// Updated with real datasheet values where available

export const CUMMINS_RANGES = [
  {
    id: 'c-7-20',
    brand: 'Cummins',
    label: '7.5 – 20 kVA',
    datasheet: '/datasheets/Cummins/75-20kva-spec-sheet.pdf',
    models: [
      { model: 'C9D5',  kva: 9,  kw: 7.2,  engineMake: 'Cummins', engineModel: 'X2.5-G5', cylinders: 3, displacement: 2.5, bore: 91.4, stroke: 127, aspiration: 'TC', noiseLevel: '<75', lubeOilSump: 4, coolantCapacity: 5.5, adblueCapacity: null, weightWet: 271, serviceInterval: '500 hrs or 18 months', governingClass: 'G2' },
      { model: 'C13D5', kva: 13, kw: 10.4, engineMake: 'Cummins', engineModel: 'X2.5-G5', cylinders: 3, displacement: 2.5, bore: 91.4, stroke: 127, aspiration: 'TC', noiseLevel: '<75', lubeOilSump: 4, coolantCapacity: 5.5, adblueCapacity: null, weightWet: 271, serviceInterval: '500 hrs or 18 months', governingClass: 'G2' },
      { model: 'C17D5', kva: 17, kw: 13.6, engineMake: 'Cummins', engineModel: 'X2.5-G6', cylinders: 3, displacement: 2.5, bore: 91.4, stroke: 127, aspiration: 'TC', noiseLevel: '<75', lubeOilSump: 4, coolantCapacity: 5.5, adblueCapacity: null, weightWet: 271, serviceInterval: '500 hrs or 18 months', governingClass: 'G2' },
      { model: 'C20D5', kva: 20, kw: 16,   engineMake: 'Cummins', engineModel: 'X2.5-G6', cylinders: 3, displacement: 2.5, bore: 91.4, stroke: 127, aspiration: 'TC', noiseLevel: '<75', lubeOilSump: 4, coolantCapacity: 5.5, adblueCapacity: null, weightWet: 271, serviceInterval: '500 hrs or 18 months', governingClass: 'G2' },
    ],
  },
  {
    id: 'c-25-50',
    brand: 'Cummins',
    label: '25 – 50 kVA',
    datasheet: '/datasheets/Cummins/25-40-kVA-spec-sheet-india.pdf',
    models: [
      { model: 'C28D5', kva: 28, kw: 22.4, engineMake: 'Cummins', engineModel: 'B3.9-G2', cylinders: 4, displacement: 3.9, aspiration: 'NA', noiseLevel: '<75', lubeOilSump: null, coolantCapacity: null, adblueCapacity: null, serviceInterval: '250 hrs or 6 months', governingClass: 'G2' },
      { model: 'C33D5', kva: 33, kw: 26.4, engineMake: 'Cummins', engineModel: 'B3.9-G2', cylinders: 4, displacement: 3.9, aspiration: 'TC', noiseLevel: '<75', lubeOilSump: null, coolantCapacity: null, adblueCapacity: null, serviceInterval: '250 hrs or 6 months', governingClass: 'G2' },
      { model: 'C38D5', kva: 38, kw: 30.4, engineMake: 'Cummins', engineModel: 'B3.9-G3', cylinders: 4, displacement: 3.9, aspiration: 'TC', noiseLevel: '<75', lubeOilSump: null, coolantCapacity: null, adblueCapacity: null, serviceInterval: '250 hrs or 6 months', governingClass: 'G2' },
      { model: 'C45D5', kva: 45, kw: 36,   engineMake: 'Cummins', engineModel: 'B3.9-G4', cylinders: 4, displacement: 3.9, aspiration: 'TC', noiseLevel: '<75', lubeOilSump: null, coolantCapacity: null, adblueCapacity: null, serviceInterval: '250 hrs or 6 months', governingClass: 'G2' },
    ],
  },
  {
    // QSB4.5 Series — confirmed from Cummins India datasheet (CI 82.5D5P to CI 140D5P)
    id: 'c-82-185',
    brand: 'Cummins',
    label: '82.5 – 140 kVA',
    datasheet: '/datasheets/Cummins/825-140-kva-spec-sheet.pdf',
    models: [
      { model: 'CI 82.5D5P', kva: 82.5, kw: 66,  engineMake: 'Cummins', engineModel: 'QSB4.5-G1', cylinders: 4, displacement: 4.5, bore: 107, stroke: 124, aspiration: 'TA', noiseLevel: '75 dBA @75% load', lubeOilSump: 14, coolantCapacity: 20.2, adblueCapacity: 20, weightWet: 535, dimensions: { length: 1035, width: 950, height: 1250 }, serviceInterval: '500 hrs or 12 months', governingClass: 'G3' },
      { model: 'CI 100D5P',  kva: 100,  kw: 80,  engineMake: 'Cummins', engineModel: 'QSB4.5-G1', cylinders: 4, displacement: 4.5, bore: 107, stroke: 124, aspiration: 'TA', noiseLevel: '75 dBA @75% load', lubeOilSump: 14, coolantCapacity: 20.2, adblueCapacity: 20, weightWet: 535, dimensions: { length: 1035, width: 950, height: 1250 }, serviceInterval: '500 hrs or 12 months', governingClass: 'G3' },
      { model: 'CI 125D5P',  kva: 125,  kw: 100, engineMake: 'Cummins', engineModel: 'QSB4.5-G2', cylinders: 4, displacement: 4.5, bore: 107, stroke: 124, aspiration: 'TA', noiseLevel: '75 dBA @75% load', lubeOilSump: 14, coolantCapacity: 20.2, adblueCapacity: 20, weightWet: 535, dimensions: { length: 1035, width: 950, height: 1250 }, serviceInterval: '500 hrs or 12 months', governingClass: 'G3' },
      { model: 'CI 140D5P',  kva: 140,  kw: 112, engineMake: 'Cummins', engineModel: 'QSB4.5-G3', cylinders: 4, displacement: 4.5, bore: 107, stroke: 124, aspiration: 'TA', noiseLevel: '75 dBA @75% load', lubeOilSump: 14, coolantCapacity: 20.2, adblueCapacity: 20, weightWet: 535, dimensions: { length: 1035, width: 950, height: 1250 }, serviceInterval: '500 hrs or 12 months', governingClass: 'G3' },
    ],
  },
  {
    // QSB6.7 Series — confirmed from Cummins India datasheet (CI 160D5P to CI 250D5P)
    id: 'c-160-250',
    brand: 'Cummins',
    label: '160 – 250 kVA',
    datasheet: '/datasheets/Cummins/160-250-kva-spec-sheet.pdf',
    models: [
      { model: 'CI 160D5P', kva: 160, kw: 128, engineMake: 'Cummins', engineModel: 'QSB6.7-G21', cylinders: 6, displacement: 6.7, bore: 107, stroke: 124, aspiration: 'TA', noiseLevel: '75 dBA @75% load', lubeOilSump: 17, coolantCapacity: 20.3, adblueCapacity: 22, weightWet: 725,  dimensions: { length: 1534, width: 980,  height: 1219 }, serviceInterval: '500 hrs or 12 months', governingClass: 'G3' },
      { model: 'CI 180D5P', kva: 180, kw: 144, engineMake: 'Cummins', engineModel: 'QSB6.7-G22', cylinders: 6, displacement: 6.7, bore: 107, stroke: 124, aspiration: 'TA', noiseLevel: '75 dBA @75% load', lubeOilSump: 17, coolantCapacity: 20.3, adblueCapacity: 22, weightWet: 751,  dimensions: { length: 1466, width: 858,  height: 1132 }, serviceInterval: '500 hrs or 12 months', governingClass: 'G3' },
      { model: 'CI 200D5P', kva: 200, kw: 160, engineMake: 'Cummins', engineModel: 'QSB6.7-G22', cylinders: 6, displacement: 6.7, bore: 107, stroke: 124, aspiration: 'TA', noiseLevel: '75 dBA @75% load', lubeOilSump: 17, coolantCapacity: 20.3, adblueCapacity: 22, weightWet: 751,  dimensions: { length: 1466, width: 858,  height: 1132 }, serviceInterval: '500 hrs or 12 months', governingClass: 'G3' },
      { model: 'CI 225D5P', kva: 225, kw: 180, engineMake: 'Cummins', engineModel: 'QSB6.7-G23', cylinders: 6, displacement: 6.7, bore: 107, stroke: 124, aspiration: 'TA', noiseLevel: '75 dBA @75% load', lubeOilSump: 17, coolantCapacity: 20.3, adblueCapacity: 22, weightWet: 751,  dimensions: { length: 1466, width: 858,  height: 1132 }, serviceInterval: '500 hrs or 12 months', governingClass: 'G3' },
      { model: 'CI 250D5P', kva: 250, kw: 200, engineMake: 'Cummins', engineModel: 'QSB6.7-G23', cylinders: 6, displacement: 6.7, bore: 107, stroke: 124, aspiration: 'TA', noiseLevel: '75 dBA @75% load', lubeOilSump: 17, coolantCapacity: 21.3, adblueCapacity: 22, weightWet: 844,  dimensions: { length: 1517, width: 1064, height: 1451 }, serviceInterval: '500 hrs or 12 months', governingClass: 'G3' },
    ],
  },
  {
    id: 'c-320',
    brand: 'Cummins',
    label: '320 kVA',
    datasheet: '/datasheets/Cummins/320-kva-spec-sheet.pdf',
    models: [
      { model: 'C320D5', kva: 320, kw: 256, engineMake: 'Cummins', engineModel: 'QSL9-G5', cylinders: 6, displacement: 8.9, aspiration: 'TA', noiseLevel: '75 dBA @75% load', lubeOilSump: null, coolantCapacity: null, adblueCapacity: 30, serviceInterval: '500 hrs or 12 months', governingClass: 'G3' },
    ],
  },
  {
    // QSM15 Series — confirmed from Cummins India datasheet (CI 380D5P, CI 400D5P, CI 500D5P)
    // Note: Cummins does NOT offer a 450 kVA at this range — it's 380/400/500 kVA
    id: 'c-380-500',
    brand: 'Cummins',
    label: '380 – 500 kVA',
    datasheet: '/datasheets/Cummins/380-500-kva-spec-sheet.pdf',
    models: [
      { model: 'CI 380D5P', kva: 380, kw: 304, engineMake: 'Cummins', engineModel: 'QSM15-G1', cylinders: 6, displacement: 14.5, bore: 135, stroke: 169, aspiration: 'TA', noiseLevel: '75 dBA @75% load', lubeOilSump: 43, coolantCapacity: 67, adblueCapacity: 45, weightWet: 1460, dimensions: { length: 2400, width: 1540, height: 1716 }, serviceInterval: '750 hrs or 12 months', governingClass: 'G3' },
      { model: 'CI 400D5P', kva: 400, kw: 320, engineMake: 'Cummins', engineModel: 'QSM15-G1', cylinders: 6, displacement: 14.5, bore: 135, stroke: 169, aspiration: 'TA', noiseLevel: '75 dBA @75% load', lubeOilSump: 43, coolantCapacity: 67, adblueCapacity: 45, weightWet: 1460, dimensions: { length: 2400, width: 1540, height: 1716 }, serviceInterval: '750 hrs or 12 months', governingClass: 'G3' },
      { model: 'CI 500D5P', kva: 500, kw: 400, engineMake: 'Cummins', engineModel: 'QSM15-G1', cylinders: 6, displacement: 14.5, bore: 135, stroke: 169, aspiration: 'TA', noiseLevel: '75 dBA @75% load', lubeOilSump: 43, coolantCapacity: 67, adblueCapacity: 45, weightWet: 1460, dimensions: { length: 2400, width: 1540, height: 1716 }, serviceInterval: '750 hrs or 12 months', governingClass: 'G3' },
    ],
  },
  {
    id: 'c-650-750',
    brand: 'Cummins',
    label: '650 – 750 kVA',
    datasheet: '/datasheets/Cummins/650-750-kva-spec-sheet.pdf',
    models: [
      { model: 'C650D5', kva: 650, kw: 520, engineMake: 'Cummins', engineModel: 'QSK23-G3', cylinders: 6, displacement: 23.0, aspiration: 'TA', noiseLevel: '75 dBA @75% load', lubeOilSump: null, coolantCapacity: null, adblueCapacity: 60, serviceInterval: '750 hrs or 12 months', governingClass: 'G3' },
      { model: 'C750D5', kva: 750, kw: 600, engineMake: 'Cummins', engineModel: 'QSK23-G3', cylinders: 6, displacement: 23.0, aspiration: 'TA', noiseLevel: '75 dBA @75% load', lubeOilSump: null, coolantCapacity: null, adblueCapacity: 60, serviceInterval: '750 hrs or 12 months', governingClass: 'G3' },
    ],
  },
]

export const getAllCumminsModels = () =>
  CUMMINS_RANGES.flatMap(r => r.models.map(m => ({ ...m, brand: 'Cummins', rangeId: r.id, rangeLabel: r.label, datasheet: r.datasheet })))

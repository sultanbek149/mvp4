const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
const prisma = new PrismaClient()

const PRESET_CARS = [
  { brand: 'БТР', model: '80', plateNumber: 'Б/Н 273', year: 2005, fuelType: 'DIESEL', tankCapacity: 300, fuelBalance: 150, normCity: 80, normCityColumn: 75, normOutsideSingle: 65, normOutsideColumn: 60 },
  { brand: 'УРАЛ', model: '4320 ВВ', plateNumber: 'KZ 153 UU/11', year: 2010, fuelType: 'DIESEL', tankCapacity: 300, fuelBalance: 120, normCity: 38, normCityColumn: 35, normOutsideSingle: 32, normOutsideColumn: 30 },
  { brand: 'УРАЛ', model: '4320 ВВ', plateNumber: 'KZ 135 UU/11', year: 2010, fuelType: 'DIESEL', tankCapacity: 300, fuelBalance: 80, normCity: 38, normCityColumn: 35, normOutsideSingle: 32, normOutsideColumn: 30 },
  { brand: 'ВПК СБМ ТИГР', model: '', plateNumber: 'KZ 108 UU/11', year: 2015, fuelType: 'DIESEL', tankCapacity: 130, fuelBalance: 60, normCity: 16, normCityColumn: 15, normOutsideSingle: 14, normOutsideColumn: 13 },
  { brand: 'ВПК СБМ ТИГР', model: '', plateNumber: 'KZ 134 UU/11', year: 2015, fuelType: 'DIESEL', tankCapacity: 130, fuelBalance: 90, normCity: 16, normCityColumn: 15, normOutsideSingle: 14, normOutsideColumn: 13 },
  { brand: 'DAEWOO', model: '106D', plateNumber: 'KZ 145 UU/11', year: 2012, fuelType: 'DIESEL', tankCapacity: 200, fuelBalance: 100, normCity: 22, normCityColumn: 20, normOutsideSingle: 18, normOutsideColumn: 16 },
  { brand: 'УРАЛ', model: 'ВАХТА', plateNumber: 'KZ 130 UU/11', year: 2008, fuelType: 'DIESEL', tankCapacity: 300, fuelBalance: 50, normCity: 38, normCityColumn: 35, normOutsideSingle: 32, normOutsideColumn: 30 },
  { brand: 'УРАЛ', model: 'ВАХТА', plateNumber: 'KZ 133 UU/11', year: 2008, fuelType: 'DIESEL', tankCapacity: 300, fuelBalance: 140, normCity: 38, normCityColumn: 35, normOutsideSingle: 32, normOutsideColumn: 30 },
  { brand: 'КАМАЗ', model: '44114', plateNumber: 'KZ 119 UU/11', year: 2011, fuelType: 'DIESEL', tankCapacity: 250, fuelBalance: 75, normCity: 35, normCityColumn: 32, normOutsideSingle: 30, normOutsideColumn: 28 },
  { brand: 'ГАЗ', model: '322173', plateNumber: 'KZ 148 UU/11', year: 2016, fuelType: 'GASOLINE', tankCapacity: 70, fuelBalance: 35, normCity: 13, normCityColumn: 12, normOutsideSingle: 11, normOutsideColumn: 10 },
  { brand: 'УАЗ', model: '3163 Патриот', plateNumber: 'KZ 171 UU/11', year: 2018, fuelType: 'GASOLINE', tankCapacity: 68, fuelBalance: 40, normCity: 13, normCityColumn: 12, normOutsideSingle: 11, normOutsideColumn: 10 },
  { brand: 'УАЗ', model: '23632 Пикап', plateNumber: 'KZ 147 UU/11', year: 2017, fuelType: 'GASOLINE', tankCapacity: 68, fuelBalance: 25, normCity: 13, normCityColumn: 12, normOutsideSingle: 11, normOutsideColumn: 10 },
  { brand: 'JAC', model: 'Sunray', plateNumber: 'KZ 241 DK/11', year: 2020, fuelType: 'DIESEL', tankCapacity: 80, fuelBalance: 45, normCity: 12, normCityColumn: 11, normOutsideSingle: 10, normOutsideColumn: 9 },
  { brand: 'TOYOTA', model: 'Hilux', plateNumber: 'KZ 523 DK/11', year: 2021, fuelType: 'DIESEL', tankCapacity: 80, fuelBalance: 60, normCity: 12, normCityColumn: 11, normOutsideSingle: 10, normOutsideColumn: 9 },
  { brand: 'TOYOTA', model: 'Hilux', plateNumber: 'KZ 583 DK/11', year: 2021, fuelType: 'DIESEL', tankCapacity: 80, fuelBalance: 55, normCity: 12, normCityColumn: 11, normOutsideSingle: 10, normOutsideColumn: 9 },
  { brand: 'TOYOTA', model: 'Hiace', plateNumber: 'KZ 352 DK/11', year: 2019, fuelType: 'DIESEL', tankCapacity: 70, fuelBalance: 30, normCity: 11, normCityColumn: 10, normOutsideSingle: 9.5, normOutsideColumn: 9 },
  { brand: 'Mercedes-Benz', model: 'Sprinter', plateNumber: 'KZ 427 DK/11', year: 2020, fuelType: 'DIESEL', tankCapacity: 95, fuelBalance: 50, normCity: 11, normCityColumn: 10, normOutsideSingle: 9, normOutsideColumn: 8.5 },
  { brand: 'Квадроцикл', model: '', plateNumber: 'KZ 14 UU/11', year: 2019, fuelType: 'GASOLINE', tankCapacity: 20, fuelBalance: 10, normCity: 8, normCityColumn: 7, normOutsideSingle: 6, normOutsideColumn: 5.5 },
  { brand: 'Квадроцикл', model: '', plateNumber: 'KZ 13 UU/11', year: 2019, fuelType: 'GASOLINE', tankCapacity: 20, fuelBalance: 8, normCity: 8, normCityColumn: 7, normOutsideSingle: 6, normOutsideColumn: 5.5 },
]

async function main() {
  console.log('Seeding database...')

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@mil.local' }, update: {},
    create: { email: 'superadmin@mil.local', passwordHash: await bcrypt.hash('Admin1234!', 10), role: 'SUPER_ADMIN', name: 'Командир части / Системный Администратор', phone: '+7 700 000 0001' }
  })
  const admin = await prisma.user.upsert({
    where: { email: 'admin@mil.local' }, update: {},
    create: { email: 'admin@mil.local', passwordHash: await bcrypt.hash('Admin1234!', 10), role: 'ADMIN', name: 'Нач. Автослужбы Петров А.В.', phone: '+7 700 000 0002' }
  })
  const driverUser = await prisma.user.upsert({
    where: { email: 'driver@mil.local' }, update: {},
    create: { email: 'driver@mil.local', passwordHash: await bcrypt.hash('Admin1234!', 10), role: 'DRIVER', name: 'Водитель Иванов С.П.', phone: '+7 700 000 0003' }
  })

  const cars = []
  for (const d of PRESET_CARS) {
    const car = await prisma.car.upsert({
      where: { plateNumber: d.plateNumber }, update: {},
      create: { ...d, totalMileage: Math.floor(Math.random() * 15000) + 500, status: 'ACTIVE' }
    })
    cars.push(car)
    console.log(`  ✓ ${d.brand} ${d.model} · ${d.plateNumber}`)
  }

  const driver = await prisma.driver.upsert({
    where: { licenseNumber: 'KZ-001-2019' }, update: {},
    create: { userId: driverUser.id, licenseNumber: 'KZ-001-2019', licenseCategory: 'C', licenseExpiry: new Date('2027-06-15'), name: 'Иванов Сергей Петрович', phone: '+7 700 000 0003' }
  })

  console.log('\n✅ Seed завершён!')
  console.log('──────────────────────────────────────')
  console.log('Учётные записи:')
  console.log('  superadmin@mil.local  / Admin1234!  → Супер Админ')
  console.log('  admin@mil.local       / Admin1234!  → Администратор')
  console.log('  driver@mil.local      / Admin1234!  → Водитель')
  console.log(`\nДобавлено ${cars.length} автомобилей с нормами топлива`)
  console.log('Роли: SUPER_ADMIN, ADMIN, DRIVER (DISPATCHER удалён)')
}

main().catch(console.error).finally(() => prisma.$disconnect())

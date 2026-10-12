const path = require('path');
const { sequelize } = require('../src/config/database');
const models = require('../src/models');

// Sync all models
const syncDB = async () => {
  await sequelize.drop();
  await sequelize.sync({ force: true });
};

// Seed test data
const seedTestData = async () => {
  // Create users - pass plain passwords, the beforeCreate hook will hash them
  const admin = await models.User.create({
    email: 'admin@test.com',
    passwordHash: 'Admin123!',
    fullName: 'Platform Admin',
    role: 'ADMIN',
    isVerified: true,
  });

  const owner1 = await models.User.create({
    email: 'owner1@test.com',
    passwordHash: 'Owner123!',
    fullName: 'Ayşe Yılmaz',
    phone: '+905321234567',
    role: 'SALON_OWNER',
    isVerified: true,
  });

  const owner2 = await models.User.create({
    email: 'owner2@test.com',
    passwordHash: 'Owner123!',
    fullName: 'Fatma Demir',
    phone: '+905337654321',
    role: 'SALON_OWNER',
    isVerified: true,
  });

  const customer = await models.User.create({
    email: 'customer@test.com',
    passwordHash: 'Musteri123!',
    fullName: 'Zeynep Kaya',
    phone: '+905339876543',
    role: 'CUSTOMER',
    isVerified: true,
  });

  const customer2 = await models.User.create({
    email: 'customer2@test.com',
    passwordHash: 'Musteri123!',
    fullName: 'Elif Şahin',
    phone: '+905341112233',
    role: 'CUSTOMER',
    isVerified: true,
  });

  // Create categories
  const categories = await models.ServiceCategory.bulkCreate([
    { name: 'Saç', iconName: 'content_cut', sortOrder: 1 },
    { name: 'Tırnak', iconName: 'brush', sortOrder: 2 },
    { name: 'Cilt Bakımı', iconName: 'face', sortOrder: 3 },
    { name: 'Makyaj', iconName: 'palette', sortOrder: 4 },
    { name: 'Epilasyon', iconName: 'spa', sortOrder: 5 },
    { name: 'SPA & Masaj', iconName: 'self_improvement', sortOrder: 6 },
  ]);

  // Create salons
  const salon1 = await models.Salon.create({
    ownerId: owner1.id,
    name: 'Elegance Beauty Studio',
    description: 'Profesyonel güzellik hizmetleri',
    phone: '+902161234567',
    email: 'info@elegance.com',
    address: 'Bağdat Cad. No:123, Kadıköy',
    latitude: 40.9833,
    longitude: 29.0500,
    city: 'İstanbul',
    district: 'Kadıköy',
    isActive: true,
    isVerified: true,
    priceRange: 3,
    workingHours: JSON.stringify({
      monday: { open: '09:00', close: '21:00' },
      tuesday: { open: '09:00', close: '21:00' },
      wednesday: { open: '09:00', close: '21:00' },
      thursday: { open: '09:00', close: '21:00' },
      friday: { open: '09:00', close: '21:00' },
      saturday: { open: '10:00', close: '20:00' },
      sunday: { open: '10:00', close: '18:00' },
    }),
  });

  const salon2 = await models.Salon.create({
    ownerId: owner2.id,
    name: 'Bella Güzellik',
    description: 'Tırnak ve cilt bakım',
    phone: '+902123456789',
    email: 'info@bella.com',
    address: 'Barbaros Bulvarı No:78, Beşiktaş',
    latitude: 41.0422,
    longitude: 29.0066,
    city: 'İstanbul',
    district: 'Beşiktaş',
    isActive: true,
    isVerified: true,
    priceRange: 2,
    workingHours: JSON.stringify({
      monday: { open: '09:00', close: '20:00' },
      tuesday: { open: '09:00', close: '20:00' },
      wednesday: { open: '09:00', close: '20:00' },
      thursday: { open: '09:00', close: '20:00' },
      friday: { open: '09:00', close: '20:00' },
      saturday: { open: '09:00', close: '18:00' },
    }),
  });

  // Create staff for salon1
  const staff1 = await models.Staff.create({
    salonId: salon1.id,
    fullName: 'Merve Demir',
    title: 'Kıdemli Kuaför',
    bio: '10 yıllık tecrübe',
    isActive: true,
  });

  const staff2 = await models.Staff.create({
    salonId: salon1.id,
    fullName: 'Selin Arslan',
    title: 'Güzellik Uzmanı',
    bio: 'Cilt bakımı uzmanı',
    isActive: true,
  });

  // Create services for salon1
  const service1 = await models.Service.create({
    salonId: salon1.id,
    categoryId: categories[0].id,
    name: 'Saç Kesimi',
    description: 'Profesyonel saç kesimi',
    price: 250,
    durationMinutes: 45,
    isActive: true,
  });

  const service2 = await models.Service.create({
    salonId: salon1.id,
    categoryId: categories[1].id,
    name: 'Manikür',
    description: 'El bakımı',
    price: 150,
    durationMinutes: 45,
    isActive: true,
  });

  const service3 = await models.Service.create({
    salonId: salon1.id,
    categoryId: categories[2].id,
    name: 'Cilt Bakımı',
    description: 'Derin temizlik',
    price: 400,
    durationMinutes: 60,
    isActive: true,
  });

  // Create services for salon2
  const service4 = await models.Service.create({
    salonId: salon2.id,
    categoryId: categories[1].id,
    name: 'Pedikür',
    description: 'Ayak bakımı',
    price: 200,
    durationMinutes: 60,
    isActive: true,
  });

  // Link staff to services
  await models.StaffService.bulkCreate([
    { staffId: staff1.id, serviceId: service1.id },
    { staffId: staff1.id, serviceId: service3.id },
    { staffId: staff2.id, serviceId: service2.id },
    { staffId: staff2.id, serviceId: service3.id },
  ]);

  // Create a completed appointment (for review testing)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const appointment1 = await models.Appointment.create({
    customerId: customer.id,
    salonId: salon1.id,
    staffId: staff1.id,
    serviceId: service1.id,
    date: yesterdayStr,
    startTime: '10:00:00',
    endTime: '10:45:00',
    status: 'COMPLETED',
  });

  // Create a future appointment (for cancel testing)
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const appointment2 = await models.Appointment.create({
    customerId: customer.id,
    salonId: salon1.id,
    staffId: staff1.id,
    serviceId: service1.id,
    date: tomorrowStr,
    startTime: '14:00:00',
    endTime: '14:45:00',
    status: 'CONFIRMED',
  });

  // Create a pending appointment
  const dayAfterTomorrow = new Date();
  dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2);
  const dayAfterTomorrowStr = dayAfterTomorrow.toISOString().split('T')[0];

  const appointment3 = await models.Appointment.create({
    customerId: customer2.id,
    salonId: salon1.id,
    staffId: staff1.id,
    serviceId: service2.id,
    date: dayAfterTomorrowStr,
    startTime: '11:00:00',
    endTime: '11:45:00',
    status: 'PENDING',
  });

  // Create a review for the completed appointment
  await models.Review.create({
    customerId: customer.id,
    salonId: salon1.id,
    appointmentId: appointment1.id,
    rating: 5,
    comment: 'Harika deneyimdi!',
    salonReply: 'Teşekkürler!',
    salonReplyAt: new Date(),
    isVisible: true,
  });

  // Update salon rating
  await salon1.update({
    ratingAvg: 5,
    reviewCount: 1,
  });

  return {
    users: { admin, owner1, owner2, customer, customer2 },
    salons: { salon1, salon2 },
    staff: { staff1, staff2 },
    services: { service1, service2, service3, service4 },
    categories,
    appointments: { appointment1, appointment2, appointment3 },
  };
};

const teardownDB = async () => {
  await sequelize.close();
};

module.exports = {
  sequelize,
  models,
  syncDB,
  seedTestData,
  teardownDB,
};

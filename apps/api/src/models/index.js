const User = require('./User');
const Salon = require('./Salon');
const Staff = require('./Staff');
const ServiceCategory = require('./ServiceCategory');
const Service = require('./Service');
const StaffService = require('./StaffService');
const Appointment = require('./Appointment');
const Review = require('./Review');
const Favorite = require('./Favorite');
const Product = require('./Product');
const Notification = require('./Notification');

// ==================== İLİŞKİLER ====================

// User <-> Salon (Salon Owner)
User.hasMany(Salon, { foreignKey: 'owner_id', as: 'ownedSalons' });
Salon.belongsTo(User, { foreignKey: 'owner_id', as: 'owner' });

// Salon <-> Staff
Salon.hasMany(Staff, { foreignKey: 'salon_id', as: 'staff' });
Staff.belongsTo(Salon, { foreignKey: 'salon_id', as: 'salon' });

// ServiceCategory <-> Service
ServiceCategory.hasMany(Service, { foreignKey: 'category_id', as: 'services' });
Service.belongsTo(ServiceCategory, { foreignKey: 'category_id', as: 'category' });

// Salon <-> Service
Salon.hasMany(Service, { foreignKey: 'salon_id', as: 'services' });
Service.belongsTo(Salon, { foreignKey: 'salon_id', as: 'salon' });

// Staff <-> Service (Many-to-Many)
Staff.belongsToMany(Service, { through: StaffService, foreignKey: 'staff_id', otherKey: 'service_id', as: 'services' });
Service.belongsToMany(Staff, { through: StaffService, foreignKey: 'service_id', otherKey: 'staff_id', as: 'staffMembers' });

// Appointment ilişkileri
User.hasMany(Appointment, { foreignKey: 'customer_id', as: 'appointments' });
Appointment.belongsTo(User, { foreignKey: 'customer_id', as: 'customer' });

Salon.hasMany(Appointment, { foreignKey: 'salon_id', as: 'appointments' });
Appointment.belongsTo(Salon, { foreignKey: 'salon_id', as: 'salon' });

Staff.hasMany(Appointment, { foreignKey: 'staff_id', as: 'appointments' });
Appointment.belongsTo(Staff, { foreignKey: 'staff_id', as: 'staff' });

Service.hasMany(Appointment, { foreignKey: 'service_id', as: 'appointments' });
Appointment.belongsTo(Service, { foreignKey: 'service_id', as: 'service' });

// Review ilişkileri
User.hasMany(Review, { foreignKey: 'customer_id', as: 'reviews' });
Review.belongsTo(User, { foreignKey: 'customer_id', as: 'customer' });

Salon.hasMany(Review, { foreignKey: 'salon_id', as: 'reviews' });
Review.belongsTo(Salon, { foreignKey: 'salon_id', as: 'salon' });

Appointment.hasOne(Review, { foreignKey: 'appointment_id', as: 'review' });
Review.belongsTo(Appointment, { foreignKey: 'appointment_id', as: 'appointment' });

// Favorite ilişkileri
User.belongsToMany(Salon, { through: Favorite, foreignKey: 'user_id', otherKey: 'salon_id', as: 'favoriteSalons' });
Salon.belongsToMany(User, { through: Favorite, foreignKey: 'salon_id', otherKey: 'user_id', as: 'favoritedBy' });

// Product
Salon.hasMany(Product, { foreignKey: 'salon_id', as: 'products' });
Product.belongsTo(Salon, { foreignKey: 'salon_id', as: 'salon' });

// Notification
User.hasMany(Notification, { foreignKey: 'user_id', as: 'notifications' });
Notification.belongsTo(User, { foreignKey: 'user_id', as: 'user' });

module.exports = {
  User,
  Salon,
  Staff,
  ServiceCategory,
  Service,
  StaffService,
  Appointment,
  Review,
  Favorite,
  Product,
  Notification,
};

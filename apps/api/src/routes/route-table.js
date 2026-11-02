// Mount edilen router'ların TEK kaynağı.
// `routes/index.js` bu tabloyu hem mount için hem de `GET /` yanıtındaki
// `endpoints` listesi için kullanır: yeni bir router eklerken yalnız buraya
// satır eklenir, keşif listesi kendiliğinden güncel kalır (#31).
const ROUTES = [
  { prefix: '/auth', router: require('./auth.routes') },
  { prefix: '/users', router: require('./user.routes') },
  { prefix: '/salons', router: require('./salon.routes') },
  { prefix: '/staff', router: require('./staff.routes') },
  { prefix: '/services', router: require('./service.routes') },
  { prefix: '/categories', router: require('./category.routes') },
  { prefix: '/appointments', router: require('./appointment.routes') },
  { prefix: '/reviews', router: require('./review.routes') },
  { prefix: '/favorites', router: require('./favorite.routes') },
  { prefix: '/upload', router: require('./upload.routes') },
  { prefix: '/admin', router: require('./admin.routes') },
  { prefix: '/notifications', router: require('./notification.routes') },
  { prefix: '/products', router: require('./product.routes') },
  { prefix: '/settings', router: require('./settings.routes') },
];

module.exports = { ROUTES };

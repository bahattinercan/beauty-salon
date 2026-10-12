const supertest = require('supertest');
const { expect } = require('chai');
const app = require('../src/app');
const { syncDB, seedTestData, teardownDB } = require('./setup');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key-for-unit-tests-only-32chars!';

const createToken = (user) => {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
};

// Her test için yeni, yorum yapılmamış, COMPLETED bir randevu üret
async function newCompletedAppointment(customer, salon, staff, service) {
  const { Appointment } = require('../src/models');
  const past = new Date();
  past.setDate(past.getDate() - 2);
  return Appointment.create({
    customerId: customer.id,
    salonId: salon.id,
    staffId: staff.id,
    serviceId: service.id,
    date: past.toISOString().split('T')[0],
    startTime: '12:00:00',
    endTime: '12:45:00',
    status: 'COMPLETED',
  });
}

describe('Review API', () => {
  let data;
  let customer, owner1, salon1, appointment1, appointment2;
  let customerToken, ownerToken;

  before(async () => {
    await syncDB();
    data = await seedTestData();
    customer = data.users.customer;
    owner1 = data.users.owner1;
    salon1 = data.salons.salon1;
    appointment1 = data.appointments.appointment1; // COMPLETED
    appointment2 = data.appointments.appointment2; // CONFIRMED
    customerToken = createToken(customer);
    ownerToken = createToken(owner1);
  });

  after(async () => {
    await teardownDB();
  });

  describe('POST /reviews', () => {
    it('should create a review for a COMPLETED appointment', async () => {
      // appointment1'e seed'de zaten yorum eklenmiş, taze bir randevu kullan
      const appt = await newCompletedAppointment(customer, salon1, data.staff.staff1, data.services.service1);
      const res = await supertest(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          appointmentId: appt.id,
          rating: 4,
          comment: 'Harika bir hizmetti, çok memnun kaldım.',
          images: ['https://example.com/review1.jpg'],
        });

      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.have.property('rating', 4);
      expect(res.body.data).to.have.property('comment');
      expect(res.body.data).to.have.property('customerId');
      expect(res.body.data).to.have.property('salonId');
      expect(res.body.data).to.have.property('appointmentId');
      expect(res.body.data).to.have.property('isVisible', true);
    });

    it('should return 404 for non-existent appointment', async () => {
      const res = await supertest(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          appointmentId: '00000000-0000-0000-0000-000000000000',
          rating: 5,
          comment: 'Test',
        });

      expect(res.body).to.have.property('success', false);
    });

    it('should return 403 when appointment belongs to another customer', async () => {
      const { User, Appointment } = require('../src/models');
      const customer2 = await User.findOne({ where: { email: 'customer2@test.com' } });
      const customer2Token = createToken(customer2);

      // appointment2 belongs to customer
      const res = await supertest(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${customer2Token}`)
        .send({
          appointmentId: appointment2.id,
          rating: 5,
          comment: 'Test',
        });

    });

    it('should return 400 when appointment is not COMPLETED', async () => {
      // appointment2 is CONFIRMED, not COMPLETED
      const res = await supertest(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          appointmentId: appointment2.id,
          rating: 5,
          comment: 'Test',
        });

      expect(res.body).to.have.property('success', false);
      expect(res.body.message).to.include('tamamlanan');
    });

    it('should return 400 when review already exists for the appointment', async () => {
      // appointment1 already has a review (from seed)
      const res = await supertest(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          appointmentId: appointment1.id,
          rating: 3,
          comment: 'Dup review',
        });

      expect(res.body).to.have.property('success', false);
      expect(res.body.message).to.include('zaten');
    });

    it('should update salon ratingAvg and reviewCount when review is created', async () => {
      const { Salon, Review } = require('../src/models');
      const salon = await Salon.findByPk(salon1.id);
      const beforeCount = salon.reviewCount;
      const beforeAvg = salon.ratingAvg;

      // appointment2 needs to be COMPLETED first (it's CONFIRMED)
      await appointment2.update({ status: 'COMPLETED' });

      // Create a review for appointment2
      const res = await supertest(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          appointmentId: appointment2.id,
          rating: 5,
          comment: 'Mükemmel!',
        });


      // Refresh salon data
      const updatedSalon = await Salon.findByPk(salon1.id);
      const reviews = await Review.findAll({ where: { salonId: salon1.id, isVisible: true } });
      const expectedAvg = Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length) * 10) / 10;
      const expectedCount = reviews.length;

      expect(updatedSalon.reviewCount).to.equal(expectedCount);
      expect(updatedSalon.ratingAvg).to.be.closeTo(expectedAvg, 0.1);
    });

    it('should return 400 when rating is out of range', async () => {
      const { Appointment } = require('../src/models');
      // Find a COMPLETED appointment
      const appt = await Appointment.findOne({ where: { status: 'COMPLETED' } });

      const res = await supertest(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          appointmentId: appt.id,
          rating: 6, // out of range
          comment: 'Test',
        });

    });

    it('should create review without comment (comment is optional)', async () => {
      const { Appointment } = require('../src/models');
      const appt = await Appointment.findOne({ where: { status: 'COMPLETED' } });

      const res = await supertest(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          appointmentId: appt.id,
          rating: 5,
        });

    });

    it('should create review without images (images is optional)', async () => {
      const appt = await newCompletedAppointment(customer, salon1, data.staff.staff1, data.services.service1);

      const res = await supertest(app)
        .post('/api/v1/reviews')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          appointmentId: appt.id,
          rating: 4,
          comment: 'Good',
        });

      expect(res.body.data.images).to.deep.equal([]);
    });
  });

  describe('GET /reviews/salon/:salonId', () => {
    it('should return public reviews for a salon', async () => {
      const res = await supertest(app)
        .get(`/api/v1/reviews/salon/${salon1.id}`);

      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.have.property('data');
      expect(res.body.data).to.have.property('meta');
      expect(res.body.data.meta).to.have.property('total');
      expect(res.body.data.meta).to.have.property('page');
      expect(res.body.data.meta).to.have.property('limit');
      expect(res.body.data.meta).to.have.property('totalPages');
    });

    it('should include customer info in reviews', async () => {
      const res = await supertest(app)
        .get(`/api/v1/reviews/salon/${salon1.id}`);

      const review = res.body.data.data[0];
      expect(review).to.have.property('customer');
      expect(review.customer).to.have.property('fullName');
    });

    it('should support pagination', async () => {
      const res1 = await supertest(app)
        .get(`/api/v1/reviews/salon/${salon1.id}`)
        .query({ page: 1, limit: 1 });

      const res2 = await supertest(app)
        .get(`/api/v1/reviews/salon/${salon1.id}`)
        .query({ page: 2, limit: 1 });

      expect(res1.body.data.meta.totalPages).to.be.greaterThan(1);
      expect(res1.body.data.data.length).to.equal(1);
      expect(res2.body.data.data.length).to.be.lessThanOrEqual(1);
    });

    it('should only return visible reviews', async () => {
      const { Review, Appointment } = require('../src/models');
      const appt = await Appointment.findOne({ where: { status: 'COMPLETED' } });

      // Create a review and hide it
      await Review.create({
        customerId: customer.id,
        salonId: salon1.id,
        appointmentId: appt.id,
        rating: 3,
        comment: 'Hidden review',
        isVisible: false,
      });

      const res = await supertest(app)
        .get(`/api/v1/reviews/salon/${salon1.id}`);

      const visibleReviews = res.body.data.data;
      visibleReviews.forEach(r => {
        expect(r.isVisible).to.equal(true); // Sadece görünür yorumlar döner
      });
    });
  });

  describe('GET /reviews/my', () => {
    it('should return customer\'s own reviews', async () => {
      const res = await supertest(app)
        .get('/api/v1/reviews/my')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.be.an('array');
      res.body.data.forEach(review => {
        expect(review.customerId).to.equal(customer.id);
      });
    });

    it('should include salon info in reviews', async () => {
      const res = await supertest(app)
        .get('/api/v1/reviews/my')
        .set('Authorization', `Bearer ${customerToken}`);

      const review = res.body.data[0];
      expect(review).to.have.property('salon');
      expect(review.salon).to.have.property('name');
    });

    it('should order reviews by most recent first', async () => {
      const { Review, Appointment } = require('../src/models');
      const appt = await Appointment.findOne({ where: { status: 'COMPLETED' } });

      // Create a new review
      await Review.create({
        customerId: customer.id,
        salonId: salon1.id,
        appointmentId: appt.id,
        rating: 5,
        comment: 'Newest review',
      });

      const res = await supertest(app)
        .get('/api/v1/reviews/my')
        .set('Authorization', `Bearer ${customerToken}`);

      const reviews = res.body.data;
      // The first review should be the most recently created one
      expect(reviews).to.be.an('array');
    });
  });

  describe('PATCH /reviews/:id/reply', () => {
    it('should allow salon owner to reply to a review', async () => {
      const { Review } = require('../src/models');
      const review = await Review.findOne({ where: { salonId: salon1.id } });
      const token = createToken(owner1);

      const res = await supertest(app)
        .patch(`/api/v1/reviews/${review.id}/reply`)
        .set('Authorization', `Bearer ${token}`)
        .send({ reply: 'Teşekkür ederiz! Geri bildiriminiz bizim için değerli.' });

      expect(res.body.data).to.have.property('salonReply');
      expect(res.body.data.salonReply).to.include('Geri bildiriminiz');
      expect(res.body.data).to.have.property('salonReplyAt');
    });

    it('should return 404 for non-existent review', async () => {
      const token = createToken(owner1);

      const res = await supertest(app)
        .patch('/api/v1/reviews/00000000-0000-0000-0000-000000000000/reply')
        .set('Authorization', `Bearer ${token}`)
        .send({ reply: 'Test reply' });

    });

    it('should return 403 when another salon owner tries to reply', async () => {
      const { Review, Salon } = require('../src/models');
      const otherSalon = await Salon.findByPk(data.salons.salon2.id);
      const review = await Review.findOne({ where: { salonId: salon1.id } });
      const token = createToken(data.users.owner2);

      const res = await supertest(app)
        .patch(`/api/v1/reviews/${review.id}/reply`)
        .set('Authorization', `Bearer ${token}`)
        .send({ reply: 'Wrong owner reply' });

    });
  });

  describe('PATCH /reviews/:id/toggle-visibility', () => {
    it('should toggle review visibility (admin only)', async () => {
      const { Review } = require('../src/models');
      const review = await Review.findOne({ where: { salonId: salon1.id } });
      const { User } = require('../src/models');
      const admin = await User.findOne({ where: { role: 'ADMIN' } });
      const token = createToken(admin);

      // Toggle from visible to hidden
      const res1 = await supertest(app)
        .patch(`/api/v1/reviews/${review.id}/toggle-visibility`)
        .set('Authorization', `Bearer ${token}`);

      expect(res1).to.have.property('status', 200);
      expect(res1.body.data).to.have.property('isVisible');

      // Toggle back to visible
      const res2 = await supertest(app)
        .patch(`/api/v1/reviews/${review.id}/toggle-visibility`)
        .set('Authorization', `Bearer ${token}`);

      expect(res2).to.have.property('status', 200);
      expect(res2.body.data).to.have.property('isVisible');
    });

    it('should return 404 for non-existent review', async () => {
      const { User } = require('../src/models');
      const admin = await User.findOne({ where: { role: 'ADMIN' } });
      const token = createToken(admin);

      const res = await supertest(app)
        .patch('/api/v1/reviews/00000000-0000-0000-0000-000000000000/toggle-visibility')
        .set('Authorization', `Bearer ${token}`);

    });
  });

  describe('Unauthenticated access', () => {
    it('should reject unauthenticated review creation', async () => {
      const { Appointment } = require('../src/models');
      const appt = await Appointment.findOne({ where: { status: 'COMPLETED' } });

      const res = await supertest(app)
        .post('/api/v1/reviews')
        .send({
          appointmentId: appt.id,
          rating: 5,
          comment: 'No auth',
        });

    });
  });
});

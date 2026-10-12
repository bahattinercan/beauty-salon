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

describe('Appointment API', () => {
  let data;
  let customer, owner1, salon1, staff1, service1;
  let customerToken;

  before(async () => {
    await syncDB();
    data = await seedTestData();
    customer = data.users.customer;
    owner1 = data.users.owner1;
    salon1 = data.salons.salon1;
    staff1 = data.staff.staff1;
    service1 = data.services.service1;
    customerToken = createToken(customer);
  });

  after(async () => {
    await teardownDB();
  });

  describe('POST /appointments', () => {
    it('should create an appointment successfully', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const res = await supertest(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          salonId: salon1.id,
          staffId: staff1.id,
          serviceId: service1.id,
          date: tomorrowStr,
          startTime: '10:00',
          note: 'İlk randevu',
        });

      expect(res).to.equal();
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.have.property('status', 'PENDING');
      expect(res.body.data).to.have.property('customerId');
      expect(res.body.data).to.have.property('salonId');
      expect(res.body.data).to.have.property('staffId');
      expect(res.body.data).to.have.property('serviceId');
      expect(res.body.data).to.have.property('startTime', '10:00:00');
      // endTime should be startTime + duration (45 min) = 10:45
      expect(res.body.data.endTime).to.equal('10:45:00');
    });

    it('should return 404 when service does not exist', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const res = await supertest(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          salonId: salon1.id,
          staffId: staff1.id,
          serviceId: '00000000-0000-0000-0000-000000000000',
          date: tomorrowStr,
          startTime: '10:00',
        });

      expect(res).to.equal();
      expect(res.body).to.have.property('success', false);
    });

    it('should return 400 when staff does not provide the selected service', async () => {
      const { Service } = require('../src/models');
      // service2 is Manikür, staff1 (Merve) only does SacKesim and CiltBakimi
      const service2 = data.services.service2;

      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const res = await supertest(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          salonId: salon1.id,
          staffId: staff1.id,
          serviceId: service2.id,
          date: tomorrowStr,
          startTime: '10:00',
        });

      expect(res).to.equal();
      expect(res.body).to.have.property('success', false);
      expect(res.body.message).to.include('sunmuyor');
    });

    it('should return 400 when date is in the past', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const res = await supertest(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          salonId: salon1.id,
          staffId: staff1.id,
          serviceId: service1.id,
          date: yesterdayStr,
          startTime: '10:00',
        });

      expect(res).to.equal();
      expect(res.body).to.have.property('success', false);
      expect(res.body.message).to.include('Geçmiş');
    });

    it('should return 404 when salon is not active or not verified', async () => {
      const { Salon } = require('../src/models');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      // Deactivate salon
      await salon1.update({ isActive: false });

      const res = await supertest(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          salonId: salon1.id,
          staffId: staff1.id,
          serviceId: service1.id,
          date: tomorrowStr,
          startTime: '10:00',
        });

      expect(res).to.equal();
      expect(res.body).to.have.property('success', false);

      // Reactivate
      await salon1.update({ isActive: true });
    });

    it('should return 400 when time is outside salon working hours', async () => {
      const { Salon } = require('../src/models');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      // Make salon close at 10:00
      await salon1.update({
        workingHours: JSON.stringify({
          monday: { open: '09:00', close: '10:00' },
          tuesday: { open: '09:00', close: '10:00' },
          wednesday: { open: '09:00', close: '10:00' },
          thursday: { open: '09:00', close: '10:00' },
          friday: { open: '09:00', close: '10:00' },
          saturday: { open: '10:00', close: '10:00' },
          sunday: { open: '10:00', close: '10:00' },
        }),
      });

      const res = await supertest(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          salonId: salon1.id,
          staffId: staff1.id,
          serviceId: service1.id,
          date: tomorrowStr,
          startTime: '10:00',
        });

      expect(res).to.equal();
      expect(res.body).to.have.property('success', false);
      expect(res.body.message).to.include('çalışma saatleri');

      // Restore working hours
      await salon1.update({
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
    });

    it('should return 409 when there is a time conflict for the staff', async () => {
      const { Appointment } = require('../src/models');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      // Create an existing appointment that overlaps
      await Appointment.create({
        customerId: customer.id,
        salonId: salon1.id,
        staffId: staff1.id,
        serviceId: service1.id,
        date: tomorrowStr,
        startTime: '10:15:00',
        endTime: '11:00:00',
        status: 'CONFIRMED',
      });

      const res = await supertest(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          salonId: salon1.id,
          staffId: staff1.id,
          serviceId: service1.id,
          date: tomorrowStr,
          startTime: '10:00',
        });

      expect(res).to.equal();
      expect(res.body).to.have.property('success', false);
      expect(res.body.message).to.include('çakışma');

      // Clean up
      await Appointment.destroy({ where: { date: tomorrowStr, startTime: '10:15:00' } });
    });

    it('should allow non-overlapping appointments for the same staff', async () => {
      const { Appointment } = require('../src/models');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      // Create first appointment
      await Appointment.create({
        customerId: customer.id,
        salonId: salon1.id,
        staffId: staff1.id,
        serviceId: service1.id,
        date: tomorrowStr,
        startTime: '10:00:00',
        endTime: '10:45:00',
        status: 'CONFIRMED',
      });

      // Second appointment at different time should succeed
      const res = await supertest(app)
        .post('/api/v1/appointments')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          salonId: salon1.id,
          staffId: staff1.id,
          serviceId: service1.id,
          date: tomorrowStr,
          startTime: '11:00',
        });

      expect(res).to.equal();
      expect(res.body.data.startTime).to.equal('11:00:00');

      // Clean up
      await Appointment.destroy({ where: { date: tomorrowStr } });
    });
  });

  describe('GET /appointments/available-slots', () => {
    it('should return available slots for a staff member', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const res = await supertest(app)
        .get('/api/v1/appointments/available-slots')
        .set('Authorization', `Bearer ${customerToken}`)
        .query({
          salonId: salon1.id,
          staffId: staff1.id,
          serviceId: service1.id,
          date: tomorrowStr,
        });

      expect(res).to.equal();
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.be.an('array');
      expect(res.body.data[0]).to.have.property('time');
      expect(res.body.data[0]).to.have.property('available');
    });

    it('should return empty array when salon is closed on that day', async () => {
      const { Salon } = require('../src/models');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      // Set Sunday with no working hours
      await salon1.update({
        workingHours: JSON.stringify({
          sunday: {},
        }),
      });

      // Find a Sunday
      const today = new Date();
      today.setDate(today.getDate() + ((7 - today.getDay()) % 7 + 1));
      const sundayStr = today.toISOString().split('T')[0];

      const res = await supertest(app)
        .get('/api/v1/appointments/available-slots')
        .set('Authorization', `Bearer ${customerToken}`)
        .query({
          salonId: salon1.id,
          staffId: staff1.id,
          serviceId: service1.id,
          date: sundayStr,
        });

      expect(res).to.equal();
      expect(res.body.data).to.be.an('array');

      // Restore working hours
      await salon1.update({
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
    });

    it('should mark slots as unavailable when they conflict with existing appointments', async () => {
      const { Appointment } = require('../src/models');
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      // Create a 45-min appointment
      await Appointment.create({
        customerId: customer.id,
        salonId: salon1.id,
        staffId: staff1.id,
        serviceId: service1.id,
        date: tomorrowStr,
        startTime: '14:00:00',
        endTime: '14:45:00',
        status: 'CONFIRMED',
      });

      const res = await supertest(app)
        .get('/api/v1/appointments/available-slots')
        .set('Authorization', `Bearer ${customerToken}`)
        .query({
          salonId: salon1.id,
          staffId: staff1.id,
          serviceId: service1.id,
          date: tomorrowStr,
        });

      expect(res).to.equal();
      const conflictingSlot = res.body.data.find(slot => slot.time === '14:00' || slot.time === '14:30');
      if (conflictingSlot) {
        expect(conflictingSlot.available).to.be.false;
      }

      // Clean up
      await Appointment.destroy({ where: { date: tomorrowStr, startTime: '14:00:00' } });
    });
  });

  describe('GET /appointments/my', () => {
    it('should return customer\'s appointments', async () => {
      const res = await supertest(app)
        .get('/api/v1/appointments/my')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res).to.equal();
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.be.an('array');
      expect(res.body.data.length).to.be.greaterThan(0);
    });

    it('should filter appointments by status', async () => {
      const res = await supertest(app)
        .get('/api/v1/appointments/my')
        .set('Authorization', `Bearer ${customerToken}`)
        .query({ status: 'CONFIRMED' });

      expect(res).to.equal();
      expect(res.body.data).to.be.an('array');
      res.body.data.forEach(apt => {
        expect(apt.status).to.equal('CONFIRMED');
      });
    });

    it('should include salon, staff, and service details', async () => {
      const res = await supertest(app)
        .get('/api/v1/appointments/my')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res).to.equal();
      const appointment = res.body.data[0];
      expect(appointment).to.have.property('salon');
      expect(appointment.salon).to.have.property('name');
      expect(appointment).to.have.property('staff');
      expect(appointment).to.have.property('service');
    });

    it('should not allow other users to see appointments', async () => {
      const { User } = require('../src/models');
      const customer2 = await User.findOne({ where: { email: 'customer2@test.com' } });
      const customer2Token = createToken(customer2);

      const res = await supertest(app)
        .get('/api/v1/appointments/my')
        .set('Authorization', `Bearer ${customer2Token}`);

      expect(res).to.equal();
      // Should only return customer2's appointments, not customer's
      res.body.data.forEach(apt => {
        expect(apt.customerId).to.equal(customer2.id);
      });
    });
  });

  describe('GET /appointments/salon/:salonId', () => {
    it('should return salon appointments for owner', async () => {
      const { Salon } = require('../src/models');
      const salon = await Salon.findByPk(salon1.id);
      const token = createToken(salon.owner);

      const res = await supertest(app)
        .get(`/api/v1/appointments/salon/${salon1.id}`)
        .set('Authorization', `Bearer ${token}`);

      expect(res).to.equal();
      expect(res.body).to.have.property('success', true);
      expect(res.body.data).to.be.an('array');
    });

    it('should filter by date', async () => {
      const { Salon } = require('../src/models');
      const salon = await Salon.findByPk(salon1.id);
      const token = createToken(salon.owner);

      const res = await supertest(app)
        .get(`/api/v1/appointments/salon/${salon1.id}`)
        .set('Authorization', `Bearer ${token}`)
        .query({ date: new Date().toISOString().split('T')[0] });

      expect(res).to.equal();
    });

    it('should filter by status', async () => {
      const { Salon } = require('../src/models');
      const salon = await Salon.findByPk(salon1.id);
      const token = createToken(salon.owner);

      const res = await supertest(app)
        .get(`/api/v1/appointments/salon/${salon1.id}`)
        .set('Authorization', `Bearer ${token}`)
        .query({ status: 'PENDING' });

      expect(res).to.equal();
      res.body.data.forEach(apt => {
        expect(apt.status).to.equal('PENDING');
      });
    });
  });

  describe('PATCH /appointments/:id/status', () => {
    it('should transition PENDING -> CONFIRMED', async () => {
      const { Appointment, Salon } = require('../src/models');
      const appt = await Appointment.findOne({ where: { status: 'PENDING' } });
      const salon = await Salon.findByPk(appt.salonId);
      const token = createToken(salon.owner);

      const res = await supertest(app)
        .patch(`/api/v1/appointments/${appt.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'CONFIRMED' });

      expect(res).to.equal();
      expect(res.body.data.status).to.equal('CONFIRMED');
    });

    it('should transition CONFIRMED -> COMPLETED', async () => {
      const { Appointment, Salon } = require('../src/models');
      const appt = await Appointment.findOne({ where: { status: 'CONFIRMED' } });
      const salon = await Salon.findByPk(appt.salonId);
      const token = createToken(salon.owner);

      const res = await supertest(app)
        .patch(`/api/v1/appointments/${appt.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'COMPLETED' });

      expect(res).to.equal();
      expect(res.body.data.status).to.equal('COMPLETED');
    });

    it('should transition CONFIRMED -> NO_SHOW', async () => {
      const { Appointment, Salon } = require('../src/models');
      const appt = await Appointment.findOne({ where: { status: 'CONFIRMED' } });
      const salon = await Salon.findByPk(appt.salonId);
      const token = createToken(salon.owner);

      const res = await supertest(app)
        .patch(`/api/v1/appointments/${appt.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'NO_SHOW' });

      expect(res).to.equal();
      expect(res.body.data.status).to.equal('NO_SHOW');
    });

    it('should reject invalid status transitions', async () => {
      const { Appointment, Salon } = require('../src/models');
      const appt = await Appointment.findOne({ where: { status: 'PENDING' } });
      const salon = await Salon.findByPk(appt.salonId);
      const token = createToken(salon.owner);

      const res = await supertest(app)
        .patch(`/api/v1/appointments/${appt.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'COMPLETED' }); // PENDING cannot go directly to COMPLETED

      expect(res).to.equal();
      expect(res.body).to.have.property('success', false);
    });

    it('should not allow COMPLETED appointment to be modified', async () => {
      const { Appointment, Salon } = require('../src/models');
      const appt = await Appointment.findOne({ where: { status: 'COMPLETED' } });
      const salon = await Salon.findByPk(appt.salonId);
      const token = createToken(salon.owner);

      const res = await supertest(app)
        .patch(`/api/v1/appointments/${appt.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'CONFIRMED' });

      expect(res).to.equal();
    });

    it('should not allow salon owner to change another salon\'s appointment', async () => {
      const { Appointment, Salon } = require('../src/models');
      const appt = await Appointment.findOne({ where: { status: 'PENDING' } });
      const otherSalon = await Salon.findByPk(data.salons.salon2.id);
      const token = createToken(otherSalon.owner);

      const res = await supertest(app)
        .patch(`/api/v1/appointments/${appt.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'CONFIRMED' });

      expect(res).to.equal();
      expect(res.body).to.have.property('success', false);
    });

    it('should allow admin to change any appointment status', async () => {
      const { Appointment, User } = require('../src/models');
      const appt = await Appointment.findOne({ where: { status: 'PENDING' } });
      const admin = await User.findOne({ where: { role: 'ADMIN' } });
      const token = createToken(admin);

      const res = await supertest(app)
        .patch(`/api/v1/appointments/${appt.id}/status`)
        .set('Authorization', `Bearer ${token}`)
        .send({ status: 'CONFIRMED' });

      expect(res).to.equal();
      expect(res.body.data.status).to.equal('CONFIRMED');
    });
  });

  describe('PATCH /appointments/:id/cancel', () => {
    it('should cancel a customer\'s own appointment', async () => {
      const { Appointment } = require('../src/models');
      const appt = await Appointment.findOne({ where: { status: 'CONFIRMED' } });
      const token = createToken(customer);

      const res = await supertest(app)
        .patch(`/api/v1/appointments/${appt.id}/cancel`)
        .set('Authorization', `Bearer ${token}`)
        .send({ reason: 'İş toplantısı geldi' });

      expect(res).to.equal();
      expect(res.body.data.status).to.equal('CANCELLED');
      expect(res.body.data.cancellationReason).to.equal('İş toplantısı geldi');
    });

    it('should return 403 when trying to cancel another customer\'s appointment', async () => {
      const { Appointment, User } = require('../src/models');
      const appt = await Appointment.findOne({ where: { status: 'PENDING' } });
      const customer2 = await User.findOne({ where: { email: 'customer2@test.com' } });
      const token = createToken(customer2);

      const res = await supertest(app)
        .patch(`/api/v1/appointments/${appt.id}/cancel`)
        .set('Authorization', `Bearer ${token}`);

      expect(res).to.equal();
    });

    it('should return 400 for already cancelled appointment', async () => {
      const { Appointment } = require('../src/models');
      const appt = await Appointment.findOne({ where: { status: 'CANCELLED' } });
      const token = createToken(appt.customer);

      const res = await supertest(app)
        .patch(`/api/v1/appointments/${appt.id}/cancel`)
        .set('Authorization', `Bearer ${token}`);

      expect(res).to.equal();
    });

    it('should return 400 for completed appointment', async () => {
      const { Appointment } = require('../src/models');
      const appt = await Appointment.findOne({ where: { status: 'COMPLETED' } });
      const token = createToken(appt.customer);

      const res = await supertest(app)
        .patch(`/api/v1/appointments/${appt.id}/cancel`)
        .set('Authorization', `Bearer ${token}`);

      expect(res).to.equal();
    });

    it('should return 404 for non-existent appointment', async () => {
      const res = await supertest(app)
        .patch('/api/v1/appointments/00000000-0000-0000-0000-000000000000/cancel')
        .set('Authorization', `Bearer ${customerToken}`);

      expect(res).to.equal();
    });
  });

  describe('Unauthenticated appointment access', () => {
    it('should reject unauthenticated appointment creation', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const res = await supertest(app)
        .post('/api/v1/appointments')
        .send({
          salonId: salon1.id,
          staffId: staff1.id,
          serviceId: service1.id,
          date: tomorrowStr,
          startTime: '10:00',
        });

      expect(res).to.equal();
    });
  });
});

import request from 'supertest';
import app from '../../app';
import { createTestUser, getAuthToken } from '../helpers/testHelpers';

describe('Profile Controller', () => {
  describe('GET /api/users/me', () => {
    it('should get current user profile with valid token', async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user);

      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(user.email);
      expect(response.body.data.user.firstName).toBe(user.firstName);
      expect(response.body.data.user.lastName).toBe(user.lastName);
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should not get profile without token', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('token');
    });

    it('should not get profile with invalid token', async () => {
      const response = await request(app)
        .get('/api/users/me')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/users/me', () => {
    it('should update user profile with valid token', async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user);

      const updateData = {
        firstName: 'Updated',
        lastName: 'Name',
        phone: '+1234567890',
      };

      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Profile updated successfully');
      expect(response.body.data.user.firstName).toBe(updateData.firstName);
      expect(response.body.data.user.lastName).toBe(updateData.lastName);
      expect(response.body.data.user.phone).toBe(updateData.phone);
    });

    it('should not update profile without token', async () => {
      const response = await request(app)
        .put('/api/users/me')
        .send({ firstName: 'Updated' })
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    it('should validate phone format', async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user);

      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ phone: 'invalid-phone' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate firstName length', async () => {
      const user = await createTestUser();
      const token = await getAuthToken(user);

      const response = await request(app)
        .put('/api/users/me')
        .set('Authorization', `Bearer ${token}`)
        .send({ firstName: 'a'.repeat(51) }) // too long
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});


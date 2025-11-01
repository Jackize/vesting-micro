import request from 'supertest';
import app from '../../app';
import { createTestUser } from '../helpers/testHelpers';

describe('Login Controller', () => {
  describe('POST /api/users/login', () => {
    let user: any;

    beforeEach(async () => {
      user = await createTestUser({
        email: 'loginuser@example.com',
        password: 'password123',
      });
    });

    it('should login user with valid credentials', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'loginuser@example.com',
          password: 'password123',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Login successful');
      expect(response.body.data.user.email).toBe('loginuser@example.com');
      expect(response.body.data).toHaveProperty('token');
      expect(response.body.data.user).not.toHaveProperty('password');
    });

    it('should not login with invalid email', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'wrong@example.com',
          password: 'password123',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid email or password');
    });

    it('should not login with invalid password', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'loginuser@example.com',
          password: 'wrongpassword',
        })
        .expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('Invalid email or password');
    });

    it('should not login inactive user', async () => {
      user.isActive = false;
      await user.save();

      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'loginuser@example.com',
          password: 'password123',
        })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('deactivated');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'loginuser@example.com',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/users/login')
        .send({
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});


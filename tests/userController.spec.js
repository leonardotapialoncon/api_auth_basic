import request from 'supertest';
import app from '../index.js';
import db from '../dist/db/models/index.js';

describe('UserController', () => {
    beforeAll(async () => {
        await db.User.destroy({ where: {} });
        await db.User.bulkCreate([
            { name: 'John Doe', email: 'john@example.com', status: true, lastLogin: new Date('2023-07-01') },
            { name: 'Jane Doe', email: 'jane@example.com', status: true, lastLogin: new Date('2023-06-01') },
            { name: 'Deleted User', email: 'deleted@example.com', status: false, lastLogin: new Date('2023-05-01') }
        ]);
    });

    afterAll(async () => {
        await db.User.destroy({ where: {} });
    });

    describe('GET /api/v1/users/getAllUsers', () => {
        it('should return all active users', async () => {
            const response = await request(app).get('/api/v1/users/getAllUsers');
            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Array);
            expect(response.body.length).toBe(2);
        });
    });

    describe('GET /api/v1/users/findUsers', () => {
        it('should return filtered users by name', async () => {
            const response = await request(app).get('/api/v1/users/findUsers').query({ name: 'John' });
            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Array);
            expect(response.body[0].name).toBe('John Doe');
        });

        it('should return filtered users by status', async () => {
            const response = await request(app).get('/api/v1/users/findUsers').query({ deleted: 'true' });
            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Array);
            expect(response.body[0].name).toBe('Deleted User');
        });

        it('should return filtered users by last login before a date', async () => {
            const response = await request(app).get('/api/v1/users/findUsers').query({ lastLoginBefore: '2023-07-01' });
            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Array);
            expect(response.body.length).toBe(2);
        });

        it('should return filtered users by last login after a date', async () => {
            const response = await request(app).get('/api/v1/users/findUsers').query({ lastLoginAfter: '2023-06-01' });
            expect(response.status).toBe(200);
            expect(response.body).toBeInstanceOf(Array);
            expect(response.body.length).toBe(1);
        });
    });

    describe('POST /api/v1/users/bulkCreate', () => {
        it('should create multiple users', async () => {
            const users = [
                { name: 'Alice', email: 'alice@example.com', password: 'password1', password_second: 'password1', cellphone: '123456789' },
                { name: 'Bob', email: 'bob@example.com', password: 'password2', password_second: 'password2', cellphone: '987654321' }
            ];
            const response = await request(app).post('/api/v1/users/bulkCreate').send({ users });
            expect(response.status).toBe(200);
            expect(response.body.message.success).toBe(2);
            expect(response.body.message.failure).toBe(0);
        });

        it('should fail to create users with missing or invalid data', async () => {
            const users = [
                { name: 'Invalid User', email: 'invalid@example.com', password: 'password3', password_second: 'different_password', cellphone: '123456789' }
            ];
            const response = await request(app).post('/api/v1/users/bulkCreate').send({ users });
            expect(response.status).toBe(200);
            expect(response.body.message.success).toBe(0);
            expect(response.body.message.failure).toBe(1);
        });
    });
});

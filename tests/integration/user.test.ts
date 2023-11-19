import request from 'supertest';
import redisMock from 'redis-mock';

import { app } from '../../../server';
import { UserFactory } from '../configs/db/factory';

describe.only('UserController', () => {
  let agent: any;
  let createdUser: any;
  let emailQueueMock: any;
  const baseUrl = '/api/v1/users';
  let accessToken: string, refreshToken: string;

  beforeEach(async () => {
    agent = request(app);
    createdUser = await UserFactory.create({});
    const resp = await request(app)
      .post(`/api/v1/auth/login`)
      .type('json')
      .send({ email: createdUser.email, password: 'password' });
    accessToken = resp.body.accessToken;

    emailQueueMock = jest.mock('@queues/email.queue', () => {
      return {
        EmailQueue: jest.fn().mockImplementation(() => {
          return {
            addEmailToQueue: jest.fn(),
          };
        }),
      };
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('update user account', () => {
    it('respond with a success when a valid request to update account info', async () => {
      const updateData = {
        ...createdUser._doc,
        firstName: 'Alhaji',
        lastName: 'Obi',
        password: 'password',
      };

      const response = await agent
        .put(`${baseUrl}/update_account`)
        .set({
          Authorization: accessToken,
        })
        .type('json')
        .send(updateData);

      expect(response.status).toEqual(200);
    });
  });
});

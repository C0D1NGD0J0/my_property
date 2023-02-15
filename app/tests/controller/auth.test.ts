import request from 'supertest';
import { app } from '../../../server';
import { UserFactory } from '../configs/db/factory';
import redisMock from 'redis-mock';

describe('AuthController', () => {
  let agent: any;
  const baseUrl = '/api/v1/auth';

  describe('POST: signup', () => {
    beforeEach(() => {
      agent = request(app);
      jest.mock('redis', () => {
        return {
          createClient: () => {
            return redisMock.createClient();
          },
        };
      });
    });

    it('respond with a success when a valid request is made for individual signup', async () => {
      const user = (await UserFactory.getPlainUserObject()).individual;
      const response = await agent
        .post(`${baseUrl}/signup`)
        .type('json')
        .send(user);

      expect(response.status).toEqual(200);
      expect(response.body.msg).toBeDefined();
      expect(response.body.msg).toEqual(
        `Account activation email has been sent to ${user.email}`
      );
    });

    it('respond with a success when a valid request is made for business signup', async () => {
      const user = (await UserFactory.getPlainUserObject()).company;
      const response = await agent
        .post(`${baseUrl}/signup`)
        .type('json')
        .send(user);

      expect(response.status).toEqual(200);
      expect(response.body.msg).toBeDefined();
      expect(response.body.msg).toEqual(
        `Account activation email has been sent to ${user.email}`
      );
    });

    it('respond with validation error when invalid data is provided for individual signup', async () => {
      const user = (await UserFactory.getPlainUserObject()).individual;
      user.email = '';
      const response = await agent
        .post(`${baseUrl}/signup`)
        .type('json')
        .send(user);

      expect(response.status).toEqual(422);
      expect(response.body.type).toEqual('validationError');
      expect(response.body.error.data).toEqual(
        expect.arrayContaining([{ email: 'Invalid email address format' }])
      );
    });
  });

  // xdescribe('PUT: forgot password', () => {
  //   it('respond with a success message when a valid request is made', async () => {
  //     const user = await UserFactory.create();
  //     const response = await request(app)
  //       .post(`${baseUrl}/forgot_password`)
  //       .type('json')
  //       .send({ email: user.email });

  //     expect(response.status).toEqual(200);
  //     expect(response.body.success).toBeTruthy();
  //   });

  //   it('responds with error when invalid email is provided', async () => {
  //     const user = await UserFactory.getPlainUserObject();
  //     const response = await request(app)
  //       .post(`${baseUrl}/forgot_password`)
  //       .type('json')
  //       .send({ email: user.email });

  //     expect(response.status).toEqual(422);
  //     expect(response.body.type).toBeDefined();
  //     expect(response.body.type).toEqual('validationError');
  //     expect(response.body.error.data).toEqual(
  //       expect.arrayContaining([{ email: "Email doesn't exist" }])
  //     );
  //   });
  // });
});

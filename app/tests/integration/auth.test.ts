import request from 'supertest';
import { app } from '../../../server';
import { UserFactory } from '../configs/db/factory';
import redisMock from 'redis-mock';
import { EmailQueue } from '../../services/queues';

describe('AuthController', () => {
  let agent: any;
  let emailQueueMock: any;
  const baseUrl = '/api/v1/auth';

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    jest.resetAllMocks();
  });

  beforeEach(() => {
    agent = request(app);
    jest.mock('redis', () => {
      return {
        createClient: () => {
          return redisMock.createClient();
        },
      };
    });

    emailQueueMock = jest.mock('@services/queues/email.queue', () => {
      return {
        EmailQueue: jest.fn().mockImplementation(() => {
          return {
            addEmailToQueue: jest.fn(),
          };
        }),
      };
    });
  });

  describe('POST: signup', () => {
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

  describe('GET: account activation', () => {
    it('respond with a success when a valid request is made to activate account', async () => {
      const user = await UserFactory.create({}, 'individual');
      const response = await agent
        .get(`${baseUrl}/account_activation/${user.activationToken}`)
        .type('json')
        .send({});

      expect(response.status).toEqual(200);
      expect(response.body.msg).toBeDefined();
      expect(response.body.msg).toEqual(`Account activated successfully.`);
    });

    // it('respond with validation error when invalid data is provided for individual signup', async () => {
    //   const user = (await UserFactory.getPlainUserObject()).individual;
    //   user.email = '';
    //   const response = await agent
    //     .post(`${baseUrl}/signup`)
    //     .type('json')
    //     .send(user);

    //   expect(response.status).toEqual(422);
    //   expect(response.body.type).toEqual('validationError');
    //   expect(response.body.error.data).toEqual(
    //     expect.arrayContaining([{ email: 'Invalid email address format' }])
    //   );
    // });
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

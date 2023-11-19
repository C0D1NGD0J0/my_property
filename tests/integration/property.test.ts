import request from 'supertest';
import { app } from '../../../server';
import { UserFactory, PropertyFactory } from '../configs/db/factory';
import { IUserDocument } from '../../interfaces/user.interface';

jest.mock('../../services/external/geoCoder.service', () => {
  return jest.fn().mockImplementation(() => {
    return {
      ...jest.requireActual('../../services/external/geoCoder.service'),
      parseLocation: jest.fn().mockReturnValue([
        {
          latitude: 48.8698679,
          longitude: 2.3072976,
          country: 'France',
          countryCode: 'FR',
          city: 'Paris',
          zipcode: '75008',
          streetName: 'Champs-Élysées',
          streetNumber: '29',
          administrativeLevels: {
            level1long: 'Île-de-France',
            level1short: 'IDF',
            level2long: 'Paris',
            level2short: '75',
          },
          provider: 'google',
          formattedAddress: '29 champs elysée paris',
        },
      ]),
      parseCorordinates: jest.fn(),
    };
  });
});

describe('PropertyController', () => {
  let agent: any;
  let user: any;
  let accessToken: string;
  const baseUrl = '/api/v1/properties';

  beforeAll(async () => {
    agent = request(app);
    user = (await UserFactory.getUser()) as IUserDocument;
    const resp = await request(app)
      .post(`/api/v1/auth/login`)
      .type('json')
      .send({ email: user.email, password: 'password' });
    accessToken = resp.body.accessToken;
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('add new property', () => {
    it('respond with a success when a valid request to add a new property', async () => {
      const property = await PropertyFactory.getPlainPropertyObject();
      const response = await agent
        .post(`${baseUrl}/`)
        .set({
          Authorization: accessToken,
        })
        .type('json')
        .send(property);

      expect(response.status).toEqual(200);
      expect(response.body.success).toEqual(true);
      expect(response.body.data._id).toBeDefined();
    });

    it('respond with validation error when a required field is not provided', async () => {
      const property = await PropertyFactory.getPlainPropertyObject();
      property.address = '';
      const response = await agent
        .post(`${baseUrl}/`)
        .set({
          Authorization: accessToken,
        })
        .type('json')
        .send(property);

      expect(response.status).toEqual(422);
      expect(response.body.error.data).toBeDefined();
      expect(response.body.error.data).toEqual(
        expect.arrayContaining([
          { address: 'Valid property address is required' },
        ])
      );
    });
  });

  describe('get properties', () => {
    it('respond with all client properties', async () => {
      const expectedCID = user.cids[0].cid;
      const response = await agent
        .get(`${baseUrl}`)
        .set({
          Authorization: accessToken,
        })
        .type('json');

      expect(response.status).toEqual(200);
      expect(response.body.success).toEqual(true);
      expect(response.body.data.properties[0].cid).toEqual(expectedCID);
    });
  });
});

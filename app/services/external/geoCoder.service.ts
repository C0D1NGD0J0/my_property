import NodeGeocoder, { Options } from 'node-geocoder';

//process.env.GEOCODER_PROVIDER!
const opts: Options = {
  provider: 'google',
  apiKey: process.env.GOOGLE_API_KEY,
};

class GeoCoder {
  private geocoder;

  constructor() {
    this.geocoder = NodeGeocoder(opts);
  }

  parseLocation = async (location: string) => {
    try {
      return await this.geocoder.geocode(location);
    } catch (error) {
      throw error;
    }
  };

  parseCorordinates = async (lat: number, lon: number) => {
    try {
      return await this.geocoder.reverse({ lat, lon });
    } catch (error) {
      throw error;
    }
  };
}

export default GeoCoder;

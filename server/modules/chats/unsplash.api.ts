import { Injectable, ProviderScope } from '@graphql-modules/di';
import { resolve } from 'path';
import axios from 'axios';
import { trackProvider } from '@safe-api/middleware';
import { RandomPhoto } from '../../types/unsplash';

interface RandomPhotoInput {
  query: string;
  orientation: 'landscape' | 'portrait' | 'squarish';
}

@Injectable({
  scope: ProviderScope.Application,
})
export class UnsplashApi {
  baseURL = 'https://api.unsplash.com/';

  async getRandomPhoto() {
    const trackedRandomPhoto = await trackProvider(
      async ({ query, orientation }: RandomPhotoInput) => {
        const response = await axios.get<RandomPhoto>('photos/random', {
          baseURL: this.baseURL,
          headers: {
            Authorization:
              'Client-ID 4d048cfb4383b407eff92e4a2a5ec36c0a866be85e64caafa588c110efad350d',
          },
          params: {
            query,
            orientation,
          },
        });

        return response.data;
      },
      {
        provider: 'Unsplash',
        method: 'RandomPhoto',
        location: resolve(__dirname, '../logs/main'),
      }
    );

    try {
      return (await trackedRandomPhoto({
        query: 'portrait',
        orientation: 'squarish',
      })).urls.small;
    } catch (err) {
      console.error('Cannot retrieve random photo:', err);
      return null;
    }
  }
}

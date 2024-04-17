import { Injectable } from '@angular/core';
import { Loader } from '@googlemaps/js-api-loader';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private loader: Loader;

  constructor() {
    this.loader = new Loader({
      apiKey: "AIzaSyCfTqgk8Aj4-UalG3uNeHjR0xzOCaDmXvU", 
      version: "weekly",
      libraries: ["places"]
    });
  }

  getMap(): Promise<google.maps.Map> {
    return this.loader.load().then(() => {
      const mapElement = document.getElementById('map') as HTMLElement;
      if (mapElement) {
        return new google.maps.Map(mapElement, {
          center: { lat: -34.397, lng: 150.644 },
          zoom: 8,
        });
      } else {
        throw new Error('Map element not found');
      }
    }).catch(error => {
      console.error('Fehler beim Laden der Google Maps API:', error);
      throw error;
    });
  }
}
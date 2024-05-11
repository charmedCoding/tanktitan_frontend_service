import { Injectable } from '@angular/core';
import { Loader } from '@googlemaps/js-api-loader';
import { environment } from '../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private loader: Loader;
  private apiKey = environment.GMAPS_API_KEY;
  private map!: google.maps.Map;
  private geocoder!: google.maps.Geocoder;
  private placesService!: google.maps.places.PlacesService;

  constructor() {
    this.loader = new Loader({
      apiKey: this.apiKey,
      version: "weekly",
      libraries: ["places"]  // 'places' library includes Geocoding functionality
    });
  }

  async initMap(): Promise<google.maps.Map> {
    await this.loader.load();
    const mapElement = document.getElementById('map') as HTMLElement;
    if (!mapElement) {
      throw new Error('Map element not found');
    }
    this.map = new google.maps.Map(mapElement, {
      center: { lat: 48.7758, lng: 9.1829 },
      zoom: 8,
    });
    this.placesService = new google.maps.places.PlacesService(this.map);
    this.geocoder = new google.maps.Geocoder(); // Initialize the geocoder
    return this.map;
  }

  getMap(): Promise<google.maps.Map> {
    return this.loader.load().then(() => {
      const mapElement = document.getElementById('map') as HTMLElement;
      if (mapElement) {
        return new google.maps.Map(mapElement, {
          center: { lat: 48.7758, lng: 9.1829 },
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

  geocodeAddress(address: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.geocoder.geocode({ address }, (results, status) => {
        if (status === 'OK') {
          this.map.setCenter(results[0].geometry.location);
          new google.maps.Marker({
            map: this.map,
            position: results[0].geometry.location
          });
          resolve();
        } else {
          reject('Geocode war nicht erfolgreich aus folgendem Grund: ' + status);
        }
      });
    });
  }
}
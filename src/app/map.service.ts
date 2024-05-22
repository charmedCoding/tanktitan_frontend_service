import { Injectable } from '@angular/core';
import { Loader } from '@googlemaps/js-api-loader';
import { environment } from '../environments/environment';
import { GeocoderResponse } from './geocoderResponse.model';
import { HttpClient } from '@angular/common/http';  // Korrektur hier
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MapService {
  private loader: Loader;
  private apiKey = environment.GMAPS_API_KEY;
  private map!: google.maps.Map;
  private geocoder!: google.maps.Geocoder;
  private placesService!: google.maps.places.PlacesService;

  constructor(private http: HttpClient) {  // Korrektur hier
    this.loader = new Loader({
      apiKey: this.apiKey,
      version: "weekly",
      libraries: ["places"]
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
    this.geocoder = new google.maps.Geocoder();
    return this.map;
  }


  //Adresse, wenn adresse nicht vorhanden dann nehme: lat: 48.7758, lng: 9.1829
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

  geocodeLatLng(location: google.maps.LatLngLiteral): Promise<GeocoderResponse> {
    let geocoder = new google.maps.Geocoder();

    return new Promise((resolve, reject) => {
      geocoder.geocode({ location: location }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results) {
          const response = new GeocoderResponse(status, results);
          resolve(response);
        } else {
          const errorResponse = new GeocoderResponse(status, []);
          reject(errorResponse);
        }
      });
    });
  }


  geocodeAddress(address: string): Promise<{ lat: number, lng: number }> {
    let geocoder = new google.maps.Geocoder();

    return new Promise((resolve, reject) => {
      geocoder.geocode({ address: address }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
          const location = results[0].geometry.location;
          resolve({ lat: location.lat(), lng: location.lng() });
        } else {
          reject(`Geocode war nicht erfolgreich aus folgendem Grund: ${status}`);
        }
      });
    });
  }

  getLocation(term: string): Observable<GeocoderResponse> {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA&key=${environment.GMAPS_API_KEY}`;
    return this.http.get<GeocoderResponse>(url);
  }



  
}
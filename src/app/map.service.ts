import { Injectable } from '@angular/core';
import { Loader } from '@googlemaps/js-api-loader';
import { environment } from '../environments/environment';
import { GeocoderResponse } from './geocoderResponse.model';
import { HttpClient } from '@angular/common/http';
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

  constructor(private http: HttpClient) {
    this.loader = new Loader({
      apiKey: this.apiKey,
      version: "weekly",
      libraries: ["places"]
    });
  }

  async initMap(lat: number = 48.7758, lng: number = 9.1829): Promise<google.maps.Map> {
    await this.loader.load();
    const mapElement = document.getElementById('map') as HTMLElement;
    if (!mapElement) {
      throw new Error('Map element not found');
    }
    this.map = new google.maps.Map(mapElement, {
      center: { lat: lat, lng: lng },
      zoom: 15,
    });
    this.placesService = new google.maps.places.PlacesService(this.map);
    this.geocoder = new google.maps.Geocoder();
    return this.map;
  }

  async initializeGeocoder() {
    if (!this.geocoder) {
      await this.loader.load();
      this.geocoder = new google.maps.Geocoder();
    }
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

  async geocodeAddress(address: string): Promise<{ lat: number, lng: number }> {
    await this.initializeGeocoder();
    return new Promise((resolve, reject) => {
      this.geocoder.geocode({ address: address }, (results, status) => {
        if (status === google.maps.GeocoderStatus.OK && results && results[0]) {
          const location = results[0].geometry.location;
          resolve({ lat: location.lat(), lng: location.lng() });
        } else {
          reject(`Geocode war nicht erfolgreich aus folgendem Grund: ${status}`);
        }
      });
    });
  }

  setMapCenterAndZoom(lat: number, lng: number, zoom: number): void {
    if (this.map) {
      this.map.setCenter({ lat: lat, lng: lng });
      this.map.setZoom(zoom);
    }
  }

  searchNearby(location: google.maps.LatLng, radius: number): void {
    const request = {
      location: location,
      radius: radius,
      type: 'gas_station',  // Set the type to 'gas_station' to search for gas stations
    };

    this.placesService.nearbySearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        results.forEach(place => {
          if (place.geometry && place.geometry.location) {
            const marker = new google.maps.Marker({
              position: place.geometry.location,
              map: this.map,
              title: place.name
            });

            const infowindow = new google.maps.InfoWindow({
              content: `<div><strong>${place.name}</strong><br>
                        ${place.vicinity}<br>
                        Rating: ${place.rating}</div>`
            });

            marker.addListener('click', () => {
              this.map.setCenter(marker.getPosition() as google.maps.LatLng);
              this.map.setZoom(15); // Setzen Sie das gewünschte Zoom-Level
              infowindow.open(this.map, marker);
            });
          }
        });
      } else {
        console.error('Places search failed due to: ' + status);
      }
    });
  }

  addMarkers(stations: any[]): void {
    if (this.map) {
      stations.forEach(station => {
        const marker = new google.maps.Marker({
          position: { lat: station.lat, lng: station.lng },
          map: this.map,
          title: station.name
        });

        const infowindow = new google.maps.InfoWindow({
          content: `<div><strong>${station.name}</strong><br>
                    ${station.vicinity}<br>
                    Rating: ${station.rating}</div>`
        });

        marker.addListener('click', () => {
          this.map.setCenter(marker.getPosition() as google.maps.LatLng);
          this.map.setZoom(15); // Setzen Sie das gewünschte Zoom-Level
          infowindow.open(this.map, marker);
        });

        marker.setMap(this.map);
      });
    } else {
      console.error('Map not initialized');
    }
  }


  getLocation(term: string): Observable<GeocoderResponse> {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=1600+Amphitheatre+Parkway,+Mountain+View,+CA&key=${environment.GMAPS_API_KEY}`;
    return this.http.get<GeocoderResponse>(url);
  }
}
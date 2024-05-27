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
  private markers: google.maps.Marker[] = [];

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
      console.log(`Centering map to ${lat}, ${lng} with zoom ${zoom}`);
      this.map.setCenter({ lat: lat, lng: lng });
      this.map.setZoom(zoom);
    } else {
      console.error('Map instance is not initialized.');
    }
  }

  clearMarkers(): void {
    // Entferne alle vorhandenen Marker von der Karte
    this.markers.forEach(marker => marker.setMap(null));
    this.markers = [];
  }

  searchNearby(location: google.maps.LatLng, radius: number): void {
    this.clearMarkers(); // Entferne vorherige Marker

    const request = {
      location: location,
      radius: radius,
      type: 'gas_station',  
    };

    this.placesService.nearbySearch(request, (results, status) => {
      if (status === google.maps.places.PlacesServiceStatus.OK && results) {
        results.forEach(place => {
          if (place.geometry && place.geometry.location) {
            const marker = new google.maps.Marker({
              position: place.geometry.location,
              map: this.map,
              title: place.name,
              icon: {
                url: 'assets/icons8-gas-station-50 (1).png', // Pfad zu Ihrem benutzerdefinierten Icon
                scaledSize: new google.maps.Size(32, 32) // Größe des Icons anpassen
              }
            });
            this.markers.push(marker); // Füge den neuen Marker zur Liste hinzu

            const infowindow = new google.maps.InfoWindow({
              content: `<div><strong>${place.name}</strong><br>
                        Rating: ${place.rating}<br>
                        <a href="https://www.google.com/maps/dir/?api=1&destination=${place.geometry.location.lat()},${place.geometry.location.lng()}" target="_blank">Navigation</a></div>`
            });

            marker.addListener('click', () => {
              if (place.geometry && place.geometry.location) {
                const position = place.geometry.location;
                this.map.setCenter(position);
                this.map.setZoom(15);
                infowindow.open(this.map, marker);
              }
            });
          }
        });
      } else {
        console.error('Places search failed due to: ' + status);
      }
    });
  }

  addMarkers(stations: any[]): void {
    this.clearMarkers(); // Entferne vorherige Marker

    if (this.map) {
      stations.forEach(station => {
        const marker = new google.maps.Marker({
          position: { lat: station.lat, lng: station.lng },
          map: this.map,
          title: station.name,
          icon: {
            url: 'assets/icons8-gas-station-50 (1).png', 
            scaledSize: new google.maps.Size(32, 32) 
          }
        });
        this.markers.push(marker); // Füge den neuen Marker zur Liste hinzu

        const infowindow = new google.maps.InfoWindow({
          content: `<div><strong>${station.name}</strong><br>
                    Rating: ${station.rating}<br>
                    <a href="https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}" target="_blank">Navigation</a></div>`
        });

        marker.addListener('click', () => {
          const position = new google.maps.LatLng(station.lat, station.lng);
          this.map.setCenter(position);
          this.map.setZoom(15);
          infowindow.open(this.map, marker);
        });

        marker.setMap(this.map);
      });
    } else {
      console.error('Map not initialized');
    }
  }
}
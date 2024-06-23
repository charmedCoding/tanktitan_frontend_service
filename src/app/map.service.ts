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
  selectedMarker!: google.maps.Marker | null;

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

    let activeMarker: google.maps.Marker | null = null; // Verfolgen des aktiven Markers
    let activeInfoWindow: google.maps.InfoWindow | null = null; // Verfolgen des aktiven InfoWindows

    this.placesService.nearbySearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            results.forEach(place => {
                if (place.geometry && place.geometry.location) { // Überprüfen Sie, ob place.geometry und place.geometry.location nicht undefined sind
                    const marker = new google.maps.Marker({
                        position: place.geometry.location,
                        map: this.map,
                        title: place.name,
                        icon: {
                            url: 'assets/tank_titan_pin_02.png', // Ursprüngliches Icon
                            scaledSize: new google.maps.Size(32, 32) // Größe des Icons anpassen
                        }
                    });
                    this.markers.push(marker); // Füge den neuen Marker zur Liste hinzu

                    const infowindow = new google.maps.InfoWindow({
                        content: `<div><strong>${place.name}</strong><br>
                                  Rating: ${place.rating || 'N/A'}<br>
                                  <a href="https://www.google.com/maps/dir/?api=1&destination=${place.geometry.location.lat()},${place.geometry.location.lng()}" target="_blank">Navigation</a></div>`
                    });

                    marker.addListener('click', () => {
                        // Setze den vorherigen aktiven Marker auf das ursprüngliche Icon zurück und schließe das InfoWindow
                        if (activeMarker) {
                            activeMarker.setIcon({
                                url: 'assets/tank_titan_pin_02.png',
                                scaledSize: new google.maps.Size(32, 32)
                            });
                        }
                        if (activeInfoWindow) {
                            activeInfoWindow.close();
                        }

                        // Setze den aktuellen Marker als aktiv und ändere das Icon
                        activeMarker = marker;
                        activeInfoWindow = infowindow;

                        marker.setIcon({
                            url: 'assets/tank_titan_pin_04.png',
                            scaledSize: new google.maps.Size(32, 32)
                        });

                        // Öffne das neue InfoWindow und setze die Karte auf die Position des Markers
                        const position = place.geometry!.location; // place.geometry ist hier sicher nicht undefined
                        if (position) {
                            this.map.setCenter(position as google.maps.LatLng);
                            this.map.setZoom(15);
                            infowindow.open(this.map, marker);
                        }
                    });

                    marker.setMap(this.map);
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
      const addedLocations = new Set<string>(); // Set, um hinzugefügte Standorte zu verfolgen
      const tolerance = 0.0001; // Toleranz für Positionsgenauigkeit
      let activeMarker: google.maps.Marker | null = null; // Verfolgen des aktiven Markers
      let activeInfoWindow: google.maps.InfoWindow | null = null; // Verfolgen des aktiven InfoWindows

      stations.forEach(station => {
          const isDuplicate = Array.from(addedLocations).some(key => {
              const [lat, lng] = key.split('-').map(Number);
              return Math.abs(lat - station.lat) < tolerance && Math.abs(lng - station.lng) < tolerance;
          });

          if (!isDuplicate) {
              const locationKey = `${station.lat}-${station.lng}`; // Einzigartiger Schlüssel für jeden Standort
              addedLocations.add(locationKey); // Standort als hinzugefügt markieren

              const marker = new google.maps.Marker({
                  position: { lat: station.lat, lng: station.lng },
                  map: this.map,
                  title: station.name,
                  icon: {
                      url: 'assets/tank_titan_pin_02.png',
                      scaledSize: new google.maps.Size(50, 50)
                  }
              });
              this.markers.push(marker); // Füge den neuen Marker zur Liste hinzu

              const infowindow = new google.maps.InfoWindow({
                  content: `<div><strong>${station.name}</strong><br>
                            Rating: ${station.rating || 'N/A'}<br>
                            <a href="https://www.google.com/maps/dir/?api=1&destination=${station.lat},${station.lng}" target="_blank">Navigation</a></div>`
              });

              marker.addListener('click', () => {
                  // Setze den vorherigen aktiven Marker auf das ursprüngliche Icon zurück und schließe das InfoWindow
                  if (activeMarker) {
                      activeMarker.setIcon({
                          url: 'assets/tank_titan_pin_03.png',
                          scaledSize: new google.maps.Size(50, 50)
                      });
                  }
                  if (activeInfoWindow) {
                      activeInfoWindow.close();
                  }

                  // Setze den aktuellen Marker als aktiv und ändere das Icon
                  activeMarker = marker;
                  activeInfoWindow = infowindow;

                  marker.setIcon({
                      url: 'assets/tank_titan_pin_04.png',
                      scaledSize: new google.maps.Size(50, 50)
                  });

                  // Öffne das neue InfoWindow und setze die Karte auf die Position des Markers
                  const position = new google.maps.LatLng(station.lat, station.lng);
                  this.map.setCenter(position);
                  this.map.setZoom(15);
                  infowindow.open(this.map, marker);
              });

              marker.setMap(this.map);
          }
      });
  } else {
      console.error('Map not initialized');
  }
}
}
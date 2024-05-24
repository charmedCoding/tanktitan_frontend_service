import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http'; 
import { MapService } from './map.service';
import { Geolocation } from '@capacitor/geolocation';



@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule, 
    RouterOutlet
  ],
  providers: [MapService],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  
  title = 'tanktitan';
  public stations: any[] = []; 
  public maps: any[] = [];
  service: any;

  constructor(private http: HttpClient, private mapService: MapService) {}

  ngOnInit() {
    // this.loadAndDisplayStations();
    this.loadAndDisplayMaps();
  }

  loadAndDisplayStations(lat: number, lng: number): void {
    this.http.get<any>(`http://localhost:8081/api/stations?lat=${lat}&lng=${lng}&rad=200&sort=dist&type=diesel`).subscribe({
      next: (response) => {
        this.stations = response;
        this.addStationMarkers();
      },
      error: (error) => {
        console.error('Fehler beim Laden der Tankstellendaten:', error);
      }
    });
  }

  async initMap(): Promise<void> {
    try {
      await this.mapService.initMap();
      console.log('Google Map geladen und angezeigt');
    } catch (error) {
      console.error('Fehler beim Laden der Google Map:', error);
    }
  }
  

  loadAndDisplayMaps(): void {
    this.mapService.getMap().then(map => {
     
      console.log('Google Map geladen und angezeigt');
     
      
    }).catch(error => {
      console.error('Fehler beim Laden der Google Map:', error);
    });

  }

  async searchPlaces(query: string): Promise<google.maps.places.PlaceResult[]> {
    if (!this.service) {
      throw new Error('PlacesService not initialized.');
    }
    return new Promise((resolve, reject) => {
      this.service.findPlaceFromQuery({
        query,
        fields: ['name', 'geometry']
      }, (results: google.maps.places.PlaceResult[] | PromiseLike<google.maps.places.PlaceResult[]>, status: string) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          resolve(results);
        } else {
          reject(new Error('No results found or error with status: ' + status));
        }
      });
    });
    console.log("Hallooooo")
  }

  
  addStationMarkers(): void {
    if (this.stations.length && this.mapService) {
      this.mapService.addMarkers(this.stations);
    } else {
      console.error('Keine Tankstelleninformationen verfügbar oder MapService nicht initialisiert');
    }
  }

  async geocode(address: string) {
    try {
      const location = await this.mapService.geocodeAddress(address);
      await this.mapService.initMap(location.lat, location.lng);
      this.mapService.searchNearby({ lat: location.lat, lng: location.lng } as unknown as google.maps.LatLng, 1000);
      this.loadAndDisplayStations(location.lat, location.lng);
    } catch (error) {
      console.error("Fehler bei der Geocodierung:", error);
    }
  }

  async locateMe() {
    try {
      const coordinates = await Geolocation.getCurrentPosition();
      const lat = coordinates.coords.latitude;
      const lng = coordinates.coords.longitude;
      console.log(`Geolocation: ${lat}, ${lng}`);
      await this.mapService.initMap(lat, lng); 
      this.mapService.setMapCenterAndZoom(lat, lng, 15);
      this.loadAndDisplayStations(lat, lng); 
    } catch (error) {
      console.error('Error getting location', error);
    }
  }

  panToStation(station: any) {
    this.mapService.setMapCenterAndZoom(station.lat, station.lng, 15);
  }
}

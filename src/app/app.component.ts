import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http'; // Importieren Sie HttpClientModule
import { MapService } from './map.service';


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule, // Fügen Sie HttpClientModule zu den Imports hinzu
    RouterOutlet
  ],
  providers: [MapService],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  
  title = 'tanktitan';
  public stations: any[] = []; // Anpassung auf den spezifischen Typ, wenn möglich
  public maps: any[] = [];
  service: any;

  constructor(private http: HttpClient, private mapService: MapService) {}

  ngOnInit() {
    this.loadAndDisplayStations();
    this.loadAndDisplayMaps();
  }

  loadAndDisplayStations(): void {
    this.http.get<any>("http://localhost:8081/api/stations?lat=48.7758&lng=9.1829&rad=200&sort=dist&type=diesel").subscribe({
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
     
      // Hier kannst du weitere Aktionen mit der Karte durchführen, wie Marker hinzufügen usw.
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
      this.loadAndDisplayStations();
    } catch (error) {
      console.error("Fehler bei der Geocodierung:", error);
    }
  }
}

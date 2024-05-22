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
  
  title = 'tanktitan_frontend_service';
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
        this.stations = response; // Hier ist die Korrektur
        console.log(this.stations);
      },
      error: (error) => {
        console.error('Fehler beim Laden der Tankstellendaten:', error);
      }
    });
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

  async geocode(adresse : string) {
    try {
      // const telekomLETest = await this.mapService.geocodeLatLng({ lat: 52.5200, lng:  13.4050 });
      const telekomAdress = await this.mapService.geocodeAddress(adresse)
      // console.log("Hallo", telekomLETest);
      console.log(telekomAdress);
      
    } catch (error) {
      console.error("Fehler bei der Geocodierung:", error);
    }
    console.log(adresse)
  }

}

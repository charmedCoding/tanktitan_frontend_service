import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http'; 
import { MapService } from './map.service';
import { Geolocation } from '@capacitor/geolocation';
import {Message} from 'primeng/api';
import { MessagesModule } from 'primeng/messages';
import { TooltipModule } from 'primeng/tooltip';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule, 
    RouterOutlet,
    MessagesModule,
    TooltipModule
  ],
  providers: [MapService],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  // @ViewChild('submitButton', { static: true }) submitButton!: ElementRef<HTMLButtonElement>;
  @ViewChild('fuelType') fuelType!: ElementRef<HTMLSelectElement>;
  @ViewChild('radius') radius!: ElementRef<HTMLSelectElement>;
  @ViewChild('sort') sort!: ElementRef<HTMLSelectElement>;
  title = 'tanktitan';
  fuel: string = 'diesel';
  rad: string = '5';
  sortBy:string = 'price';
  messages1: Message[] = [];
  input: any = 'Stuttgart';

  public stations: any[] = []; 
  public maps: any[] = [];
  service: any;

  constructor(private http: HttpClient, private mapService: MapService) {}

  public ngOnInit() {
    this.loadAndDisplayMaps();
    // this.loadAndDisplayStations(48.7758, 9.1829);
     // Stuttgart coordinates
  }

  loadAndDisplayStations(lat: number, lng: number): void {
   
    console.log(this.fuel)
    console.log(this.sortBy)
    console.log(this.rad)
    this.http.get<any>(`http://localhost:8081/api/stations?lat=${lat}&lng=${lng}&rad=${this.rad}&sort=${this.sortBy}&type=${this.fuel}`).subscribe({
      next: (response) => {
        console.log('Stations response:', response);
        if (response.length === 0){
          this.messages1 = [{severity: 'warn', summary: 'No gas stations in this area.', detail: "Please make sure you selected a city inside Germany. If there are still no stations try expanding the radius."}]
        }
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
      // HARD CODED NEEDS TO BE CHANGED!
      this.loadAndDisplayStations(lat, lng ); 
    } catch (error) {
      console.error('Error getting location', error);
    }
  }

  panToStation(station: any) {
    console.log('Station:', station);
    if (station.lat && station.lng) {
      console.log(`Panning to station at ${station.lat}, ${station.lng}`);
      this.mapService.setMapCenterAndZoom(station.lat, station.lng, 15);
    } else {
      console.error('Koordinaten nicht gefunden für die Station:', station);
    }
  }

  setInput(input: any): void {
    this.input = input;
    
  }
  onSelectFuel(): void {
  
    this.fuel = this.fuelType.nativeElement.value;
    this.geocode(this.input)
    
  }
  onSelectRadius(): void {
  
    this.rad = this.radius.nativeElement.value;
    this.geocode(this.input)
  }
  onSelectSort(): void {
  
    this.sortBy = this.sort.nativeElement.value;
    this.geocode(this.input)
    
  }
}




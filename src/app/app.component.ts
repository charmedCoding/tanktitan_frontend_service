import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http'; // Importieren Sie HttpClientModule


@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    HttpClientModule, // Fügen Sie HttpClientModule zu den Imports hinzu
    RouterOutlet
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  
  title = 'tanktitan_frontend_service';
  public stations: any[] = []; // Anpassung auf den spezifischen Typ, wenn möglich

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadAndDisplayStations();
  }

  loadAndDisplayStations(): void {
    this.http.get<any>("http://localhost:8081/api/stations").subscribe({
      next: (response) => {
        // Stellen Sie sicher, dass Sie nur das 'stations'-Array aus der Antwort extrahieren und zuweisen.
        this.stations = response.stations; // Hier ist die Korrektur
        console.log(this.stations);
      },
      error: (error) => {
        console.error('Fehler beim Laden der Tankstellendaten:', error);
      }
    });
  }
}

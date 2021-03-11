import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  url = "http://localhost:3000/";
  constructor(private http: HttpClient) {}
  getShipmentWithID(track_id: string) {
    return this.http.get(this.url + 'shipment/' + track_id);

  }
}

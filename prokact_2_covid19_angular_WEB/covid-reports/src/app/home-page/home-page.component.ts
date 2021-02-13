import { Component, OnInit } from '@angular/core';
import { ServiceService } from '../service.service';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.css']
})
export class HomePageComponent implements OnInit {
  UpdateDate: string;
  Source: string;
  Confirmed: number;
  NewConfirmed: number;
  Recovered: number;
  Hospitalized: number;
  Deaths: number;

  constructor(private api: ServiceService) {}

  ngOnInit(): void {
    this.api.getCovidStat().subscribe((response) => {
      console.log(response);
      this.UpdateDate =response['UpdateDate'];
      this.Source = response['Source'];
      this.Confirmed = this.numberWithCommas(response['Confirmed']);
      this.NewConfirmed = this.numberWithCommas(response['NewConfirmed']);
      this.Recovered = this.numberWithCommas(response['Recovered']);
      this.Hospitalized = this.numberWithCommas(response['Hospitalized']);
      this.Deaths = this.numberWithCommas(response['Deaths']);

      }
    );
    
  }
  numberWithCommas(x) {
            return x.toString().replace(/\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g, ",");
  }
  refreshPAGE() {
    window.location.reload();
  }

}

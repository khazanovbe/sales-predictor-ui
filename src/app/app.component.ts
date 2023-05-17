import { HttpClient } from '@angular/common/http';
import { Component, Inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { TuiDay } from '@taiga-ui/cdk';
import { TUI_MONTHS, TuiPoint } from '@taiga-ui/core';
import { start } from 'repl';
import { BehaviorSubject, Observable } from 'rxjs';

interface IForecast {
    Date: string;
    Actual: number | null;
    Forecast: number | null;
}

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.less']
})
export class AppComponent {
    tickersWithCategory={};
	selectedTicker = new FormControl();
    category = new FormControl();
    startDate = new FormControl(new TuiDay(2021,1,1));
    countOfMonth = new FormControl(1);
    desiredIncome= new FormControl(12);
    tickers:string[]=[];
    showLoader=false;
    expectedIncome:number=0;
    toBuy:boolean = false;
    toSell:boolean = false;

    categories :string[]=[];

    results:IForecast[] = [];
    actual:IForecast[] = [];
    predicted:IForecast[] = [];
    tuiIconCheck = 'tuiIconCheck';
    tuiIconClose = 'tuiIconClose';

	constructor(private http: HttpClient){
        this.http.get('/api/get-tickers').subscribe((tickers)=>{
            this.tickers=Object.keys(tickers);
            this.tickersWithCategory = tickers;
            // @ts-ignore
            this.categories = Array.from(new Set(Object.values(tickers)));
        });
        this.selectedTicker.valueChanges.subscribe((ticker)=>{
           this.onSubmit(ticker);
        });
        this.category.valueChanges.subscribe((category:string)=>{
            if(this.categories){
                // @ts-ignore
                this.tickers = Object.keys(this.tickersWithCategory).filter(ticker=>this.tickersWithCategory[ticker]===category);
            }
        });
	}
	
	onRefresh($event: MouseEvent) {
        this.onSubmit(this.selectedTicker.value);
	}

    onSubmit(ticker:string) {
        this.showLoader=true;
        const date:TuiDay = this.startDate.value;
        const parsedDate = {year:date.year,month:'',day:'',};
        if (date.day < 10) {
            parsedDate.day = '0' + date.day;
        }
        else{
            parsedDate.day = date.day.toString();
        }
        
        if (date.month+1 < 10) {
            parsedDate.month = `0${date.month+1}`;
        }
        else{
            parsedDate.month = (date.month+1).toString();
        }
        const dateString = `${parsedDate.year}-${parsedDate.month}-${parsedDate.day}`;

        this.http.post<IForecast[]>('/api/evaluate',{
            ticker:ticker,
            start_date:dateString,
            n_forecast:this.countOfMonth.value*30
        }).subscribe(results=>{
            this.showLoader=false;
            this.results = results;
            const actual:IForecast[] = results.filter(day=>day.Actual);
            const predicted = results.filter(day=>day.Forecast);
            this.chartOptions.next(
                {
                    ...this.chartOptions.value,
                    data: [{
                        type: "line",
                        showInLegend: true,
                        name: "Actual price",
                        xValueFormatString: "MMM DD, YYYY",
                        //@ts-ignore
                        dataPoints: actual.map(day=>({x:new Date(day.Date), y:day.Actual}))
                      }, {
                        type: "line",
                        showInLegend: true,
                        name: "Predicted price",
                        xValueFormatString: "MMM DD, YYYY",
                        //@ts-ignore
                        dataPoints: predicted.map(day=>({x:new Date(day.Date), y:day.Forecast})),
                        markerSize:0
                      }]
                }
            );
            this.calculateIncome(actual[actual.length-1].Actual??0,predicted[predicted.length-1].Forecast??0);
        });
    }

    calculateIncome(startPrice:number,endPrice:number){
        this.expectedIncome = (endPrice-startPrice)/startPrice*100;
        if(this.expectedIncome>=this.desiredIncome.value){
            this.toBuy=true;
            this.toSell=false;
        }
        else{
            this.toBuy=false;
            this.toSell=true;
        }
    }

    chart: any;
	
	chartOptions = new BehaviorSubject({
	  animationEnabled: true,
	  theme: "light2",
	  title:{
		text: "Actual and Forecast price"
	  },
	  axisX:{
		valueFormatString: "D MMM"
	  },
	  axisY: {
		title: "Price"
	  },
	  toolTip: {
		shared: true
	  },
	  legend: {
		cursor: "pointer",
		itemclick: function (e: any) {
			if (typeof (e.dataSeries.visible) === "undefined" || e.dataSeries.visible) {
				e.dataSeries.visible = false;
			} else {
				e.dataSeries.visible = true;
			} 
			e.chart.render();
		}
	  },
	  data: [{
		type: "line",
		showInLegend: true,
		name: "Actual price",
		xValueFormatString: "MMM DD, YYYY",
		dataPoints: [],
        dotted: false
	  }, {
		type: "line",
		showInLegend: true,
		name: "Predicted price",
		xValueFormatString: "MMM DD, YYYY",
		dataPoints: [],
        dotted: false
	  }]
	});	
}

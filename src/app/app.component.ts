import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, Inject, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { TuiDay } from '@taiga-ui/cdk';
import { TUI_MONTHS, TuiPoint } from '@taiga-ui/core';
import { start } from 'repl';
import { BehaviorSubject, Observable, from, map, mergeMap, of } from 'rxjs';
import { CanvasJSChart } from 'src/assets/canvasjs.angular.component';

export interface IChartData {
    type?:               string;
    showInLegend?:       boolean;
    name?:               string;
    xValueFormatString?: string;
    dataPoints?:         DataPoint[];
    markerSize?:         number;
}

export interface DataPoint {
    x?: Date;
    y?: number;
}

export interface IChartConfig {
    animationEnabled?: boolean;
    theme?:            string;
    title?:            Title;
    axisX?:            AxisX;
    axisY?:            AxisY;
    toolTip?:          ToolTip;
    legend?:           Legend;
    data?:             IChartData[];
}

export interface AxisX {
    valueFormatString?: string;
}

export interface AxisY {
    title?: string;
}

export interface Legend {
    cursor?: string;
    itemclick?:Function;
}

export interface Title {
    text?: string;
}

export interface ToolTip {
    shared?: boolean;
}

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
    @ViewChild(CanvasJSChart) chartComponent!:CanvasJSChart;
    tickersWithCategory={};
	selectedTicker = new FormControl([]);
    category = new FormControl();
    startDate = new FormControl(new TuiDay(2021,1,1));
    countOfMonth = new FormControl(1);
    desiredIncome= new FormControl(12);
    tickers:string[]=[];
    showLoader=false;
    expectedIncome:object={};
    toBuy:string[] = [];
    toSell:string[] = [];

    categories :string[]=[];

    results:object = {};
    actual:IForecast[] = [];
    predicted:IForecast[] = [];
    tuiIconCheck = 'tuiIconCheck';
    tuiIconClose = 'tuiIconClose';

    get maxIncome():any{
        const income = Math.max(...Object.values(this.expectedIncome));
        if(income<0){
            return 0;
        }
        // @ts-ignore
        const ticker = Object.keys(this.expectedIncome).find(ticker=>this.expectedIncome[ticker]===income);
        return {income:income,ticker:ticker};
    }

    incomeByTicker(ticker:string):number{
        //@ts-ignore
        return this.expectedIncome[ticker];
    }

	constructor(private http: HttpClient,private cd: ChangeDetectorRef){
        this.http.get('/api/get-tickers').subscribe((tickers)=>{
            this.tickers=Object.keys(tickers);
            this.tickersWithCategory = tickers;
            // @ts-ignore
            this.categories = Array.from(new Set(Object.values(tickers)));
        });
        this.category.valueChanges.subscribe((category:string)=>{
            if(this.categories){
                // @ts-ignore
                this.tickers = Object.keys(this.tickersWithCategory).filter(ticker=>this.tickersWithCategory[ticker]===category);
            }
        });
	}
	
	onRefresh($event: MouseEvent) {
        this.onSubmit();
	}

    onSubmit() {
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

        this.chartOptions.value.data = [];
        from(this.selectedTicker.value).pipe(
            // @ts-ignore
            mergeMap((ticker:string)=>{
                return this.http.post<IForecast[]>('/api/evaluate',{
                    ticker:ticker,
                    start_date:dateString,
                    n_forecast:this.countOfMonth.value*30
                }).pipe(
                    map(results=>{
                        this.showLoader=false;
                        // @ts-ignore
                        this.results[ticker] = results;
                        const actual:IForecast[] = results.filter(day=>day.Actual);
                        const predicted:IForecast[] = results.filter(day=>day.Forecast);

                        this.chartOptions.next(
                            {
                                ...this.chartOptions.value,
                                data: [
                                    //@ts-ignore
                                    ...this.chartOptions.value.data,
                                    {
                                    type: "line",
                                    showInLegend: true,
                                    name: `Actual price of ${ticker}`,
                                    xValueFormatString: "MMM DD, YYYY",
                                    dataPoints: actual.map(day=>({x:new Date(day.Date), y:day.Actual}))
                                  }, 
                                    {
                                    type: "line",
                                    showInLegend: true,
                                    name: `Predicted price of ${ticker}`,
                                    xValueFormatString: "MMM DD, YYYY",
                                    dataPoints: predicted.map(day=>({x:new Date(day.Date), y:day.Forecast})),
                                    markerSize:0
                                  }]
                            }
                        );
                        this.calculateIncome(ticker,actual[actual.length-1].Actual??0,predicted[predicted.length-1].Forecast??0);
                        this.chartComponent.detectChanges();
                    })
                );
            })
        ).subscribe();
    }

    calculateIncome(ticker:string,startPrice:number,endPrice:number){
        const income = (endPrice-startPrice)/startPrice*100;
        // @ts-ignore
        this.expectedIncome[ticker] = income;
        if(income>=this.desiredIncome.value){
            this.toBuy.push(ticker);
        }
        else{
            this.toSell.push(ticker);
        }
    }

    chart: any;
	
	chartOptions = new BehaviorSubject<IChartConfig>({
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
	  data: []
	});	
}

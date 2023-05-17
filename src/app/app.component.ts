import { HttpClient } from '@angular/common/http';
import { AfterViewInit, Component, Inject, ViewChild } from '@angular/core';
import { FormControl } from '@angular/forms';
import { TuiLineDaysChartComponent } from '@taiga-ui/addon-charts';
import { TUI_DATE_FORMAT, TUI_DATE_SEPARATOR, TUI_DEFAULT_STRINGIFY, TuiContextWithImplicit, TuiDay, TuiDayLike, TuiDayRange, TuiMapper, TuiMonth, TuiStringHandler, TuiYear, tuiPure } from '@taiga-ui/cdk';
import { TUI_MONTHS, TuiPoint } from '@taiga-ui/core';
import { Observable, map, of, range } from 'rxjs';

interface IForecast {
    Date: string;
    Actual: number | null;
    Forecast: number | null;
}
enum Months {
    'January','February','March','April','May','June','July','August','September','October','November','December'
}

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.less'],
    providers: [{provide: TUI_DATE_FORMAT, useValue: 'YMD'},{provide: TUI_DATE_SEPARATOR, useValue: '-'},]
})
export class AppComponent implements AfterViewInit {
    @ViewChild(TuiLineDaysChartComponent) chart!: TuiLineDaysChartComponent;
	selectedTicker = new FormControl();
    startDate = new FormControl(new TuiDay(2021,1,1));
    countOfMonth = new FormControl(1);
    tickers:string[]=[];
    showLoader=false;

    results:IForecast[] = [];
    actual:IForecast[] = [];
    predicted:IForecast[] = [];

	range = new TuiDayRange(
        TuiDay.currentLocal(),
        TuiDay.currentLocal().append({year: 1}),
    );
 
    readonly maxLength: TuiDayLike = {year: 1};

	readonly yStringify: TuiStringHandler<number> = y =>{
        return `${(10 * y).toLocaleString('en-US', {maximumFractionDigits: 0})} $`
    };

	readonly xStringify: TuiStringHandler<TuiDay> = (date:TuiDay)=>{
        return `${Months[date.month]}, ${date.day}`;
    };

	get actualValues(): [TuiDay, number][] {
        const actual = this.computeValue(this.actual);
        const predicted = this.computeValue(this.predicted);
        return actual.concat([...predicted].map(value=>[value[0],0]));
    }
    get predictedValues(): [TuiDay, number][] {
        const actual = this.computeValue(this.actual);
        const predictedValues = this.computeValue(this.predicted);
        const actualZeros:[TuiDay, number][] = actual.map(v=>[v[0],0])
        const predicted:[TuiDay, number][] = actualZeros.concat(predictedValues);
        return predicted;
    }

    get charts(): ReadonlyArray<ReadonlyArray<[TuiDay, number]>>{
        const actualZeros:[TuiDay, number][] = this.actualValues.map(v=>[v[0],0])
        const predicted:[TuiDay, number][] = actualZeros.concat(this.predictedValues);
        return [
            this.actualValues.concat([...this.predictedValues].map(value=>[value[0],0])),
            predicted
    ];
    }

    get minPrice():number{
        const prices = this.results.map(day=>{
            if(day.Actual){
                return day.Actual;
            }
            else if(day.Forecast){
                return day.Forecast;
            }
            return 0;
        });

        return Math.min(...prices);
    }

	constructor(@Inject(TUI_MONTHS) private readonly months$: Observable<readonly string[]>,private http: HttpClient){
        this.http.get('/api/get-tickers').subscribe((tickers)=>{
            this.tickers=Object.keys(tickers);
        });
        this.selectedTicker.valueChanges.subscribe((ticker)=>{
           this.onSubmit(ticker);
        });
	}

    ngAfterViewInit(): void {
    }
	
	@tuiPure
    computeLabels$({from, to}: TuiDayRange): Observable<readonly string[]> {
        const length = TuiDay.lengthBetween(from, to);

        if( length>365 ){
            return of(Array.from(
                {length: TuiYear.lengthBetween(from, to)-1},
                (_, i) => from.append({year: i}).year,
            ).map(v=>v.toString()));
        }
        return this.months$.pipe(
            map(months =>
                Array.from(
                    {length: TuiMonth.lengthBetween(from, to) - 1},
                    (_, i) => months[from.append({month: i}).month],
                ),
            ),
        );
    }
 
    @tuiPure
    private computeValue(data:IForecast[]): [TuiDay, number][] {
        const prevDate = null;
        const prevPrice = 0;
        const results = data.map<[TuiDay, number]>((day:IForecast) =>{
            const date = new Date(day.Date);
            let price;
            if(day.Actual){
                price = day.Actual;
            }
            else if(day.Forecast){
                price = day.Forecast;
            }
            else{
                price = 0;
            }
            const tuiDate = new TuiDay(date.getFullYear(), date.getMonth(),date.getDate());

            return [
                new TuiDay(date.getFullYear(), date.getMonth(),date.getDate()),
                Math.round(price)
            ];
        });
                
        return results;
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
            this.actual = results.filter(day=>day.Actual);
            this.predicted = results.filter(day=>day.Forecast);
            this.range = new TuiDayRange(
                this.startDate.value,
                TuiDay.currentLocal().append({month: this.countOfMonth.value}),
            );
        });
    }
}

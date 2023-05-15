import { HttpClient } from '@angular/common/http';
import { Component, Inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { TUI_DATE_FORMAT, TUI_DATE_SEPARATOR, TUI_DEFAULT_STRINGIFY, TuiContextWithImplicit, TuiDay, TuiDayLike, TuiDayRange, TuiMonth, TuiStringHandler, tuiPure } from '@taiga-ui/cdk';
import { TUI_MONTHS, TuiPoint } from '@taiga-ui/core';
import { Observable, map } from 'rxjs';

interface IForecast {
    Date: string;
    Actual: number | null;
    Forecast: number | null;
}

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.less'],
    providers: [{provide: TUI_DATE_FORMAT, useValue: 'YMD'},{provide: TUI_DATE_SEPARATOR, useValue: '-'},]
})
export class AppComponent {
	selectedTicker = new FormControl();
    startDate = new FormControl(new TuiDay(2021,1,1));
    countOfMonth = new FormControl(0);
    tickers:string[]=[];

    results:IForecast[] = [];

	range = new TuiDayRange(
        TuiDay.currentLocal(),
        TuiDay.currentLocal().append({year: 1}),
    );
 
    readonly maxLength: TuiDayLike = {year: 5};

	readonly yStringify: TuiStringHandler<number> = y =>
        `${(10 * y).toLocaleString('en-US', {maximumFractionDigits: 0})} $`;

	readonly xStringify$: Observable<TuiStringHandler<TuiDay>> = this.months$.pipe(
		map(
			months =>
				({month, day}) =>
					`${months[month]}, ${day}`,
		),
	);

	get actual(): ReadonlyArray<[TuiDay, number]> {
        return this.computeValue(this.results.filter(day=>day.Actual));
    }
    get predicted(): ReadonlyArray<[TuiDay, number]> {
        return this.computeValue(this.results.filter(day=>day.Forecast));
    }

	constructor(@Inject(TUI_MONTHS) private readonly months$: Observable<readonly string[]>,private http: HttpClient){
        this.http.get('/api/get-tickers').subscribe((tickers)=>{
            this.tickers=Object.keys(tickers);
        });
        this.selectedTicker.valueChanges.subscribe((ticker)=>{
           this.onSubmit(ticker);
        });
	}
	
	@tuiPure
    computeLabels$({from, to}: TuiDayRange): Observable<readonly string[]> {
        return this.months$.pipe(
            map(months =>
                Array.from(
                    {length: TuiMonth.lengthBetween(from, to) + 1},
                    (_, i) => months[from.append({month: i}).month],
                ),
            ),
        );
    }
 
    @tuiPure
    private computeValue(data:IForecast[]): ReadonlyArray<[TuiDay, number]> {
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

            console.log(date.getFullYear(), date.getMonth(),date.getDate());
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
            this.results = results;
            this.range = new TuiDayRange(
                this.startDate.value,
                TuiDay.currentLocal().append({month: this.countOfMonth.value}),
            );
        });
    }
}

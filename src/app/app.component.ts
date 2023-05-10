import { Component, Inject } from '@angular/core';
import { FormControl } from '@angular/forms';
import { TUI_DEFAULT_STRINGIFY, TuiContextWithImplicit, TuiDay, TuiDayLike, TuiDayRange, TuiMonth, TuiStringHandler, tuiPure } from '@taiga-ui/cdk';
import { TUI_MONTHS, TuiPoint } from '@taiga-ui/core';
import { Observable, map } from 'rxjs';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.less']
})
export class AppComponent {
	selectedTicket = new FormControl();
	items = [
		'AAPL',
		'GGLE',
		'GOOGLE',
		'TSL',
	];


	range = new TuiDayRange(
        TuiDay.currentLocal(),
        TuiDay.currentLocal().append({year: 1}),
    );
 
    readonly maxLength: TuiDayLike = {month: 12};

	readonly yStringify: TuiStringHandler<number> = y =>
        `${(10 * y).toLocaleString('en-US', {maximumFractionDigits: 0})} $`;

	readonly xStringify$: Observable<TuiStringHandler<TuiDay>> = this.months$.pipe(
		map(
			months =>
				({month, day}) =>
					`${months[month]}, ${day}`,
		),
	);

	get value(): ReadonlyArray<[TuiDay, number]> {
        return this.computeValue(this.range);
    }

	constructor(@Inject(TUI_MONTHS) private readonly months$: Observable<readonly string[]>,){

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
    private computeValue({from, to}: TuiDayRange): ReadonlyArray<[TuiDay, number]> {
        return new Array(TuiDay.lengthBetween(from, to) + 1)
            .fill(0)
            .reduce<ReadonlyArray<[TuiDay, number]>>(
                (array, _, i) => [
                    ...array,
                    [
                        from.append({day: i}),
                        (i ? array[i - 1][1] : 100) + Math.random() * 10 - 5,
                    ],
                ],
                [],
            );
    }

	onRefresh($event: MouseEvent) {
	}
}

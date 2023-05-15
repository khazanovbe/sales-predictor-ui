import { NgDompurifySanitizer } from "@tinkoff/ng-dompurify";
import { TuiRootModule, TuiDialogModule, TuiAlertModule, TUI_SANITIZER, TuiDataListModule, TuiButtonModule } from "@taiga-ui/core";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import {TuiDataListWrapperModule, TuiInputDateModule, TuiInputDateRangeModule, TuiInputNumberModule, TuiSelectModule} from '@taiga-ui/kit';
import {TuiAxesModule, TuiLineChartModule, TuiLineDaysChartModule} from '@taiga-ui/addon-charts';
import {ScrollingModule} from "@angular/cdk/scrolling";
import {HttpClientModule} from '@angular/common/http';
@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    TuiRootModule,
    TuiDialogModule,
    TuiAlertModule,
    FormsModule,
    ReactiveFormsModule,
    TuiDataListModule,
    TuiDataListWrapperModule,
    TuiSelectModule,
    TuiLineChartModule,
    TuiAxesModule,
    TuiInputDateRangeModule,
    TuiLineDaysChartModule,
    TuiButtonModule,
    ScrollingModule,
    HttpClientModule,
    TuiInputDateModule,
    TuiInputNumberModule
],
  providers: [{provide: TUI_SANITIZER, useClass: NgDompurifySanitizer}],
  bootstrap: [AppComponent]
})
export class AppModule { }

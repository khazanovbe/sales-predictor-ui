import { NgDompurifySanitizer } from "@tinkoff/ng-dompurify";
import { TuiRootModule, TuiDialogModule, TuiAlertModule, TUI_SANITIZER, TuiDataListModule, TuiButtonModule, TuiFormatNumberPipe, TuiFormatNumberPipeModule, TuiLoaderModule } from "@taiga-ui/core";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import {TuiActionModule, TuiDataListWrapperModule, TuiInputDateModule, TuiInputDateRangeModule, TuiInputNumberModule, TuiIslandModule, TuiSelectModule} from '@taiga-ui/kit';
import {TuiAxesModule, TuiLineChartModule, TuiLineDaysChartModule} from '@taiga-ui/addon-charts';
import {ScrollingModule} from "@angular/cdk/scrolling";
import {HttpClientModule} from '@angular/common/http';
import { TuiMapperPipeModule } from "@taiga-ui/cdk";

import * as CanvasJSAngularChart from '../assets/canvasjs.angular.component';
export const CanvasJSChart = CanvasJSAngularChart.CanvasJSChart;

@NgModule({
  declarations: [
    AppComponent,
    CanvasJSChart
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
    TuiInputDateRangeModule,
    TuiButtonModule,
    ScrollingModule,
    HttpClientModule,
    TuiInputDateModule,
    TuiInputNumberModule,
    TuiMapperPipeModule,
    TuiLoaderModule,
    TuiActionModule
    
],
  providers: [{provide: TUI_SANITIZER, useClass: NgDompurifySanitizer}],
  bootstrap: [AppComponent]
})
export class AppModule { }

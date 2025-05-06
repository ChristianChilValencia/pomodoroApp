import { Component, OnInit, OnDestroy } from '@angular/core';
import { Observable } from 'rxjs';
import { TimerService, TimerState } from '../services/timer.service';
import { SettingsService } from '../services/settings.service';
import { NotificationService } from '../services/notification.service';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false
})
export class HomePage implements OnInit, OnDestroy {
  timerState$: Observable<TimerState>;
  
  minutes: string = '01';
  seconds: string = '00';
  breakMinutes: string = '01';
  breakSeconds: string = '00';
  running: boolean = false;
  breakRunning: boolean = false;
  breakFinished: boolean = false;
  
  isDarkMode: boolean = false;
  currentTime: string = '';

  constructor(
    private timerService: TimerService,
    private settingsService: SettingsService,
    private notificationService: NotificationService,
    private alertController: AlertController
  ) {
    this.timerState$ = this.timerService.timerState$;
  }

  ngOnInit() {
    this.timerService.init();
    this.settingsService.load();
    this.notificationService.requestPermission();
    
    this.timerService.timerState$.subscribe(state => {
      this.minutes = state.minutes;
      this.seconds = state.seconds;
      this.running = state.running;
      this.breakRunning = state.isBreak;
      this.breakFinished = state.breakFinished;
      
      if (state.isBreak) {
        this.breakMinutes = state.minutes;
        this.breakSeconds = state.seconds;
      }
    });
    
    this.settingsService.clock$.subscribe(time => {
      this.currentTime = time;
    });
  }

  toggleTimer() {
    this.timerService.toggle();
  }
  
  restartPomodoroBreak() {
    this.timerService.restartPomodoro();
  }
  
  settings() {
    this.settingsService.openSettingsDialog();
  }

  ngOnDestroy() {
    this.timerService.cleanup();
    this.settingsService.cleanup();
  }
}
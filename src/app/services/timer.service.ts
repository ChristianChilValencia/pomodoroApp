import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, Subscription } from 'rxjs';
import { SettingsService } from './settings.service';
import { NotificationService } from './notification.service';

export interface TimerState {
  minutes: string;
  seconds: string;
  running: boolean;
  isBreak: boolean;
  breakFinished: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class TimerService implements OnDestroy {
  private workDurationMinutes = 25;
  private breakDurationMinutes = 5;
  private timerInterval: any;
  private endTime = 0;
  private currentTime = 0;
  private remainingTime = 0;

  private timerStateSubject = new BehaviorSubject<TimerState>({
    minutes: '25',
    seconds: '00',
    running: false,
    isBreak: false,
    breakFinished: false
  });

  timerState$: Observable<TimerState> = this.timerStateSubject.asObservable();
  private settingsSubscription: Subscription | null = null;

  constructor(
    private settingsService: SettingsService,
    private notificationService: NotificationService
  ) {}

  init(): void {
    this.settingsSubscription = this.settingsService.durations$.subscribe(settings => {
      this.workDurationMinutes = settings.workDuration;
      this.breakDurationMinutes = settings.breakDuration;
      
      if (!this.timerStateSubject.value.running) {
        this.reset();
      }
    });
  }

  start(): void {
    const currentState = this.timerStateSubject.getValue();
    if (currentState.running) return;
    
    const mins = parseInt(currentState.minutes, 10);
    const secs = parseInt(currentState.seconds, 10);
    const durationMs = (mins * 60 + secs) * 1000;
    
    this.currentTime = Date.now();
    this.endTime = this.currentTime + durationMs;
    this.timerInterval = setInterval(() => this.updateTimer());
    
    this.updateState({ running: true });
  }

  stop(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    
    if (this.timerStateSubject.getValue().running) {
      this.updateState({ running: false });
    }
  }

  reset(): void {
    this.stop();
    
    const isBreak = this.timerStateSubject.getValue().isBreak;
    const duration = isBreak ? this.breakDurationMinutes : this.workDurationMinutes;
    
    this.timerStateSubject.next({
      minutes: this.formatTimeUnit(duration),
      seconds: '00',
      running: false,
      isBreak: isBreak,
      breakFinished: false
    });
  }

  toggle(): void {
    this.timerStateSubject.getValue().running ? this.reset() : this.start();
  }

  private updateTimer(): void {
    this.currentTime = Date.now();
    this.remainingTime = Math.max(0, this.endTime - this.currentTime);
    
    if (this.remainingTime <= 0) {
      this.updateState({ minutes: '00', seconds: '00' });
      setTimeout(() => this.handleTimerComplete(), 100);
      return;
    }
    
    const totalSeconds = Math.ceil(this.remainingTime / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    
    this.updateState({
      minutes: this.formatTimeUnit(minutes),
      seconds: this.formatTimeUnit(seconds)
    });
  }

  private handleTimerComplete(): void {
    this.stop();
    const currentState = this.timerStateSubject.getValue();
    
    if (currentState.isBreak) {
      this.notificationService.notify('Break time finished! Ready to work?');
      this.updateState({ breakFinished: true });
    } else {
      this.notificationService.notify('Good job! Time for a break!');
      
      this.timerStateSubject.next({
        minutes: this.formatTimeUnit(this.breakDurationMinutes),
        seconds: '00',
        running: false,
        isBreak: true,
        breakFinished: false
      });
      
      setTimeout(() => this.start(), 500);
    }
  }
  
  restartPomodoro(): void {
    const currentState = this.timerStateSubject.getValue();
    
    if (currentState.isBreak) {
      this.stop();
      
      this.timerStateSubject.next({
        minutes: this.formatTimeUnit(this.workDurationMinutes),
        seconds: '00',
        running: false,
        isBreak: false,
        breakFinished: false
      });
      
      setTimeout(() => this.start(), 300);
    }
  }

  private formatTimeUnit(value: number): string {
    return value < 10 ? `0${value}` : `${value}`;
  }
  
  private updateState(partialState: Partial<TimerState>): void {
    this.timerStateSubject.next({
      ...this.timerStateSubject.getValue(),
      ...partialState
    });
  }

  cleanup(): void {
    this.stop();
    if (this.settingsSubscription) {
      this.settingsSubscription.unsubscribe();
      this.settingsSubscription = null;
    }
  }

  ngOnDestroy(): void {
    this.cleanup();
  }
}
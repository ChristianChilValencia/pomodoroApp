import { Component, OnInit, OnDestroy } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { App } from '@capacitor/app';
import { Preferences } from '@capacitor/preferences';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage implements OnInit, OnDestroy {
  minutes = '25';
  seconds = '00';
  breakMinutes = '05';
  breakSeconds = '00';
  intervalId: any;
  breakIntervalId: any;
  clockIntervalId: any;
  running = false;
  breakRunning = false;
  breakActive = false;
  breakFinished = false;
  currentTime = '';

  async ngOnInit() {
    await LocalNotifications.requestPermissions();
    await this.loadSavedState();
    this.startClock();
    App.addListener('backButton', () => App.exitApp());
    App.addListener('appStateChange', async ({ isActive }) => {
      if (!isActive) await this.saveState();
    });
  }

  private async loadSavedState() {
    const state = await Preferences.get({ key: 'pomodoroState' });
    if (state.value) {
      const savedState = JSON.parse(state.value);
      const timePassed = Date.now() - savedState.timestamp;
      const totalSeconds = this.calculateRemainingTime(
        savedState.minutes,
        savedState.seconds,
        timePassed
      );

      if (savedState.isBreak) {
        this.breakRunning = true;
        this.breakActive = savedState.isActive;
        if (totalSeconds > 0) {
          this.breakMinutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
          this.breakSeconds = (totalSeconds % 60).toString().padStart(2, '0');
          if (savedState.isActive) this.resumeBreakTimer();
        } else this.breakFinished = true;
      } else {
        if (totalSeconds > 0) {
          this.minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
          this.seconds = (totalSeconds % 60).toString().padStart(2, '0');
          if (savedState.isActive) {
            this.running = true;
            this.startTimer();
          }
        } else if (savedState.isActive) this.startBreakTimer();
      }
    }
  }

  private calculateRemainingTime(minutes: string, seconds: string, timePassed: number): number {
    return Math.max(0, parseInt(minutes) * 60 + parseInt(seconds) - Math.floor(timePassed / 1000));
  }

  private async saveState() {
    await Preferences.set({
      key: 'pomodoroState',
      value: JSON.stringify({
        isBreak: this.breakRunning,
        isActive: this.breakRunning ? this.breakActive : this.running,
        minutes: this.breakRunning ? this.breakMinutes : this.minutes,
        seconds: this.breakRunning ? this.breakSeconds : this.seconds,
        timestamp: Date.now(),
      }),
    });
  }

  async startTimer() {
    if (this.running) return;
    this.running = true;
    await this.saveState();
    this.intervalId = setInterval(async () => {
      if (this.seconds === '00') {
        if (this.minutes === '00') {
          clearInterval(this.intervalId);
          this.running = false;
          await this.showNotification('Work Session Complete! 🎉', 'Time for a break!');
          this.startBreakTimer();
        } else {
          this.minutes = (parseInt(this.minutes) - 1).toString().padStart(2, '0');
          this.seconds = '59';
        }
      } else this.seconds = (parseInt(this.seconds) - 1).toString().padStart(2, '0');
      await this.saveState();
    }, 1000);
  }

  async stopTimer() {
    if (!this.running) return;
    clearInterval(this.intervalId);
    this.running = false;
    await this.saveState();
  }

  async startBreakTimer() {
    if (this.breakRunning) return;
    this.breakRunning = true;
    this.breakActive = true;
    await this.saveState();
    this.resumeBreakTimer();
  }

  async resumeBreakTimer() {
    this.breakActive = true;
    await this.saveState();
    this.breakIntervalId = setInterval(async () => {
      if (this.breakSeconds === '00') {
        if (this.breakMinutes === '00') {
          clearInterval(this.breakIntervalId);
          this.breakActive = false;
          this.breakFinished = true;
          await this.showNotification('Break Time Complete! 💪', 'Ready for another Pomodoro?');
        } else {
          this.breakMinutes = (parseInt(this.breakMinutes) - 1).toString().padStart(2, '0');
          this.breakSeconds = '59';
        }
      } else this.breakSeconds = (parseInt(this.breakSeconds) - 1).toString().padStart(2, '0');
      await this.saveState();
    }, 1000);
  }

  async stopBreakTimer() {
    if (!this.breakRunning) return;
    clearInterval(this.breakIntervalId);
    this.breakRunning = false;
    this.breakActive = false;
    await this.saveState();
  }

  async pauseBreakTimer() {
    this.breakActive = false;
    clearInterval(this.breakIntervalId);
    await this.saveState();
  }

  async restartPomodoro() {
    this.stopTimer();
    this.stopBreakTimer();
    this.minutes = '25';
    this.seconds = '00';
    this.breakMinutes = '05';
    this.breakSeconds = '00';
    this.running = false;
    this.breakRunning = false;
    this.breakActive = false;
    this.breakFinished = false;
    await this.saveState();
  }

  async toggleTimer() {
    this.running ? await this.stopTimer() : await this.startTimer();
  }

  async toggleBreakTimer() {
    this.breakActive ? await this.pauseBreakTimer() : await this.resumeBreakTimer();
  }

  private startClock() {
    this.updateClock();
    this.clockIntervalId = setInterval(() => this.updateClock(), 1000);
  }

  private updateClock() {
    this.currentTime = new Date().toLocaleTimeString();
  }

  private async showNotification(title: string, body: string) {
    await LocalNotifications.schedule({
      notifications: [{ title, body, id: Math.random() * 100, schedule: { at: new Date() } }],
    });
    await Haptics.impact({ style: ImpactStyle.Heavy });
  }

  ngOnDestroy() {
    clearInterval(this.clockIntervalId);
    clearInterval(this.intervalId);
    clearInterval(this.breakIntervalId);
  }
}

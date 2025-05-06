import { Injectable, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable, interval } from 'rxjs';
import { map } from 'rxjs/operators';
import { Preferences } from '@capacitor/preferences';
import { ActionSheetController, AlertController, Platform } from '@ionic/angular';
import { App } from '@capacitor/app';

export interface TimerSettings {
  workDuration: number; 
  breakDuration: number;
}

@Injectable({
  providedIn: 'root'
})
export class SettingsService implements OnDestroy {
  private readonly DEFAULT_WORK_DURATION = 25;
  private readonly DEFAULT_BREAK_DURATION = 5;
  private readonly STORAGE_SETTINGS_KEY = 'pomodoro-settings';

  private durationsSubject = new BehaviorSubject<TimerSettings>({
    workDuration: this.DEFAULT_WORK_DURATION,
    breakDuration: this.DEFAULT_BREAK_DURATION
  });
  durations$: Observable<TimerSettings> = this.durationsSubject.asObservable();

  private clockInterval: any;
  private clockSubject = new BehaviorSubject<string>('');
  clock$: Observable<string> = this.clockSubject.asObservable();

  constructor(
    private actionSheetController: ActionSheetController,
    private alertController: AlertController,
    private platform: Platform
  ) {
    this.startClock();
  }

  private startClock(): void {
    this.updateClock();
    this.clockInterval = interval(1000)
      .pipe(
        map(() => this.updateClock())
      )
      .subscribe();
  }

  private updateClock(): void {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const timeStr = `${hours}:${minutes}`;
    this.clockSubject.next(timeStr);
  }

  async load(): Promise<void> {
    const settingsResult = await Preferences.get({ key: this.STORAGE_SETTINGS_KEY });
    if (settingsResult && settingsResult.value) {
      try {
        const settings: TimerSettings = JSON.parse(settingsResult.value);
        this.durationsSubject.next(settings);
      } catch (e) {
        console.error('Error parsing settings', e);
        this.durationsSubject.next({
          workDuration: this.DEFAULT_WORK_DURATION,
          breakDuration: this.DEFAULT_BREAK_DURATION
        });
      }
    }
  }

  async saveDurations(settings: TimerSettings): Promise<void> {
    const validatedSettings: TimerSettings = {
      workDuration: Math.max(1, Math.min(60, Math.floor(settings.workDuration))),
      breakDuration: Math.max(1, Math.min(30, Math.floor(settings.breakDuration)))
    };
    
    await Preferences.set({
      key: this.STORAGE_SETTINGS_KEY,
      value: JSON.stringify(validatedSettings)
    });
    
    this.durationsSubject.next(validatedSettings);
  }

  async openSettingsDialog(): Promise<void> {
    try {
      const actionSheet = await this.actionSheetController.create({
        header: 'Pomodoro Settings',
        buttons: [
          {
            text: 'Work Duration',
            icon: 'briefcase',
            handler: () => {
              this.openWorkDurationAlert();
            }
          },
          {
            text: 'Break Duration',
            icon: 'cafe',
            handler: () => {
              this.openBreakDurationAlert();
            }
          },
          {
            text: 'Refresh App',
            icon: 'refresh',
            handler: () => {
              window.location.reload();
            }
          },
          {
            text: 'Exit App',
            icon: 'exit',
            handler: () => {
              this.exit();
            }
          },
          {
            text: 'Cancel',
            icon: 'close',
            role: 'cancel'
          }
        ]
      });
      
      await actionSheet.present();
    } catch (error) {
      console.error('Error opening settings action sheet', error);
    }
  }

  private async openWorkDurationAlert(): Promise<void> {
    const currentSettings = this.durationsSubject.getValue();
    
    const alert = await this.alertController.create({
      header: 'Work Duration',
      subHeader: 'Set work duration in minutes',
      inputs: [
        {
          name: 'workDuration',
          type: 'number',
          min: 1,
          max: 60,
          value: currentSettings.workDuration,
          placeholder: 'Minutes'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Save',
          handler: (data) => {
            if (data.workDuration) {
              this.saveDurations({
                ...currentSettings,
                workDuration: parseInt(data.workDuration, 10)
              });
            }
          }
        }
      ]
    });

    await alert.present();
  }

  private async openBreakDurationAlert(): Promise<void> {
    const currentSettings = this.durationsSubject.getValue();
    
    const alert = await this.alertController.create({
      header: 'Break Duration',
      subHeader: 'Set break duration in minutes',
      inputs: [
        {
          name: 'breakDuration',
          type: 'number',
          min: 1,
          max: 30,
          value: currentSettings.breakDuration,
          placeholder: 'Minutes'
        }
      ],
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Save',
          handler: (data) => {
            if (data.breakDuration) {
              this.saveDurations({
                ...currentSettings,
                breakDuration: parseInt(data.breakDuration, 10)
              });
            }
          }
        }
      ]
    });

    await alert.present();
  }
    
  async exit() {
    const alert = await this.alertController.create({
      header: 'Exit App?',
      message: 'Are you sure you want to exit the Pomodoro App?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
        {
          text: 'Exit',
          handler: () => {
              App.exitApp();
              window.close();
          }
        }
      ]
    });
    
    await alert.present();
  }

  cleanup(): void {
    if (this.clockInterval) {
      this.clockInterval.unsubscribe();
    }
  }

  ngOnDestroy(): void {
    this.cleanup();
  }
}
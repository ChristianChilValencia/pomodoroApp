import { Injectable } from '@angular/core';
import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { Platform, ToastController } from '@ionic/angular';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private permissionGranted = false;

  constructor(
    private platform: Platform,
    private toastController: ToastController
  ) {
    this.initPermissions();
  }

  private async initPermissions(): Promise<void> {
    await this.platform.ready();
    await this.requestPermission();
  }

  async requestPermission(): Promise<void> {
    try {
      if (this.platform.is('capacitor') || this.platform.is('cordova') || this.platform.is('hybrid')) {
        const result = await LocalNotifications.requestPermissions();
        this.permissionGranted = result.display === 'granted';
        
        await LocalNotifications.registerActionTypes({
          types: [
            {
              id: 'TIMER_ACTIONS',
              actions: [
                {
                  id: 'restart',
                  title: 'Restart Timer'
                }
              ]
            }
          ]
        });
      } else {
        if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          this.permissionGranted = permission === 'granted';
        }
      }
    } catch (error) {
      console.error('Error requesting notification permissions', error);
      this.permissionGranted = false;
    }
  }

  async notify(message: string, title = 'Pomodoro Timer'): Promise<void> {
    try {
      await this.showToast(message);

      if (this.platform.is('capacitor') || this.platform.is('cordova') || this.platform.is('hybrid')) {
        await this.showMobileNotification(title, message);
      } else {
        this.showBrowserNotification(title, message);
      }

      this.triggerHapticFeedback();
      
    } catch (error) {
      console.error('Error in notify method', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.showToast(`${message} (Notification error: ${errorMessage})`);
    }
  }

  private async showMobileNotification(title: string, body: string): Promise<void> {
    await this.requestPermission();

    try {
      setTimeout(async () => {
        try {
          await LocalNotifications.schedule({
            notifications: [
              {
                title: title,
                body: body,
                id: Math.floor(Math.random() * 100000),
                schedule: { at: new Date(Date.now()) },
                sound: 'default',
                actionTypeId: 'TIMER_ACTIONS',
                extra: { data: 'notification-data' },
                smallIcon: 'ic_notification'
              }
            ]
          });
        } catch (innerError) {
          console.error('Error in delayed notification scheduling', innerError);
        }
      }, 300);
    } catch (error) {
      console.error('Error showing mobile notification', error);
    }
  }

  private showBrowserNotification(title: string, body: string): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body: body,
        icon: 'assets/icons/icon-72x72.png'
      });
    }
  }

  private async showToast(message: string): Promise<void> {
    try {
      const toast = await this.toastController.create({
        message: message,
        duration: 3000,
        position: 'top',
        buttons: [{ text: 'OK', role: 'cancel' }],
        color: 'primary'
      });
      await toast.present();
    } catch (error) {
      console.error('Error showing toast', error);
    }
  }

  private async triggerHapticFeedback(): Promise<void> {
    try {
      if (this.platform.is('capacitor') || this.platform.is('cordova') || this.platform.is('hybrid')) {
        await Haptics.impact({ style: ImpactStyle.Heavy });
        await Haptics.vibrate();
      }
    } catch (error) {
      console.error('Error triggering haptics', error);
    }
  }

  async cancelAllNotifications(): Promise<void> {
    if (this.platform.is('capacitor') || this.platform.is('cordova') || this.platform.is('hybrid')) {
      try {
        await LocalNotifications.cancel({ notifications: [] });
      } catch (error) {
        console.error('Error canceling notifications', error);
      }
    }
  }
}
# PomodoroApp ⏰

A mobile Pomodoro timer built with Ionic + Angular and Capacitor!
Stay focused, get work done, and take meaningful breaks — all while getting notified with haptics and alerts!


---

Features ✨

⏳ Pomodoro Timer: 25 minutes of focused work time.

☕ Break Timer: 5 minutes of refreshing break time after work sessions.

🔔 Local Notifications: Get notified when your session or break ends.

📳 Haptic Feedback: Feel a satisfying vibration when timers complete.

💾 Persistent State: Your timer will be saved even if the app closes or goes to the background.

🕰️ Live Clock: Displays the current time at the top.

▶️⏸️ Simple Controls: Start, pause, resume, and reset easily.

📱 Android Back Button Handling: Clean exit from the app.



---

Technologies Used 🛠️

Ionic Framework

Angular

Capacitor

Local Notifications

Haptics

App Preferences

App State



---

Getting Started 🚀

Prerequisites

Node.js and npm

Ionic CLI

Android Studio (for Android builds)


Installation

1. Clone this repository:

git clone https://github.com/your-username/PomodoroApp.git
cd PomodoroApp


2. Install dependencies:

npm install


3. Run in the browser (for quick testing):

ionic serve


4. To run on a real Android device:

ionic cap add android
ionic cap open android

Then build and run from Android Studio!




---

Project Structure 🗂️

home.page.ts: Main timer logic (Pomodoro + Break timer, state saving).

home.page.html: User interface for timer, clock, and controls.

home.page.scss: App styling.


import { Component } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: false,
})
export class HomePage {
  time = 25;
  seconds = 59;



  breakTime = 5;
  isBreak = false;
  isRunning = true;
  isPaused = true;
  isStarted = false;
  
  constructor() {}

  startTimer(){
    // let timer = setInterval(() => {
    //   this.time--;
    //   if(this.time <= 0){
    //     clearInterval(timer);
    //     alert("Time's up!");
    //     console.log("Clock is running");
    //   }
    // }, 1000);
    
    this.time--;
    this.seconds--;



    if(this.isRunning){
        this.isRunning = true;
        this.isStarted = true;
        console.log("Clock is running");
      return;
    }else{  
      this.isRunning = false;
      this.isStarted = false;
      console.log("Clock is not running");
    }
  }




  



}

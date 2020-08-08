import * as THREE from 'three';
import { Injectable } from '@angular/core';
import { gsap } from 'gsap';
import { ThreeService } from './three.service';
import { Subject } from 'rxjs';


@Injectable({
  providedIn: 'root'
})

export class NextScene{
  public ScenePhase:number=0;
  public ScenePhaseChange: Subject<number> = new Subject<number>();
  constructor(private ThreeService: ThreeService) {
  }

  private firstClientX:number=0;
  private CurrentGoal:number=0;
  private NextGoal:number=15;
  private onNextLeft:boolean=false;

  nextStageFunction(){
    // this.ScenePhase = 0;
    // this.ScenePhaseChange.next(this.ScenePhase);
    // let Mesh = new THREE.Mesh(new THREE.BoxBufferGeometry(.5,.5,.5))
    // Mesh.position.set(15,0,0);
    // this.ThreeService.scene.add(Mesh);

    // let Mesh02 = Mesh.clone();
    // Mesh02.position.set(30,0,0);
    // this.ThreeService.scene.add(Mesh02);

    document.querySelector('#nextStage .nextLeft').addEventListener("mousedown", this.Start, false);
    document.addEventListener("mouseup", ()=>{
      if(this.onNextLeft){
        document.removeEventListener("mousemove", this.Moving, false);
        this.firstClientX=0;
        this.onNextLeft=false;
        this.nextCancel();
      }
    })
  }

  Start = (e) => {
    console.log("clicked")
    if(!this.onNextLeft){
      document.addEventListener("mousemove", this.Moving);
      this.firstClientX=e.clientX;
      this.onNextLeft = true;
      console.log('start')
    }
  }

  Moving = (e) => {
    var num = e.clientX-this.firstClientX > 0 ? e.clientX-this.firstClientX : 0;

    if(num>0){
      if(num>=250){
        this.Succeed();
      } else {
        gsap.set(this.ThreeService.Goal,{x:(this.CurrentGoal+num*.01)})
        gsap.set('#nextStage .nextLeft',{css:{left:num+"px"}});
        gsap.set('#nextStage .mid .svg',{css:{width:(200-num)+"px"}});
      }
    }
  }

  Succeed(){
    this.ScenePhase += 1;
    this.ScenePhaseChange.next(this.ScenePhase);
    console.log('Go to Scene'+this.ScenePhase)


    gsap.to(this.ThreeService.Goal,1.5,{ease:"in",x:this.NextGoal});
    

    this.CurrentGoal+=15;
    this.NextGoal+=15;

    gsap.to('#nextStage',.5,{ease:"in",css:{opacity:0}});
    gsap.set('#nextStage',{css:{visibility:"hidden"},delay:.4});
    
    // var offsetl = document.querySelector('#nextStage .nextRight') as HTMLElement;
    // gsap.to('#nextStage .nextLeft',.2,{css:{left:offsetl.offsetLeft+"px"}});
    // gsap.to('#nextStage .mid .svg',.2,{css:{width:0+"px"}});

    document.removeEventListener("mousemove", this.Moving, false);
    this.firstClientX=0;
    this.onNextLeft=false;

    gsap.delayedCall(1.5,()=>{
      this.restart();
    })
  }

  
  nextCancel(){
    console.log('cancel')
    gsap.to('#nextStage .nextLeft',.3,{ease:"Power1.out",css:{left:0+"px"}});
    gsap.to('#nextStage .mid .svg',.3,{ease:"Power1.out",css:{width:200+"px"}});
    gsap.to(this.ThreeService.Goal,.3,{ease:"Power1.out",x:this.CurrentGoal})
  }

  restart(){
    gsap.set('#nextStage .nextLeft',{ease:"Power1.out",css:{left:0+"px"}});
    gsap.set('#nextStage .mid .svg',{ease:"Power1.out",css:{width:200+"px"}});
    gsap.to('#nextStage',.5,{ease:"in",css:{opacity:1}});
    gsap.set('#nextStage',{css:{visibility:"visible"},delay:.5});
  }
}

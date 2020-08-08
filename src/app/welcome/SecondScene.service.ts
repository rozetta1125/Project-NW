import * as THREE from 'three';
import * as CANNON from 'cannon';
import { Injectable } from '@angular/core';
import { gsap,TimelineLite } from 'gsap';
import { ThreeService } from './three.service';
import { Resources } from './Resources.service';

@Injectable({
  providedIn: 'root'
})

export class SecondScene{
  constructor(private RS:Resources,private ThreeService: ThreeService) {}

  private Golfing: boolean = false;
  private FBvec = new THREE.Vector3();
  
  private FBpos = new THREE.Vector3();
  private LBpos = new THREE.Vector3();
  private world02 = new CANNON.World();
  
  InitSecondScene(){
    this.InitGolfCannon();
    this.CreateScoreMaterial();
    this.GolfStageCannon();

    this.GolfString = new THREE.Object3D();
    let material = new THREE.MeshBasicMaterial({color:0xffffff});
    let arrow = new THREE.Mesh(
      new THREE.CylinderBufferGeometry(.075,.075,.01,3),material
    )
    arrow.position.set(0,0,0.45);
    let box = new THREE.Mesh(
      new THREE.BoxBufferGeometry(.05,.01,.1),material
    )
    box.position.set(0,0,0.3);
    let box02 = new THREE.Mesh(
      new THREE.BoxBufferGeometry(.05,.01,.1),material
    )
    box02.position.set(0,0,0.15);
    this.GolfString.add(arrow);
    this.GolfString.add(box);
    this.GolfString.add(box02);
  }

  StartSecondScene(){
    this.SecondSceneRender();
    this.addEvent();
  }

  addEvent(){
    this.ThreeService.canvas.addEventListener("mousedown",this.MouseDown);
    this.ThreeService.canvas.addEventListener("mouseup", this.MouseUp);
  }

  MouseDown = (e)=>{
    if (e.which == 1) {
      if(this.GolfState.value==1){
        this.ThreeService.canvas.addEventListener("mousemove", this.isGolfing, false);
        this.GolfBegin();
      }
    }
  }

  MouseUp = (e)=>{
    if (e.which == 1) {
      this.ThreeService.canvas.removeEventListener("mousemove", this.isGolfing, false);
      this.Golfing=false;
      gsap.set('.circle',{css:{strokeDashoffset: 270}});
      gsap.set('.circle .innerCircle',{css:{strokeDashoffset: 270}});
      gsap.set('.svg-line',{css:{opacity:0}});

      this.ThreeService.scene.remove(this.GolfString);

      if(this.GolfState.value==2){
        if(this.ThreeService.BasePosition.x==this.FBasePosition.x&&this.ThreeService.BasePosition.y==this.FBasePosition.y){
        } else {
          this.GolfMove();
          this.GolfState.value=0;
          gsap.delayedCall(.6,()=>{
            this.MiniGolf(); 
          });
        }
      }
    }
  }

  isGolfing = () => {
    this.Golfing=true;
    this.GolfState.value=2;
    this.ThreeService.scene.add(this.GolfString);
    gsap.set('.circle .innerCircle',{css:{strokeDashoffset: 0}});
    gsap.set('.svg-line',{css:{opacity:1}});
  }

  CancelSecondScene(){
    cancelAnimationFrame(this.render);
    this.ThreeService.canvas.removeEventListener("mousedown",this.MouseDown);
    this.ThreeService.canvas.removeEventListener("mouseup", this.MouseUp);
  }


  private render;
  SecondSceneRender(){
    this.render = requestAnimationFrame(()=>{
      this.SecondSceneRender();
    });

    // Physic
    this.world02.step(1 / this.ThreeService.fps);
    this.debugger.update();

    // Golf
    for (var i = 0; i < this.GolfThrees.length; i++) {
      this.GolfThrees[i].position.copy(this.GolfCannons[i].position);
      this.GolfThrees[i].quaternion.copy(this.GolfCannons[i].quaternion);
      this.GolfShadows[i].position.set(this.GolfCannons[i].position.x,this.GolfCannons[i].position.y-0.08,this.GolfCannons[i].position.z);
      if(Math.abs(this.GolfCannons[i].position.y)>0.3){
        this.GolfShadows[i].material.uniforms.uAlpha.value = 0;
      } else {
        this.GolfShadows[i].material.uniforms.uAlpha.value = (.3 - this.GolfCannons[i].position.y)*5;
      }
    }

    // windmill
    if(this.windmillthree.length>0){
      this.windmillcannon[0].quaternion.copy(this.windmillthree[0].quaternion);
    }
    // Cursor
    if(this.GolfState.value==2){
      this.RenderGolfCursor();
    }
    this.RunAnimation();
  }

  private oldTime=0;
  private elapsedTime=0;
  private diff;
  RunAnimation(){
    var newTime=(typeof performance === 'undefined' ? Date : performance).now();
    if(this.elapsedTime!=0){
      this.diff = ((newTime-this.oldTime-this.elapsedTime)/1000);
      this.elapsedTime=0;
    } else {
      this.diff = (newTime-this.oldTime)/1000;
    }
    this.oldTime=newTime;
    if (this.FlagMixer){
      this.FlagMixer.update(this.diff);
    }
  }

  private GolfCMaterial:CANNON.Material;
  private GolfStageMaterial:CANNON.Material;
  private GoalMaterial:CANNON.Material;
  private PlaneMaterial:CANNON.Material;
  private debugger;
  InitGolfCannon(){
    this.world02 = new CANNON.World();
    this.world02.gravity.set(0, 0, 0);

    var shape = new CANNON.Plane();
    var PlaneBody = new CANNON.Body({ mass: 0,material:this.PlaneMaterial });
    PlaneBody.addShape(shape);
    PlaneBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    PlaneBody.position.set(0, -.2, 0);
    this.world02.addBody(PlaneBody)

    this.GolfCMaterial = new CANNON.Material("GolfCMaterial");
    this.GoalMaterial = new CANNON.Material("GoalMaterial");
    this.GolfStageMaterial = new CANNON.Material("GolfStageMaterial");
    this.PlaneMaterial = new CANNON.Material("PlaneMaterial");

    // let Contact = new CANNON.ContactMaterial(this.GolfCMaterial,this.PlaneMaterial,{
    //   // friction:0.01,
    //   restitution:0.3,
    // });
    // this.world02.addContactMaterial(Contact);

    // // Golf stage
    
    // Contact = new CANNON.ContactMaterial(this.GolfCMaterial,this.GolfStageMaterial,{
    //   // friction: 0.5,
    //   restitution: 0.3,
    // });
    // this.world02.addContactMaterial(Contact);
    this.debugger = new CannonDebugRenderer(this.ThreeService.scene, this.world02);

    // First time
    if(this.GolfClone==null){
      // Create material once time
      let white = this.ThreeService.textureLoader.load('assets/matcaps/white.png',()=>{
        white.encoding=THREE.sRGBEncoding;
      });
      // white
      let mate = new THREE.MeshMatcapMaterial({
        color:0xffffff,
        matcap:white,
      })

      // THREE
      this.GolfClone = new THREE.Mesh(
        new THREE.SphereBufferGeometry(.09,16,16),
        mate
      )
      this.GolfClone.position.set(0,6,0)
    }


    gsap.delayedCall(2,() => {
      this.MiniGolf();
      this.world02.gravity.set(0, -10, 0);
    });

  }
  
  private FBasePosition=new THREE.Vector2();
  GolfBegin(){
    this.FBvec.copy(this.ThreeService.LBvec);
    this.FBasePosition.copy(this.ThreeService.BasePosition);
  }

  
  private GolfString:THREE.Object3D;
  private GolfDistance:number;
  private GolfPercent:number;
  RenderGolfCursor(){
    if(this.GolfCannons[this.GolfN] && this.Golfing){
      this.FBpos=this.GolfCannons[this.GolfN].position;
      var Multiplier = 1.2;
      this.LBpos.set(this.FBpos.x+((this.FBvec.x-this.ThreeService.LBvec.x)*Multiplier),this.FBpos.y,this.FBpos.z-((this.FBvec.y-this.ThreeService.LBvec.y)*Multiplier));

      this.GolfString.position.copy(this.FBpos);
      this.GolfString.lookAt(this.LBpos);


      this.GolfDistance = this.ThreeService.distanceVec2(this.FBpos.x,this.FBpos.z,this.LBpos.x,this.LBpos.z);

      var maxDistance = 4;
      
      this.GolfPercent = 270 - (this.GolfDistance/maxDistance * 100)*2.7;
      

      gsap.set('.circle',{css:{strokeDashoffset: this.GolfPercent > 0 ? this.GolfPercent : 0}});


      var angleRadians = 180 + (Math.atan2(this.ThreeService.BasePosition.y-this.FBasePosition.y,this.ThreeService.BasePosition.x-this.FBasePosition.x) * 180/Math.PI);
      gsap.set('#lgrad',{attr:{gradientTransform:"rotate("+angleRadians+" 0.5 0.5)"}});
      gsap.set('.svg-line .line',{attr:{x1:this.FBasePosition.x,y1:this.FBasePosition.y,x2:this.ThreeService.BasePosition.x,y2:this.ThreeService.BasePosition.y}});
    }
  }

  GolfMove(){
    let startPosition = new CANNON.Vec3(this.FBpos.x, 0, this.FBpos.z);
    let endPosition = new CANNON.Vec3(this.LBpos.x, 0, this.LBpos.z);

    // endPosition limit
    var maxDistance = 4;
    if(this.GolfDistance>maxDistance){
      var Line = new THREE.LineCurve3(new THREE.Vector3(startPosition.x,startPosition.y,startPosition.z),
        new THREE.Vector3(endPosition.x,endPosition.y,endPosition.z));
      var len = Line.getLengths();
      var numberI:number;
      var Vec3:THREE.Vector3;

      for(var i=0;i<len.length;i++){
        if(len[i]>maxDistance){
          numberI=i;
          break;
        }
      }

      Vec3 = Line.getPointAt(numberI/201);
      endPosition.set(Vec3.x,Vec3.y,Vec3.z);
    }


    let direction = new CANNON.Vec3();
    endPosition.vsub(startPosition, direction);

    let totalLength = this.ThreeService.distance(direction.x, direction.y, direction.z, 0, 0, 0);
    direction.normalize();

    let speed = totalLength / 0.225;
    if(speed<1){
      speed = 1;
    }

    direction.scale(speed, this.GolfCannons[this.GolfN].velocity);
    // this.GolfStateFunction();
  }
  private GolfState={value:0}; // 0 preparing 1 standby 2 damping

  // GolfStateFunction(){
  //   if(this.GolfState.value==0)
  //   gsap.delayedCall(.1,() => {
  //     if(Math.abs(this.GolfCannons[this.GolfN].angularVelocity.x)+Math.abs(this.GolfCannons[this.GolfN].angularVelocity.z) < 2 ){
  //       console.log('dingding')
  //       TweenLite.set(this.GolfState,{value:2});
  //       TweenLite.to(this.GolfCannons[this.GolfN],1,{linearDamping:.8,angularDamping:.8});
  //       TweenLite.set(this.GolfCannons[this.GolfN],{delay:1,linearDamping:.5,angularDamping:.5});
  //       TweenLite.set(this.GolfState,{delay:1,value:1});
  //     }
  //     this.GolfStateFunction();
  //   });
  //   console.log(Math.abs(this.GolfCannons[this.GolfN].angularVelocity.x)+Math.abs(this.GolfCannons[this.GolfN].angularVelocity.z))
  // }


  private GolfClone=null;
  private GolfN: number = 0;
  private MaxGolf: number = 2;
  MiniGolf(){
    // P
    var Position = new THREE.Vector3();
    Position.setFromMatrixPosition(this.StageThreeArray[0].matrixWorld);
    this.GolfN++;

    gsap.fromTo(this.GolfFlip[0].rotation,1,{x:0},{x:-Math.PI});

    if(this.GolfThrees.length<1){
      this.GolfN=0;
    }

    if(this.GolfThrees.length == this.MaxGolf){
      // if max
      if(this.GolfN==this.MaxGolf){
        this.GolfN=0;
      }
      this.ScoreFunction(this.GolfCannons[this.GolfN].position)
      this.GolfCannons[this.GolfN].collisionFilterMask=2;
      this.GolfCannons[this.GolfN].position.set(Position.x,Position.y - .6,Position.z);
      this.GolfCannons[this.GolfN].velocity.set(.09,6,-.18);
      this.GolfCannons[this.GolfN].angularVelocity.set(0,0,0);
      this.GolfState.value=0;
      gsap.delayedCall(.5,()=>{
        this.GolfCannons[this.GolfN].collisionFilterMask=1;
      })
      gsap.delayedCall(1,()=>{
        this.GolfState.value=1;
      })

    } else {
      // Create more Golf ball if length less than MaxGolf
      // CANNON
      let body = new CANNON.Body({mass:1,material:this.GolfCMaterial})
      body.linearDamping = .5;
      body.angularDamping = .5;
      body.addShape(new CANNON.Sphere(.09));
      this.world02.addBody(body)
      this.GolfCannons[this.GolfN] = body;


      body.collisionFilterMask=2;
      body.position.set(Position.x,Position.y - .6,Position.z);
      body.velocity.set(.09,6,-.18);
      this.GolfState.value=0;
      gsap.delayedCall(.5,()=>{
        body.collisionFilterMask=1;
      })
      gsap.delayedCall(1,()=>{
        this.GolfState.value=1;
      })


      // Collision
      body.addEventListener('collide',(e)=>{
        if(e.body.material.name=="GoalMaterial"){
          this.ScoreFunction(body.position)
        }
      });

      // THREE
      let Golf = this.GolfClone.clone();
      this.ThreeService.scene.add(Golf);
      this.GolfThrees[this.GolfN] = Golf;
      

      // SHADOW
      let uniforms = {
        tShadow:{value:this.RS.GolfShadow},
        uShadowColor:{value:new THREE.Color("#c0a68e")},
        uAlpha:{value:1}
      }
      let material = new THREE.ShaderMaterial({wireframe:false,transparent:true,uniforms,depthWrite:false,
        vertexShader:document.getElementById('vertexShader').textContent,
        fragmentShader:document.getElementById('fragmentShader').textContent})
        
      let shadow = new THREE.Mesh(new THREE.PlaneGeometry(1,1),material);
      shadow.rotation.set(-Math.PI/2,0,0)
      shadow.position.set(0,0,0);

      this.ThreeService.scene.add(shadow);
      this.GolfShadows[this.GolfN] = shadow;
    }
  }

  // 24 for each function call,3 material, 4 usage at the same time.
  private ScoreMax = 6*3*4;
  private ScoreCurrent = 0;
  private ScoreLast = 0;
  CreateScoreMaterial(){
    // Score
    let Score01 = new THREE.Mesh(new THREE.BoxBufferGeometry(.05,.08,.005),
      new THREE.MeshMatcapMaterial({color:0xffffff,matcap:this.RS.blue02,transparent:true}));
    let Score02 = new THREE.Mesh(new THREE.BoxBufferGeometry(.08,.05,.005),
      new THREE.MeshMatcapMaterial({color:0xffffff,matcap:this.RS.red,transparent:true}));
    let Score03 = new THREE.Mesh(new THREE.BoxBufferGeometry(.05,.08,.005),
      new THREE.MeshMatcapMaterial({color:0xffffff,matcap:this.RS.yellow,transparent:true}));
    Score01.position.set(0,5,0)
    Score02.position.set(0,5,0)
    Score03.position.set(0,5,0)
    for (var i=0;i<this.ScoreMax/3;i++){
      let mesh = Score01.clone();
      this.ThreeService.scene.add(mesh);
      this.GolfScore.push(mesh);
      
      let mesh02 = Score02.clone();
      this.ThreeService.scene.add(mesh02);
      this.GolfScore.push(mesh02);

      let mesh03 = Score03.clone();
      this.ThreeService.scene.add(mesh03);
      this.GolfScore.push(mesh03);
    }
    // let Score02 = new THREE.Mesh(new THREE.CylinderBufferGeometry(.04,.04,.02,8,1),
    //   new THREE.MeshMatcapMaterial({color:0xffffff,matcap:this.RS.blue02,transparent:true}));
    // Score02.position.set(0,5,0)
    // for(var i=0;i<this.ScoreMax/3;i++){
    //   let mesh = Score02.clone();
    //   this.ThreeService.scene.add(mesh);
    //   this.GolfScore.push(mesh);
    // }
    // let Score03 = new THREE.Mesh(new THREE.CylinderBufferGeometry(.04,.04,.02,8,1),
    //   new THREE.MeshMatcapMaterial({color:0xffffff,matcap:this.pink,transparent:true}));
    // Score03.position.set(0,5,0)
    // for(var i=0;i<this.ScoreMax/3;i++){
    //   let mesh = Score03.clone();
    //   this.ThreeService.scene.add(mesh);
    //   this.GolfScore.push(mesh);
    // }

    // let yellow = this.ThreeService.textureLoader.load('assets/matcaps/03/FFEB40.png',()=>{
    //   yellow.encoding=THREE.sRGBEncoding;
    // });
  }

  private ScoreDistance = .25;
  ScoreFunction(Po:CANNON.Vec3){
    console.log(this.ScoreCurrent);
    if(this.ScoreCurrent >= this.ScoreMax){
      this.ScoreCurrent=24;
      this.ScoreLast=0;
    } else {
      this.ScoreCurrent+=24;
    }

    var j=0;
    for(var i=this.ScoreLast;i<this.ScoreCurrent;i++){

      var ranX = Po.x + Math.random()*1.2-.6;
      var ranZ = Po.z + Math.random()*1.2-.6;

      var distance = this.ThreeService.distanceVec2(ranX,ranZ,Po.x,Po.z);
      if(distance>this.ScoreDistance){
        var randomDelay = j;
        j+=.01;

        // Distance duration
        var DD = (distance - this.ScoreDistance);

        var PoDuration = .35 + DD;
        
        // Position
        gsap.fromTo(this.GolfScore[i].position,PoDuration,
          {x:Po.x,z:Po.z},
          {x:ranX,z:ranZ,delay:randomDelay,ease:"power1.out"});


        gsap.fromTo(this.GolfScore[i].position,PoDuration/2,{y:Po.y},{ease:"power1.out",y:DD+.4,delay:randomDelay})
        gsap.to(this.GolfScore[i].position,PoDuration/2,{ease:"power1.in",delay:(PoDuration/2)+randomDelay,y:0.28})

        // Rotation
        gsap.fromTo(this.GolfScore[i].rotation,PoDuration,{x:0,y:0,z:0},{x:Math.random()*24-12,y:Math.random()*24-12,z:Math.random()*24-12,delay:randomDelay,ease:"none"});

        // Scale
        gsap.fromTo(this.GolfScore[i].scale,PoDuration,{x:1,y:1,z:1},{delay:PoDuration+.1,x:.1,y:.1,z:.1})
      } else {
        i--;
      }
    }
    this.ScoreLast = this.ScoreCurrent;
  }
  
  private StageThreeArray=[];
  private StageCannnonArray=[];
  private GolfFlip=[];
  private GolfScore=[];
  private FlagMixer: THREE.AnimationMixer;
  // Windmill
  private windmillthree = [];
  private windmillcannon = [];
  private GolfShadows = [];
  private GolfThrees = [];
  private GolfCannons = [];
  GolfStageCannon(){
    let Stage = new THREE.Object3D();
    this.ThreeService.scene.add(Stage)

    Stage.position.set(15,0,-1.5);
    // Stage.scale.set(1.1,1.1,1.1);
    Stage.rotation.set(0*Math.PI/180,-25*Math.PI/180,0*Math.PI/180);

    let StageMaterial = new THREE.MeshBasicMaterial({transparent:true,opacity:0,color:0x2395dc})


    let uniforms = {
      tShadow:{value:this.RS.WindmillShadow01},
      uShadowColor:{value:new THREE.Color("#c0a68e")},
      uAlpha:{value:1}
    }
    let material = new THREE.ShaderMaterial({wireframe:false,transparent:true,uniforms,depthWrite:false,
      vertexShader:document.getElementById('vertexShader').textContent,
      fragmentShader:document.getElementById('fragmentShader').textContent})

    let StageShadow = new THREE.Mesh(new THREE.PlaneGeometry(10,10),material);
    StageShadow.rotation.set(-Math.PI/2,0,0)
    StageShadow.position.set(0,0,0);

    Stage.add(StageShadow);

    let uniforms02 = {
      tShadow:{value:this.RS.WindmillShadow02},
      uShadowColor:{value:new THREE.Color("#c0a68e")},
      uAlpha:{value:1}
    }
    let material02 = new THREE.ShaderMaterial({wireframe:false,transparent:true,uniforms:uniforms02,depthWrite:false,
      vertexShader:document.getElementById('vertexShader').textContent,
      fragmentShader:document.getElementById('fragmentShader').textContent})

      
    let StageShadow02 = new THREE.Mesh(new THREE.PlaneGeometry(10,10),material02);
    StageShadow02.rotation.set(-Math.PI/2,0,0)
    StageShadow02.position.set(0,-.2,0);

    Stage.add(StageShadow02);


    let uniforms03 = {
      tShadow:{value:this.RS.WindmillShadow03},
      uShadowColor:{value:new THREE.Color("#000000")},
      uAlpha:{value:.08}
    }
    let material03 = new THREE.ShaderMaterial({wireframe:false,transparent:true,uniforms:uniforms03,depthWrite:false,
      vertexShader:document.getElementById('vertexShader').textContent,
      fragmentShader:document.getElementById('fragmentShader').textContent})

      
    let StageShadow03 = new THREE.Mesh(new THREE.PlaneGeometry(3,3),material03);
    StageShadow03.rotation.set(0*Math.PI/180,0,0)
    StageShadow03.scale.set(.5,.5,1)
    StageShadow03.position.set(0,1.2,.48);

    Stage.add(StageShadow03);

    let StageShadow0302 = StageShadow03.clone();
    Stage.add(StageShadow0302);

    let StageShadow0303 = StageShadow03.clone();
    Stage.add(StageShadow0303);

    let StageShadow0304 = StageShadow03.clone();
    Stage.add(StageShadow0304);


    this.RS.Windmill.scene.position.set(15,0,-1.5);
    // stage.scale.set(1.1,1.1,1.1);
    this.RS.Windmill.scene.rotation.set(0*Math.PI/180,-25*Math.PI/180,0)
    for(var i=0;i<this.RS.Windmill.scene.children.length;i++){
      if(this.RS.Windmill.scene.children[""+i+""].name == "Windmill"){
        let mate01 = new THREE.MeshMatcapMaterial({
          color:0xffffff,
          side:2,
          matcap:this.RS.white
        })
        let mate02 = new THREE.MeshMatcapMaterial({
          color:0xffffff,
          side:2,
          matcap:this.RS.blue02
        })
        this.RS.Windmill.scene.children[""+i+""].children[0].material=mate01;
        this.RS.Windmill.scene.children[""+i+""].children[1].material=mate02;
      } else if (this.RS.Windmill.scene.children[""+i+""].name == "Goal"){
        let mate01 = new THREE.MeshMatcapMaterial({
          color:0xffffff,
          side:2,
          matcap:this.RS.green01
        })
        let mate02 = new THREE.MeshMatcapMaterial({
          color:0xffffff,
          side:2,
          matcap:this.RS.wood
        })
        this.RS.Windmill.scene.children[""+i+""].children[0].material=mate01;
        this.RS.Windmill.scene.children[""+i+""].children[1].material=mate02;
      } else if (this.RS.Windmill.scene.children[""+i+""].name == "Fan"){
        let mate01 = new THREE.MeshMatcapMaterial({
          color:0xffffff,
          side:2,
          matcap:this.RS.blue02
        })
        this.RS.Windmill.scene.children[""+i+""].material=mate01;
        let wmthree = new THREE.Mesh();
        wmthree.rotation.set(0,-23*Math.PI/180,-31.5*Math.PI/180)
        this.windmillthree.push(wmthree);

        // three
        gsap.fromTo(this.RS.Windmill.scene.children[""+i+""].rotation,10,{y:0},{y:-Math.PI*2,ease:"none",repeat:-1})
        // cannon
        gsap.fromTo(wmthree.rotation,10,{z:-31.5*Math.PI/180},{z:-31.5*Math.PI/180-Math.PI*2,ease:"none",repeat:-1})

        // 4 shadow 
        gsap.fromTo(StageShadow03.rotation,10,{z:0*Math.PI/180},{z:-360*Math.PI/180,ease:"none",delay:.3,repeat:-1})
        var ShadowTween = gsap.timeline({repeat:-1,delay:.3,repeatDelay:2.5});
        ShadowTween.to(StageShadow03.scale,.75,{x:1,y:1,ease:"none",})
        ShadowTween.to(StageShadow03.scale,.75,{x:.3,y:.3,ease:"none",delay:.75})
        ShadowTween.to(StageShadow03.scale,1.75,{x:.45,y:.45,ease:"none",delay:3})
        ShadowTween.to(StageShadow03.scale,.5,{x:.5,y:.5,ease:"none",})

        gsap.fromTo(StageShadow0302.rotation,10,{z:0*Math.PI/180},{z:-360*Math.PI/180,ease:"none",delay:2.8,repeat:-1})
        var ShadowTween02 = gsap.timeline({repeat:-1,delay:2.8,repeatDelay:2.5});
        ShadowTween02.to(StageShadow0302.scale,.75,{x:1,y:1,ease:"none",})
        ShadowTween02.to(StageShadow0302.scale,.75,{x:.3,y:.3,ease:"none",delay:.75})
        ShadowTween02.to(StageShadow0302.scale,1.75,{x:.45,y:.45,ease:"none",delay:3})
        ShadowTween02.to(StageShadow0302.scale,.5,{x:.5,y:.5,ease:"none"})

        gsap.fromTo(StageShadow0303.rotation,10,{z:0*Math.PI/180},{z:-360*Math.PI/180,ease:"none",delay:5.3,repeat:-1})
        var ShadowTween03 = gsap.timeline({repeat:-1,delay:5.3,repeatDelay:2.5});
        ShadowTween03.to(StageShadow0303.scale,.75,{x:1,y:1,ease:"none",})
        ShadowTween03.to(StageShadow0303.scale,.75,{x:.3,y:.3,ease:"none",delay:.75})
        ShadowTween03.to(StageShadow0303.scale,1.75,{x:.45,y:.45,ease:"none",delay:3})
        ShadowTween03.to(StageShadow0303.scale,.5,{x:.5,y:.5,ease:"none"})

        gsap.fromTo(StageShadow0304.rotation,10,{z:0*Math.PI/180},{z:-360*Math.PI/180,ease:"none",delay:7.8,repeat:-1})
        var ShadowTween04 = gsap.timeline({repeat:-1,delay:7.8,repeatDelay:2.5});
        ShadowTween04.to(StageShadow0304.scale,.75,{x:1,y:1,ease:"none",})
        ShadowTween04.to(StageShadow0304.scale,.75,{x:.3,y:.3,ease:"none",delay:.75})
        ShadowTween04.to(StageShadow0304.scale,1.75,{x:.45,y:.45,ease:"none",delay:3})
        ShadowTween04.to(StageShadow0304.scale,.5,{x:.5,y:.5,ease:"none"})
      } else if (this.RS.Windmill.scene.children[""+i+""].name == "Bench"){
        let mate01 = new THREE.MeshMatcapMaterial({
          color:0xffffff,
          side:2,
          matcap:this.RS.wood
        })
        this.RS.Windmill.scene.children[""+i+""].material=mate01;
      } else if (this.RS.Windmill.scene.children[""+i+""].name == "Wall"){
        let mate01 = new THREE.MeshMatcapMaterial({
          color:0xffffff,
          side:2,
          matcap:this.RS.blue02
        })
        this.RS.Windmill.scene.children[""+i+""].material=mate01;
      } else if (this.RS.Windmill.scene.children[""+i+""].name == "Bush"){
        let mate01 = new THREE.MeshMatcapMaterial({
          color:0xffffff,
          side:2,
          matcap:this.RS.green01
        })
        this.RS.Windmill.scene.children[""+i+""].material=mate01;
      } else if (this.RS.Windmill.scene.children[""+i+""].name == "Tree"){
        let mate01 = new THREE.MeshMatcapMaterial({
          color:0xffffff,
          side:2,
          matcap:this.RS.green01
        })
        let mate02 = new THREE.MeshMatcapMaterial({
          color:0xffffff,
          side:2,
          matcap:this.RS.wood
        })
        this.RS.Windmill.scene.children[""+i+""].children[0].material=mate01;
        this.RS.Windmill.scene.children[""+i+""].children[1].material=mate02;
      }  else if (this.RS.Windmill.scene.children[""+i+""].name == "Flip"){
        let mate01 = new THREE.MeshMatcapMaterial({
          color:0xffffff,
          side:2,
          matcap:this.RS.green01
        })
        this.RS.Windmill.scene.children[""+i+""].material=mate01;
        this.GolfFlip.push(this.RS.Windmill.scene.children[""+i+""]);
      } else if (this.RS.Windmill.scene.children[""+i+""].name == "Start"){
        let mate01 = new THREE.MeshMatcapMaterial({
          color:0xffffff,
          side:2,
          matcap:this.RS.green01
        })
        let mate02 = new THREE.MeshMatcapMaterial({
          color:0xffffff,
          side:2,
          matcap:this.RS.wood
        })
        this.RS.Windmill.scene.children[""+i+""].children[0].material=mate02;
        this.RS.Windmill.scene.children[""+i+""].children[1].material=mate01;
      } else if (this.RS.Windmill.scene.children[""+i+""].name == "Rock"){
        let mate01 = new THREE.MeshMatcapMaterial({
          color:0xffffff,
          side:2,
          matcap:this.RS.white
        })
        this.RS.Windmill.scene.children[""+i+""].material=mate01;
      } else if (this.RS.Windmill.scene.children[""+i+""].name == "Window"){
        let mate01 = new THREE.MeshMatcapMaterial({
          color:0xffffff,
          side:2,
          matcap:this.RS.white
        })
        this.RS.Windmill.scene.children[""+i+""].material=mate01;
      } else if (this.RS.Windmill.scene.children[""+i+""].name == "Pole"){
        let mate01 = new THREE.MeshMatcapMaterial({
          color:0xffffff,
          side:2,
          matcap:this.RS.white
        })
        this.RS.Windmill.scene.children[""+i+""].material=mate01;
      } else {
        let mate01 = new THREE.MeshMatcapMaterial({
          color:0xffffff,
          side:2,  
          matcap:this.RS.white
        })
        this.RS.Windmill.scene.children[""+i+""].material=mate01;
      }
    }
    this.ThreeService.scene.add(this.RS.Windmill.scene);



    // FLAG 
    this.FlagMixer = new THREE.AnimationMixer(this.RS.Flag.scene);
    this.FlagMixer.timeScale = 1;

    let animation = this.FlagMixer.clipAction(this.RS.Flag.animations[0]);
    animation.play();

    this.RS.Flag.scene.children[0].scale.set(1,1,1);
    this.RS.Flag.scene.children[0].position.set(0,0,0);

    let FlagMate = new THREE.MeshMatcapMaterial({
      color:0xec1c24,
      side:2,
      matcap:this.RS.white,
      morphTargets:true,
    })

    this.RS.Flag.scene.children["0"].material = FlagMate;
    this.RS.Flag.scene.position.set(.38,.75,-2);

    Stage.add(this.RS.Flag.scene);


    var sizeX = .8;
    var sizeY = .01;
    var sizeZ = .6;

    let CG01 = {
      x:0,
      y:-.011,
      z:2.875+.2,
      Rx:0,
      Ry:0,
      Rz:0,
    }

    // THREE 01 
    let Cube01 = new THREE.Mesh(new THREE.BoxBufferGeometry(sizeX*2,sizeY*2,sizeZ*2),StageMaterial);
    Cube01.position.set(CG01.x,CG01.y,CG01.z);
    Cube01.rotation.set(CG01.Rx*Math.PI/180,CG01.Ry*Math.PI/180,CG01.Rz*Math.PI/180)
    Stage.add(Cube01);
    this.StageThreeArray.push(Cube01);
    
    // CANNON 01
    let Cube001 = new CANNON.Body({mass:0,material:this.GolfStageMaterial});
    Cube001.addShape(new CANNON.Box(new CANNON.Vec3(sizeX,sizeY,sizeZ)),new CANNON.Vec3(0,0,-.2));
    Cube001.addShape(new CANNON.Box(new CANNON.Vec3(sizeX*.08,.07,sizeZ*.5)),new CANNON.Vec3(-sizeX,.04,-.3-.2));
    Cube001.addShape(new CANNON.Box(new CANNON.Vec3(sizeX*.08,.07,sizeZ*.5)),new CANNON.Vec3(sizeX,.04,-.3-.2));
    var shape = this.CreateCANNONCirclePlane(0,.12,.73,0*Math.PI/180,180*Math.PI/180,20);
    Cube001.addShape(shape,new CANNON.Vec3(0,0,-.13-.2))

    this.world02.addBody(Cube001)
    this.StageCannnonArray.push(Cube001)


    sizeX = .8;
    sizeY = .01;
    sizeZ = 1.4;

    let CG02 = {
      x:0,
      y:-.011,
      z:.875,
      Rx:0,
      Ry:0,
      Rz:0,
    }

    // THREE 02 
    let Cube02 = new THREE.Mesh(new THREE.BoxBufferGeometry(sizeX*2,sizeY*2,sizeZ*2),StageMaterial);
    Cube02.position.set(CG02.x,CG02.y,CG02.z);
    Cube02.rotation.set(CG02.Rx*Math.PI/180,CG02.Ry*Math.PI/180,CG02.Rz*Math.PI/180)
    Stage.add(Cube02);
    this.StageThreeArray.push(Cube02);
    
    // CANNON 02
    let Cube002 = new CANNON.Body({mass:0,material:this.GolfStageMaterial});
    Cube002.addShape(new CANNON.Box(new CANNON.Vec3(sizeX,sizeY,sizeZ)),new CANNON.Vec3(0,0,0));
    Cube002.addShape(new CANNON.Box(new CANNON.Vec3(sizeX*.08,.07,sizeZ)),new CANNON.Vec3(-sizeX,.04,0));
    Cube002.addShape(new CANNON.Box(new CANNON.Vec3(sizeX*.08,.07,sizeZ)),new CANNON.Vec3(sizeX,.04,0));
    this.world02.addBody(Cube002)
    this.StageCannnonArray.push(Cube002)
    

    sizeX = .14;
    sizeY = .1;
    sizeZ = .035;

    let CG03 = {
      x:0,
      y:.1,
      z:0,
      Rx:0,
      Ry:0,
      Rz:0,
    }

    // THREE 03 
    let Cube03 = new THREE.Mesh(new THREE.BoxBufferGeometry(sizeX*2,sizeY*2,sizeZ*2),StageMaterial);
    Cube03.position.set(CG03.x,CG03.y,CG03.z);
    Cube03.rotation.set(CG03.Rx*Math.PI/180,CG03.Ry*Math.PI/180,CG03.Rz*Math.PI/180)
    Stage.add(Cube03);
    this.StageThreeArray.push(Cube03);
    
    // CANNON 03
    let Cube003 = new CANNON.Body({mass:0,material:this.GolfStageMaterial});
    Cube003.addShape(new CANNON.Box(new CANNON.Vec3(sizeX,sizeY,sizeZ)),new CANNON.Vec3(-.6,0,0));
    Cube003.addShape(new CANNON.Box(new CANNON.Vec3(sizeX,sizeY,sizeZ)),new CANNON.Vec3(.6,0,0));
    this.world02.addBody(Cube003)
    this.StageCannnonArray.push(Cube003)


    sizeX = .16;
    sizeY = .1;
    sizeZ = .025;

    let CG04 = {
      x:0,
      y:0,
      z:0,
      Rx:0,
      Ry:0,
      Rz:0,
    }
    // THREE 04 
    let Cube04 = new THREE.Mesh(new THREE.BoxBufferGeometry(sizeX*2,sizeY*2,sizeZ*2),StageMaterial);
    Cube04.position.set(CG04.x,CG04.y,CG04.z);
    Cube04.rotation.set(CG04.Rx*Math.PI/180,CG04.Ry*Math.PI/180,CG04.Rz*Math.PI/180)
    Stage.add(Cube04);
    this.StageThreeArray.push(Cube04);
    

    // CANNON 04
    var quat = new CANNON.Quaternion();

    let quatThree = new THREE.Mesh;
    quatThree.rotation.set(-Math.PI/2,0,108*Math.PI/180);
    quat.set(quatThree.quaternion.x,quatThree.quaternion.y,quatThree.quaternion.z,quatThree.quaternion.w)
    quat.normalize();

    let Cube004 = new CANNON.Body({mass:0,material:this.GolfStageMaterial});
    
    var shape = this.CannonHalfCylinder(.44,.47,.3,6,.96);
    Cube004.addShape(shape,new CANNON.Vec3(0,.15,0),quat);


    quatThree.rotation.set(-Math.PI/2,0,(108+180)*Math.PI/180);
    quat.set(quatThree.quaternion.x,quatThree.quaternion.y,quatThree.quaternion.z,quatThree.quaternion.w)
    quat.normalize();

    var shape = this.CannonHalfCylinder(.44,.47,.3,6,.96);
    Cube004.addShape(shape,new CANNON.Vec3(0,.15,0),quat);


    // Cube004.addShape(new CANNON.Box(new CANNON.Vec3(.02,.4,.13)),new CANNON.Vec3(.15,.15,0));
    // Cube004.addShape(new CANNON.Box(new CANNON.Vec3(.02,.4,.13)),new CANNON.Vec3(-.15,.15,0));

    var quat = new CANNON.Quaternion(.5,0,0,-.5);
    quat.normalize();

    Cube004.addShape(new CANNON.Cylinder(.3,.4,1,8),new CANNON.Vec3(0,.8,0),quat);
    Cube004.addShape(new CANNON.Cylinder(.38,.38,.12,8),new CANNON.Vec3(0,1.2,0),quat);
    Cube004.addShape(new CANNON.Cylinder(.1,.42,.4,8),new CANNON.Vec3(0,1.5,0),quat);

    this.world02.addBody(Cube004)
    this.StageCannnonArray.push(Cube004)




    sizeX = .142;
    sizeY = .42;
    sizeZ = .03;

    let CG05 = {
      x:0,
      y:1.2,
      z:.48,
      Rx:0,
      Ry:0,
      Rz:0,
    }
    // THREE 05
    let Cube05 = new THREE.Mesh(new THREE.BoxBufferGeometry(sizeX*2,sizeY*2,sizeZ*2),StageMaterial);
    Cube05.position.set(CG05.x,CG05.y,CG05.z);
    Cube05.rotation.set(CG05.Rx*Math.PI/180,CG05.Ry*Math.PI/180,CG05.Rz*Math.PI/180);
    Stage.add(Cube05);
    this.StageThreeArray.push(Cube05);

    // CANNON 05
    let Cube005 = new CANNON.Body({mass:0,material:this.GolfStageMaterial});
    Cube005.addShape(new CANNON.Box(new CANNON.Vec3(sizeX,sizeY,sizeZ)),new CANNON.Vec3(-.128,-.68,0));
    Cube005.addShape(new CANNON.Box(new CANNON.Vec3(sizeX,sizeY,sizeZ)),new CANNON.Vec3(.128,.68,0));
    Cube005.addShape(new CANNON.Box(new CANNON.Vec3(sizeY,sizeX,sizeZ)),new CANNON.Vec3(.68,-.128,0));
    Cube005.addShape(new CANNON.Box(new CANNON.Vec3(sizeY,sizeX,sizeZ)),new CANNON.Vec3(-.68,.128,0));
    this.windmillcannon.push(Cube005);
    this.world02.addBody(Cube005);
    this.StageCannnonArray.push(Cube005);


    sizeX = .15;
    sizeY = .2;
    sizeZ = .15;

    let CG06 = {
      x:0,
      y:0,
      z:-1.97,
      Rx:0,
      Ry:0,
      Rz:0,
    }
    // THREE 06
    let Cube06 = new THREE.Mesh(new THREE.BoxBufferGeometry(sizeX*2,sizeY*2,sizeZ*2),StageMaterial);
    Cube06.position.set(CG06.x,CG06.y,CG06.z);
    Cube06.rotation.set(CG06.Rx*Math.PI/180,CG06.Ry*Math.PI/180,CG06.Rz*Math.PI/180);
    Stage.add(Cube06);
    this.StageThreeArray.push(Cube06);

    // CANNON 06
    let Cube006 = new CANNON.Body({mass:0,material:this.GolfStageMaterial});
    var shape = this.CreateCANNONCirclePlane(0,.12,1.6,118*Math.PI/180,425*Math.PI/180,20);
    Cube006.addShape(shape,new CANNON.Vec3(0,0,-.01));
    var shape = this.CreateCANNONPlane(0,1.8,.25,0,0*Math.PI/180,380*Math.PI/180,20);
    Cube006.addShape(shape,new CANNON.Vec3(0,0,0));
    var shape = this.CreateCANNONCirclePlane(0,.2,.25,0*Math.PI/180,380*Math.PI/180,10);
    Cube006.addShape(shape,new CANNON.Vec3(0,-.2,0));

    var quat = new CANNON.Quaternion(.5,0,0,.5);
    quat.normalize();
    Cube006.addShape(new CANNON.Cylinder(.025,.025,1,6),new CANNON.Vec3(0,0.25,0),quat);
    this.world02.addBody(Cube006);
    this.StageCannnonArray.push(Cube006);
    

    sizeX = .15;
    sizeY = .2;
    sizeZ = .15;

    let CG07 = {
      x:0,
      y:0,
      z:-1.97,
      Rx:0,
      Ry:0,
      Rz:0,
    }
    // THREE 07
    let Cube07 = new THREE.Mesh(new THREE.BoxBufferGeometry(sizeX*2,sizeY*2,sizeZ*2),StageMaterial);
    Cube07.position.set(CG07.x,CG07.y,CG07.z);
    Cube07.rotation.set(CG07.Rx*Math.PI/180,CG07.Ry*Math.PI/180,CG07.Rz*Math.PI/180);
    Stage.add(Cube07);
    this.StageThreeArray.push(Cube07);

    // CANNON 07
    let Cube007 = new CANNON.Body({mass:0,material:this.GoalMaterial});

    var quat = new CANNON.Quaternion(.5,0,0,.5);
    quat.normalize();
    Cube007.addShape(new CANNON.Box(new CANNON.Vec3(.25,.25,.1)),new CANNON.Vec3(0,-0.25,0),quat);
    this.world02.addBody(Cube007);
    this.StageCannnonArray.push(Cube007);
    
    gsap.delayedCall(1,()=>{
      this.SetStageCannonPosition();
    })
  }

  SetStageCannonPosition(){
    var Position = new THREE.Vector3();
    var Quaternion = new THREE.Quaternion();
    for(var i=0;i<this.StageThreeArray.length;i++){
      // P
      Position.setFromMatrixPosition(this.StageThreeArray[i].matrixWorld);
      this.StageCannnonArray[i].position.set(Position.x,Position.y,Position.z);

      // Q
      Quaternion.setFromRotationMatrix(this.StageThreeArray[i].matrixWorld)
      this.StageCannnonArray[i].quaternion.set(Quaternion.x,Quaternion.y,Quaternion.z,Quaternion.w);
    }
  }

  CannonHalfCylinder( radiusTop, radiusBottom, height , numSegments, pie ) {
    var N = numSegments,
        verts = [],
        axes = [],
        faces = [],
        bottomface = [],
        topface = [],
        
        cos = Math.cos,
        sin = Math.sin;

    // First bottom point
    verts.push(new CANNON.Vec3(radiusBottom*cos(0),
                               radiusBottom*sin(0),
                               -height*0.5));
    bottomface.push(0);

    // First top point
    verts.push(new CANNON.Vec3(radiusTop*cos(0),
                               radiusTop*sin(0),
                               height*0.5));
    topface.push(1);

    for(var i=0; i<N; i++){
        var theta = Math.PI*pie/N * (i+1);
        var thetaN = Math.PI*pie/N * (i+0.5);
        if(i<N-1){
            // Bottom
            verts.push(new CANNON.Vec3(radiusBottom*cos(theta),
                                       radiusBottom*sin(theta),
                                       -height*0.5));
            bottomface.push(2*i+2);
            // Top
            verts.push(new CANNON.Vec3(radiusTop*cos(theta),
                                       radiusTop*sin(theta),
                                       height*0.5));
            topface.push(2*i+3);

            // Face
            faces.push([2*i+2, 2*i+3, 2*i+1,2*i]);
        } else {
            faces.push([0,1, 2*i+1, 2*i]); // Connect
        }

        // Axis: we can cut off half of them if we have even number of segments
        if(N % 2 === 1 || i < N / 2){
            axes.push(new CANNON.Vec3(cos(thetaN), sin(thetaN), 0));
        }
    }
    faces.push(topface);
    axes.push(new CANNON.Vec3(0,0,1));

    // Reorder bottom face
    var temp = [];
    for(var i=0; i<bottomface.length; i++){
        temp.push(bottomface[bottomface.length - i - 1]);
    }
    faces.push(temp);

    var shape = new CANNON.ConvexPolyhedron( verts, faces);
    return shape;
  }

  CreateCANNONCirclePlane(H1:number,H2:number,radius:number,N0:number,N:number,Ni:number){
    var vertTest=[];
    var number=0;
    for(var i=N0;i<N;i+=Math.PI/Ni){
      if(number%2==0){
        vertTest.push(new CANNON.Vec3(Math.cos(i)*radius,H1,Math.sin(i)*radius));
      } else {
        vertTest.push(new CANNON.Vec3(Math.cos(i)*radius,H2,Math.sin(i)*radius));
      }
      number++;
    }
    var faceTest=[];
    faceTest.push([0,2,1]);
    faceTest.push([1,2,3]);// 2
    faceTest.push([3,2,4]);
    var zero=3,one=4,two=5;
    for(var i=0;i<vertTest.length-2-3;i++){
      if(i%2==0){
        faceTest.push([zero,one,two]);
      } else {
        faceTest.push([one,zero,two]);
      }
      zero++;
      one++;
      two++;
    }

    var cannonShape = new CANNON.ConvexPolyhedron(vertTest,faceTest);
    return cannonShape;
  }

  CreateCANNONPlane(H:number,Oradius:number,Iradius:number,Hminus:number,N0:number,N:number,Ni:number){
    var vertTest=[];
    var number=0;
  
    for(var i=N0;i<N;i+=Math.PI/Ni){
      if(number%2==0){
        H-=Hminus;
        vertTest.push(new CANNON.Vec3(Math.cos(-i)*Oradius,H,Math.sin(-i)*Oradius));
      } else {
        vertTest.push(new CANNON.Vec3(Math.cos(-i)*Iradius,H,Math.sin(-i)*Iradius));
      }
      number++;
    }
    var faceTest=[];
    faceTest.push([0,2,1]);
    faceTest.push([1,2,3]);// 2
    faceTest.push([3,2,4]);
    var zero=3,one=4,two=5;
    for(var i=0;i<vertTest.length-2-3;i++){
      if(i%2==0){
        faceTest.push([zero,one,two]);
      } else {
        faceTest.push([one,zero,two]);
      }
      zero++;
      one++;
      two++;
    }

    var cannonShape = new CANNON.ConvexPolyhedron(vertTest,faceTest);
    return cannonShape;
  }
}


function CannonDebugRenderer(scene, world) {
  this.scene = scene;
  this.world = world;

  this._meshes = [];

  this._material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
  this._sphereGeometry = new THREE.SphereGeometry(1);
  this._boxGeometry = new THREE.BoxGeometry(1, 1, 1);
  this._planeGeometry = new THREE.PlaneGeometry(10, 10, 10, 10);
  this._cylinderGeometry = new THREE.CylinderGeometry(1, 1, 10, 10);
};

CannonDebugRenderer.prototype = {
  tmpVec0: new CANNON.Vec3(),
  tmpVec1: new CANNON.Vec3(),
  tmpVec2: new CANNON.Vec3(),
  tmpQuat0: new CANNON.Vec3(),

  update: function () {
    var bodies = this.world.bodies;
    var meshes = this._meshes;
    var shapeWorldPosition = this.tmpVec0;
    var shapeWorldQuaternion = this.tmpQuat0;

    var meshIndex = 0;

    for (var i = 0; i !== bodies.length; i++) {
      var body = bodies[i];

      for (var j = 0; j !== body.shapes.length; j++) {
        var shape = body.shapes[j];

        this._updateMesh(meshIndex, body, shape);

        var mesh = meshes[meshIndex];

        if (mesh) {

          // Get world position
          body.quaternion.vmult(body.shapeOffsets[j], shapeWorldPosition);
          body.position.vadd(shapeWorldPosition, shapeWorldPosition);

          // Get world quaternion
          body.quaternion.mult(body.shapeOrientations[j], shapeWorldQuaternion);

          // Copy to meshes
          mesh.position.copy(shapeWorldPosition);
          mesh.quaternion.copy(shapeWorldQuaternion);
        }

        meshIndex++;
      }
    }

    for (var i = meshIndex; i < meshes.length; i++) {
      var mesh = meshes[i];
      if (mesh) {
        this.scene.remove(mesh);
      }
    }

    meshes.length = meshIndex;
  },

  _updateMesh: function (index, body, shape) {
    var mesh = this._meshes[index];
    if (!this._typeMatch(mesh, shape)) {
      if (mesh) {
        this.scene.remove(mesh);
      }
      mesh = this._meshes[index] = this._createMesh(shape);
    }
    this._scaleMesh(mesh, shape);
  },

  _typeMatch: function (mesh, shape) {
    if (!mesh) {
      return false;
    }
    var geo = mesh.geometry;
    return (
      (geo instanceof THREE.SphereGeometry && shape instanceof CANNON.Sphere) ||
      (geo instanceof THREE.BoxGeometry && shape instanceof CANNON.Box) ||
      (geo instanceof THREE.PlaneGeometry && shape instanceof CANNON.Plane) ||
      (geo.id === shape.geometryId && shape instanceof CANNON.ConvexPolyhedron) ||
      (geo.id === shape.geometryId && shape instanceof CANNON.Heightfield)
    );
  },

  _createMesh: function (shape) {
    var mesh;
    var material = this._material;

    switch (shape.type) {

      case CANNON.Shape.types.SPHERE:
        mesh = new THREE.Mesh(this._sphereGeometry, material);
        break;

      case CANNON.Shape.types.BOX:
        mesh = new THREE.Mesh(this._boxGeometry, material);
        break;

      case CANNON.Shape.types.PLANE:
        mesh = new THREE.Mesh(this._planeGeometry, material);
        break;

      case CANNON.Shape.types.CONVEXPOLYHEDRON:
        // Create mesh
        var geo = new THREE.Geometry();

        // Add vertices
        for (var i = 0; i < shape.vertices.length; i++) {
          var v = shape.vertices[i];
          geo.vertices.push(new THREE.Vector3(v.x, v.y, v.z));
        }

        for (var i = 0; i < shape.faces.length; i++) {
          var face = shape.faces[i];

          // add triangles
          var a = face[0];
          for (var j = 1; j < face.length - 1; j++) {
            var b = face[j];
            var c = face[j + 1];
            geo.faces.push(new THREE.Face3(a, b, c));
          }
        }
        geo.computeBoundingSphere();
        geo.computeFaceNormals();

        mesh = new THREE.Mesh(geo, material);
        shape.geometryId = geo.id;
        break;

      case CANNON.Shape.types.HEIGHTFIELD:
        var geometry = new THREE.Geometry();

        var v0 = this.tmpVec0;
        var v1 = this.tmpVec1;
        var v2 = this.tmpVec2;
        for (var xi = 0; xi < shape.data.length - 1; xi++) {
          for (var yi = 0; yi < shape.data[xi].length - 1; yi++) {
            for (var k = 0; k < 2; k++) {
              shape.getConvexTrianglePillar(xi, yi, k === 0);
              v0.copy(shape.pillarConvex.vertices[0]);
              v1.copy(shape.pillarConvex.vertices[1]);
              v2.copy(shape.pillarConvex.vertices[2]);
              v0.vadd(shape.pillarOffset, v0);
              v1.vadd(shape.pillarOffset, v1);
              v2.vadd(shape.pillarOffset, v2);
              geometry.vertices.push(
                new THREE.Vector3(v0.x, v0.y, v0.z),
                new THREE.Vector3(v1.x, v1.y, v1.z),
                new THREE.Vector3(v2.x, v2.y, v2.z)
              );
              var i = geometry.vertices.length - 3;
              geometry.faces.push(new THREE.Face3(i, i + 1, i + 2));
            }
          }
        }
        geometry.computeBoundingSphere();
        geometry.computeFaceNormals();
        mesh = new THREE.Mesh(geometry, material);
        shape.geometryId = geometry.id;
        break;
    }

    if (mesh) {
      this.scene.add(mesh);
    }

    return mesh;
  },

  _scaleMesh: function (mesh, shape) {
    switch (shape.type) {

      case CANNON.Shape.types.SPHERE:
        var radius = shape.radius;
        mesh.scale.set(radius, radius, radius);
        break;

      case CANNON.Shape.types.BOX:
        mesh.scale.copy(shape.halfExtents);
        mesh.scale.multiplyScalar(2);
        break;

      case CANNON.Shape.types.CONVEXPOLYHEDRON:
        mesh.scale.set(1, 1, 1);
        break;

      case CANNON.Shape.types.HEIGHTFIELD:
        mesh.scale.set(1, 1, 1);
        break;

    }
  }
};
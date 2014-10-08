angular.module('MadProps')
  .directive('dronemodel', ['$window', function($window){
    return {
      restrict: 'EA',
      link: function(scope, element, attrs){
        /************************************************************
        THREEjs setup 
        ************************************************************/
        var context = document.getElementsByTagName('dronemodel')[0];
        var width = height = 500;
        var scene = new THREE.Scene();
        var camera = new THREE.PerspectiveCamera(75, width/height, 0.1, 1000);
        var renderer = new THREE.WebGLRenderer();
        renderer.setSize(width, height);
        context.appendChild(renderer.domElement);

        // create colored background skybox                                 edit this to change color: 0x######
        scene.add( new THREE.Mesh(new THREE.BoxGeometry(300,300,300), new THREE.MeshBasicMaterial({color: 0xffffff, side: THREE.BackSide})) );
        // create ambient skylight
        scene.add( new THREE.HemisphereLight(0xffffff,0xffffff,0.45));
        var light = new THREE.PointLight(0xffffff, 0.75, 200);
        light.position.set(0,100,0);
        scene.add(light);

        // move camera towards screen to [0,0,100]
        camera.position.z = 250;

        /******************************************************
        loader

        example options:
          {
            material: 
            pathURL: './assets/N5065_Motor.stl',
            scale: 1,
            position: [x,y,z],
            rotation: [x,y,z]
          }

        ******************************************************/
        var assetLoader = function(context, options, callback){
          var loader = new THREE.STLLoader();
          loader.addEventListener('load', function(event){
            var geometry = event.content;
            var model = new THREE.Mesh(geometry, options.material);
            
            if(options.position){
              model.position.fromArray(options.position);
            }
            if(options.rotation){
              model.rotation.fromArray(options.rotation);
            }
            if(options.scale){
              model.scale.fromArray([options.scale,options.scale,options.scale]);
            }
            if(options.name){
              model.name = options.name;
            }

            context.add(model);
            if(callback){
              callback();
            }
          });
          loader.load(options.pathURL);
        }

        {/************ 3D Workspace upper edge ******************/
          var bodyColor = new THREE.MeshLambertMaterial({color: 0xffffff});
          var propellerColor = new THREE.MeshLambertMaterial({color: 0xffffff});
          var motorColor = new THREE.MeshLambertMaterial({color: 0x0578FF});

          var tesselBoard_boardColor = new THREE.MeshLambertMaterial({color: 0xD60000});
          var tesselBoard_decoColor = new THREE.MeshLambertMaterial({color: 0x364040});

          var tesselBoard_pinColor = new THREE.MeshLambertMaterial({color: 0x89A1A0});

          var esc_boardColor = new THREE.MeshLambertMaterial({color: 0x1D238A});
          var esc_deco1Color = new THREE.MeshLambertMaterial({color: 0x1E1E1E});
          var esc_deco2Color = new THREE.MeshLambertMaterial({color: 0x364040});
          var esc_deco3Color = new THREE.MeshLambertMaterial({color: 0x878787});

          var powerswitch_bodyColor = new THREE.MeshLambertMaterial({color: 0x1E1E1E});
          var powerswitch_switchColor = new THREE.MeshLambertMaterial({color: 0x409DFF});
          var powerswitch_teethColor = new THREE.MeshLambertMaterial({color: 0x89A1A0});

          var drone = new THREE.Object3D();

          var currPitch = 0;
          var currYaw = 0;
          var currRoll = 0;

          var pitchArr = [];
          var yawArr = [];
          var rollArr = [];

          // Because the engines are built from two separate models, sometimes the load time of one component will
          // be faster than the other making their index in the child array of their parent inconsistant. To fix this 
          // issue we determine which model is the propeller at runtime.

          // References to the engines
          var engine1 = null;
          var engine2 = null;
          var engine3 = null;
          var engine4 = null;

          // References to the propellers to be set once the server recieves first throttle data
          var prop1 = null;
          var prop2 = null;
          var prop3 = null;
          var prop4 = null;
          
          {// load all assets async
            // var _frameLoaded = false;
            // var _engineTemplateL_motorLoaded = false;
            // var _engineTemplateL_propLoaded = false;
            // var _engineTemplateR_motorLoaded = false;
            // var _engineTemplateR_propLoaded = false;

            var _body_main = false;
            var _body_posts = false;
            var _prop_left = false;
            var _prop_right = false;
            var _motor = false;
            var _tesselBoard_board = false;
            var _tesselBoard_deco = false;
            var _servo_board = false;
            var _servo_deco = false;
            var _servo_pins = false;
            var _esc_board = false;
            var _esc_deco1 = false;
            var _esc_deco2 = false;
            var _esc_deco3 = false;
            var _powerswitch_body = false;
            var _powerswitch_switch = false;
            var _powerswitch_teeth = false;
            
            var loadProgress = {};

            /****************************
            body loaded flag
            ****************************/
            Object.defineProperty(loadProgress, 'body_main', {
              enumerable: true,
              get: function(){
                return _body_main;
              },
              set: function(value){
                _body_main = value;
                if(checkProgress()){
                  loadComplete();
                }
              }
            });

            Object.defineProperty(loadProgress, 'body_posts', {
              enumerable: true,
              get: function(){
                return _body_posts;
              },
              set: function(value){
                _body_posts = value;
                if(checkProgress()){
                  loadComplete();
                }
              }
            });

            /****************************
            prop loaded flag
            ****************************/
            Object.defineProperty(loadProgress, 'prop_left', {
              enumerable: true,
              get: function(){
                return _prop_left;
              },
              set: function(value){
                _prop_left = value;
                if(checkProgress()){
                  loadComplete();
                }
              }
            });

            Object.defineProperty(loadProgress, 'prop_right', {
              enumerable: true,
              get: function(){
                return _prop_right;
              },
              set: function(value){
                _prop_right = value;
                if(checkProgress()){
                  loadComplete();
                }
              }
            });

            /****************************
            motor loaded flag
            ****************************/
            Object.defineProperty(loadProgress, 'motor', {
              enumerable: true,
              get: function(){
                return _motor;
              },
              set: function(value){
                _motor = value;
                if(checkProgress()){
                  loadComplete();
                }
              }
            });

            /****************************
            tesselBoard loaded flag
            ****************************/
            Object.defineProperty(loadProgress, 'tesselBoard_board', {
              enumerable: true,
              get: function(){
                return _tesselBoard_board;
              },
              set: function(value){
                _tesselBoard_board = value;
                if(checkProgress()){
                  loadComplete();
                }
              }
            });

            Object.defineProperty(loadProgress, 'tesselBoard_deco', {
              enumerable: true,
              get: function(){
                return _tesselBoard_deco;
              },
              set: function(value){
                _tesselBoard_deco = value;
                if(checkProgress()){
                  loadComplete();
                }
              }
            });

            /****************************
            servo loaded flag
            ****************************/
            Object.defineProperty(loadProgress, 'servo_board', {
              enumerable: true,
              get: function(){
                return _servo_board;
              },
              set: function(value){
                _servo_board = value;
                if(checkProgress()){
                  loadComplete();
                }
              }
            });

            Object.defineProperty(loadProgress, 'servo_deco', {
              enumerable: true,
              get: function(){
                return _servo_deco;
              },
              set: function(value){
                _servo_deco = value;
                if(checkProgress()){
                  loadComplete();
                }
              }
            });

            Object.defineProperty(loadProgress, 'servo_pins', {
              enumerable: true,
              get: function(){
                return _servo_pins;
              },
              set: function(value){
                _servo_pins = value;
                if(checkProgress()){
                  loadComplete();
                }
              }
            });

            /****************************
            esc loaded flag
            ****************************/
            Object.defineProperty(loadProgress, 'esc_board', {
              enumerable: true,
              get: function(){
                return _esc_board;
              },
              set: function(value){
                _esc_board = value;
                if(checkProgress()){
                  loadComplete();
                }
              }
            });

            Object.defineProperty(loadProgress, 'esc_deco1', {
              enumerable: true,
              get: function(){
                return _esc_deco1;
              },
              set: function(value){
                _esc_deco1 = value;
                if(checkProgress()){
                  loadComplete();
                }
              }
            });

            Object.defineProperty(loadProgress, 'esc_deco2', {
              enumerable: true,
              get: function(){
                return _esc_deco2;
              },
              set: function(value){
                _esc_deco2 = value;
                if(checkProgress()){
                  loadComplete();
                }
              }
            });

            Object.defineProperty(loadProgress, 'esc_deco3', {
              enumerable: true,
              get: function(){
                return _esc_deco3;
              },
              set: function(value){
                _esc_deco3 = value;
                if(checkProgress()){
                  loadComplete();
                }
              }
            });

            /****************************
            powerswitch loaded flag
            ****************************/
            Object.defineProperty(loadProgress, 'powerswitch_body', {
              enumerable: true,
              get: function(){
                return _powerswitch_body;
              },
              set: function(value){
                _powerswitch_body = value;
                if(checkProgress()){
                  loadComplete();
                }
              }
            });

            Object.defineProperty(loadProgress, 'powerswitch_switch', {
              enumerable: true,
              get: function(){
                return _powerswitch_switch;
              },
              set: function(value){
                _powerswitch_switch = value;
                if(checkProgress()){
                  loadComplete();
                }
              }
            });

            Object.defineProperty(loadProgress, 'powerswitch_teeth', {
              enumerable: true,
              get: function(){
                return _powerswitch_teeth;
              },
              set: function(value){
                _powerswitch_teeth = value;
                if(checkProgress()){
                  loadComplete();
                }
              }
            });

            // check if all loaded flags are true
            var checkProgress = function(){
              for(var key in loadProgress){
                if(!loadProgress[key]){
                  return false;
                }
              }
              return true;
            };
          }

          var _wrapper = new THREE.Object3D();

          //////////////////////////////////////////////////////
          var body = new THREE.Object3D();
            // load body
            assetLoader(body, {
              material: bodyColor,
              pathURL: 'assets/dronebody.stl',
              scale: 0.5,
              position: [0,0,-4],
              rotation: [
                THREE.Math.degToRad(90),// x
                THREE.Math.degToRad(0), // y
                THREE.Math.degToRad(0)  // z
              ]
            }, function(){
              loadProgress.body_main = true;
            });
            // load posts
            assetLoader(body, {
              material: bodyColor,
              pathURL: 'assets/dronebody_posts.stl',
              scale: 0.5,
              position: [0,0,-4],
              rotation: [
                THREE.Math.degToRad(90),// x
                THREE.Math.degToRad(0), // y
                THREE.Math.degToRad(0)  // z
              ]
            }, function(){
              loadProgress.body_posts = true;
            });

          //////////////////////////////////////////////////////
          var _motorTEMP = new THREE.Object3D();
          var _propellerLeftTEMP = new THREE.Object3D();
          var _propellerRightTEMP = new THREE.Object3D();
          var clockwiseMotor = new THREE.Object3D();
          var counterClockwiseMotor = new THREE.Object3D();
            // load motor
            assetLoader(_motorTEMP, {
              material: motorColor,
              pathURL: 'assets/motor.stl',
              scale: 0.5,
              position: [0,0,0],
              rotation: [
                THREE.Math.degToRad(-90),// x
                THREE.Math.degToRad(0), // y
                THREE.Math.degToRad(0)  // z
              ]
            }, function(){
              clockwiseMotor.add(_motorTEMP.children[0].clone());
              counterClockwiseMotor.add(_motorTEMP.children[0].clone());
              _motorTEMP = null;
              loadProgress.motor = true;
            });
            // load left propeller
            assetLoader(_propellerLeftTEMP, {
              material: propellerColor,
              pathURL: 'assets/prop_left.stl',
              scale: 0.55,
              position: [-1,15,0.4],// DONT TOUCH
              rotation: [
                THREE.Math.degToRad(-90),// x
                THREE.Math.degToRad(0), // y
                THREE.Math.degToRad(0)  // z
              ]
            }, function(){
              clockwiseMotor.add(_propellerLeftTEMP.children[0].clone());
              _propellerLeftTEMP
              loadProgress.prop_left = true;
            });
            // load left propeller
            assetLoader(_propellerRightTEMP, {
              material: propellerColor,
              pathURL: 'assets/prop_right.stl',
              scale: 0.55,
              position: [-2.5,15,3],// DONT TOUCH
              rotation: [
                THREE.Math.degToRad(-90),// x
                THREE.Math.degToRad(0), // y
                THREE.Math.degToRad(0)  // z
              ]
            }, function(){
              counterClockwiseMotor.add(_propellerRightTEMP.children[0].clone());
              _propellerRightTEMP = null;
              loadProgress.prop_right = true;
            });

          //////////////////////////////////////////////////////
          var tesselBoard = new THREE.Object3D();
            // load board
            assetLoader(tesselBoard, {
              material: tesselBoard_boardColor,
              pathURL: 'assets/tesselBoard_board.stl',
              scale: 0.5,
              position: [0,0,0],
              rotation: [
                THREE.Math.degToRad(-90),// x
                THREE.Math.degToRad(0), // y
                THREE.Math.degToRad(0)  // z
              ]
            }, function(){
              loadProgress.tesselBoard_board = true;
            });
            // load decorations
            assetLoader(tesselBoard, {
              material: tesselBoard_decoColor,
              pathURL: 'assets/tesselBoard_deco.stl',
              scale: 0.5,
              position: [0,0,0],
              rotation: [
                THREE.Math.degToRad(-90),// x
                THREE.Math.degToRad(0), // y
                THREE.Math.degToRad(0)  // z
              ]
            }, function(){
              loadProgress.tesselBoard_deco = true;
            });
          
          //////////////////////////////////////////////////////
          var servo = new THREE.Object3D();
          // load board
            assetLoader(servo, {
              material: tesselBoard_boardColor,
              pathURL: 'assets/servo_board.stl',
              scale: 0.35,
              position: [0,0,0],
              rotation: [
                THREE.Math.degToRad(-90),// x
                THREE.Math.degToRad(0), // y
                THREE.Math.degToRad(0)  // z
              ]
            }, function(){
              loadProgress.servo_board = true;
            });
            // load decorations
            assetLoader(servo, {
              material: tesselBoard_decoColor,
              pathURL: 'assets/servo_deco.stl',
              scale: 0.35,
              position: [0,0,0],
              rotation: [
                THREE.Math.degToRad(-90),// x
                THREE.Math.degToRad(0), // y
                THREE.Math.degToRad(0)  // z
              ]
            }, function(){
              loadProgress.servo_deco = true;
            });
            // load pins
            assetLoader(servo, {
              material: tesselBoard_pinColor,
              pathURL: 'assets/servo_pins.stl',
              scale: 0.35,
              position: [0,0,0],
              rotation: [
                THREE.Math.degToRad(-90),// x
                THREE.Math.degToRad(0), // y
                THREE.Math.degToRad(0)  // z
              ]
            }, function(){
              loadProgress.servo_pins = true;
            });

          //////////////////////////////////////////////////////
          var powerswitch = new THREE.Object3D();
            // load body
            assetLoader(powerswitch, {
              material: powerswitch_bodyColor,
              pathURL: 'assets/powerswitch_body.stl',
              scale: 0.4,
              position: [0,0,0],
              rotation: [
                THREE.Math.degToRad(-90),// x
                THREE.Math.degToRad(0), // y
                THREE.Math.degToRad(0)  // z
              ]
            }, function(){
              loadProgress.powerswitch_body = true;
            });
            // load teeth
            assetLoader(powerswitch, {
              material: powerswitch_teethColor,
              pathURL: 'assets/powerswitch_teeth.stl',
              scale: 0.4,
              position: [0,0,0],
              rotation: [
                THREE.Math.degToRad(-90),// x
                THREE.Math.degToRad(0), // y
                THREE.Math.degToRad(0)  // z
              ]
            }, function(){
              loadProgress.powerswitch_teeth = true;
            });
            // load switch
            assetLoader(powerswitch, {
              material: powerswitch_switchColor,
              pathURL: 'assets/powerswitch_switch.stl',
              scale: 0.4,
              position: [0,0,0],
              rotation: [
                THREE.Math.degToRad(-90),// x
                THREE.Math.degToRad(0), // y
                THREE.Math.degToRad(0)  // z
              ]
            }, function(){
              // add green board switch is attached to
              powerswitch.add(
                (function(){
                  var geom = new THREE.BoxGeometry(28,1,18);
                  var mat = new THREE.MeshLambertMaterial({color:0x009900});
                  var mesh = new THREE.Mesh(geom, mat);
                  mesh.position.set(1,6,12);
                  return mesh;
                })()
              );
              loadProgress.powerswitch_switch = true;
            });

            //////////////////////////////////////////////////////
            var esc = new THREE.Object3D();
            // load board
            assetLoader(esc, {
              material: esc_boardColor,
              pathURL: 'assets/esc_board.stl',
              scale: 0.55,
              position: [0,0,0],
              rotation: [
                THREE.Math.degToRad(-90),// x
                THREE.Math.degToRad(0), // y
                THREE.Math.degToRad(0)  // z
              ]
            }, function(){
              loadProgress.esc_board = true;
            });
            // load deco1
            assetLoader(esc, {
              material: esc_deco1Color,
              pathURL: 'assets/esc_deco1.stl',
              scale: 0.55,
              position: [0,0,0],
              rotation: [
                THREE.Math.degToRad(-90),// x
                THREE.Math.degToRad(0), // y
                THREE.Math.degToRad(0)  // z
              ]
            }, function(){
              loadProgress.esc_deco1 = true;
            });
            // load deco2
            assetLoader(esc, {
              material: esc_deco2Color,
              pathURL: 'assets/esc_deco2.stl',
              scale: 0.55,
              position: [0,0,0],
              rotation: [
                THREE.Math.degToRad(-90),// x
                THREE.Math.degToRad(0), // y
                THREE.Math.degToRad(0)  // z
              ]
            }, function(){
              loadProgress.esc_deco2 = true;
            });
            // load deco3
            assetLoader(esc, {
              material: esc_deco3Color,
              pathURL: 'assets/esc_deco3.stl',
              scale: 0.55,
              position: [0,0,0],
              rotation: [
                THREE.Math.degToRad(-90),// x
                THREE.Math.degToRad(0), // y
                THREE.Math.degToRad(0)  // z
              ]
            }, function(){
              loadProgress.esc_deco3 = true;
            });

          //////////////////////////////////////////////////////

          // to be run once all assets loaded
          var loadComplete = function(){
            _wrapper.add(body);

            _wrapper.add(// add the battery
              (function(){
                var geom = new THREE.BoxGeometry(20,10,55);
                var mat = new THREE.MeshLambertMaterial({color:0x505050});
                var mesh = new THREE.Mesh(geom, mat);
                mesh.position.set(0,-11,0);
                return mesh;
              })()
            );

            tesselBoard.position.set(22,-3,0);
            tesselBoard.rotation.x = THREE.Math.degToRad(180);
            tesselBoard.rotation.y = THREE.Math.degToRad(-90);

            servo.position.set(-31,0,-13);
            servo.rotation.y = THREE.Math.degToRad(90);
            tesselBoard.add(servo);
            _wrapper.add(tesselBoard);

            esc.position.set(10,0,0);
            _wrapper.add(esc);

            powerswitch.position.set(-30,-10,1);
            powerswitch.rotation.y = THREE.Math.degToRad(90);
            _wrapper.add(powerswitch);

            var motors = new THREE.Object3D();
            motors.add(clockwiseMotor.clone());
              motors.children[motors.children.length-1].position.set(63,0,63);
            motors.add(counterClockwiseMotor.clone());
              motors.children[motors.children.length-1].position.set(-63,0,63);
            motors.add(clockwiseMotor.clone());
              motors.children[motors.children.length-1].position.set(-63,0,-63);
            motors.add(counterClockwiseMotor.clone());
              motors.children[motors.children.length-1].position.set(63,0,-63);
            _wrapper.add(motors);

            // camera.position.z = 100;
            // // camera.position.z = 75;

            // _wrapper.rotation.y = THREE.Math.degToRad(-45);
            // drone.position.setY(-20);

            // _wrapper.rotation.y = THREE.Math.degToRad(90);
            // _wrapper.rotation.z = THREE.Math.degToRad(90);

            drone.add(_wrapper);

            scene.add(drone);
            scope.threeVisualizerIsLoaded = true;
          };
        }/************ 3D Workspace lower edge ******************/

        // helper functions for easing between attitude changes

        var _inOutQuad = function(t, b, c, d){
          t /= d/2;
          if(t < 1){
            return c/2*t*t + b;
          }
          t--;
          return -c/2 * (t*(t-2) - 1) + b;
        };

        var _inOutLinear = function (t, b, c, d) {
          return c*t/d + b;
        };

        var easeMovement = function(b, c, d){
          var results = [];
          for(var t = 0; t < d; t++){
            results.push(_inOutLinear(t, b, c, d));
          }
          results.shift();
          results.push(c);
          return results
        };

        // the render loop
        var render = function () {
          if(document.getElementsByTagName('dronemodel').length){
            requestAnimationFrame(render);
          }

          // //DELETE ME!!!!!!
          // if(drone){
          //   drone.rotation.x += 0.01;
          //   drone.rotation.y += 0.01;
          // }

          //set attitude of drone
          if(drone && scope.attitude){
            var newPitch = Math.round(scope.attitude.pitch*(180/Math.PI));
            var newRoll = Math.round(scope.attitude.roll*(180/Math.PI));

            // check for diff in attitude
            if(newPitch !== currPitch){
              pitchArr = easeMovement(currPitch, newPitch, 25);
              currPitch = newPitch;
            }
            if(newRoll !== currRoll){
              rollArr = easeMovement(currRoll, newRoll, 25);
              currRoll = newRoll;
            }

            // apply attitude adjustments if available
            if(pitchArr.length){
              drone.rotation.x = pitchArr.shift()*(Math.PI/180);
            }
            if(rollArr.length){
              drone.rotation.z = rollArr.shift()*(Math.PI/180);
            }
          }

          // rotate each engine's propeller
          if(drone && scope.throttle){
            if(engine1){
              if(!prop1){// checks if propeller needs to be referenced
                engine1.children.forEach(function(mesh){
                  if(mesh.name === 'propeller'){
                    prop1 = mesh;// associates the THREEjs mesh with a prop variable for later referencing
                  }
                });
              }else{// propeller has already be assigned to a variable and is ready to be manipulated
                prop1.rotation.z -= scope.throttle.e1;
              }
            }
            if(engine2){
              if(!prop2){// checks if propeller needs to be referenced
                engine2.children.forEach(function(mesh){
                  if(mesh.name === 'propeller'){
                    prop2 = mesh;// associates the THREEjs mesh with a prop variable for later referencing
                  }
                });
              }else{// propeller has already be assigned to a variable and is ready to be manipulated
                prop2.rotation.z -= scope.throttle.e2;
              }
            }
            if(engine3){
              if(!prop3){// checks if propeller needs to be referenced
                engine3.children.forEach(function(mesh){
                  if(mesh.name === 'propeller'){
                    prop3 = mesh;// associates the THREEjs mesh with a prop variable for later referencing
                  }
                });
              }else{// propeller has already be assigned to a variable and is ready to be manipulated
                prop3.rotation.z += scope.throttle.e3;
              }
            }
            if(engine4){
              if(!prop4){// checks if propeller needs to be referenced
                engine4.children.forEach(function(mesh){
                  if(mesh.name === 'propeller'){
                    prop4 = mesh;// associates the THREEjs mesh with a prop variable for later referencing
                  }
                });
              }else{// propeller has already be assigned to a variable and is ready to be manipulated
                prop4.rotation.z += scope.throttle.e4;
              }
            }
          }

          renderer.render(scene, camera);
        };
        // kickoff render loop
        render();
      }
    }
  }]);

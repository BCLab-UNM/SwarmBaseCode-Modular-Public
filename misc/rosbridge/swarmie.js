
// Connecting to ROS
// -----------------
window.addEventListener('load', eventWindowLoaded, false);

function eventWindowLoaded () {
    runSwarmieWebsite();
}

function runSwarmieWebsite() {

  var Name = prompt("Please enter the robot's name.").toUpperCase();
  var robotRos = new ROSLIB.Ros({
      url : 'ws://' + Name + ':9090'
      });
    
    var laptopRos = new ROSLIB.Ros({
        url : 'ws://localhost:9090'
    });
  robotRos.on('connection', function() {
      console.log('Connected to websocket server.');
  });
    laptopRos.on('connection', function() {
        console.log('We are on');
    });

  robotRos.on('error', function(error) {
      console.log('Error connecting to websocket server: ', error);
  });

  robotRos.on('close', function() {
      console.log('Connection to websocket server closed.');
  });

// Publishing a Topic
// ------------------

    
  var robotMovement = new ROSLIB.Topic({
      ros : robotRos,
      name : '/' + Name + '/driveControl',
      messageType : 'geometry_msgs/Twist'
  });

  var fingerAction = new ROSLIB.Topic({
      ros : robotRos,
      name : '/' + Name + '/fingerAngle/cmd',
      messageType : 'std_msgs/Float32'
  });

  var wristAction = new ROSLIB.Topic({
      ros : robotRos,
      name : '/' + Name + '/wristAngle/cmd',
      messageType : 'std_msgs/Float32'
  });

  var robotMode = new ROSLIB.Topic({
      ros : robotRos,
      name : '/' + Name + '/mode',
      messageType : 'std_msgs/UInt8'
  });

    var move, finger, wrist, mode;

    function changesMode(auto) {
        mode = new ROSLIB.Message({
        data : auto
        });
        return mode;
    };

   // document.getElementById('button').addEventListener('click', changeRobotMode);
    var count = 0;

    $("#button").click(function() {
        count++;  
        count % 2 ? $runAuto() : $runManual();
    });
    
    function $runAuto () {
        $('#textonbutton').text('Auto');
        changesMode(2);
        robotMode.publish(mode);
    }
    function $runManual () {
        $('#textonbutton').text('Manual');
        changesMode(1);
        robotMode.publish(mode);
    }

  function moveWrist(up) {
      wrist = new ROSLIB.Message({
	  data : up
      });
      return wrist;
  };

  $(document).keydown(function(e){
      if (e.keyCode == 87) { //87 is "w" key
	  moveWrist(0); //up
	  wristAction.publish(wrist);
      } else if (e.keyCode == 83) { //83 is "s" key
	  moveWrist(1.25); //down
	  wristAction.publish(wrist);
      };
  });  

  function moveFingers(open) {
      finger = new ROSLIB.Message({
	  data : open
      });
      return finger;
  };

  $(document).keydown(function(e){
      if (e.keyCode == 65) { //"a" key
	  moveFingers(Math.PI / 2);
	  fingerAction.publish(finger);
      } else if (e.keyCode == 68) { //"d" key
	  moveFingers(0); //close
	  fingerAction.publish(finger);
      };
  }); 

  function driveCommand(left, right) {
      move = new ROSLIB.Message({
      linear : {
            x : left,
            y : 0,
            z : 0
      },
      angular : {
            x : 0,
            y : 0,
            z : right
      }
      });
      return move;
  };

  $(document).keydown(function(e){
      switch (e.keyCode) { 
      case 38: //up arrow
          e.preventDefault();
          driveCommand(120, 120); //forward
          robotMovement.publish(move);
        
          break;
      case 40: //down arrow
          e.preventDefault();
          driveCommand(-120, -120); //backward
          robotMovement.publish(move);
          break;
      case 37: //left arrow
          e.preventDefault();
          driveCommand(-100, 100); //turn left
          robotMovement.publish(move);
          break;
      case 39: //right arrow
          e.preventDefault();
          driveCommand(100, -100); //turn right
          robotMovement.publish(move);
      };
  });

  $(document).keyup(function(){
      driveCommand(0, 0);
      robotMovement.publish(move);
  });  


// Subscribing to a Topic
// ----------------------

  var maxRange = 3.21;

  var mapCoords = [];

  var scaleCoords = [];
    
    function storeCoords (xVal, yVal, array) {  
        array.push({x : xVal, y: yVal});
    };

    function storeScaleCoords (xVal, yVal, array) {
        array.push({x : xVal, y : yVal});
        drawPath(scaleCoords);
    };
    
  var positionReader = new ROSLIB.Topic({
      ros : robotRos,
      name : '/' + Name + '/odom/filtered',
      messageType : 'nav_msgs/Odometry'
  });

    function distance (x1, y1, x2, y2) {
        return Math.sqrt((x1 - x2)*(x1 - x2) + (y1 - y2)*(y1 - y2));
    };
        
  positionReader.subscribe(function(message) {
      var posx, posy;      
      posx = message.pose.pose.position.x;
      posy = message.pose.pose.position.y;
      if (mapCoords.length === 0) {
          storeCoords(posx, posy, mapCoords);
      } else if (distance(posx, posy, mapCoords[mapCoords.length - 1].x,
                   mapCoords[mapCoords.length - 1].y) > 0.25) {
          storeCoords(posx, posy, mapCoords);
      };
  });
  
    document.getElementById('myRange').addEventListener('change', scalePoint);
    
    var positionCanvas, canvasCtx;
    
    function setupMapCanvas() {
      positionCanvas = document.getElementById('positionmap');
      canvasCtx = positionCanvas.getContext('2d');
      canvasCtx.translate(positionCanvas.width * 0.5, positionCanvas.height * 0.5);
      canvasCtx.scale(1, -1);
  };
   setupMapCanvas();
   
    function drawPath (array) {
        for (var i = 0; i < array.length - 1; i++) {
          canvasCtx.save();
          canvasCtx.beginPath();
          canvasCtx.moveTo(array[i].x, array[i].y);
          canvasCtx.lineTo(array[i + 1].x, array[i + 1].y);
          canvasCtx.stroke();   
         };
    };
    var scale;
    function scalePoint()  {
        scale = document.getElementById('myRange').value
        document.getElementById('output').innerHTML = scale;
        scaleCoords = [];
        canvasCtx.clearRect(0, 0, positionCanvas.width, positionCanvas.height);
        for (var i = 0; i < mapCoords.length; i++) {
            newCoordsx = mapCoords[i].x * (scale / 50);
            newCoordsy = mapCoords[i].y * (scale / 50);
            storeScaleCoords(newCoordsx, newCoordsy, scaleCoords);
        }
    };
/*
    var robotHeading = new ROSLIB.Topic({
        ros : ros,
        name : '/' + Name + '/odom/filtered',
        messageType : 'nav_msgs/Odometry'
    });

    robotHeading.subscribe(function(message) {
        var head;
        head = message.pose.pose.orientation.y;
        console.log(head);
    });*/

    function createPassthrough(sourceRosHandle, destinationRosHandle, robotSubscription, messageReceived, oneShot = false) {

        var passthroughHandle = {
            sourceTopic : new ROSLIB.Topic({
                ros : sourceRosHandle,
                name : '/' + Name + robotSubscription,
                messageType : messageReceived
            }),
            destinationTopic : new ROSLIB.Topic({
                ros : destinationRosHandle,
                name : '/' + Name + robotSubscription,
                messageType : messageReceived
            })
        }


        
        passthroughHandle.sourceTopic.subscribe(function(message) {
            passthroughHandle.destinationTopic.publish(message);
            if (oneShot) {
                passthroughHandle.sourceTopic.unsubscribe();
            };
        });
        return passthroughHandle;
    };
 
    createPassthrough(robotRos, laptopRos, '/abridge/heartbeat', 'std_msgs/String');
    createPassthrough(robotRos, laptopRos, '/behaviour/heartbeat', 'std_msgs/String');
    createPassthrough(robotRos, laptopRos, '/camera/camera_info', 'sensor_msgs/CameraInfo', true);
//    createPassthrough(robotRos, laptopRos, '/camera/image', 'sensor_msgs/Image');
  //  createPassthrough(robotRos, laptopRos, '/camera/image/compressed', 'sensor_msgs/CompressedImage');
    // createPassthrough(robotRos, laptopRos, '/camera/image/compressed/parameter_descriptions', 'dynamic_reconfigure/ConfigDescription');
    // createPassthrough(robotRos, laptopRos, '/camera/image/compressed/parameter_updates', 'dynamic_reconfigure/Config');
    // createPassthrough(robotRos, laptopRos, '/camera/image/compressedDepth', 'sensor_msgs/CompressedImage');
    // createPassthrough(robotRos, laptopRos, '/camera/image/compressedDepth/parameter_descriptions', 'dynamic_reconfigure/ConfigDescription');
    // createPassthrough(robotRos, laptopRos, '/camera/image/compressedDepth/parameter_updates', 'dynamic_reconfigure/Config');
   // createPassthrough(robotRos, laptopRos, '/camera/image/theora', 'theora_image_transport/Packet');
 //   createPassthrough(robotRos, laptopRos, '/camera/image/theora/parameter_descriptions', 'dynamic_reconfigure/ConfigDescription');
   // createPassthrough(robotRos, laptopRos, '/camera/image/theora/parameter_updates', 'dynamic_reconfigure/Config');
    createPassthrough(robotRos, laptopRos, '/diagnostics', 'std_msgs/Float32MultiArray');
     createPassthrough(laptopRos, robotRos, '/driveControl', 'geometry_msgs/Twist');
    createPassthrough(laptopRos, robotRos, '/fingerAngle/cmd', 'std_msgs/Float32');
   // createPassthrough(robotRos, laptopRos, '/fingerAngle/prev_cmd', 'geometry_msgs/QuaternionStamped');
   // createPassthrough(robotRos, laptopRos, '/fix', 'sensor_msgs/NavSatFix');
    createPassthrough(robotRos, laptopRos, '/fix_velocity', 'geometry_msgs/TwistWithCovarianceStamped');
    createPassthrough(robotRos, laptopRos, '/imu', 'sensor_msgs/Imu');
    createPassthrough(laptopRos, robotRos, '/joystick', 'sensor_msgs/Joy');
    createPassthrough(laptopRos, robotRos, '/mode', 'std_msgs/UInt8');
    // createPassthrough(robotRos, laptopRos, '/navposllh', 'ublox_msgs/NavPOSLLH');
    createPassthrough(robotRos, laptopRos, '/navsol', 'ublox_msgs/NavSOL')
    // createPassthrough(robotRos, laptopRos, '/navvelned', 'ublox_msgs/NavVELNED');
    createPassthrough(robotRos, laptopRos, '/odom', 'nav_msgs/Odometry');
    createPassthrough(robotRos, laptopRos, '/odom/ekf', 'nav_msgs/Odometry'); 
    createPassthrough(robotRos, laptopRos, '/odom/filtered', 'nav_msgs/Odometry');
    createPassthrough(robotRos, laptopRos, '/odom/navsat', 'nav_msgs/Odometry');
    createPassthrough(robotRos, laptopRos, '/sbridge/heartbeat', 'std_msgs/String');
    createPassthrough(robotRos, laptopRos, '/sonarCenter', 'sensor_msgs/Range');   
    createPassthrough(robotRos, laptopRos, '/sonarLeft', 'sensor_msgs/Range');
    createPassthrough(robotRos, laptopRos, '/sonarRight', 'sensor_msgs/Range');
    createPassthrough(robotRos, laptopRos, '/state_machine', 'std_msgs/String');
    createPassthrough(robotRos, laptopRos, '/status', 'std_msgs/String');
    createPassthrough(robotRos, laptopRos, '/targets', 'apriltags_ros/AprilTagDetectionArray');
    createPassthrough(robotRos, laptopRos, '/targets/image', 'sensor_msgs/Image');
     createPassthrough(robotRos, laptopRos, '/targets/image/compressed', 'sensor_msgs/CompressedImage');
    // createPassthrough(robotRos, laptopRos, '/targets/image/compressed/parameter_descriptions', 'dynamic_reconfigure/ConfigDescription');
    // createPassthrough(robotRos, laptopRos, '/targets/image/compressed/parameter_updates', 'dynamic_reconfigure/Config');
    // createPassthrough(robotRos, laptopRos, '/targets/image/compressedDepth', 'sensor_msgs/CompressedImage');
    // createPassthrough(robotRos, laptopRos, '/targets/image/compressedDepth/parameter_descriptions', 'dynamic_reconfigure/ConfigDescription');
    // createPassthrough(robotRos, laptopRos, '/targets/image/compressedDepth/parameter_updates', 'dynamic_reconfigure/Config');
    //createPassthrough(robotRos, laptopRos, '/targets/image/theora', 'theora_image_transport/Packet');
 //   createPassthrough(robotRos, laptopRos, '/targets/image/theora/parameter_descriptions', 'dynamic_reconfigure/ConfigDescription');
 //   createPassthrough(robotRos, laptopRos, '/targets/image/theora/parameter_updates', 'dynamic_reconfigure/Config');
  //  createPassthrough(robotRos, laptopRos, '/waypoints', 'swarmie_msgs/Waypoint');
    //createPassthrough(robotRos, laptopRos, '/waypoints/cmd', 'swarmie_msgs/Waypoint');
    createPassthrough(laptopRos, robotRos, '/wristAngle/cmd', 'std_msgs/Float32');
//    createPassthrough(robotRos, laptopRos, '/wristAngle/prev_cmd', 'geometry_msgs/QuaternionStamped');
  
    
    var sonarLeft, sonarRight, sonarCenter;
      
    sonarLeft = new ROSLIB.Topic({
        ros : robotRos,
        name : '/' + Name + '/sonarLeft',
        messageType : 'sensor_msgs/Range'
        });
    
    sonarLeft.subscribe(function(message) {
        var sonL;
        sonL = message.range;
        sonLimg(sonL);
    });

    function sonLimg(line) {
        var Lcanvas, Lctx;
    
        Lcanvas = document.getElementById('sonarImage');
        Lctx = Lcanvas.getContext('2d');
        Lctx.clearRect(0, 0, Lcanvas.width / 2, Lcanvas.height);

        Lctx.beginPath();
        Lctx.moveTo(Lcanvas.width / 2, Lcanvas.height);
        Lctx.lineTo((Lcanvas.width / 2) - ((line / 2) / (maxRange/ 2) * (Lcanvas.width / 2)),     Lcanvas.height - (line / Math.sqrt(3)) / (maxRange / Math.sqrt(3)) * Lcanvas.height);
        Lctx.stroke();
    };

    sonarCenter = new ROSLIB.Topic({
        ros : robotRos,
        name : '/' + Name + '/sonarCenter',
        messageType : 'sensor_msgs/Range'
    });
    
    sonarCenter.subscribe(function(message) {
        var sonC;
        sonC = message.range;
        sonCimg(sonC);
    });

    function sonCimg(line) {
        var Ccanvas, Cctx;
    
        Ccanvas = document.getElementById('sonarImage');
        Cctx = Ccanvas.getContext('2d');
        Cctx.clearRect(Ccanvas.width / 2 - 1, 0, Ccanvas.width / 2 + 1, Ccanvas.height);

        Cctx.beginPath();
        Cctx.moveTo(Ccanvas.width / 2, Ccanvas.height);
        Cctx.lineTo(Ccanvas.width / 2, Ccanvas.height - (Ccanvas.height * (line / maxRange)));
        Cctx.stroke();
    };

    sonarRight = new ROSLIB.Topic({
        ros : robotRos,
        name : '/' + Name + '/sonarRight',
        messageType : 'sensor_msgs/Range'
    });
    
    sonarRight.subscribe(function(message) {
        var sonR = message.range;
        sonRimg(sonR);
    });

    function sonRimg(line) {
        var Rcanvas, Rctx;
    
        Rcanvas = document.getElementById('sonarImage');
        Rctx = Rcanvas.getContext('2d');
        Rctx.clearRect(Rcanvas.width / 2 + 2, 0, Rcanvas.width, Rcanvas.height);

        Rctx.beginPath();
        Rctx.moveTo(Rcanvas.width / 2, Rcanvas.height);
        Rctx.lineTo((Rcanvas.width / 2) + ((line / 2) / (maxRange/ 2) * (Rcanvas.width / 2)),      Rcanvas.height - (line / Math.sqrt(3)) / (maxRange / Math.sqrt(3)) * Rcanvas.height);
        Rctx.stroke();
    };



  var imageTopic = new ROSLIB.Topic({
      ros : robotRos,
      name : '/' + Name + '/targets/image/compressed',
      messageType : 'sensor_msgs/CompressedImage'
  });

  imageTopic.subscribe(function(message) {
      var imagedata = "data:image/jpg;base64," + message.data;
      document.getElementById('image').setAttribute('src', imagedata);
  });

// Calling a service
// -----------------

/*var addTwoIntsClient = new ROSLIB.Service({
  ros : ros,
  name : '/add_two_ints',
  serviceType : 'rospy_tutorials/AddTwoInts'
  });

  var request = new ROSLIB.ServiceRequest({
  a : 1,
  b : 2
  });

  addTwoIntsClient.callService(request, function(result) {
  console.log('Result for service call on '
  + addTwoIntsClient.name
  + ': '
  + result.sum);
  });*/

// Getting and setting a param value
// ---------------------------------
    
/*  ros.getParams(function(params) {
      console.log(params);
  });

  var maxVelX = new ROSLIB.Param({
      ros : ros,
      name : 'max_vel_y'
  });

  maxVelX.set(0.8);
  maxVelX.get(function(value) {
      console.log('MAX VAL: ' + value);
  });
*/
    function drawMapCallback() {
        if (scaleCoords === []) {
            canvasCtx.clearRect(0, 0, positionCanvas.width, positionCanvas.height);
          drawPath(mapCoords);
        } else {
            canvasCtx.clearRect(0 - positionCanvas.width/2, 0 - positionCanvas.height/2, positionCanvas.width, positionCanvas.height);
          scalePoint();
          drawPath(scaleCoords);
      };
        setTimeout(drawMapCallback, 50); 
    };
    setTimeout(drawMapCallback, 50);
            

    };

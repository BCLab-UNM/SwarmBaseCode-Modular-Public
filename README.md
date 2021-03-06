# SwarmBaseCode-Modular

This repository is a ROS (Robot Operating System) controller framework for the Swarmie robots used in the [NASA Swarmathon](http://www.nasaswarmathon.com), a national swarm robotics competition. 

This repository contains:

1. Source code for ROS libraries (i.e. packages) that control different aspects of the Swarmie robot, including robot behaviours such as search strategies and obstacle avoidance, diagnostics, and user interface elements. 
2. 3D .STL models for the physical Swarmie build 
3. Bash shell scripts for initializing simulated Swarmies in the Gazebo simulator, as well as physical Swarmies

- For a step-by-step guide to using SwarmBaseCode-ROS to control a physical Swarmie robot, please see the instructions in the physical robot [Quick Start Guide](https://github.com/BCLab-UNM/Swarmathon-Docs/blob/master/PhysicalInstallGuide.md).

- Please submit bug reports for SwarmBaseCode-ROS through GitHub's Issues system. For all other questions regarding the SwarmBaseCode-ROS code base, please visit the forums on the [NASA Swarmathon website](http://www.nasaswarmathon.com).

- We recommend Jason M. O'Kane's [A Gentle Introduction to ROS](https://cse.sc.edu/~jokane/agitr/) for an in-depth walkthrough.

- Please consult the [git scm](https://git-scm.com/) and [git best practices](https://sethrobertson.github.io/GitBestPractices/) for guidelines on the most effective approaches to maintaining code. Teams will be expected to commit new code at least every two weeks, and ideally commit one or more times per week. Consult the [NASA Swarmathon Timeline](http://www.nasaswarmathon.com) for specifics on how often code should be committed, as well as the cutoff date for final code revision before the competition.

Be: sure you are using the latest drivers for your video card using the "additional drivers tool" in Ubuntu. Gazebo client often does not do well with the open source drivers.

![Alt text](https://github.com/BCLab-UNM/SwarmBaseCode-ROS/blob/master/readmeImages/InstallGraphics.png "Additional Drivers")

## Description of Behavior architecture

The architecure for the behaviours package (the package that controlls
the serach/pickup/dropoff/etc functionality of the robots) has beed
designed with two goals:

1. Make the behavior of the robots testable
   * Isolate individual behaviors into independently testable components
   * Write unit tests for these commponents using google-test
2. Make it easier to add and remove behaviors
   * This follows almost immediately from the previous goal of isolation

There are two main components to the architecture: the main loop, the behavior stack
and the robot interface.

### Main Loop
At a rate of 30Hz the robot interface is polled for new sensor
readings. The current readings are then passed to the behavior stack
which returns an action to be executed by the robot. The main loop is
in `src/behaviours/src/Behavior.cpp`.

### Robot Interface
This defines the interface between the behavior stack and the
robots. All ROS topics are isolated in this part of the code and a
clean interface to the sensors is exposed via the `SwarmieSensors`
class. The interface to robot actuators is provided by the
`SwarmieAction` class.

### Behavior Stack
This is the core of the new architecture. Behaviors are organized in a
stack from low-level to high-level. The current sensor readings and
the action that the lower level behavior wants to take are passed to
each `Behavior` in the stack. That behavior returns a `SwarmieAction`
it would like to perform (either incorporating the previous action or
ignoring it). If it is the last behavior then the action is returned
to the robot interface as described above.

To add behaviors to the stack users add a call to
`BehaviorManager::RegisterBehavior` in the main loop (where the
behavior manager is instantiated). Behaviors are placed into the
stack in the order of these calls.

#### Behavior Interface
To implement a new Behavior Extend the `Behavior` class (defined in
`include/BehaviorManager.hpp`). This interface provides two functions
that can be overridden 
* `Behavior::Update` takes the current sensor readings and the action
  the lower-level behavior has requested. Use this method to update
  the action that the behavior should take. The value of the
  lower-level action can be incorporated into the action the behavior
  takes, ignored completely, or passed up to the next in the stack. To
  take an action the behavior should assign the action it wants to
  take to the `_action` variable.
* `Behavior::Reset` should reset the current state of the behavior to
  the state it had at initialization.

A behavior can explicitly subsume a lower level behavior by calling
`Behavior::Subsumes` from the main loop. This allows higher level
behaviors to reset lower level's of the stack or bypass the behavior
taken by intervening layers. For instance a behavior for dropping off
a cube will want to take the "avoid obstacle" action in to account
from layer 1, but ignore the "avoid nest" action from layer 2. So
"drop off cube" should subsume the avoid obstacle behavior.

## Quick Start Installation Guide

SwarmBaseCode-ROS is designed and tested exclusively on the 64 bit version of Ubuntu 16.04 LTS (Xenial Xerus) and ROS Kinetic Kame. Other systems are untested and are therefore not supported at this time.

#### 1. Install ROS Kinetic Kame

Detailed instructions for installing ROS Kinetic Kame under Ubuntu 16.04 [here](http://wiki.ros.org/kinetic/Installation/Ubuntu) or follow the summarized instructions below:

```
sudo sh -c 'echo "deb http://packages.ros.org/ros/ubuntu $(lsb_release -sc) main" > /etc/apt/sources.list.d/ros-latest.list'

sudo apt-key adv --keyserver hkp://ha.pool.sks-keyservers.net:80 --recv-key 421C365BD9FF1F717815A3895523BAEEB01FA116

sudo apt update
sudo apt install ros-kinetic-desktop-full
sudo rosdep init
rosdep update      # Note this is not run with sudo
```

Note: if you accidentally ran ```sudo rosdep update``` you can repair the permissions ```sudo rosdep fix-permissions```.

You may request the installation of addition packages on the competition rovers. To do so create a pull request modifying the [preinstalled packages list](https://github.com/BCLab-UNM/Swarmathon-Docs/blob/master/PreinstalledCompetitionPackages.md) document.

Most systems will already have usb development support installed, but just in case:

```
 sudo apt install libusb-dev
```

#### 2. Install additional ROS packages

We use the [catkin_tools](https://catkin-tools.readthedocs.io/) package to build the SwarmBaseCode-ROS code base:

```
sudo apt install python-rosinstall python-catkin-tools
```

Our simulated and physical Swarmies use existing ROS plugins, external to this repo, to facilitate non-linear state estimation through sensor fusion and frame transforms. These plugins are contained in the [robot_localization](http://wiki.ros.org/robot_localization) package, which should be installed using the apt-get package management tool:

```
sudo apt install ros-kinetic-robot-localization
```
The ROS USB camera package:
```
sudo apt install ros-kinetic-usb-cam
```
If you intend to use the rosbridge tools to run robots independently of the laptop you will need to install rosbridge:
```
sudo apt install ros-kinetic-rosbridge-server
```

#### 3. Install additional Gazebo plugins

Our simulated Swarmies use existing Gazebo plugins, external to this repo, to replicate sonar, IMU, and GPS sensors. These plugins are contained in the [hector_gazebo_plugins](http://wiki.ros.org/hector_gazebo_plugins) package, which should be installed using the apt-get package management tool:

```
sudo apt install ros-kinetic-hector-gazebo-plugins
```

The Swarmies can receive commands from the thumb sticks on a Microsoft Xbox 360 controller. The ROS [joystick_drivers](http://wiki.ros.org/joystick_drivers) package, which contains a generic Linux joystick driver compatible with this controller, should also be installed using the apt tool:

```
 sudo apt install ros-kinetic-joystick-drivers
```

Joystick commands can also be simulated using the direction keys (Up=I, Down=K, Left=J, Right=L) on the keyboard. The Rover GUI window must have focus for keyboard control to work.

#### 4. Install git (if git is already installed, skip to step 5):

```
sudo apt install git
```

#### 5. Install SwarmBaseCode-ROS

1a. To update your existing repository using the base code (your competition repository name will have been provided to you):

```
cd YourRepositoryName
git remote add SwarmBaseCode https://github.com/BCLab-UNM/SwarmBaseCode-ROS
git pull SwarmBaseCode
```

### OR

If you just want a clean copy of the base code then:

1b. Clone this GitHub repository to your home directory (~), renaming the repo so ROS and catkin can properly identify it (you can name the target directory whatever you like):

  ```
  cd ~
  git clone https://github.com/BCLab-UNM/SwarmBaseCode-ROS.git SwarmBaseCode-ROS
  cd SwarmBaseCode-ROS
  ```


2. Set up [ublox](http://wiki.ros.org/ublox) GPS submodule and April Tag library:

  ```
  git submodule init
  git submodule update
  ```

3. Compile SwarmBaseCode-ROS as a ROS catkin workspace:
 
  Make sure bash is aware of the location of the ROS environment:
  ```
  if ! grep -q "source /opt/ros/kinetic/setup.bash" ~/.bashrc
  then 
    echo "source /opt/ros/kinetic/setup.bash" >> ~/.bashrc
  fi
  source ~/.bashrc
  ```
  
  Tell catkin to build the Swarmathon code:
  
  ```
  catkin build
  ```
    
#### 6. Run the SwarmBaseCode-ROS simulation:

1. Change the permissions on the simulation run script to make it exectuatable (assuming you use the target directory name SwarmBaseCode-ROS):
  
  ```
  cd ~/SwarmBaseCode-ROS
  chmod +x ./run.sh
  ```
  
2. Start the simulation

  ```
  ./run.sh
  ```

The GUI will now launch. The run script kills a number of gazebo and ROS processes. Killing these processes is suggested by gazebosim.com as the best way to clean up the gazebo environment at the moment.

This is the first screen of the GUI:

![Alt text](https://github.com/BCLab-UNM/SwarmBaseCode-ROS/blob/master/readmeImages/guiFirstScreen.png "Opening Screen")

Click the "Simulation Control" tab:

![Alt text](https://github.com/BCLab-UNM/SwarmBaseCode-ROS/blob/master/readmeImages/simControlTab.png "Simulation Parameters")

There are several settings you can change:

- Target Distribution: Choose between randomly generating a uniform, clustered, or power law distribution. You can also select a custom Gazebo world file; there are several pre-made world files included in the base code!

- Number of Cubes: When you select a uniform or clustered target distribution, you can select the total number of apriltag cubes placed. This is not available for the power law distribution or custom world files at this time. The point of this option is to speed up the process of placing cubes in the simulation using these distribution types.

- Ground Texture: Choose the kind of ground texture that will appear in the Gazebo simulation.

- Round Type: Preliminary round creates a 15 meter square arena and generates a default of three rovers. Final round creates a 23.1 meter square arena and generates a default of six rovers. Unbounded round does not place any barriers around the edge of the arena, it generates a default of three rovers, and you can set the size of the arena in the dropbox below the unbounded radio button. Cubes placed using the uniform, clustered, or powerlaw target distributions will use this arena size to determine random placements.

- Set Number of Rovers: Optional. If you select this checkbox, you can customize the exact number of rovers that will be created regardless of the round type. You can create from 0 to 8 rovers.

- Simulation Length: Optional. By default there is no timer set. If you select a timer from the drop down list, when you click the "All Autonomous" button the Gazebo simulation will run for the specified time before stopping all of the rovers (the equivalent of pressing the "Stop All Rovers" button). Please note that a twenty minute timer will run for twenty minutes of simulated time. That is, the amount of time that the simulation needs to simulate twenty real world minutes of time. You can look at the real time factor in Gazebo to get a feel for this, but it is generally slower than real time.

    tldr: A simulation timer for twenty minutes *might* take anywhere from thirty minutes to sixty minutes to actually complete.

- Create Savable Gazebo World: Selecting this option will create a Gazebo simulation that does not include rovers, a collection zone, or wall barriers. The point of this is to create a uniform, clustered, or power law distribution (which takes a long time to do) and then save that Gazebo world so that you can load it MUCH more quickly for testing your simulated rovers later on.

Click the "Build Simulation" button when ready.

The Gazebo physics simulator will open.

![Alt text](https://github.com/BCLab-UNM/SwarmBaseCode-ROS/blob/master/readmeImages/buildSim.png "Gazebo Simulator")

Click back to the Swarmathon GUI and select the "Sensor Display" tab.

![Alt text](https://github.com/BCLab-UNM/SwarmBaseCode-ROS/blob/master/readmeImages/sensorDisplayTab.png "Sesnor display")

Any active rovers, simulated and/or real, will be displayed in the rover list on the left side. To the right of the rover list is their corresponding connection status. Please note that the number here reflects different things for simulated vs. physical rovers:
- physical rovers: This number represents the wireless link quality and the bitrate of their connection.
- simulated rovers: This number represents their simulation rate as a percentage of real time. For example, 1.0 = moving at 100% real time factor, 0.5 = moving at 50% real time factor, etc.
- all rovers: Green = good connection. Yellow = meh connection. Red = bad connection and/or disconnected.

To the right of the connection status is a checkbox for the map frame. If you select a checkbox for a given rover, it's map information will appear in the map to the right. You can arbitrarily select any number of rovers to be displayed in the map frame.

![Alt text](https://github.com/BCLab-UNM/SwarmBaseCode-ROS/blob/master/readmeImages/activeRovers.png "Active rovers")

Select a rover to view its sensor outputs. 

![Alt text](https://github.com/BCLab-UNM/SwarmBaseCode-ROS/blob/master/readmeImages/roverSensorOutputs.png "Rover sensor outputs")

There are four sensor display frames and one settings frame:

The camera output. This is a rover eye's view of the world.

The ultrasound output is shown as three white rays, one for each ultrasound. The length of the rays indicates the distance to any objects in front of the ultrasound. The distance in meters is displayed in text below these rays. The maximum distance reported by the ultrasounds is 3 meters.  

The IMU sensor display consists of a cube where the red face is the bottom of the rover, the blue face is the top of the rover, and the red and blue bars are the front and back of the rover. The cube is viewed from the top down. The cube is positioned according to the IMU orientation data. For example, if the rover flips over, the red side will be closest to the observer. Accelerometer data is shown as a 3D vector projected into 2D space pointing towards the sum of the accelerations in 3D space.
 
The map view shows the path taken by the currently selected rover. Green is the encoder position data. In simulation, the encoder position data comes from the odometry topic being published by Gazebo's skid steer controller plugin. In the real robots, it is the encoder output. GPS points are shown as red dots. The EKF is the output of an extended Kalman filter which fuses data from the IMU, GPS, and encoder sensors.

The map settings frame contains several settings that affect the map view:
- Frame Views: You can check whether the map displays data from EKF (MAP), odometry (ODOM), and/or GPS (NAVSAT).
    Additionally, the Global Frame checkbox moves rovers from all starting at (0,0) to their actual start points (this is for simulated rovers only at this time).
- Panning: You can select whether the map automatically pans to fit all of the map data into the map frame or you can choose to manually pan the map yourself using the mouse to click-and-drag and also zooming with the scroll wheel.
- Unique Rover Colors: Select this option to change the colors in the map frame to display unique rover colors. This will help people to tell the rover paths apart in the map frame after long simulation runs.
- Popout: Click on this box to generate a popout map window that you can maximize or resize however you want. The popout map retains all of the settings you had selected in the original map frame. Changing settings in the RQT GUI will also change things in your popout map.

Look on the left hand side of the RQT Rover GUI.

![Alt text](https://github.com/BCLab-UNM/SwarmBaseCode-ROS/blob/master/readmeImages/taskStatusTab.png "Task Status tab")

This section displays important status information:

1. (all rovers) The currently selected rover in the RQT GUI.
2. (physical rovers) The number of GPS satellites detected.
3. (all rovers) The number of obstacle avoidance calls.
4. (simulated rovers) The number of targets collected.
5. (simulated rovers) The current status of the simulation timer after selecting a timer length and clicking the "All Autonomous" button.

To close the simulation and the GUI, click the red exit button in the top left-hand corner.

## Software Documentation

Source code for SwarmBaseCode-ROS can be found in the repository /src directory. This diretory contains severals subdirectories, each of which contain a single ROS package. Here we present a high-level description of each package.

- ```abridge```: A serial interface between SwarmBaseCode-ROS and the A-Star 32U4 microcontroller onboard the physical robot. In the SwarmBaseCode-ROS simulation, ```abridge``` functionality is supplanted by [gazebo_ros_skid_steer_drive](http://docs.ros.org/kinetic/api/gazebo_plugins/html/classgazebo_1_1GazeboRosSkidSteerDrive.html) (motor and encoders) and [hector_gazebo_plugins](http://wiki.ros.org/hector_gazebo_plugins) (sonar and IMU; see [step 3](https://github.com/BCLab-UNM/SwarmBaseCode-ROS/blob/master/README.md#3-install-additional-gazebo-plugins) of the Quick Start guide).
- ```behavours```: The top-level controller class for the physical and simulated robots. This package receives messages from sensors and implements behaviours the robot should follow in response. This packages also receives pose updates from [robot_localization](http://wiki.ros.org/robot_localization) (see [step 2](https://github.com/BCLab-UNM/SwarmBaseCode-ROS/blob/master/README.md#2-install-additional-ros-plugins) of the Quick Start guide) and commands from [joystick_drivers](http://wiki.ros.org/joystick_drivers) (see [step 3](https://github.com/BCLab-UNM/SwarmBaseCode-ROS/blob/master/README.md#3-install-additional-gazebo-plugins) of the Quick Start guide).
- ```rqt_rover_gui```: A Qt-based graphical interface for the physical and simulated robots. See [How to use Qt Creator](https://github.com/BCLab-UNM/SwarmBaseCode-ROS/blob/master/README.md#how-to-use-qt-creator-to-edit-the-simulation-gui) for details on this package.
- ```target_detection```: An image processor that detects [AprilTag](https://april.eecs.umich.edu/wiki/index.php/AprilTags) fiducial markers in the onboard camera's video stream. This package receives images from the ```usbCamera``` class (for physical robots) or [gazebo_ros_camera](http://docs.ros.org/kinetic/api/gazebo_plugins/html/classgazebo_1_1GazeboRosCamera.html) (for simulated robots), and, if an AprilTag is detected in the image, returns the integer value encoded in the tag.
- ```ublox```: A serial interface to the ublox GPS receiver onboard the physical robot. This package is installed as a git submodule in the SwarmBaseCode-ROS repo. See the [ublox ROS wiki page](http://wiki.ros.org/ublox) for more information.

## How to use Qt Creator to edit the GUI

Steps that are crossed out below show how the procedure has changed for QT Creator 3.5.1 which is installed with QT 5.

1. Install Qt Creator:

  ```
  sudo apt-get install qtcreator
  ```
  
2. Build the workspace:

  ```
  catkin build
  ```

3. Run Qt Creator:
  ```
  qtcreator &
  ```

4. Choose "Open File or Project" from the File menu

5. Navigate to ```~/SwarmBaseCode-ROS/src/rqt_rover_gui/``` 

Replace ~/SwarmBaseCode-ROS with the path to your git repository.

6. Select CMakeLists.txt.

7. Click "Open" to continue.

8. Enter ```path to your home directory/SwarmBaseCode-ROS/build``` in the text box, this is the default build path. You cannot use the ~ as a shorthand to your home directory here.

~~9. Click Configure Project.~~

~~10. Click on the Projects icon on the left toolbar.~~

9. QTCreator will prompt you to enter cmake arguments.

10. Enter ```-DCMAKE_INSTALL_PREFIX=../install -DCATKIN_DEVEL_PREFIX=../devel``` in the CMake arguments text box.

11. Press the run cmake button.

12. Press the "Finish" button.

~~11. Click the "Edit" toolbox icon on the left.~~

~~12. Double-click CMakeLists.txt.~~

13. Click the "Build Now" button to build the project.

Qt Creator can now be used to build your git repository.

Note: start qtcreator in your terminal with your git repository as the current directory. Source the ~/.bashrc if the catkin environment variables are not set so that QT Creator can properly build the project.

## Debugging with GDB and Qt Creator

Debuggers are particularly useful for tracking down segfaults and for tracing through the logic of your programs. In order to use the GNU debugger (GDB) with the swarmathon competition add the following line to the CMakelists.txt file for the project you want to debug.

```set(CMAKE_BUILD_TYPE Debug)```

This will compile your code with debugging symbols enabled.

Since ROS is multithreaded you may need to attach the debugger to threads that have been spawned by your program. To enable this enter the following in a terminal:

```sudo apt-get install libcap2-bin```

```sudo setcap cap_sys_ptrace=eip /usr/bin/gdb```

To use QT Creator to debug your already running program click the "Debug" menu. Choose "Start Debugging" and then "Attach to Running Application...". You will be able to use the graphical interface to GDB from here. 

## Using the deploy.sh script

The "deploy.sh" script has been added to allow for rapid and easy development for physical teams and judges alike! This script is found in the SwarmBaseCode-ROS/misc folder and automates several key tasks for the user! Now connecting to swarmies takes seconds.

The script is run from your workstation and not the swarmies themselves. Keeping work on the workstation has many benefits with one being a fast and reliable way to transfer and run code.  You will need to ensure the GUI is running before running this script!

Before running the code, navigate to the misc folder:

```cd ~/SwarmBaseCode-ROS/misc```

Give permission to the script to be executable:

```chmod +x deploy.sh```

You are now set for rapid deployment and development!

"deploy.sh" has 3 built-in options to be used:

```./deploy.sh -R```
- -R will ask the user for which rovers they wish to connect with and start sending information back to the workstation GUI

```./deploy.sh -L```
- -L will compile and compress the local repository from which the script was run. Then the user is prompted for a list of rovers that will receive the repository. The code is unpacked on the specified rovers and the nodes started.

- ex.) ```./deploy.sh -L``` means the local repo is compiled and compressed

- Rover Name/IP To Start: ```R17 R18 R19``` means the packaged local repo is sent to R17 R18 R19 and then those nodes are started

- If changes are made to the local repo they will not take affect as part of the transfer until the script is made aware of the changes. This is done by using the -RC command in place of a target rover id:
	+ Typing '-RC' recompiles the code base the user is currently using to deploy to a swarmie and repackages it for transfer

```deploy.sh -G {branch}```
(where branch is the desired branch you wish to pull)
- -G requires the branch users wish to pull from. This allows users to choose different branches for testing. This will then follow a similar logic to -L and begin sending information back to the workstation GUI.  Like -L this has unique built-in options
	+ Typing '-NB' will allow users to get a new branch at anytime
	+ Typing '-RP' will allow users to re-pull from your current selected github branch

If you want to use the script, and don't want to use the interface, you are able to do so.  Running any option (-R, -L, -G) followed by a -S will trigger a silent mode for the command, running your commands and returning to the terminal that the script was called from immediately after all operations are performed.

EX:  ```./deploy.sh -R -S robot1``` will attempt to connect and run robot1 and then return to the current terminal without opening the interface.

Feature:

Typing "REBOOT {hostname}" in any option will allow you to reboot the selected rover.
- If changes been made to the password for a swarmie, users will need to change the password in the script file as well in the variable "roverPass" to allow it to work!

Running multiple commands at once is allowed. So typing in a line such as "rover1 rover2 REBOOT rover3" will work.

## NOTES FOR DEPLOY.SH SCRIPT:  Applying Keys

This script runs better when using ssh-keys.  Keys allow you to SSH without requiring the user to type in a password every time.

- Follow this guide to learn about using keys: https://www.ssh.com/ssh/copy-id

If unfamiliar or have not setup an SSH-Key on a current machine, users can type:
```ssh-keygen``` and follow the prompt

Once the key has been setup, copy the key from the users machine to each rover you wish to add it to with
```ssh-copy-id swarmie@{hostname}``` where hostname is the rover's hostname

That's it! You should now have a seamless way to SSH without having to type in passwords each time!
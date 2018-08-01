#ifndef _SWARMIE_SENSORS_HPP
#define _SWARMIE_SENSORS_HPP

#include <boost/math/quaternion.hpp>
#include <iostream> // ostream

#include "Point.hpp"
#include "Heading.hpp"

class Tag
{
private:
   int _id;
   double _x;
   double _y;
   double _z;
   boost::math::quaternion<double> _orientation;

   const double CAMERA_HEIGHT = 0.195;
   const double CAMERA_OFFSET = -0.023;
public:
   const static int NEST_TAG_ID = 256;
   const static int CUBE_TAG_ID = 0;

   Tag(int id, double x, double y, double z, boost::math::quaternion<double> orientation);
   ~Tag() {}
   
   double Alignment() const;
   double Distance() const;
   double HorizontalDistance() const;
   double GetX() const { return _x; }
   double GetY() const { return _y; }
   double GetZ() const { return _z; }
   boost::math::quaternion<double> GetOrientation() const { return _orientation; }
   double GetYaw()   const;
   double GetPitch() const;
   int    GetId()    const { return _id; }
   bool   IsCube()   const;
   bool   IsNest()   const;

   friend std::ostream& operator<<(std::ostream& os, const Tag& tag);
};

class SwarmieSensors
{
private:
   double _leftSonar;
   double _rightSonar;
   double _centerSonar;
   std::vector<Tag> _detections;

   Point   _deadReckoningPosition;
   Point   _gpsFusedPosition;
   Heading _heading;

public:
   SwarmieSensors();
   ~SwarmieSensors() {};

   void SetLeftSonar(double range) { _leftSonar = range; }
   void SetRightSonar(double range) { _rightSonar = range; }
   void SetCenterSonar(double range) { _centerSonar = range; }
   void DetectedTag(Tag t);
   void ClearDetections();
   
   double GetLeftSonar() const { return _leftSonar; }
   double GetRightSonar() const { return _rightSonar; }
   double GetCenterSonar() const { return _centerSonar; }
   const std::vector<Tag> GetTags() const { return _detections; }
};

#endif // _SWARMIE_SENSORS_HPP
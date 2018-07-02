#ifndef _DROP_OFF_CUBE_HPP
#define _DROP_OFF_CUBE_HPP

#include "BehaviorManager.hpp"

class DropOffCube : public Behavior
{
private:
   enum State { Holding, NotHolding, Entering, Leaving } _state;
   void TagHandler();
   void UpdateState();

   int  _tagsLeft;
   int  _tagsRight;

   bool _exited;
   bool _dropped_cube;

    // once EXIT_THRESHOLD tags have been seen the rover has "exited"
    // the collection zone.
   const int EXIT_THRESHOLD = 5;
public:
   DropOffCube(const SwarmieSensors *sensors);
   ~DropOffCube() {}
   void Update() override;
};

#endif // _DROP_OFF_CUBE_HPP
#ifndef _ALIGN_TO_CUBE_HPP
#define _ALIGN_TO_CUBE_HPP

#include "BehaviorManager.hpp"
#include "PID.hpp"

#define CUBE_TAG_ID 0

class AlignToCube : public Behavior
{
private:
   double _distanceToTag;
   double _linearDistance;

   double _integral;

   PID    _alignPID;
   
   void ProcessTags();

public:
   AlignToCube(const SwarmieSensors* sensors);
   ~AlignToCube() {}

   void Update() override;
};

#endif // _ALIGN_TO_CUBE_HPP
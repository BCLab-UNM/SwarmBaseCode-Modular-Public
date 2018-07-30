#include "AvoidNest.hpp"
#include "Action.hpp"
#include "Velocity.hpp"

AvoidNest::AvoidNest(const SwarmieSensors* sensors, Timer* timer) :
   Behavior(sensors),
   _persist(false),
   _persistenceTimer(timer) {}


void AvoidNest::TagHandler()
{
   _tagsRight = 0;
   _tagsLeft  = 0;
   _tooClose = false;
   for(auto tag : _sensors->GetTags())
   {
      if(tag.GetId() != Tag::NEST_TAG_ID)
      {
         continue; // skip blocks
      }

      if(tag.GetYaw() < 0)
      {
         _tagsLeft = 0;
         _tagsRight = 0;
         _tooClose = false;
         return;
      }

      if(tag.Alignment() > 0)
      {
         _tagsRight++;
      }
      else
      {
         _tagsLeft++;
      }

      if(tag.HorizontalDistance() <= 0.2)
      {
         _tooClose = true;
      }
   }
}

void AvoidNest::Update()
{
   _action = _llAction;
   TagHandler();

   if(_persist)
   {
      if(!_persistenceTimer->Expired())
      {
         _action = _savedAction;
      }
      else
      {
         _persist = false;
      }
   }

   if(_tooClose)
   {
      _action.SetAction(core::VelocityAction(LinearVelocity(-1)));
   }

   if(_tagsLeft > 0 || _tagsRight > 0)
   {
      if(_tagsLeft > _tagsRight)
      {
         _action.SetAction(core::VelocityAction(AngularVelocity(0, 0, -1)));
      }
      else
      {
         _action.SetAction(core::VelocityAction(AngularVelocity(0, 0, 1)));
      }

      _persist = true;
      _savedAction = _action;
      _persistenceTimer->SetInterval(1.2);
      _persistenceTimer->StartOnce();
   }   
}

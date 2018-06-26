#include "test_util.h"
#include "SwarmieInterface.hpp"

bool is_moving(Action a)
{
   return (fabs(a.drive.left) >= 35 || fabs(a.drive.right) >= 35);
}

bool is_turning_left(Action a)
{
   if(!is_moving(a)) {
      return false;
   }
   
   // if one wheel is negative then it must be the left wheel.
   // otherwise the right wheel must be greater than the left.
   if(a.drive.left < 0)
   {
      return a.drive.right >= 0;
   }

   // lets say we are turning if right is at least 15% greater than left.
   return a.drive.right > a.drive.left*0.85;
}

bool is_turning_right(Action a)
{
   if(!is_moving(a)) {
      return false;
   }
   
   if(a.drive.right < 0)
   {
      return a.drive.left >= 0;
   }

   // lets say we are turning if right is at least 15% greater than left.
   return a.drive.left > a.drive.right*0.85;   
}

/* Tag positions values measured from the robot camera:
 *
 * _____________
 * |A         B|
 * |           |
 * |           |
 * |           |
 * |D         C|
 * -------------
 *
 * A -> x: -0.202 | y: -0.121 | z: 0.5
 * B -> x: 0.213  | y: -0.116 | z: 0.63
 * C -> x: 0.068  | y: 0.042  | z: 0.212
 * D -> xL -0.069 | y: 0.039  | z: 0.63
 */

Tag tag_top_left(int id)
{
   return Tag(id, -0.202, -0.121, 0.5, DEFAULT_ORIENTATION);
}

Tag tag_top_right(int id)
{
   return Tag(id, 0.213, -0.116, 0.63, DEFAULT_ORIENTATION);
}

Tag tag_bottom_left(int id)
{
   return Tag(id, -0.069, 0.039, 0.63, DEFAULT_ORIENTATION);
}

Tag tag_bottom_right(int id)
{
   return Tag(id, 0.068, 0.042, 0.212, DEFAULT_ORIENTATION);
}
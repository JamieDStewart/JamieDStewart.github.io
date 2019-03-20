---
layout: post
title: "GBA Development: Splitting up a Project"
categories:
  - GBA Dev
tags:
  - gameboy advance
  - programming
  - vs code
---

Right so in the last tutorial video that I uploaded I did something that I'm not really that happy with. The use of #pragma region.

{% highlight C %}
#pragma region SOME_GBA_CODE
//...
#pragma endregion
{% endhighlight %}

While this works, and can be used to hide away long sections of code when I'm working in one file there's a problem with this. It's lazy and *I'm working in one file* so let's tackle this issue really quickly and split our project up into multiple files.

To do this let's first adopt a bit of a naming convention, any file that is specifically GBA related let's call **gba_** then after the underscore we can give it a name that best describes what that file content covers. We can do this for our header and source files. 

I think the first one that we need to tackle is the file that I currently have named as *Intellisense.h*, I'll be honest this is a really poor file name for what's in this file and it's a throwback to when I was using Visual Studio 2015 to do GBA dev. I've taken so much content out of this file that is handled in VS Code by the **c_cpp_properties.json** file that this name no longer suits this file's purpose.

So let's rename this file to something more apt like **gba_macros.h**, VS Code makes this super easy and on the plus side handles this really nicely with the Git integration. I can't really say enough about how super impressed I am about the Git integration of VS Code it makes using version control so easy that it's almost effortless. Much better than some of the perforce integration tools that I've used on other projects.

Ok so right click and rename *Intellisense.h* to *gba_macros.h* then in the **main.c** file we will have to modify the #include for our file

{% highlight C %}
//it was this
#include "Intellisense.h"
//it should now be this...
#include "gba_macros.h"
{% endhighlight %}

Let's add some additional code into *gba_macros.h*, put the following into the file so that it appears before the line *#endif //__GBA_MACRO_H__*

{% highlight C %}
#ifndef	NULL
#define	NULL	(void*)0
#endif
{% endhighlight %}

Right so that seems like a good place to put our definintion of *NULL*, or at least as good as any.  
Ok so that was pretty easy, now the slightly longer process of splitting up what we have in **main.c** into multiple files.  

If we create a new file in our **include** folder called **gba_types.h**. Now I want to stress that it's *super* important to make use of a decent folder structure for any programming project that you work on. Folder structure, especially when working in teams is critical to maintaining and developing complex projects and can releive so much stress and aid in a more productive work flow. So please, *please*, **please** stick with me here.

In our newly created *gba_types.h* file (which is inside your includes folder), add the following code.  

{% highlight C %}
//Author: ...
//Data: ...
//Desc: This is a small header file used to define types that are used for GBA development
//      these types are named according to their signedness and their bit length

#ifndef __GBA_TYPES_H__
#define __GBA_TYPES_H__

#include <stdint.h>
#include <stdbool.h>

//\===========================================================================================================
//\TYPEDEF our variables to indicate clearly what level of bit precision each variable has
//\===========================================================================================================
typedef uint8_t		u8;		typedef int8_t		s8;
typedef uint16_t	u16;	typedef int16_t		s16;
typedef uint32_t	u32;	typedef int32_t		s32;
//\===========================================================================================================
//\ Volatile variables
//\ The volatile key word indicates to the compiler, and the programmer. That these variables may have their values
//\ altered by an external factor, this could be a hardware switch, or some external program that can access the 
//\ memory location of the variable.
//\===========================================================================================================
typedef volatile uint8_t		v_u8;	typedef volatile int8_t			v_s8;
typedef volatile uint16_t		v_u16;	typedef volatile int16_t		v_s16;
typedef volatile uint32_t		v_u32;	typedef volatile int32_t		v_s32;

#endif //__GBA_TYPES_H__
{% endhighlight %}

Ok now inside of *main.c* we can remove the code where we have typedefined out all the above variables. Instead we can replace this with a simple **#include "gba_types.h"**

Once you've done that it's best to recompile the project and make sure that everything still works exactly as you expect it to and that there are no compiler errors, this is a simple *ctrl+shift+p* run task *make debug*.  
If there are compiler errors then you'll have to read what they are in the build output, and address them and rebuild until the project compiles and runs as expected. Ok so that's one file out of the way, only... about 8 more to go for the GBA defines.  

Ok so lets make a really small header file that keeps track of all the base register addresses for each key register section. Create a new file in the includes folder (just right click on the folder *include* in VS Code (In case you were doing something else weird) and select new). We'll call this file **gba_reg.h**.

Put the following content in **gba_reg.h**

{% highlight C %}
//---------------------------------------------------------------------------------
//This class defines the base register addresses for I/O VRAM etc
//---------------------------------------------------------------------------------

#ifndef __GBA_REG_H__
#define __GBA_REG_H__
/*
* Define the Base Address for External (on-board) Work RAM (WRAM)
* This is 256K in Size
*/
#define	EWRAM		0x02000000
#define	EWRAM_END	0x02040000 // From This address up to 0x02FFFFFF is not utilised
/*
* Define the Base Address for Internal (on-chip) Work RAM (WRAM)
* This is 32K in Size
*/
#define IWRAM 0x03000000
/*
* Define the Base Address for I/O or Hardware Registers
*
*/
#define REG_BASE 0x04000000
/*
* Define the Base Address for Video RAM (VRAM)
* This is 96K in Size
*/
#define VRAM 0x06000000
/*
* Define the Base Address for Cart Save RAM (VRAM)
* This is 64K (Max) in Size
*/
#define	SRAM		0x0E000000

#endif //__GBA_REG_H__
{% endhighlight %}

Ok no need to move any code around in *main.c* with that new file we've just created but go ahead and build the project anyway just to make sure that there are no errors with what we've done.  

Lets tackle one next that we'll need to implement a source file for as well. Let's go ahead and create a new header file in our includes folder called **gba_gfx.h**
Inside of this file we're going to put our defines for any of the registers and functions that have to do with our graphics for the GBA.

This will be things like the define for **REG_DISPCNT**, setting our video modes and which backgrounds are enabled as well as functionality for things like vsync.
The content of this *gba_gfx.h* header file will look like the following:  

{% highlight C %}
#ifndef __GBA_GFX_H__
#define __GBA_GFX_H__

#include "gba_macros.h"
#include "gba_reg.h"
#include "gba_types.h"

//base address pointer for base register
#define REG_DISPCNT *((v_u32*)(REG_BASE))

//Defines for settng up different video modes
#define VIDEOMODE_0 0x0000  //Sprite Mode 0
#define VIDEOMODE_1 0x0001  //Sprite Mode 1
#define VIDEOMODE_2 0x0002  //Sprite Mode 2
#define VIDEOMODE_3 0x0003	// < Mode 3; 240x160 @16bpp
#define VIDEOMODE_4	0x0004	// < Mode 4; 240x160 @8 bpp
#define VIDEOMODE_5 0x0005  // < Mode 5; 

//Defines for enabling different backgrounds
#define BGMODE_0	0x0100
#define BGMODE_1	0x0200
#define BGMODE_2	0x0400
#define BGMODE_3	0x0800

//vcount is used for testing for vertical blank
#define REG_VCOUNT (*(v_u16*)(REG_BASE + 0x06))

extern void vsync();

#endif //__GBA_GFX_H__
{% endhighlight %}

Ok one thing about the above is the use of the *extern* keyword infront of our function definition. This is a C keyword that indicates that the function/struct/variable being externed is going to be defined somewhere else and that this is just a declaration. In C functions have a default extern value, so we don't explicitly need to use the extern keyword here, but just to be relly explicit as to what's going on I will be.  
If you want to read more about this [TutorialsPoint](https://www.tutorialspoint.com/extern-keyword-in-c) has a pretty good post regarding this keyword.

Ok now that the *gba_gfx.h* file has been implemented time to put some code in a **gba_gfx.c** file. So if we add a new source file to our project, right click the source folder and *"add new file"* name it *gba_gfx.c* and then add we need to add the definition for our **vsync()** funciton. 

{% highlight C %}
#include "gba_gfx.h"


void vsync()
{
	while (REG_VCOUNT >= 160);
	while (REG_VCOUNT < 160);
}

{% endhighlight %}

Alright we're maybe about halfway there now. The next file to tackle would be to take the random number generation functionality and vafriables out of our **main.c** file and put them in their own file, along with the **abs( s32 a_val)** function that is also found in our main.c file.

So creating a new file called **gba_mathUtil.h** and adding in only the variable and function declarations and not the definitions would provide us with the following:

{% highlight C %}
#ifndef __GBA_MATHUTIL_H__
#define __GBA_MATHUTIL_H__

#include "gba_types.h"

extern s32 __gba_rand_seed;
extern s32 gba_seed_rand(s32 a_val);
extern s32 gba_rand();
extern s32 gba_rand_range(s32 a_min, s32 a_max);
extern s32 sign(s32 a_val);
extern s32 abs(s32 a_val);

#endif //__GBA_MATHUTIL_H__
{% endhighlight %}

Now you can see that we have a variable defined in this header, *__gba_rand_seed* this variable has the extern keyword infront of it which makes this variable visible globally within any source files.  I know that there are arguments that global variables are bad, and there are ways to avoid using them, however in this scenario a global variable will suffice and won't impact upon our design of the gba_ files.

With our *gba_mathUtil.h* header file looking like the above then we should put the function definitions in the *gba_mathUtil.c* source file. We will need to allocate a value into our externed *__gba_rand_seed* variable too or the memory for that variable will not be assigned and the varialbe will not be accessable.

{% highlight C %}
#include "gba_mathUtil.h"

s32 __gba_rand_seed = 42;

s32 gba_seed_rand(s32 a_val)
{
	s32 old = __gba_rand_seed;
	__gba_rand_seed = a_val;
	return old;
}

s32 gba_rand()
{
	__gba_rand_seed = 1664525 * __gba_rand_seed + 1013904223;
	return (__gba_rand_seed >> 16) & 0x7FFF;
}

s32 gba_rand_range(s32 a_min, s32 a_max)
{
	return (gba_rand()*(a_max - a_min) >> 15) + a_min;
}

s32 sign(s32 a_val)
{
	return (!(a_val & 0x80000000) && !a_val) ? 1 : -1;
}

s32 abs(s32 a_val)
{
	s32 mask = a_val >> 31;
	return (a_val ^ mask) - mask;
}
{% endhighlight %}

So this now leaves us with only some of the drawing code to be defined on the GBA side before we need to split up our game specific code into separate headers and source files.

Create a new file called **gba_drawing.h** and make sure it has the following content:

{% highlight C %}
#ifndef __GBA_DRAWING_H__
#define __GBA_DRAWING_H__

#include "gba_reg.h"
#include "gba_types.h"

#define SCREENBUFFER ((v_u16*)(VRAM))

#define SCREEN_W 240
#define SCREEN_H 160

extern u16 setColor(u8 a_red, u8 a_green, u8 a_blue);
extern void drawRect(u32 a_left, u32 a_top, u32 a_width, u32 a_height, u16 a_color);
extern void drawLine(s32 a_x, s32 a_y, s32 a_x2, s32 a_y2, u16 a_color);

#endif //__GBA_DRAWING_H__
{% endhighlight %}

Then the content of the source file **gba_drawing.c** (which you will need to create) becomes:

{% highlight C %}
#include "gba_drawing.h"
#include "gba_mathUtil.h"

u16 setColor(u8 a_red, u8 a_green, u8 a_blue)
{
	return (a_red & 0x1F) | (a_green & 0x1F) << 5 | (a_blue & 0x1f) << 10;
}

void drawRect(u32 a_left, u32 a_top, u32 a_width, u32 a_height, u16 a_color)
{
	for (u32 y = 0; y < a_height; ++y)
	{
		for (u32 x = 0; x < a_width; ++x)
		{
			SCREENBUFFER[(a_top + y) * SCREEN_W + a_left + x] = a_color;
		}
	}
}

void drawLine(s32 a_x, s32 a_y, s32 a_x2, s32 a_y2, u16 a_color)
{
	s32 w = a_x2 - a_x;
	s32 h = a_y2 - a_y;
	s32 dx1 = 0, dy1 = 0, dx2 = 0, dy2 = 0;
	if (w<0) dx1 = -1; else if (w>0) dx1 = 1;
	if (h<0) dy1 = -1; else if (h>0) dy1 = 1;
	if (w<0) dx2 = -1; else if (w>0) dx2 = 1;
	s32 longest = abs(w);
	s32 shortest = abs(h);
	if (!(longest>shortest)) {
		longest = abs(h);
		shortest = abs(w);
		if (h<0) dy2 = -1; else if (h>0) dy2 = 1;
		dx2 = 0;
	}
	s32 numerator = longest >> 1;
	for (s32 i = 0; i <= longest; i++) {
		SCREENBUFFER[a_y * SCREEN_W + a_x] = a_color;
		numerator += shortest;
		if (!(numerator<longest)) {
			numerator -= longest;
			a_x += dx1;
			a_y += dy1;
		}
		else {
			a_x += dx2;
			a_y += dy2;
		}
	}
}
{% endhighlight %}

Splitting up the game code should prove to be quite straight forward if you have followed the above, so I'll leave that as an exercise for the reader. Or if you want to cheat you can of course assess all this sourcecode on [GitHub](https://github.com/JamieDStewart/GBA_Tutorials).

I'll leave you with what the content of the **main.c** file should look like with the game specific code split out into a **ball.h/.c** and **paddle.h/.c** header and source files. The next post after this I'll tackle how to handle button input on the GBA.

{% highlight C %}
#include "gba_macros.h"
#include "gba_types.h"
#include "gba_gfx.h"
#include "gba_drawing.h"
#include "gba_mathUtil.h"
#include "gba_input.h"

//include Pong related structures and functions
#include "ball.h"
#include "paddle.h"

int main()
{
	//set GBA rendering context to MODE 3 Bitmap Rendering
	REG_DISPCNT = VIDEOMODE_3 | BGMODE_2;

	gba_seed_rand(14);
	Paddle p1;
	InitPaddle(&p1,10, 60, 8, 40, setColor(0, 0, 31));
	Paddle p2;
	InitPaddle(&p2, SCREEN_W - 18, 60, 8, 40, setColor(31, 0, 0));

	Ball ball;
	InitBall(&ball, 115, 75, 10, setColor(31, 31, 31));

	while (1) { //loop forever
		vsync();
		PollKeys();

		ClearBall(&ball);
		ClearPaddle(&p1);
		ClearPaddle(&p2);

		MoveBall(&ball);

		s16 pDir = 0;
		if( keyDown(UP) )
		{
			pDir = -2;
		}
		if( keyDown(DOWN) )
		{
			pDir = 2;
		}
		MovePaddle(&p1, pDir);

		pDir = 0;
		if( keyDown(A) )
		{
			pDir = -2;
		}
		if( keyDown(B) )
		{
			pDir = 2;
		}
		MovePaddle(&p2, pDir);

		drawLine(10, 4, 230, 4, setColor(31, 31, 31));
		drawLine(230, 156, 10, 156, setColor(31, 31, 31));
		DrawBall(&ball);
		DrawPaddle(&p1);
		DrawPaddle(&p2);
	}
	
	return 0;
}
{% endhighlight %}
---
layout: post
title: "GBA Development: 001 - My First Pixels"
categories:
  - GBA Dev
tags:
  - gameboy advance
  - programming
  - vs code
---

Ok so getting started with GBA programming if you've seen the previous post to this one and taken the time to view the <a href="https://github.com/JamieDStewart/GBA_VSCode_Basic">basic project</a> that's up on GitHub then you will have seen some pretty awful code. 
The project setup itself within VS Code is ok, things compile and build and we can debug the program quite well, admittedley I'd like to have a proper debug view that clearly showed the current values in the GB's registers but if I want that I can just load the ROM file into another debugger like no$GBA and debug from there.
But then I'm pretty comfortable with looking at ASM code and not everyone is me. So the VS Code GCC debugger will suffice for the majority of what we're doing.

Anyway, the first program that you can build an run in an the emulator looks like the following:

![Running the Basic GBA Program](/assets/images/running.PNG "GBA:101")

Honsetly it's some of the worst code I've written in recent history and I've written some pretty bad code in my time as a developer. Some to just get something working and some when I started out because I didn't know what I was doing. 

But looking at the above I wouldn't be surprised if you looked at line 7 and thought *"What the hell is that?!"*

{% highlight C %}
*(unsigned int*)0x04000000 = 0x0403;
{% endhighlight %}

So looking at that we have an unsigned int pointer to a memory address, yeah in C and C++ you can directly access memory addresses like that. It's crazy handy and potentially super destructive. Then we're dereferencing whatever is at memory address *0x04000000* and then allocating the value of *0x0403* into that memory.

Makes no sense at all right. Well unless you understand the memory layout of the GBA, which is available on line in a few places but have a look here at [GBATek](https://problemkaputt.de/gbatek.htm#gbamemorymap).  **0x04000000** is the beginning of memory for the I/O registers and the first register at that memory location is the Display Controller, it's two bytes in size too, and setting it's value to *0x0403* turns on bits 0, 1, and bit 10 (counting from 0). So it set video mode in the lower two bits to a value of 3 and turns on background 2.

Oh and we're accissing that memory location as an unsigned integer, but as we're concerned with bit sizes hopefully an unsigned int is going to be 4 bytes in size.

Tell you what, lets neaten things up a little bit. Grab/Clone the [Basic Project](https://github.com/JamieDStewart/GBA_VSCode_Basic) and let's start by adding some code to ensure that our variables are all of the appropriate bit size, leave nothing to chance here. Put the following code snippet right after the include intellisense directive.

{% highlight C %}
#include <stdint.h>
#include <stdbool.h>

typedef uint8_t		uint8;
typedef uint16_t	uint16;
typedef uint32_t	uint32;
typedef int8_t		int8;
typedef int16_t		int16;
typedef int32_t		int32;

typedef volatile uint8_t		v_uint8;
typedef volatile uint16_t		v_uint16;
typedef volatile uint32_t		v_uint32;
typedef volatile int8_t			v_int8;
typedef volatile int16_t		v_int16;
typedef volatile int32_t		v_int32;
{% endhighlight %}

Ok so now everything has a typedefined variable name that indicates the bit size of the variable. Brilliant, but what's this *volatile* business? Ok so compilers are pretty clever, they may compile out some code on occasion, or optimise some things like say if we're reading a value from a variable that never changes in our code the compiler might just go ahead and replace that variable with a constant value. Which is great, unless that variable is a memory address that can be modified by a hardware interrupt or switch.

So the *volatile* keyword is used to let the compiler (and us) know that this variable could potentially be modified by hardware and not just from within our code.

Great our types are sorted let's clean up that line 7 a bit more by making use of a #define or two

{% highlight C %}
#define REG_DISPLAYCONTROL *((v_uint32*)(0x04000000))
#define VIDEOMODE_3 0x0003
#define BGMODE_2	0x0400
{% endhighlight %}

Ok so I'm not going to lie, the first perhaps 15 of these GBA programming tutorials may involve quite a lot of "Hey! lets #define a memory address!". Now with the above defined we can re-write line 7 of code to be way more readable.

{% highlight C %}
//set GBA rendering to MODE 3 Bitmap rendering
REG_DISPLAYCONTROL = VIDEOMODE_3 | BGMODE_2;
{% endhighlight %}

There that already looks better. Let's add a few more defines....

{% highlight C %}

#define SCREENBUFFER ((v_int16*)(0x06000000))
#define SCREEN_W 240
#define SCREEN_H 160

{% endhighlight %}

Ok so now you could replace the Unsigned short pointer to memory address 0x06000000 on line 14 with 
{% highlight C %}
SCREENBUFFER[x+y*SCREEN_W] = ((((x&y)+t) & 0X1F) << 10)|
{% endhighlight %}

But that doesn't really improve how readable the code is.

Tell you what delete that while loop and let's do the first thing I always do when getting to grips with a new programming language or working on a new peice of hardware. 
Let's make Pong!

Just without any of the user input for now. We'll cover user input in the next post.

First thing we need to add is a function to let us know when a VBLANK is taking place. A VBLANK occurs when the screen has finished rendering, there is a period of time that it takes before the screen begins to draw again. This is a bit of a throw back to when games consoles ran on CRT monitors and had to wait for the physical VBLANK to occur.

The following image explains the dimensions and what a screenblank is pretty clearly
[Visual Blank Explained in an picture](/assets/images/2019-02-16-003.PNG "GBA: vblank")

Ideally to prevent visible tearing when we render out to the screen buffer we want to carry out all this drawing within the VBLANK window.

Prior to the main function on line 30 add in the following code to define the memory address of the VBLANK register and a function to read from it.

{% highlight C %}
#define REG_VCOUNT (*(v_uint16*)(0x04000006))
void vsync()
{
	while (REG_VCOUNT >= 160);
	while (REG_VCOUNT < 160);
}
{% endhighlight %}

Than within main() after the display control register is set add the following 

{% highlight C %}
while (1) { //loop forever
    vsync();
}
{% endhighlight %}

Ok now we have a program that will loop forever and will sit in the vsync() function until the hardware tells us that we are within the VBLANK window. This isn't the best way to do this, but for now this will suffice, we will revisit vsync at a later date.

Ok So how about actually drawing something. All of these functions that we are about to add into the code need to go above the main() function, this is due to the way that C operates. Although you could choose to make use of forward declarations for these functions if you chose to. I've not done that as well... it is only a simple version of Pong that we're looking to implement.


Ok a quick function to set the colour of a pixel. In Mode 3 the GBA makes use of 15 bit colour, 5 bits for Red, 5 bits for Green, and 5 bits for blue. All we'll be doing to set the colour value for an individual pixel is to write to a memory location in the SCREENBUFER range of memory addresses.
Here's a function that makes use of some bit shifting and masking to set the colour values in a uint16.


{% highlight C %}
uint16 setColor(uint8 a_red, uint8 a_green, uint8 a_blue)
{
	return (a_red & 0x1F) | (a_green & 0x1F) << 5 | (a_blue & 0x1f) << 10;
}
{% endhighlight %}

Well here's some functionality to draw some basic rectangles, and a draw line function that should work for lines being drawn in any direction not just left to right.
The drawRect function takes in the location of the upper left corner of the box to be drawn and a width and height to size the box acordingly.

{% highlight C %}
void drawRect(int32 a_left, int32 a_top, int32 a_width, int32 a_height, uint16 a_color)
{
	for (uint32 y = 0; y < a_height; ++y)
	{
		for (uint32 x = 0; x < a_width; ++x)
		{
			SCREENBUFFER[(a_top + y) * SCREEN_W + a_left + x] = a_color;
		}
	}
}

{% endhighlight %}

This is the draw line function, the contents of which come from the Wikipedia article describing [Bresenham's Line Algorithm](https://en.wikipedia.org/wiki/Bresenham%27s_line_algorithm), the function takes a starting X and Y position and an ending X and Y position. The line will be drawn from point (a_x, a_y) to point (a_x2, a_y2).

{% highlight C %}
void drawLine(int32 a_x, int32 a_y, int32 a_x2, int32 a_y2, uint16 a_color)
{
	int32 w = a_x2 - a_x;
	int32 h = a_y2 - a_y;
	int32 dx1 = 0, dy1 = 0, dx2 = 0, dy2 = 0;
	if (w<0) dx1 = -1; else if (w>0) dx1 = 1;
	if (h<0) dy1 = -1; else if (h>0) dy1 = 1;
	if (w<0) dx2 = -1; else if (w>0) dx2 = 1;
	int32 longest = abs(w);
	int32 shortest = abs(h);
	if (!(longest>shortest)) {
		longest = abs(h);
		shortest = abs(w);
		if (h<0) dy2 = -1; else if (h>0) dy2 = 1;
		dx2 = 0;
	}
	int32 numerator = longest >> 1;
	for (int32 i = 0; i <= longest; i++) {
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

Ok so that's the drawing routines that we need to get Pong up and running out of the way. Let's start with getting a ball up and drawing to the screen and moving around

As we're using C and not C++ we only have access to structs and not classes. Structs in C do not, repeat **do not** have functions. They are **data only**.
So to define our Ball we can define it as follows

{% highlight C %}
typedef struct Ball
{
	int32 x, y, xDir, yDir, size;
	uint16 color;
}Ball;
{% endhighlight %}

Again this definition should go outside of any other functionality and just prior to the location of the main() function. 
Now the fun part adding in the functionality for the ball. As we're using C we don't have access to C++'s name mangling that happens at compile time, so functions all have to be explicitly named to avoid any naming collisions. 
So lets add an initialise and an initialise, a move, a draw and a clear function for the ball structure.
After the definition of the ball structure add the following 

{% highlight C %}
void InitBall(Ball* a_ball, int32 a_x, int32 a_y, int32 a_size, int16 a_color)
{
	a_ball->x = a_x;
	a_ball->y = a_y;
	a_ball->size = a_size;
	a_ball->color = a_color;
	a_ball->xDir = a_ball->yDir = 0;
	StartBall(a_ball);
}

void MoveBall(Ball* a_ball)
{
	bool reset = false;
	a_ball->y += a_ball->yDir;
	if (a_ball->y < 0)
	{
		a_ball->y = 0;
		a_ball->yDir *= -1;
	}
	if (a_ball->y > SCREEN_H - a_ball->size)
	{
		a_ball->y = SCREEN_H - a_ball->size;
		a_ball->yDir *= -1;
	}

	a_ball->x += a_ball->xDir;
	if (a_ball->x < 0 || a_ball->x > SCREEN_W - a_ball->size)
	{
		reset = true;
	}

	if (reset)
	{
		a_ball->x = 115; a_ball->y = 75;
		a_ball->xDir = 0;
		StartBall(a_ball);
	}

}

void ClearBall(Ball* a_ball)
{
	drawRect(a_ball->x, a_ball->y, a_ball->size, a_ball->size, setColor(0,0,0));
}

void DrawBall(Ball* a_ball)
{
	drawRect(a_ball->x, a_ball->y, a_ball->size, a_ball->size, a_ball->color);
}

void StartBall(Ball* a_ball) {
	
}
{% endhighlight %}

In the above it's important to note that we're passing the ball object around as a pointer, if this were C++ I'd do this as a reference argument but C doesn't support that. So pointers it is. 

Then modify the **main()** function so that it looks like the following 

[Main function with a Ball!](/assets/images/2019-02-16-004.PNG "GBA: Main with a Ball!")

Running this program in it's current state should provide you with the following rather static GBA Rom. 

[Running the program as it is..](/assets/images/2019-02-16-005.PNG "GBA: Rather Dull huh!")

Let's add a little bit of movement to the ball by getting that StartBall function to actually do something. First up we're going to add some functionality to provide us with a random number value that will give the ball a random starting direction, and a fucntion to get a random value within a range in the case of our ball we want that to be between -1 and 1.

Here's the code to get some random numbers happenning, oh and I've gone ahead and defined a function to get the sign of a nmber and the absolute value of a number too. These fucntions should be put into the code after the vsync function declaration but prior to the setColour function.

{% highlight C %}
int32 __qran_seed = 42;

int32 sqran(int32 a_val)
{
	int32 old = __qran_seed;
	__qran_seed = a_val;
	return old;
}

int32 qran()
{
	__qran_seed = 1664525 * __qran_seed + 1013904223;
	return (__qran_seed >> 16) & 0x7FFF;
}

int qran_range(int32 a_min, int32 a_max)
{
	return (qran()*(a_max - a_min) >> 15) + a_min;
}

int32 sign(int32 a_val)
{
	return (!(a_val & 0x80000000) && !a_val) ? 1 : -1;
}

int32 abs(int32 a_val)
{
	int32 mask = a_val >> 31;
	return (a_val ^ mask) - mask;
}
{% endhighlight %}

Then in the StartBall function the following code can be written, this creates a small loop to get teh ball moving in the left or right direction and then a random Y direction, this loop is there to prevent the ball from not moving in the X direction.

{% highlight C %}
void StartBall(Ball* a_ball) {
	while (a_ball->xDir == 0)
	{
		a_ball->xDir = qran_range(-1, 2);
	}
	a_ball->yDir = qran_range(-1, 2);
}
{% endhighlight %}

So that's a moving ball that re-centers itself when it goes outside the bounds of the screen.

Next up we need to draw a couple of paddles.

The paddle structure looks like this:
{% highlight C %}
typedef struct Paddle
{
	int32 x, y, width, height;
	uint16 color;
}Paddle;
{% endhighlight %}

Then there's the paddle functionality to consider, which is largely the same as the code that was produced for the ball.

{% highlight C %}
void InitPaddle(Paddle* a_paddle, int32 a_x, int32 a_y, int32 a_width, int32 a_height, int16 a_color)
{
	a_paddle->x = a_x;
	a_paddle->y = a_y;
	a_paddle->width = a_width;
	a_paddle->height = a_height;
	a_paddle->color = a_color;
}

void MovePaddle(Paddle* a_paddle, int32 a_val)
{
	a_paddle->y += a_val;
	if (a_paddle->y < 0)
	{
		a_paddle->y = 0;
	}
	if (a_paddle->y > SCREEN_H - a_paddle->height)
	{
		a_paddle->y = SCREEN_H - a_paddle->height;
	}

}

void ClearPaddle(Paddle* a_paddle)
{
	drawRect(a_paddle->x, a_paddle->y, a_paddle->width, a_paddle->height, setColor(0, 0, 0));
}

void DrawPaddle(Paddle* a_paddle)
{
	drawRect(a_paddle->x, a_paddle->y, a_paddle->width, a_paddle->height, a_paddle->color);
}
{% endhighlight %}

This now leaves you to modify your main function to look like the following image

[Completed Main Function](/assets/images/2019-02-16-006.PNG "GBA: Now with Paddles!")

When buliding and running this you should now have something that looks a bit like the following,

[Running the ROM](/assets/images/2019-02-16-007.PNG "GBA: Ohh Pretty!")

You may notice some filckering with the rendering, this can be down to the fact that the default build is in DEBUG mode and that any compiler flags that produce a more efficient build are disabled, so you get the GBA code running at it's slowest speed with no optimisations. 
Running this in Release mode should lose the flickering, but will not allow you to debug the application. 

I'd love to hear any feedback on this, I've uplaoded the [finished product to GitHub](https://github.com/JamieDStewart/001_GBA_Hello_Pixel) if you've found this in the slightest part useful then please let me know. 

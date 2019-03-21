---
layout: post
title: "GBA Development: Button Input Handling"
categories:
  - GBA Dev
tags:
  - gameboy advance
  - programming
  - vs code
  - input handling
  - IO
---

Ok so looking at [GBATek](https://problemkaputt.de/gbatek.htm#gbakeypadinput) we can find out all about the keypad input registers and which bit of those registers corresponds to which individual button.  
There is one tidbit of information from GBATek that we do need to pay attention to, you might assume that when a button is pressed that the bit in the IO register that it relates to is turned on. This is infact the opposite of what happens. The **REG_KEYINPUT 0x04000130** has all bits turned on when buttons are not pressed. This isn't really a massive issue, it just means that we need to look for when a button's bit is in the off state to indicate a press.

Ok so the first step is to create a new header file called **gba_input.h**, remember as always to put this header file into the *include* folder, I really can't stress enough how important good project folder structure is, especially when working with makefiles.
I'll work through this file in a line by line fashion but the first thing we will need to add as always is our include guards and some additional GBA specific includes.

{% highlight C %}
//---------------------------------------------------------------------------------
// This header file outlines the registers for GBA Key Input and provides functionality
// for handling key presses
//
//---------------------------------------------------------------------------------


#ifndef __GBA_INPUT_H__
#define __GBA_INPUT_H__

#include "gba_reg.h"
#include "gba_types.h"
#include "gba_macros.h"

// All of our input handling code will go inside this include guard

#endif //__GBA_INPUT_H__
{% endhighlight %}

Alright so the rest of the code we're going to write for this will go inside the include guard for this file.
The first step is to define our key input register (**REG_KEYINPUT**) and the Key Interrupt Control Register (**REG_KEYCNT**). We won't be using the Key Interrupt Control Register just yet, that will come in future GBA dev posts, this register is used to set up allowing key input to trigger hardware interrupts, and shouldn't be used for detecting standard user input. This is all documented in GBATek, it should be noted too that this interrupt seems to take a couple of frames to respond which does not make it ideal for handling user input in fast paced games (or any games really).

So lets define these two regiters, note the names for these registers, as with all registers that we define I have taken straight out of the GBATek documentation, which funnily enough is the same names that they have in the official Nintendo documentation.

{% highlight C %}

#define REG_KEYINPUT	*(v_u16*)(REG_BASE + 0x130)
#define REG_KEYCNT		*(v_u16*)(REG_BASE + 0x132)

{% endhighlight %}

Ok so that bit was easy, we should by now be in the habit of using *#define* to provide GBA registers with nice names that we can use within our codebase. Let's define an enumerator that we can use to give some definition to our keys that we are looking for, looking at GBATek we can see that in both registers that the key values are represented by the same bit number, A is bit 0 in both REG_KEYINPUT and REG_KEYCNT, B is bit 1 in both registers. This means that we can use this enum for both registers, without any confilcts.

{% highlight C %}
typedef enum KEYS
{
	A       = (1 << 0),
	B       = (1 << 1),
	SELECT  = (1 << 2),
	START   = (1 << 3),
	RIGHT   = (1 << 4),
	LEFT    = (1 << 5),
	UP      = (1 << 6),
	DOWN    = (1 << 7),
	R       = (1 << 8),
	L       = (1 << 9),

	KEYIRQ_ENABLE   = (1 << 14),	/*!< Enable keypad interrupt */
	KEYIRQ_OR       = (0 << 15),	/*!< interrupt logical OR mode */
	KEYIRQ_AND      = (1 << 15),	/*!< interrupt logical AND mode */


}KEYS;
{% endhighlight %}

I'm still using **typedef** when creating an enum much the same way I do with structs. This practice could be seen as being bad, Linus Torvalds even made a post about it once.  Coming from a C++ background some habits are hard to drop, I can see his point, but for our purposes here it's not going to be an issue. If you don't want to typedef your structs or enums then that's totally fine, you don't have to. I'll continue to do so.
So we've made use of bit shifting to assign the enum values. A is equal to 0, B is equal to 2, Select is 4, Start is 8 and so on.

As we're only interested in the lower 10 bits of the REG_KEYINPUT for detecting our key presses we can use a bit mask of 1023 or in HEX 0x03FF which in binary is 0b1111111111 to mask off any values above that which may come in.

Our intent here is that we will poll our hardware keys once per frame, this will tell us each update loop if something has been pressed, so hopefully we're running at the GBA's native update cycle of around 60FPS that's every 0.016 seconds we can poll to see what keys are being pressed. But as key presses can happen quite quickly and we want to know additional information such as has a button been presses, held, released etc we're going to use two variables to keep track of our key state. A current key state and a previous key state. We'll have an inline function for **PollKeys()** which we will call once a frame to update these values. Or previous value will be allocated what is in the current value, and we will read the REG_KEYINPUT to get the current hardware values.

{% highlight C %}
#define KEY_MASK 0x03FF
//Vars to hold the current and previous state of the hardware keys
extern u16 __currKeys, __prevKeys;
//Function to test for Hardware Key Depress
INLINE void PollKeys()
{
	__prevKeys = __currKeys;
	__currKeys = ~REG_KEYINPUT & KEY_MASK;
}
{% endhighlight %}

Notice that there is a *~* infront of REG_KEYINPUT, this will flip all the bits of this register as I said above a 0 value means pressed and a 1 value means released. It's easier for us to flip this so that a 1 value is pressed and 0 is not pressed.

Ok so we now have a function that can read from this register to get us the current state of the GBA buttons. Let's add some functions to retreive these values as we really shouldn't access global variables directly, of course we can but we shouldn't accessing them via a function is a bit cleaner and a nice practice to get into.

{% highlight C %}
INLINE u16		currentKeyState()           { return __currKeys; }
INLINE u16		prevKeyState()              { return __prevKeys; }
{% endhighlight %}

Ok so here's were some bitwise operations are going to come into effect. If you need a refresher on bitwise operators have a look at this [Wikipedia](https://en.wikipedia.org/wiki/Bitwise_operation) article. If we use a **bitwise and (&)** with our current key value this will return a value were the __currentKeys variable and the key value we ask for have their same bits turned on. We can use this to detect when a key is down, additionally to this we can detect if a key is up by doing a *bitwise and* test with ~__currentKeys variable and the key value we are after.
The code for this looks like the following:

{% highlight C %}
INLINE u16		keyDown(u16 a_key)       { return __currKeys & a_key; }
INLINE u16		keyUp(u16 a_key)         { return ~__currKeys & a_key; }
{% endhighlight %}

The value we pass into these functions would be one of the enum values from our KEYS enum. So calling keyDown(A) would return a value when the A button is down. In this scenario it would return a value of 1 which is equal to the value of A, if we asked for keyDown(B) this would return a value of 2 or B. What if we asked if two buttons were down... we could then have something like 

{% highlight C %}
if( keyDown(A) && keyDown(B) )
{
    //do something...
}
{% endhighlight %}

Although this is a bit wastefull calling the function twice, fortunately the way that this code is written we can do a little better by making use of a *bitwise OR (|)*

{% highlight C %}
if( keyDown( A | B ) == (A|B) )
{
    //do something
}
{% endhighlight %}

Ok so we can tell when a key is down and a key is up... but we haven't made any use of that previous state variable yet. Well we can use that to figure out if a key has been **held**, if the key has just been **released** or if a key has just been **pressed**.
Here are those functions in the order of held, released, just pressed (called this one hit).

{% highlight C %}
INLINE u16		keyHeld(u16 a_key)       { return (__currKeys & __prevKeys) & a_key; }
INLINE u16		keyReleased(u16 a_key)   { return (~__currKeys & __prevKeys) & a_key; }
INLINE u16		keyHit(u16 a_key)        { return (__currKeys & ~__prevKeys) & a_key; }
{% endhighlight %}

Lastly a function to see if a button has undergone any state change may be useful. So here's a function that will tell you if a button has changed since the last frame.

{% highlight C %}
INLINE u16		keyStateChange(u16 a_key){ return (__currKeys ^ __prevKeys) & a_key; }
{% endhighlight %}

That's pretty much it, key presses can all now be detected. Although there is some useful functionality that we can add, if you're familiar with Unity then you will know about being able to get input as **horizontal** or **vertical**, this is a rather nice feature and has been implemented in many an engine since the dawn of games development. It's not just a Unity thing.
The idea here is that we cannot have both left and right pressed at the same time, well we can but they would cancel each other out, as would pressing up and down at the same time.
So let's add some functionality to handle detecting horizontal and vertical input and we will return a -1 value for left or down and a positive value or 1 for right or up.

{% highlight C %}
typedef enum AXIS
{
	HORIZONTAL = 0,
	VERTICAL,

}AXIS;

INLINE s16	getAxis(AXIS a_val)
{
	switch (a_val)
	{
	case HORIZONTAL:
		//shift __currKeys down 4 to move the value for RIGHT to the lowest bit & with 1 do the same for LEFT and subtract
		//if right is pressed the equation becomes 1 - 0 = 1, if Left is pressed then 0 - 1 = -1.
		return ((__currKeys >> 4) & 1) - ((__currKeys >> 5) & 1);
	case VERTICAL:
		//This is the same logic as above however uses UP and DOWN.
		return ((__currKeys >> 6) & 1) - ((__currKeys >> 7) & 1);
	default:
		return 0;
	}
}
{% endhighlight %}

Now we can call the getAxis function with a value of *HORIZONTAL* or *VERTICAL* and it will return a +/- value if we are pressing the dpad in one direction or 0 if we aren't pressing it or if we are pressing it in both directions.
Ok so how to make use of this, if you've been keeping up with the rest of the tutorial series this would come in at the point in Pong where we need to be able to move the paddles around. So a **MovePaddle()** function can be added into the *Paddle.h/.c* files.

Here is the content of the **MovePaddle** function which should be put into the Paddle.c file, remember to put the function definition in the Paddle.h file.

{% highlight C %}
void MovePaddle(Paddle* a_paddle, s32 a_val)
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
{% endhighlight %}

Now the content of the **main.c** file can be altered to have the game loop (the while loop) look like the following.

{% highlight C %}
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
{% endhighlight %}

That covers input handling for now, we will return to this at a later point in time to examine the REG_KEYCNT register to see how this can be used to set up and configure hardware interrupts that occur when a key press happens. Until then you now have moving paddles in Pong. Implementing AABB collision between the ball and the paddles is something I'll leave up to you for a short time until the next post.

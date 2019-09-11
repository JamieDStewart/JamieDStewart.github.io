---
layout: post
title: "GBA Development: Interrupt Handling"
categories:
  - GBA Dev
tags:
  - gameboy advance
  - programming
  - vs code
  - hardware interrupts
  - interrupts
---

Alright so we should all be able to agree that the following is a really bad way to handle VSYNC:

{% highlight C %}

void vsync()
{
	while (REG_VCOUNT >= 160);
	while (REG_VCOUNT < 160);
}

{% endhighlight %}

Let's change this so that we hadle VSYNC in a much more sensible fashion and we will introduce how to use hardware interrupts.

## Interrupts ##

Interrupts are hardware specific flags that can be set to indicate that we want the CPU to stop whatever it is currently doing, to interrupt the program flow, and to execute something else the when the interrupt has been handled to continue with the previous flow of the program.

With this in mind it should be noted that interrupt functions should typically be quite small tasks that are executed and wrapped up quickly so as not to interfere with or delay the execution of the main program.

### Enabling Interrupts ###
In order for interrupts to be enabled on the GBA there needs to be a hardware flag set. Looking at [GBATek's Write up of Interrupt Controls](http://problemkaputt.de/gbatek.htm#gbainterruptcontrol) we can see that there is an Interrupt Master Enable Register that needs to be set in order for interrupts to be enabled. This is the **REG_IME** flag, setting this to a value of 1 will enable hardware interrupts.

As these hardware interrupts are handled at the bios level then let's introduce a new header file into our GBA project called **gba_bios.h** and an accompanying **gba_bios.c** source file. Add the following content to this file, we now have a define named for the IME which is located at the memory address 0x04000208.

{% highlight C %}
#ifndef __GBA_BIOS_H__
#define __GBA_BIOS_H__

#include "gba_reg.h"
#include "gba_macros.h"
#include "gba_types.h"

//master interrupt controller 0 off 1 on
#define REG_IME (*(v_u16*)(0x4000208))

#endif //__GBA_BIOS_H__
{% endhighlight %}

### Setting and Acknowledging Interrupts ###
Now that we have a way to enable interrupts we need to be able to set those interrupts up to be triggered, and when triggered we need a way to acknowledge when these interrupts are handled.
By 'handled' I mean a way for us to inform the system that the triggered interrupt has been dealt with.

There are two 16 bit registers that are used to set and acknowledge interrupts. These are defined in GBATek as REG_IE (Interrupt Enable Register) 0x04000200 and REG_IF 0x04000202 (Interrupt Request Acknowledge).

These defines could now be added into our newly created **gba_bios.h** file

{% highlight C %}

//Interrupts that are registered or Interrupts Expected
#define REG_IE (*(v_u16*)(0x4000200))
//IF is the interrupt Fired, 
#define REG_IF (*(v_u16*)(0x4000202))

{% endhighlight %}

The breakdown of individual bits in these registers is presented on GBATek as follows:
 
* 0     LCD V-Blank                    (0=Disable)
* 1     LCD H-Blank                    (etc.)
* 2     LCD V-Counter Match            (etc.)
* 3     Timer 0 Overflow               (etc.)
* 4     Timer 1 Overflow               (etc.)
* 5     Timer 2 Overflow               (etc.)
* 6     Timer 3 Overflow               (etc.)
* 7     Serial Communication           (etc.)
* 8     DMA 0                          (etc.)
* 9     DMA 1                          (etc.)
* 10    DMA 2                          (etc.)
* 11    DMA 3                          (etc.)
* 12    Keypad                         (etc.)
* 13    Game Pak (external IRQ source) (etc.)
* 14-15 Not used

From this we can see that we have hardware interrupts available for Vertical Blank, Horizontal Blank, when a specific Vertical draw position is met, four interrupts for timer overflows, a serial communications interrupt, interrupts on DMA copies, keypad interrupts, and an interrupt for gamepak's to utilise.

There is quite a lot that can be done with these, but for today's exercise and to get us familiar with the process of handling interrupts we will only be looking at making use of the VBLANK Interrupt.

### How do interrupts get called? ###
Ok it's great that we have some interrupt registers, but how does any code, or rather how do we specify what code gets called when one of thse interrupts is triggered?

Well as we're intereseted in setting up a VBLANK interrupt there is an additional place that we need to register that interrupts are enabled for the screen and this is with the register for the display status (**REG_DIPSTAT**) so let's add that into the gba_bios.h file too.

{% highlight C %}

//REG_DIPSTAT interrupts for the display need to be registered here too
// for the display to fire the interrupts off
#define REG_DISPSTAT (*(v_u16*)(0x4000004))

{% endhighlight %}

Ok so when an interrupt is registered when the criteria for that interrupt is met, such as when the display controller informs the CPU that a VBLANK is occuring then the CPU will call the memory address that is pointed to by 0x03007FFC, so in effect what we need to do is store a pointer to a void function that takes no arguments at this memory location. 

{% highlight C %}

//REG_INTERRUPT this memory address is where the interrupt funciton pointer will be stored
#define REG_INTERRUPT *(fnptr*)(0x03007FFC)
//REG_IFBIOS this is the BIOS register address that needs to be set to inform the bios 
//that any interrupts it was expecting have been dealt with.
#define REG_IFBIOS (*(v_u16*)(0x3007FF8))

{% endhighlight %}

In the above the define for REG_IFBIOS is defined, this is a register that duplicates the REG_IF register and is used by the bios to acknowledge any interrutps that the bios needs to be concerned with such as IntrWait and VBlankIntrWait

Now that all the registers are defined it will make the code much easier to read and use if we additionally define all of our potential interrupt flags. Go ahead and add in the following defines to gba_bios.h which reflect the bit values in the above bullet point list for REG_IE and REG_IF. Additionally the dfeined values for the REG_DIPSTAT are defined in this code block.

{% highlight C %}

//Defines for Interrupts
//There are 14 Interrupts that we can register with REG_IE
#define INT_VBLANK 	0x0001
#define INT_HBLANK 	0x0002
#define INT_VCOUNT 	0x0004
#define INT_TIMER0 	0x0008
#define INT_TIMER1 	0x0010
#define INT_TIMER2 	0x0020
#define INT_TIMER3 	0x0040
#define INT_COM 	0x0080
#define INT_DMA0 	0x0100
#define INT_DMA1	0x0200
#define INT_DMA2 	0x0400
#define INT_DMA3 	0x0800
#define INT_BUTTON 	0x1000
#define INT_CART 	0x2000
//create pointer to video memory
#define DSTAT_VBL_IRQ 0x0008
#define DSTAT_VHB_IRQ 0x0010
#define DSTAT_VCT_IRQ 0x0020

{% endhighlight %}

### Putting it all Together ###

Now that the registers are all defined let's get some functions created that make use of these defines. Let's start by creating a function pointer that will allow us to tell the GBA hardware where our interrupt handler function is.

I don't want to get into this just yet but interrupts are handled via ARM specific code in order to get things working happily on the GBA we will need to add the following into the **gba_macros.h** file

{% highlight C %}

#define ARM __attribute__((__target__("arm")))
#define THUMB __attribute__((__target__("thumb")))

{% endhighlight %}

With those defines in gba_macros.h we can now add teh following code into **gba_bios.h**

{% highlight C %}

typedef void (*fnptr)(void);

//This is the declaration for the function we will call to trigger the VBLANK interrupt wait
void vblank_intr_wait();
//This is the function that will be called by the CPU when an interrupt is triggered
ARM void interruptHandler();
//this is the funciton that we wil call to register that we want to register a VBLANK Interrupt
void register_vblank_isr();

{% endhighlight %}

Here we have typedef'd out fnptr to indicate a function that is of return type void and takes no function arguments/parameters.

Now in gba_bios.c we need to write out function definitions for the three function we have declared up above.

{% highlight C %}

#include "gba_bios.h"

void vblank_intr_wait()
{
  // 0x5 is VBlankIntrWait in the function table.
  asm volatile("swi 0x05");
}

ARM void interruptHandler()
{
	REG_IF = INT_VBLANK;
	REG_IFBIOS |= INT_VBLANK;
}

void register_vblank_isr()
{
	REG_IME = 0x00;
	REG_INTERRUPT = (fnptr)interruptHandler;
	REG_DISPSTAT |= DSTAT_VBL_IRQ;
	REG_IE |= INT_VBLANK;
	REG_IME = 0x01;
}

{% endhighlight %}

Ok so function by function then:

**void vblank_intr_wait**
This function fires off an ASM call by making use of the C asm call. Then the SWI (software Interrupt) instruction is fired off with the 0x05 condition which is the instruction required to trigger the VBlankIntrWait interrupt (the details for SWI instructions can be seen on [GBATek](http://problemkaputt.de/gbatek.htm#biosfunctions)). 

**ARM void interruptHandler**
This is our function that we want the CPU to call when an interrupt is triggered.  As we are only registering INT_VBLANK as the only interrupt then this is all that we need to look for in this function. It should be noted that there can only be one function registered with the Interrupt Handler that the CPU will call into. There is not the ability to register multiple functions to be called by the Interrupt Handler, shoud we wish to handle more than the VBLANK interrupt then we would need to add some additonal code into this function to test which interrupt has been triggered and then handle that interrupt appropriately. 

**void register_vblank_isr**
This function demonstrates how to set up for a VBLANK interrupt to be handled, first the Interrupt Manager is disabled to prevent any interrupts for triggering, then the interrupt function is registered, then the appropriate flags on the dispaly status are set. Finally the expected interrupt flag is set to the VBLANK flag and the Interrupt Manager is switched back on.

### Using all of this ###

To make use of this we can now call register_vblank_isr() in our program to register for vblank
for example somewhere in our main.c file
{% highlight C %}
....... 
//set GBA rendering context to MODE 3 Bitmap Rendering
REG_DISPCNT = VIDEOMODE_3 | BGMODE_2;

register_vblank_isr();

gba_seed_rand(14);
Paddle p1;
..........
{% endhighlight %}

Then within the main while loop we can add the following...

{% highlight C %}
.......
while (1) 
{ //loop forever
	//wait until v-sync occurs
	vblank_intr_wait();
	PollKeys();
.......
{% endhighlight %}

That should be enough to get the VBLANK interrupt happening and to finally get rid of having to use the laothsome VSync function that we were previously relying upon to sync up our frame rate and our processing.

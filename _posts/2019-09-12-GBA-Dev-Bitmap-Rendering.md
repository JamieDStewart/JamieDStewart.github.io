---
layout: post
title: "GBA Development: Bitmap Loading & Rendering"
categories:
  - GBA Dev
tags:
  - gameboy advance
  - programming
  - vs code
  - bitmap rendering
  - bitmap
  - Mode3
  - Mode4
  - Mode5
---

So up until this point we have only looked at rendering in Mode 3, and then we have only looked at rendering lines, and boxes. The GBA supports multipe different rendering modes Modes 3 through to 5 are for bitmap rendering.  I'll briefly explain how these three render modes work.

### Setting the Render Mode ###

Setting the render mode of the GBA is carried out by setting the value of the lowest 3 bits in the register for the display controller (REG_DISPCNT) to a value of 0 -> 5.  Values of 6 or 7 are prohibited as pointed out on [GBATek](http://problemkaputt.de/gbatek.htm#lcdiodisplaycontrol), so don't try that at home!

Of course once you set the render mode you will need to enable at least one background so that anything you draw can be seen. It's important to realise that in Bitmap rendering modes each background shares video memory so enabling more than one background in these modes is a little pointless.

![Setting Render Modes](/assets/images/2019-09-12-000.PNG "GBA:Setting Render Mode")

A bitmap is basically an colour matrix. Look here's a Pikachu bitmap image (which has been saved out as PNG!).

![A Colour Matrix](/assets/images/2019-09-12-0001.PNG "GBA:Pikachu")

Fundamentally in bitmap rendering modes VRAM is treated as what gets displayed on the screen anything you put into a VRAM location will be treated as bitmap data and the hardware will attempt to display it. So with VRAM we basically have one big rectangle of memory in which to store our bitmap data that we want displayed, although there are some differences between the modes.

### Mode3 ###
In Render Mode3 the GBA hardware treats VRAM as one big area of screen where each pixel occupies 16bits worth of data. Well it certainly does this for the first 76,800 bytes (75Kb) of VRAM, as Mode 3 gives us on screen worth of data 240 x 160 pixels @ 16 bits per pixel (2 * 240 * 160 = 76,800 bytes ).
In Mode 3 palette memory is not used to determine the colour of the pixel, the colour data is read directly out of VRAM. For example storing a value of 31 at any memory location in VRAM will draw a red pixel to the screen at that pixel location.
This is what we have been using in our draw routines so far.
{% highlight C %}
//The following code would colour the second pixel on the screen to Red
SCREENBUFFER[1] = 31 
{% endhighlight %}
Pixels on the GBA screen start at the upper left corner of the screen and increment as they move right across the screen. The first pixel on the second row of the screen would be at SCREENBUFFER array position 240 as with arrays westart counting from 0.
So we have a total of 38,400 pixels on the screen with which to create our vibrant landscapes.

### Mode 4 ###
In Render Mode three we have the same render target size of 240 x 160 pixels, however in this mode each pixel only has 8 bits per pixel. So does this mean that this render mode only utilises half the amount of VRAM? 

No, this time we have two pages of VRAM to draw to, or rather to use modern render pipeline terminology we have two render targets to draw to. A Front and Back Buffer if you will, with only one page being able to be displayed at a time by setting a flag in the display control register (REG_DISPCNT) to indicate which page is to be drawn.

In VRAM the first page starts at memory location 06000000 and uses 37.5Kb of memory, the second page starts at memory location 0600A000 and uses another 37.5Kb of memory.

Ok so Mode 4 is the first mode we come across that uses the palette memory to contol the colour value for pixels that are contained within VRAM. Instead of simply setting the pixel colour to the value stored in VRAM at that location instead a palette loook up will happen, as with only 8 bits per pixel there are only 256 possible colour values.  

What those 256 colour values equates to is the colour information that is loaded into the background palette memory. The first colour value loaded into the palette memory in this mode will be used an alpha colour and will not render on the screen.

Only one page can be visible at a time and page flipping is controlled via the display control register, so a page can be displayed to the user while the other page is being drawn into.
A visual example of this is shown here.
![Page Flipping](/assets/images/2019-09-12-001.PNG "GBA:Page Flipping")

### Mode 5 ###
This brings us to Mode 5. This mode is like a mixture of modes 3 & 4 but has a reduced render target size. Instead of drawing to the full 240x 160 pixels of the screen an area of only 160 x 128 pixels is drawn to. 

Although like Mode 3, Mode 5 uses 16 bits per pixel so again values in VRAM correspond directly to pixel colour values and no palette data is used. 

But like Mode 4, Mode 5 allows us to make use of pages, so now we have two pages of memory to swap between like we did in Mode 4. Although we have a reduced number of pixels to draw into, we have dramatically increased the number of colours available for us to use!

You have to take the good with the bad I guess. 

### Bitmap Render Modes Summarised ###
![Bitmap Render Modes](/assets/images/2019-09-12-002.PNG "GBA:Bitmap Render Modes in a Table")

One thing that to note from [GBATek](http://problemkaputt.de/gbatek.htm#lcdvramoverview) is that in all bitmap render modes there is 16Kb of OAM data in VRAM.

This means that in these render modes you can still make use of sprite data, and use the sprite palette memory to have sprites appear on screen.

The majority of GBA games in existance primarily utilise Render Modes 0-2 which are the tile based redering modes available to use in GBA hardware. However many of these games have made use of some bitmap rendering modes for static screens that required a high amount of colour data to be presented of for things like title screens or other splash screens (Some companies are very sensitive about their logos and titles having to have precise colour data!).

### But How!... ###
Ok so that's a bit of an explanation of bitmap render modes and their differences. But how to get image data into our GBA ROM. 

Well the GBA doesn't have a file system or anything of that kind so it's not like we can tell our compiler to bundle images into our ROM (Actually with raw bitmap data you kind of can but let's not, and say we did).

So how can I get this Image...
![GBA IMAGE](/assets/images/2019-09-12-003.PNG "GBA:An image of a GBA")
Into my GBA Rom?

What we can do is store the image we want to use in our program as raw data the we can store in a const array and read from it that way. So it becomes as easy as reading from an array, an array that happens to contain pixel data.

Now encoding an image into an array by hand is pretty tedious, thankfully there are some tools that exist out there that do exactly what we need. The creator of the Tonc library has some tools with it that we can use to get the job done. [Usenti](http://www.coranac.com/projects/#usenti) does just what we need and is quite easy to use.

First you need to open it and load in the image that you want to export for the GBA, here's a screen grab of the process that I went through to convert te GBA image above into an array of C data and an array of palette data when converting it for Mode 4.

![Usenti Process 01](/assets/images/2019-09-12-004.PNG "GBA:Usenti 01")

Once the image is loaded into Usenti (make sure that it's not larger than 240 x 160 pixels), then open up the image menu option and click on export right at the bottom.

This will bring up the following dialog, **make sure to select the option to save as c file from the drop down option** and not as a raw bitmap (more on this later). 

![Usenti Process 02](/assets/images/2019-09-12-005.PNG "GBA:Usenti 02")

I've already got a couple of exports saved out as you can see in this image I used a simple naming convention of precursoring any image data files with img_ and then a name for the image content, in this case gba with a trailing naming convention to indicate the render mode the image was saved for _m3/_m4/_m5.

Clicking Ok takes your through to the following configuration page, make sure to select the bitmap option from the drop down menu in the upper left and not to save as tile data. Then ensure that the right number of bits per pixel is selected for the mode you want to save the data out for (16 bpp for Mode 3 and Mode 5, 8bpp for Mode 4). 

![Usenti Process 03](/assets/images/2019-09-12-006.PNG "GBA:Usenti 03")

If you are saving for Mode 5 then you can change the width and height in the area tab by choosing the custom button and entering the dimensions for that mode.

Once all that's finished you should have generated a C source file and an accompanying header file for the image data. All the data will be contained in the C file with the header having some useful defines in it for getting the size of the data containted in the image.

### Header File Contents for Mode 3 ###

![Mode 3 Image Header File](/assets/images/2019-09-12-007.PNG "GBA: Mode 3 Header")

### Source File data for Mode 3 ###

![Mode 3 Image Source File](/assets/images/2019-09-12-008.PNG "GBA: Mode 3 Source")

### Rendering BitMap Data ###

In the following C code from **main.c** all I am doing is including the header files for the image data, and making use of a simple switch statement that when the A button is released changes the rendering Mode between Modes 3, 4 and 5. When rendering modes are switched I make use of memcpy to copy the data from the image data arrays into VRAM.

There really isn't any code in this tutorial that you haven't seen in previous tutorials, save perhaps the use of memcpy. This is a native C funtion that is found in string.h that is used to copy memory in byte size chunks from a source to a destination location.

The Syntax for memcpy is **memcpy( destination, source, number of bytes to copy)**.

For Mode 4 rendering palette memory needs to be copied into the background palette bank the memory address that MEM_PALETTE points to is defined in **gba_gfx.h** as:

{% highlight C %}
#define MEM_PALETTE			((u16*)0x05000000) 
{% endhighlight %}

The contents for **main.c** are as Follows:

{% highlight C %}
#include "gba_macros.h"
#include "gba_types.h"
#include "gba_gfx.h"
#include "gba_drawing.h"
#include "gba_mathUtil.h"
#include "gba_input.h"

//include the header file for the bitmap image
#include "img_gba_m3.h"
#include "img_gba_m4.h"
#include "img_gba_m5.h"

#include <string.h>

int main()
{

	u16 vidMode = VIDEOMODE_3;
	memcpy(SCREENBUFFER, img_gbaM3Bitmap, img_gbaM3BitmapLen);
	//set GBA rendering context to MODE 3 Bitmap Rendering
	REG_DISPCNT = VIDEOMODE_3 | BGMODE_2;
	while (1) { //loop forever
		vsync();

		PollKeys();

		if( keyReleased(A) )
		{
			vidMode += 1;
			if( vidMode > VIDEOMODE_5)
			{
				vidMode = VIDEOMODE_3;
			}

			switch (vidMode)
			{
				case VIDEOMODE_3:
				{
					memcpy(SCREENBUFFER, img_gbaM3Bitmap, img_gbaM3BitmapLen);
					break;
				}
				case VIDEOMODE_4:
				{
					memcpy(SCREENBUFFER, img_gba_m4_bitmap, img_gba_m4BitmapLen);
					memcpy(MEM_PALETTE, img_gba_m4_pal, img_gba_m4PalLen);
					break;
				}
				case VIDEOMODE_5:
				{
					memcpy(SCREENBUFFER, img_gba_m5Bitmap, img_gba_m5BitmapLen);
					break;
				}
				default:
					break;
			}
			REG_DISPCNT = vidMode | BGMODE_2;
		}
		
	}
	
	return 0;
}
{% endhighlight %}

If everything has gone to plan and you have implemented the above then you should be presented with the following when running the program.

![Look It Works](/assets/images/2019-09-12-fin.PNG "GBA: Bitmap Rendering")

This tutorial didn't look at page flipping, the next write up will cover page swapping and loading in and rendering of bitmap data specifcally for Mode 4. 

.kthanxby.
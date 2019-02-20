---
layout: post
title: "GBA Development: OS X pathces and use an older version of mGBA"
categories:
  - GBA Dev
tags:
  - gameboy advance
  - programming
  - vs code
---

Ok so a couple of small items that have cropped up since I put up that first YouTube video on the VS Code setup for GBA Dev. I've cleaned up some of the items in the project and I've commited some Mac specific changes to the **tasks.json**, **launch.json**, and **c_cpp_properties.json** files to make working on Mac a bit nicer. Although as I discovered thanks to a reddit comment, there's a problem with mGBA's latest release and gdb debuggin in VS Code.

I've not 100% found a fix for this, but mGBA version 0.6.2 [Available here](https://mgba.io/old.html) works pretty well. Although mGBA on OS X does refuse to relenquish control to the terminal after it starts, yes even when run as a background process. This lack of relenquishing control prevents the debuger from launchingin a single click, or press of F5 (or if your MacBook is newer than mine, and that's not hard, a swipe of the touch bar). 

The fix is to launch the debugger, then once mGBA is up and waiting for a connection on it's splash screen to stop the debugger with the stop button on the VS debug toolbar, and then press F5 again to relaunch the debugger. This will allow it to finally connect to the already running instance of the mGBA emulator and you can debug the same way that you would on the PC.

I've additionally patched up some of the incude folders in the **c_cpp_properties.json** file and taken out a couple of unrequired include paths that were seemingly left over from somewhere else.

So I'm happy that this works *pretty well* on both Mac and PC and that from feedback that others have gotten this working too and it's not just on my machine. *Phew*.

I'll be putting the next video up in a couple of days from now, hopefully with less white noise as I've sourced a microphone, not sure how brilliant it is but tests have show improvement. 

Oh and if you're on Mac and you get an issue about the debugger not being signed then have a look on the link in the youtube video as there's a guide I link to that explains how to codesign GDB so that it can listen in on other processes and actually be of use, Mac security is a bit OTT sometimes. 

.kthankxby.
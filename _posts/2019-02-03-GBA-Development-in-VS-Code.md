---
layout: post
title: "GBA Development: Using VS Code for retro dev"
categories:
  - GBA Dev
tags:
  - gameboy advance
  - programming
  - vs code
---

So the first port of call on programming that I want to cover is Game Boy Advance programming using Visual Studio Code as the IDE of choice.

Sure there are other IDE's that I could use, like Visual Studio 2017, VS Code's bigger more bloated sibling, but it doesn't work across as many platforms and sometimes I find myself coding on a Macbook. 

I've put up a simple project on my github to get you started with GBA dev, <a href="https://github.com/JamieDStewart/GBA_VSCode_Basic">this is just a simple test project</a> that draws some pixels to the GBA screen in Mode 3 (totally going to cover more of that later) and runs the GBA binary through mGBA and gdb-debugger to allow for line by line source debugging in VS Code.

In the past I've used tools like No$GBA to debug and run GBA games/things that I've worked on, now don't get me wrong No$GBA is great and has some fantastic features and a very nice layout for tiles and backgrounds but it's debugger can be a little overwhelming if you're just starting out and you don't speak ARM ASM.  

The other intimidating issue is that the majority of GBA makefile's that I've seen turn the optimisations up to one million which strips out any of the debug information from the GBA rom and doesn't allow easy debugging of the rom in anything. I've edited the makefiles here to allow for both *debug* and *release* builds with optimisations turned off for the debug build.

There is a readme file with the project, read through that once you've pulled the project down from GitHub and you should be able to get the thing up and running. I'll deal with the next portion of this project in the next few days in a subsequent post.

.kthanxbye.


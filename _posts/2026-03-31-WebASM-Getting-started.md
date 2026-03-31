# Getting started with WebASM

So I'm building everything on a headless Raspberry Pi as part of something to do to challenge myself and to demonstrate that you can build some pretty
interesting portfolio projects on some very basic hardware. It's been said to me before from students that you need to have some beefy hardware to create a good portfolio, that's really not the case. 

A good portfolio site should be a demonstration of not just how you write code but how you write code within constraints. I've always enjoyed programming to a performance budget. Older consoles are where I started out, and those have constraints. So my first constraint in this is that everything must run on a Raspberry Pi 3B, which is still far more powerful than the PC's I grew up with.

Secondly as my set up is a headless Pi, one that has no screen or keyboard or mouse attached there's a bit of a challenge in seeing it run anything. Well command line applications will run just fine, but anything that needs to produce an interactive scene won't really work. 

So I can code everything on the Pi, and build everything via the Pi then what? Well WebASM is what. 

I can compile everything I do in C++ via emscripten into HTML and JavaScript. While this means that what I code isn't strictly running on the PI it;s possible to build it, serve it and test it. Which for me works out, as I've been meaning to work in an excuse to look at doing something in WebASM for a while now.

So first up a quick what's what of C++ compilation for WebASM. 

## Emscripten

[Emscripten](https://emscripten.org/) is a complete compiler toolchain to WebAssembly. It uses LLVM and focuses on speed, size and getting things executing via the browser.

Installation on Linux is an absolute breeze and can be read about [here](https://emscripten.org/docs/getting_started/downloads.html). It's a matter of cloning the `emscripten-core` GitHub repo then running the install and activeate scripts in that repository. 

After following the installation instructions and verifying that everything has installed correctly (`emcc -v`) I'll be creating a very small tests project to verify that it's all set up correctly.

## Hello Emscripten

I'm a stickler for having a proper folder structure for everything I do. So in my `dev` directory I've created a `web_asm` folder and in that made a quick hello world application.

```
$ mkdir hello_world
$ cd hello_world
$ touch hello_world.cpp
$ sudo nano hello_world.cpp
```

That will create the `hello_world.cpp` file that will hold the **main** function for this application. We're only going to do something as basic as display "Hello World" to the console. So in the opened editor I'll create the following C++ code.

```
#include <cstdio>

int main() {
    printf( "Hello, WebASM from C++!\n" );
    return 0;
}
```

Save and exit the nano text editor. Now I can compile this using emscripten via the commandline

```
emcc hello_world.cpp -O2 -s WASM=1 -s EXIT_RUNTIME=1 -o hello_world.js
```

Then the output of this can be tested in Node by running:

```
node hello_world.js
```

This will show the expected output of *"Hello, WebASM from C++!"* which is great and as we want to see this from a browser we need to set up a HTML file to run that particular script. So back to the command line again.

```
$ touch index.html
$ sudo nano index.html
```

Then inside of the nano editor add some HTML to the file:

```
<!doctype html>
<html>
    <body>
        <script src="hello_world.js"></script>
    </body>
</html>
```

Then as python is set up on the Pi by default I can simply run `python3 -m http.server 8000` to run a web server from this directory and browse to the IP address of my Pi to see the resutls. Which looks like nothing at first, but press *F12* to view source and look at the console and I can see that everything has worked

![HTML Console](/asset/images/2026-03-31-01.png "Web Console Output")

So this was a frist step in the setup and a bit of the rational behind why I'll be writing a bit about using WebASM to show off some small projects.

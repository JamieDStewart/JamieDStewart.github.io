# Building a portfolio site

## Introduction

So my intention with this was to demonstrate what a 'good' portfolio site should look like for a games programmer or a software engineer 
working within one of the primary programming languages used within the games industry (C/C++/C#). 

I've seen many a portfolio site when hiring junior developers and I've noticed that many are missing key elements that make them stand out.


I don't feel that there's a need with a portfolio site to have it hosted anywhere else other than on Github as you will no doubt have some of your work on display and why not have your site located in the same place. 

GitHub Pages work well and there are many ways to use a static site builder like [Jekyll](https://github.com/jekyll/jekyll) or [Hugo](https://gohugo.io/). I've opted to make use of [Marked,js](https://github.com/markedjs/marked) and [Highlight.js](https://highlightjs.org/) which simplifies static site generation by combining markdown which I'm quite familiar with and code syntax highlighting and styling. 

Perfect for developers (like me) who want a clean, code-first approach to blogging with minimal set up.

## Raspberry Pi as a dev machine

Everything I'm coding up is done on a Raspberry pi, as I'd like to demonstrate that you don't need to have an all powerful PC to develop some fun content, plus I enjoy the challenge of making everything cross-platfom (not as difficult as it used to be) and I like to code close to the metal for the most part, and outside of a few web games the majority of content will be C and C++ which can be compiled quite easily on the Pi. 

The other side of this is that I want to explore emscripten and web assembly and using the Pi as a headless linux machine allows me to explore this, develop code on it in C++ and then compile it to Web Assembly using emscripten.

I aim to showcase a sensible approach to development, with a focus on performance and analysis to really show why something is engineered the way it is.


## How I structured this portfolio site

This is very much a work in progress and will be subject to change as I use it more and develop more content on these pages. You can find the structure of this site right here on my Github [jamiedstewart.github.io](https://github.com/JamieDStewart/JamieDStewart.github.io). 

I've structured it as shown, with a script to populate a list of posts from content in the '_posts' directory.

```
this-site/
├── _posts/
│   ├── 2026-03-02-Category-title.md
│   └── 2026-02-24-AnotherCategory-AnotherTitle.md
│   └── index.json
├── _welcome/
│   ├── welcome.md
└── assets/
│   ├── /* folder with image assets for html files */
└── css/
│   ├── /* Any files for CSS styles go in here */
├── js/
│   ├── load-posts.js
│   ├── render-posts.js
├── posts/
│   ├── post.html //Base html file that gets markdown posts loaded into it
├── index.html
```

## Key Features

- **Easy to Use**: Lets me write up a post in markdown and display it as HTML.
- **Code Blocks**: Automatic syntax highlighting based on language type
- **Cross Platform**: Mobile-friendly, works with a range of resolutions, supported in all browsers
- **Fast**: No server-side processing needed

## Deployment

I just have to update the `_posts/index.json` file to pick up any new markdown files in that folder, then push changes to GitHub and the new post will appear on the site.

Automating the process of creating content is a must for me. I'd like as seamless a process as I can to push content to this site, and this so far is nice and easy without overcomplicating it. Plus does allow me to play around a little bit with looking to integrate some WebGL or Wasm when I get around to it, as I'd like to explore some Emscripten.

## Conclusion

So hopefully I'll begin making some regular posts and showcase a few projects that aspiring game developers or junior engineers can look through to pick up some knowledge and to find some inspiration for their own portfolio sites.


I don't intend to make this site too discoverable, I'll certaily not be plugging it too hard outside of some 'classroom' demonstrations that I do in my 'day job' for uni students and secondary visitors to our studio. 

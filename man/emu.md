Header Definitions
==================

* [wall pixels] - define wall color and step size for the VM (1, 2, 3, 4 bytes etc)
                all subsequent codels should follow that scale unless scale is changed
                wall provides bouncing behavior (which also can be dinamically customizable)
                (black works fine here)
* [space] - define color of space delimiter (usually white)
* [def][ ][0][ ][1][ ][2]..[8][term] - space delimited code sequences (cquence) values for numbers 0-8
                starts with definition word
                ends with terminal word
* [ ][comment][ ]

from now on we can define new seq like that: [def] (we are in def mode now) [definition seq] [] [] [] ;

Now it is time to define layout version:

* [0][0][1][sys]

This defines protocol version + code for system calls:

* pushRGBA - push next color rgba integer to stack
* pushR/G/B/A - push a single color byte to stack
* pushAt - push color at point on stack
* pushR/G/B/A/At - push single color value at pos to stack
* pop (or drop?)
* storeAt
* storeRGBAAt
* add
* sub
* mul
* div
* mod
* pow
* neg
* not
* jmp (or move value from stack to CP)
* call
* ret
* eq
* gr
* gre
* ls
* lse
* dup
* swap
* jmpz
* jmpnz
* loopn - loop n times sequence until terminator (wall?)
* tin - test input availability
* in - read number
* out - write number
* tinb - test if n bytes available
* inb - read n bytes
* outb - write n bytes
* move - copy values from one place to another (has RGBA/R/G/B/A/RG/BA/GB/RGB modes)

? maybe all sys calls make as a in/out ops?


help values can be printed as a 5-pixel text on the memory map
and can be guarded by walls for additional protection


ROM Image
=========
The image is an actual image.
The fundamental property is memory width&height,
where width*height is the memory limit.

Image for current devices is immutable,
but some future devices can afford to change it in runtime.

Image is segmented (for convenience 8x8, but not necessary -
it could be 16x16).

First capsule is Palette, which can actually span on several
segments left and down.
All sequence definitions are defined here.

Machine palette is also defined here?

Palette sets segement size.
Palette is also must define address for memory map.

Memory Map
----------
Defines types for each of the segments:

* undefined
* palette (code segment)
* colors&symbols table (color <-> text mappings)
* mem map
* label - visual markers for better image understanding
* color set
* font
* tile
* tile map
* tile mapping (color to number)
* sprite
* sfx
* music track
* interrupt handler (timer, collision, io, custom etc)
  must be a code segment
* tuning segment (some pixelated env variables)
* various customized segments (can be device-specific)

types can be address by a segment number left-down
e.g. sprite #5 would be fifth segment with sprite type
when scanned from left to right and down.


* you could call a code segment as an interrupt, but can call a color seq.
* palette labels is a simple pattern-text matching system
  to simplify image assembly and debugging
* emu stops procedure and returns when hit the wall in two directions
  (when moving right and bouncing down hitting the wall again)
  palette ends just like that

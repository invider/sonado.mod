Sonado Inc. SonaVision Hardware Specification
=============================================

**Development Release 1 (DR1)**


About Sonado Inc. 
-----------------

Sonado Inc. is the leading game hardware manufacturer in the world.
It ships an advanced line of 8-bit consoles.


SonaVision
----------

SonaVision is the main product line of Sonado Inc.
It represents an entire 8-bit platform. There are multiple
hardware versions providing different capabilities.


ROM Image
---------
ROM Image is just a regular .png image.
It works as a cartridge for SonaVision console.
When you need to play a game - you just load
an appropriate ROM Image.

That image has all the information about the game encoded in:
sprites, tiles, fonts, sounds and game logic.

For conveniece, image is divided on square segments
of the same size. Current SonaVision hardware
supports 8x8 size segments.

Each sprite, tile, font symbol, interrupt etc.
occupies a single segment.

There are many ways to address memory.

**Absolute pixel**: a single number representing shift
in pixels from the beginning of the image.

**Absolute subpixel**: a single number representing shift
in pixel colors from the beginning (4 values on pixel)

**Pixel**: X/Y coordinates of the pixel on image

**Segment**: X/Y coordinates of segment normalized in segment size.

**Segment Type #**: sprite #0 always means a first sprite segment
defined on the image



System Palette
--------------
System Palette defines all the color patterns for the game.
Since the console doesn't know anything about
color palette and color sequences of your ROM Image,
you have to teach it before doing anything else.

On the image boot, SonaVision starts by reading palette
at top left image corner from left to right
and stops only when double-hit the wall.
All the patterns must be defined by that time.

Memory Map
----------
Defines types of each segment on the map in 2 pixel segments.
The types can be:

```
00: noise
01: system data
02: system palette
03: memory map
04: interrupt
05: font
06: sprite
07: tile
08: tile map
09: sfx
10: music track
11: user data
12: tuning segment
13: device specific
```


### Palette Header

```
[!] starts at coordinates 0x0 of the image.
[ ] brackets represent a color sequence

[w][ ][d][ ][0][ ][1][ ][2][ ]..[ ][7][ ][;]
 ^
0x0
[ ][c][ ][x][ ][,][ ][;]

[iv][ ][hv][ ][name][ ]
```

Those sequences are defined below:

[w] - wall color, usually black. The length of this segment
also defines the scan step. So it [ww] is 4 pixels,
it means the patterns scanner will be stepping in
4 pixels intervals.

[ ] - next color defines an empty space, usually white.
This color is used often to separate color sequences.

[d] - definition sequence. Used to initiate definition
of new sequences.

[0] - sequence for 0
[1] - sequence for 1
..
[7] - sequence for 7. Octal format is used for numbers.
[;] - terminal sequence used to end definitions.
[c] - start and end of comment sequence
[name] - between comment definitions there is an image name encoded.
[x] - sys call sequence
[,] - next sequence (usually used to push values on stack)

For initial definitions it makes a lot of sense
to use single-pixel definitions, but not
necessary so. Any can be encoded as a sequence
of colors.

15 colors would be enough to encode all of header definitions.
SonaVision platform expects support of 16 colors.
However, even 4-color modes are theoreticaly possible.

### Palette Body
Now, when initial definitions are made and the console
knows how to define new patterns, you just have to
specify all others in the following format:

[d][color pattern][ ][c][name][c][][defining sequences][;]

Definitions are following in palette one after the other,
potentially separated with white spaces.

The while palette is enclosed by the walls to limit the scan.
The scan goes horizontaly downwards. It bounces down
when hitting the vertical wall and then scan the line below.
The scan stops on hitting the horizontal wall
(see Patterns Scanner section for more details).

Following scheme shows how scan usually goes:

```
|->         |
|         <-|
|->         |
X         <-|
-X-----------
 ^
 |
 a place where scan supposed to hit the wall second time and quit.
```

Patterns Scanner and Stack
--------------------------
Scanner goes over color patters trying to recognize
and execute encoded instructions.
Scanner always choses the shortest recognized sequence,
so the patter scheme must be choosen wise
to recognize the right sequences or white space
should be used to guide the parsing
(sequence is always starts at the beginning after
the white space)


Sys Calls
---------
To make any meaningful behavior, you need to call
console system for help.
The call is always encoded as a sequence of numbers
representing system call # and a sys call sequence:

```
[1][3][x] - make a system call #11
```

All the arguments must be pushed on stack before the call.
Returned values are also placed on stack.

For example, calling sys call #21 with number 4
as an argument would be:

```
[4][,][2][5][x]
```


Capsule
-------
A sequence of pixels limited by the wall.


Interrupts
----------
After initial definitions the console goes into reactive mode.
Only interrupts on particular events get executed.

These events include:

* start of the game
* next frame (real timer)
* next second (periodic timer)
* sprite collision
* tile collision
* custom call
* key up/down?

Interrupts are the code sequences always starting
on particular segment.



Input/Output
------------

Pixel Asm
---------


Sys Call Reference
------------------

This section describes available system calls
with their input/output data.

* halt
* dump
* test
* add
* sub
* mul
* div
* mod
* abs
* neg
* min
* max
* rnd
* dup
* swap
* drop
* over
* rot
* eq
* neq
* ls
* gr
* lse
* gre
* lsz
* grz
* and
* or
* not
* jmp
* jmpz
* jmpnz
* jmpe
* jmpne
* do
* loop
* call
* ret




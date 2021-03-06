
.SEGMENT 8

// TODO MACRO language

// TODO PALETTE COLORS should be defined here
// as macro-labels or something
// this way we won't have to specify values in header
// just color names from default palette

// TODO unique color sequence generation
//      from default palette


@0x0
.HEADER
#000000   // wall
#0FFFFFF  // space
.CAPSULE 4x4    // the size is in segments
                // capsule should be specified only after wall is defined

#00000FF    // define (:)
#0FFFFFF    // space

// define 0..7
#0D0FF30  #0FFFFFF
#0FF8070  #0FFFFFF
#00080FF  #0FFFFFF
#000FF80  #0FFFFFF
#0FFC040  #0FFFFFF
#0FF60B0  #0FFFFFF
#0C000FF  #0FFFFFF
#08080FF  #0FFFFFF

#0FF0000    // terminal
#0FFFFFF    // space

#0FFFF00    // comment
#0FFFFFF    // space

#000FF00    // sys call
#0FFFFFF    // space
#000FFFF    // next

// end of core definitions
#0FFFFFF    // space
#0FF0000    // terminal

// now it is time to define
// version for image and hardware
// image name and other metadata

.SKIP 2; // generate spaces

//0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10,
//0! 1! 2!;
//.LF
//"OK";;
//__: 24 10; __; // 2 spaces, controls, 2 spaces


// do some init stuff and initialize interrupts
2, 2, add 4, mul

// init sprites
1, .sprite-state 0, spriteSet
0, .sprite-type 0, spriteSet
25, .sprite-x 0, spriteSet
25, .sprite-y 0, spriteSet
0, .sprite-stilex 0, spriteSet
1, .sprite-etilex 0, spriteSet
1000, .sprite-frameRate 0, spriteSet

1, .sprite-state 1, spriteSet
1, .sprite-type 1, spriteSet
50, .sprite-x 1, spriteSet
50, .sprite-y 1, spriteSet
8, .sprite-stilex 1, spriteSet
9, .sprite-etilex 1, spriteSet
600, .sprite-frameRate 1, spriteSet

1, .sprite-state 2, spriteSet
1, .sprite-type 2, spriteSet
20, .sprite-x 2, spriteSet
80, .sprite-y 2, spriteSet
16, .sprite-stilex 2, spriteSet
17, .sprite-etilex 2, spriteSet
800, .sprite-frameRate 2, spriteSet

.T // end the scan flow

.LF
//.LF
address: dump test ret
.T

// test assemble at some point
//@1x1
//@1x1:2x2
//" !/09az_^^"


// INT 1
@4x0
.CAPSULE 1x1
test
.T

// INT 2
@5x0
.CAPSULE 1x1
address call
.T
 

// INT 3
@6x0
.CAPSULE 1x1
test
.T

// PALETTE
@7x0

// true set
#000000  // true black
#0FFFFFF // true white
#0FF0000 // true red
#000FF00 // true green
#00000FF // true blue
#0FFFF00 // true yellow
#000FFFF // true cyan
#0FF00FF // true pink

// === 2 ===
#0305082 // dirty blue
#04192C3 // pastel blue
#061D3E3 // dirty sky
#04161FB // sea blue
#061A2FF // sky blue
#092D3FF // light blue
#0a0ffff // ligh cyan
#0404040 // dark gray

// === 3 ===
#0808080 // gray
#09241F3 // violet
#0ffffaa // pastel yellow
#0008080 // teal
#08a8a00 // swamp green
#071E395 // light green
#049A269 // light grass
#0306141 // dark green

// === 4 ===
#0794100 // brown
#0C37100 // light brown
#0ffa200 // orange
#0aa0000 // dark red
#0ffcbba // light coffee
#0f28585 // pastel red
#0ff5500 // ubuntu orange
#0D0D0D0 // light gray

// set default background
@7x0:7x7
#071E395 // light green



'use strict'

let Sprite = function(id) {
    this.id = id
    this.state = 0
    this.type = 0

    this.x = 0
    this.y = 0
    this.speed = 32
    this.dir = 0
    this.size = 8

    this.frame = 0
    this.frameRate = 0
    this.stilex = 0
    this.etilex = 0
    this._timer = 0

    this.health = 0
    this.ammo = 0
    this.power = 0
    this.score = 0
    this.life = 0

    this.data = []
}

Sprite.prototype.get = function(i) {
    switch (i) {
    case 0: return this.state = v;
    case 1: return this.type = v;
    case 2: return this.x = v
    case 3: return this.y = v
    case 4: return this.speed = v
    case 5: return this.dir = v
    case 6: return this.frame = v
    case 7: return this.frameRate = v
    case 8: return this.stilex = v
    case 9: return this.etilex = v
    case 10: return this.health = v
    case 11: return this.ammo = v
    case 12: return this.power = v
    case 13: return this.score = v
    case 14: return this.life = v
    default: return this.data[i-14]
    }
}

Sprite.prototype.set = function(i, v) {
    switch (i) {
    case 0: this.state = v; break;
    case 1: this.type = v; break;
    case 2: this.x = v; break;
    case 3: this.y = v; break;
    case 4: this.speed = v; break;
    case 5: this.dir = v; break;
    case 6: this.frame = v; break;
    case 7: this.frameRate = v/1000; break; // turn milliseconds to seconds
    case 8: this.stilex = v; this.frame = v; break;
    case 9: this.etilex = v; break;
    case 10: this.health = v; break;
    case 11: this.ammo = v; break;
    case 12: this.power = v; break;
    case 13: this.score = v; break;
    case 14: this.life = v; break;
    default:
        i = i - 14;
        this.data[i] = v;
    }
}

Sprite.prototype.inc = function(i) {
    this.set(this.get(i) + 1)
}

Sprite.prototype.dec = function(i) {
    this.set(this.get(i) - 1)
}

Sprite.prototype.add = function(i, v) {
    this.set(this.get(i) + v)
}

Sprite.prototype.sub = function(i, v) {
    this.set(this.get(i) - v)
}

Sprite.prototype.evo = function(dt) {
    if (this.state === 0) return
    
    // animate
    if (this.frameRate > 0) {
        this._timer += dt

        if (this._timer > this.frameRate) {
            this.frame++
            this._timer -= this.frameRate
            if (this.frame > this.etilex) {
                this.frame = this.stilex
            }
        }
    }

    // move
    switch (this.dir) {
    case 1: this.x -= this.speed * dt; break;
    case 2: this.y -= this.speed * dt; break;
    case 3: this.x += this.speed * dt; break;
    case 4: this.y += this.speed * dt; break;
    }

    if (this.x+this.size < 0) this.x = this.emu.w
    else if (this.x > this.emu.w) this.x = 0 - this.size
    if (this.y+this.size < 0) this.y = this.emu.h
    else if (this.y > this.emu.h) this.y = 0 - this.size

    if (this.x < 0) {
        this.emu.push(this.id)
        this.emu.push(1)
        this.emu.interrupt(this.emu.INT_SPRITE_WALL)
    } else if (this.x + this.size > this.emu.w) {
        this.emu.push(this.id)
        this.emu.push(3)
        this.emu.interrupt(this.emu.INT_SPRITE_WALL)
    }
    if (this.y < 0) {
        this.emu.push(this.id)
        this.emu.push(2)
        this.emu.interrupt(this.emu.INT_SPRITE_WALL)
    } else if (this.y + this.size > this.emu.h) {
        this.emu.push(this.id)
        this.emu.push(4)
        this.emu.interrupt(this.emu.INT_SPRITE_WALL)
    }

    // collisions
    this.emu.sprite.forEach(t => { if (t !== this && t.state !== 0) this.collide(t); })
}

Sprite.prototype.collide = function(target) {
    if (this.x+this.size >= target.x
            && this.x <= target.x+target.size
            && this.y+this.size >= target.y
            && this.y <= target.y+target.size) {
        // we got a collision!
        this.emu.push(this.id)
        this.emu.push(target.id)
        this.emu.interrupt(this.emu.INT_SPRITE_COLLISION)
    }
}

Sprite.prototype.dump = function() {
    return '' + 
        'state = ' + this.state + '\n' +
        'type = ' + this.type + '\n' +
        'x = ' + this.x + '\n' +
        'y = ' + this.y + '\n' +
        'speed = ' + this.speed + '\n' +
        'dir = ' + this.dir + '\n' +
        'frame = ' + this.frame + '\n' +
        'frameRate = ' + this.frameRate + '\n' +
        'stilex = ' + this.stilex + '\n' +
        'etilex = ' + this.etilex + '\n' +
        'health = ' + this.health + '\n' +
        'ammo = ' + this.ammo + '\n' +
        'power = ' + this.power + '\n' +
        'score = ' + this.score + '\n' +
        'life = ' + this.life + '\n';
}

module.exports = Sprite

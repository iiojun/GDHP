const COLORS = [ 'crimson', 'forestgreen', 'yellow', 'royalblue',
                 'saddlebrown', 'hotpink', 'darkorange', 'darkmagenta' ];
const NUM_OF_DISKS = COLORS.length;
const BASE_LENGTH = 200;
const C_WIDTH  = 3.732 * BASE_LENGTH;
const C_HEIGHT = 3.500 * BASE_LENGTH;
const DISK_R = 0.9 * BASE_LENGTH;
const POLE_R = 15;
const POSITIONS = { 'Source'      : [0.268, 0.714],
                    'Auxiliary'   : [0.500, 0.286],
                    'Destination' : [0.732, 0.714] };
const FLASHING_COUNTER = 20;
const STEPS = 30;

class Vector {
  constructor(x,y) {
    this.x = x;
    this.y = y;
  }
}

class Position extends Vector {
  constructor(x,y) { super(x,y); }

  move(vec) {
    this.x += vec.x;
    this.y += vec.y;
  }
}

class Disk {
  constructor(level) {
    this.level = level;
    this.color = COLORS[level];
    this.r = (DISK_R-POLE_R)*(NUM_OF_DISKS-level)/NUM_OF_DISKS + POLE_R;
  }
}

class MovingDisk extends Disk {
  constructor(level,from,to) {
    super(level); 
    [sx,sy] = [from.pos.x,from.pos.y];
    [dx,dy] = [to.pos.x,  to.pos.y];
    this.pos = new Position(sx,sy);
    this.mvec = new Vector((dx-sx)/STEPS,(dy-sy)/STEPS);
    this.move_ctr = 0;
    this.from = from;
    this.to = to;
  }

  step_forward() {
    this.pos.move(this.mvec);
    this.move_ctr++;
  }

  finish_p() {
    var ret_flag = false;
    if (ret_flag = (this.move_ctr == STEPS)) {
      this.to.disks.push(new Disk(this.level));
    }
    return ret_flag;
  }
}

class Tower {
  constructor(name, disks, direction=null) {
    this.name = name;
    this.disks = [];
    for (var i = 0; i < disks; i++) {
      this.disks.push(new Disk(i));
    }
    this.direction = direction;
    this.moving = false;
    this.flash_ctr = 0;
  }

  get toplevel() {
    var l = this.disks.length;
    // '-1' means there is no disk.
    return (l > 0) ? this.disks[l-1].level : -1;
  }
}

var src = new Tower('Source', NUM_OF_DISKS);
var aux = new Tower('Auxiliary',   0, src);
var dst = new Tower('Destination', 0, src);
// In the case of NUM_OF_DISKS is odd, 
// the src must face the src.
// Otherwise, the src faces the aux.
src.direction = (COLORS.length % 2 == 1) ? dst : aux;

// the reference to moving disk is stored to this variable.
var moving_disk = null;

function setup() {
  createCanvas(C_WIDTH, C_HEIGHT);
  frameRate(30);
  [src,aux,dst].forEach(function(t) {
    [rx,ry] = POSITIONS[t.name];
    t.pos = new Position(rx * C_WIDTH, ry * C_HEIGHT);
  })
}

function base_drawing() {
  background('beige');

  [src,aux,dst].forEach(function(t) {
    // draw disks
    t.disks.forEach(function(d) {
      stroke('black');
      fill(d.color);
      ellipse(t.pos.x,t.pos.y,2*d.r);
    })

    // draw a pole
    stroke('brown');
    fill(t.moving & (t.flash_ctr < FLASHING_COUNTER/2) ? 'gold' : 'white');
    ellipse(t.pos.x,t.pos.y,2*POLE_R);

    // draw a direction
    stroke('navy');
    [sx, sy] = [t.pos.x, t.pos.y];
    [dx, dy] = [t.direction.pos.x, t.direction.pos.y];
    r = POLE_R / Math.sqrt((dx-sx)*(dx-sx)+(dy-sy)*(dy-sy));
    [dx, dy] = [(dx-sx)*r+sx, (dy-sy)*r+sy];
    line(sx,sy,dx,dy);
  })
}

function flash_poles() {
  [src,aux,dst].forEach(function(t) {
    t.moving = (t.direction.direction === t);
    t.flash_ctr += 1;
    t.flash_ctr %= FLASHING_COUNTER;
  })
}

function pop_disk(src,aux,dst) {
  var towers = [src,aux,dst].filter(t => t.moving);
  var idx,from,to;
  idx = (towers[0].toplevel > towers[1].toplevel) ? 0 : 1;
  [from, to] = [towers[idx], towers[1-idx]];
  return new MovingDisk(from.disks.pop().level,from,to);
}

function draw_moving_disk() {
  var d = moving_disk;
  d.step_forward();
  stroke('black');
  fill(d.color);
  ellipse(d.pos.x,d.pos.y,2*d.r);
  return d.finish_p();
}

function turn() {
  [moving_disk.from,moving_disk.to].forEach(function(t) {
    t.direction = ([src,aux,dst]
      .filter(x => (x !== t) && (x !== t.direction)))[0];
    t.moving = false;
  })
}

function draw() {
  // base drawing
  base_drawing();

  // find two exchange-towers out of three
  flash_poles();

  // start moving
  if (moving_disk == null) {
    moving_disk = pop_disk(src,aux,dst);
  } else {
    if (draw_moving_disk()) {
      turn();
      moving_disk = null;
    }
  }
}

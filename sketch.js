const COLORS = [ 'crimson', 'forestgreen', 'yellow',
   'royalblue', 'saddlebrown', 'hotpink', 'darkorange',
   'darkmagenta' ];
const N_DISKS = COLORS.length;
const BASE_LENGTH = 200;
const C_WIDTH  = 3.732 * BASE_LENGTH;
const C_HEIGHT = 3.500 * BASE_LENGTH;
const DISK_R = 0.9 * BASE_LENGTH;
const POLE_R = 15;
const POSITIONS = { 'Source'      : [0.268, 0.714],
                    'Auxiliary'   : [0.500, 0.286],
                    'Destination' : [0.732, 0.714] };
const FLASH_CTR = 20;
const STEPS = 30;

class Vector {
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }
}

class Position extends Vector {
  constructor(x, y) { super(x, y); }

  move(vec) {
    this.x += vec.x;
    this.y += vec.y;
  }
}

class Disk {
  constructor(level) {
    this.level = level;
    this.color = COLORS[level];
    this.r = (DISK_R-POLE_R)*(N_DISKS-level)
                / N_DISKS + POLE_R;
  }

  draw(pos) {
    stroke('black');
    fill(this.color);
    ellipse(pos.x, pos.y, 2*this.r);
  }
}

class MovingDisk extends Disk {
  constructor(level, from, to) {
    super(level); 
    this.pos = new Position(from.pos.x, from.pos.y);
    this.vec = new Vector((to.pos.x-from.pos.x)/STEPS, 
                          (to.pos.y-from.pos.y)/STEPS);
    this.move_ctr = 0;
    this.from = from;
    this.to = to;
  }

  step_forward() {
    this.pos.move(this.vec);
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
    for (var i = 0; i < disks; i++) 
      { this.disks.push(new Disk(i)); }
    this.direction = direction;
    var rx, ry;
    [rx,ry] = POSITIONS[name];
    this.pos = new Position(rx*C_WIDTH, ry*C_HEIGHT);

    this.exchanging = false;
    this.flash_ctr = 0;
  }

  draw() {
    var pos  = this.pos;
    var pos2 = this.direction.pos;
    var sx, sy, dx, dy, r;

    // draw disks
    this.disks.forEach(function(d) { d.draw(pos) })

    // draw a pole
    stroke('brown');
    fill(this.exchanging & (this.flash_ctr < FLASH_CTR/2) 
      ? 'gold' : 'white');
    ellipse(pos.x, pos.y, 2*POLE_R);

    // draw direction
    stroke('navy');
    [sx, sy] = [pos.x,  pos.y ];
    [dx, dy] = [pos2.x, pos2.y];
    r = POLE_R / Math.sqrt((dx-sx)*(dx-sx)+(dy-sy)*(dy-sy));
    [dx, dy] = [(dx-sx)*r+sx, (dy-sy)*r+sy];
    line(sx, sy, dx, dy);
  }

  flash_pole() {
    this.exchanging = (this.direction.direction === this);
    this.flash_ctr++;
    this.flash_ctr %= FLASH_CTR;
  }

  get toplevel() {
    var l = this.disks.length;
    // '-1' means there is no disk.
    return (l > 0) ? this.disks[l-1].level : -1;
  }
}

var src = new Tower('Source', N_DISKS);
var aux = new Tower('Auxiliary',   0, src);
var dst = new Tower('Destination', 0, src);
// The src faces the dst if the number of disks (N_DISKS) is odd.
// Otherwise, it faces the aux.
src.direction = (N_DISKS % 2 == 1) ? dst : aux;

// The variable for the reference to the moving disk
var moving_disk = null;

function pop_disk() {
  var towers = [src, aux, dst].filter(t => t.exchanging);
  var idx, from, to;
  if (towers[0].toplevel == towers[1].toplevel) { 
    noLoop(); 
    return null; 
  };
  idx = (towers[0].toplevel > towers[1].toplevel) ? 0 : 1;
  [from, to] = [towers[idx], towers[1-idx]];
  return new MovingDisk(from.disks.pop().level, from, to);
}

function draw_moving_disk() {
  var d = moving_disk;
  d.step_forward();
  d.draw(d.pos);
  return d.finish_p();
}

function turn() {
  [moving_disk.from, moving_disk.to].forEach(function(t) {
    t.direction = ([src, aux, dst]
      .filter(x => (x !== t) && (x !== t.direction)))[0];
    t.exchanging = false;
  })
}

function setup() {
  createCanvas(C_WIDTH, C_HEIGHT);
  frameRate(30);
}

function draw() {
  background('beige');
  [src, aux, dst].forEach(function(t) { 
    t.draw(); 
    t.flash_pole();
  })

  if (moving_disk == null) {
    moving_disk = pop_disk();
  } else if (draw_moving_disk()) {
    turn();
    moving_disk = null;
  }
}

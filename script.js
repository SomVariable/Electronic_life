const plan = ["###################################",
              "#                 ~        ~      #",
              "#      ####                       #",
              "# #### o      ####         o      #",
              "#      ####                       #",
              "#####o                            #",
              "#~             o       ~         ~#",
              "#                                 #",
              "#                          o      #",
              "#         o                       #",
              "# ~                         ~     #",
              "###################################",]

const directions = {
    "n" : new Vector( 0, -1),
    "ne": new Vector( 1, -1),
    "e" : new Vector( 1,  0),
    "se": new Vector( 1,  1),
    "s" : new Vector( 0,  1),
    "sw": new Vector(-1,  1),
    "w" : new Vector(-1,  0),
    "nw": new Vector(-1, -1)
}

const directionNames = Object.keys(directions)

// functions -------------------------------------------------------------------
const randomElement = (arr) => {
    const direction = arr[Math.floor(Math.random() * arr.length)]
    return direction
}

const elementFromChar = (legend, char) => {
    if(char === " ") return null;

    const element = new legend[char]();
    element.originChar = char;
    return element;
}

const charFromElement = (element) => element === null? " " : element.originChar

const dirPlus = (direction, n) => {
    const index = directionNames.indexOf(direction)
    return directionNames[(index + n + directionNames.length) % directionNames.length]
}

// ------------------------------------------------------------------------------

function Vector(x, y){
    this.x = x;
    this.y = y;
}

Vector.prototype.plus = function(other) {
    return new Vector(this.x + other.x, this.y + other.y)
} 

//Grid--------------------------------------------------------------------------

function Grid(width, height){
    this.space = new Array(width * height)
    this.width = width;
    this.height = height;
}

Grid.prototype.isInside = function (vector){
    return vector.x >= 0 && vector.x < this.width &&
           vector.y >= 0 && vector.y < this.height
}

Grid.prototype.set = function (vector, value) {
    this.space[vector.x + this.width * vector.y] = value
}
Grid.prototype.get = function (vector) {
    return this.space[vector.x + this.width * vector.y]
}

Grid.prototype.forEach = function(f, context) {
    for(let y = 0; y < this.height; y++){
        for(let x = 0; x < this.width; x++){
            const value = this.space[x + y * this.width];
            if(value !== null) f.call(context, value, new Vector(x, y))
        }
    }
}

//------------------------------------------------------------------------------

//Creatures Logic---------------------------------------------------------------

//BouncingCritter-----------------------------------------------------


function BouncingCritter (){
    this.direction = randomElement(Object.keys(directions))
}

BouncingCritter.prototype.act = function (view) {
    if(view.look(this.direction) !== " ") this.direction = view.find(" ") || "s";
    return {type: "move", direction: this.direction}
}

//end. BouncingCritter-------------------------------------------------

//WallFollower---------------------------------------------------------


function WallFollower (){
    this.direction = "s"
}

WallFollower.prototype.act = function (view) {
    let start = this.direction;

    if(view.look(dirPlus(this.direction, -3)) !== " "){
        start = this.direction = dirPlus(this.direction, -2)
    }

    while(view.look(this.direction) !== " "){
        this.direction = dirPlus(this.direction, 1)
        if(this.direction === start) break
    }

    return {type: "move", direction: this.direction}
}

//end. WallFollower-----------------------------------------------------




//end. Creatures Logic------------------------------------------------------------



function World(map, legend){
    const grid = new Grid(map[0].length, map.length);
    this.grid = grid;
    this.legend = legend;

    map.forEach((line, y) => {
        for(let x = 0; x < line.length; x++){
            grid.set(new Vector(x, y), elementFromChar(legend, line[x]))
        }
    })
}

World.prototype.toString = function (){
    let output = "";
    for(let y = 0; y < this.grid.height; y++){
        for(let x = 0; x < this.grid.width; x++){
            const element = this.grid.get(new Vector(x, y))
            output += charFromElement(element)
        }
        output += '\n'
    }

    return output
}

World.prototype.turn = function(){
    const acted = [];
    this.grid.forEach((critter, vector) => {
        if(critter.act && acted.indexOf(critter) === -1){
            acted.push(critter);
            this.letAct(critter, vector)
        }
    }, this)
}

World.prototype.letAct = function(critter, vector){
    const action = critter.act(new View(this, vector));

    if(action && action.type === "move") {
        const dest= this.checkDestination(action, vector);

        if(dest && this.grid.get(dest) === null){
            this.grid.set(vector, null);
            this.grid.set(dest, critter);
        }
    }
}

World.prototype.checkDestination = function(action, vector) {
    if(directions.hasOwnProperty(action.direction)){
        const dest = vector.plus(directions[action.direction]);
        if(this.grid.isInside(dest)) return dest
    }
}

function View(world, vector){
    this.world = world;
    this.vector = vector;
}

View.prototype.look = function(dir){
    const target = this.vector.plus(directions[dir])
    return this.world.grid.isInside(target) ? charFromElement(this.world.grid.get(target)) : "#" 
}

View.prototype.findAll = function(ch){
    const found = [];
    
    for(let dir in directions){
        if(this.look(dir) === ch) found.push(dir)
    }

    return found
}

View.prototype.find = function(ch){
    const found = this.findAll(ch);
    return found.length === 0 ? null : randomElement(found)
}

function Wall(){}



const world = new World(plan, {"#": Wall, "o": BouncingCritter, "~": WallFollower});


const direction = setInterval(() => {
    console.clear()
    world.turn();
    console.log(world.toString())
}, 100)


setTimeout(() => {
    clearInterval(direction)
}, 20000)


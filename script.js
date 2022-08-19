const plan = ["################",
              "#  o#   *#     #",
              "#   #     *    #",
              "#  **     *    #",
              "################"]

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

const actionTypes = {};

//ActionCreaters----------------------------------------------------------

const growAC = () => {
    return {type: "grow"}
}
const reproduceAC = (payload) => {
    return {type: "reproduce", direction: payload.dir, dist: payload.dist} 
}

const moveAC = (payload) => {
    return {type: "move", direction: payload.dir, dist: payload.dist} 
}

const eatAC = (payload) => {
    return {type: "eat", direction: payload.dir, dist: payload.dist} 
}
//end.ActionCreaters------------------------------------------------------

//Interfaces---------------------------------------------------------------


actionTypes.grow = (critter) => {
    critter.changeEnergy(0.5);
    return true
}

actionTypes.move = function(critter, vector, action) {
    const dest = this.checkDestination(action, vector);
    const isIncorrectDest   =  dest === null,
          isIncorrectEnergy =  critter.energy <= 1;
    
    if(isIncorrectDest || isIncorrectEnergy || this.grid.get(dest) !== null) return false

    this.deleteCreature(critter, vector, -1)
    this.grid.set(vector, null);
    this.grid.set(dest, critter)
    return true
}

actionTypes.eat = function(critter, vector, action) {
    const dest = this.checkDestination(action, vector);
    const atDest = dest !== null && this.grid.get(dest);

    if(!atDest || atDest.energy === null) return false;

    critter.changeEnergy(atDest.energy);
    this.grid.set(dest, null)
    return true
}

actionTypes.reproduce = function(critter, vector, action)  {
    const baby = elementFromChar(this.legend, critter.originChar)
    const dest = this.checkDestination(action, vector);
    const isIncorrectDest   =  dest === null,
          isIncorrectEnergy =  critter.energy <= 2 * baby.energy;

    if(isIncorrectDest || isIncorrectEnergy || this.grid.get(dest) !== null) return false
    this.deleteCreature(critter, vector, -2 * baby.energy)
    this.grid.set(dest, baby)
    return true
}


//end.Interfaces-----------------------------------------------------------


// functions -------------------------------------------------------------------
const randomDitections = (directions) => {
    const randomDirections = []
    for(let dir in directions){
        randomDirections.push(dir)
    }
    return randomDirections.sort((a, b) => Math.floor(Math.random() * 10) > 5? 1: -1)
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
    if(!other || other.__proto__ !== Vector.prototype) {
        return new Vector(this.x, this.y)
    }
    return new Vector(this.x + other.x, this.y + other.y)
}

Vector.prototype.subtraction = function(other) {
    if(!other || other.__proto__ !== Vector.prototype) {
        return new Vector(this.x, this.y)
    }
    return new Vector(this.x - other.x, this.y - other.y)
}

//Grid--------------------------------------------------------------------------

function Grid(width, height){
    this.space = new Array(width * height)
    this.width = width;
    this.height = height;
}

Grid.prototype.isInside = function (vector){
    const isInsideByX = vector.x >= 0 && vector.x < this.width,
          isIsideByY  = vector.y >= 0 && vector.y < this.height
    return isInsideByX && isIsideByY;
           
}

Grid.prototype.set = function (vector, value) {
    this.space[vector.x + this.width * vector.y] = value
}
Grid.prototype.get = function (vector) {
    if(!vector){
        const fff = null;
    }
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

const creatureViews = { 
    plant: "*",
    plantEater: "o"
}


function Creature(){
    this.energy = null
}



Creature.prototype.changeEnergy = function (val) {
    this.energy += val;
    
}

//Plant--------------------------------------------------------------
function Plant(){
    this.energy = 3 + Math.random() * 4;
}

Plant.prototype = Object.create(Creature.prototype)

Plant.prototype.act = function(context){
    if(this.energy > 15){
        const space = context.find(" ", 1);
        if(space) return reproduceAC({dist: space.dist, dir: space.dir})
    }

    if(this.energy < 20){
        return growAC()
    }
}
//end. Plant---------------------------------------------------------

//PlantEater---------------------------------------------------------
function PlantEater(){
    this.energy = 20;
    this.range = 1
}

PlantEater.prototype = Object.create(Creature.prototype)

PlantEater.prototype.act = function(context){
    const space = context.find(" ", 1);
    if(this.energy > 60 && space) return reproduceAC({dist: space.dist, dir: space.dir})
    
    const plant= context.find(creatureViews.plant, this.range)

    if(plant) return eatAC({plant})

    if(space) return moveAC({dist: space.dist, dir: space.dir})
}
//end. PlantEater------------------------------------------------------

//PlantEater---------------------------------------------------------
function SmartPlantEater(){
    this.energy = 20;
    this.range = 3;
}

SmartPlantEater.prototype = Object.create(Creature.prototype)

SmartPlantEater.prototype.act = function(context){
    const space = context.find(" ", 1);
    if(this.energy > 60 && space) return reproduceAC({dist: space.dist, dir: space.dir})
    
    const plant= context.find(creatureViews.plant, this.range)

    if(plant && (plant.dist.x !== directions[plant.dir].x || plant.dist.y !== directions[plant.dir].y)){
        return moveAC({dist: plant.dist, dir: plant.dir})
    }
    if(plant) return eatAC({dir: plant.dir, dist: plant.dist})

    if(space) return moveAC({dist: space.dist, dir: space.dir})
}
//end. PlantEater------------------------------------------------------

//WallFollower---------------------------------------------------------

// function WallFollower (){
//     this.energy = 20;
// }

// WallFollower.prototype.act = function (view) {
//     let start = this.direction;

//     if(view.look(dirPlus(this.direction, -3)) !== " "){
//         start = this.direction = dirPlus(this.direction, -2)
//     }

//     while(view.look(this.direction) !== " "){
//         this.direction = dirPlus(this.direction, 1)
//         if(this.direction === start) break
//     }

//     return moveAC(this.direction)
// }

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
    const isCorrectAction = action && action.type in actionTypes
    const handled = isCorrectAction && actionTypes[action.type].call(this, critter, vector, action);

    if(!handled){
        this.deleteCreature(critter, vector, -0.2)
    }
}

World.prototype.deleteCreature = function(critter, vector, subtrahend){
    critter.changeEnergy(subtrahend);
    if(critter.energy <= 1){
        this.grid.set(vector, null)
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

View.prototype.look = function(range){
    const isInside = this.world.grid.isInside(range);

    if(isInside) {
        const char = charFromElement(this.world.grid.get(range))
        return char;
    } else{
        return '#'
    }
    //return  ? ) : "#" 
}

//thre are recursion where we look in max-range distance if there is no el then we look on range -1 e.t
View.prototype.lookArraund = function(ch, dir, range){
    const direction = directions[dir]
    const char = this.look(this.vector.plus(range));
    if(char === ch) return range
    if(range.x === direction.x && range.y === direction.y) return false
    return this.lookArraund(ch, dir, range.subtraction(new Vector(direction.x, direction.y)))
}

View.prototype.findAll = function(ch, range){
    let found = null;
    const randomDirections = randomDitections(directions)

    for(let dir of randomDirections){
        const _range = new Vector(directions[dir].x * range, directions[dir].y * range)
        const _found = this.lookArraund(ch, dir, _range)
        if(_found) {
            found = {dir: dir, dist: _found};
            break;
        }
    }

    if(found){
        return found
    }else{
        return null
    }
}

View.prototype.find = function(ch, range){
    const found = this.findAll(ch, range);
    return found? found : null
}

function Wall(){}

//const world = new World(plan, {"#": Wall, "*": Plant, "o": PlantEater});

const planConstructor = (x, y) => {
    const _plan = []

    for(let i = 0; i < y; i++){
        let str = ''
        _plan.push()
        
        for(let j = 0; j < x; j++){
            if(i === 0) _plan[i].push('#')
            else if(i+1 === y) _plan[i].push('#')
            else if(j === 0 || j + 1 === x){
                _plan[i].push('#')
            }else{
                _plan[i].push(' ')
            }

            
        }
    }

    return _plan
}
// const newPlan = planConstructor(20, 20)
// console.log(newPlan)
const world = new World(plan, {"#": Wall, "*": Plant, "o": SmartPlantEater});


const direction = setInterval(() => {
    console.clear()
    world.turn();
    console.log(world.toString())
}, 100)


setTimeout(() => {
    clearInterval(direction)
}, 20000)


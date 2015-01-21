/**************************************************************************************************
 * Project: AEngine2                                                                              *
 * File:    InterfaceTree.java                                                                    *
 * Author:  Joseph Marlin (j.marlin@outlook.com)                                                  *
 * Description:                                                                                   *
 *    The interface tree acts as both the model of the engine's state and the API window by which *
 * level scripts can interact with the engine. The most important features of the class are its   *
 * Lists, one each for Sounds, Things, Items, Globals, Triggers and lines of dialogue as well as  *
 * the methods associated with adding and deleting new entries to and from the same. There are    *
 * also a handful of helper methods used for modifying and inspecting engine state, eg. to check  *
 * the active tool, define the player character, get system time or reset the scene.              *
 *    Currently, this file is the best API reference for scriptwriting, but proper API doc should *
 * be created in the future to assist game makers.                                                *
 **************************************************************************************************/

//Game state and scripting API
function InterfaceTree() {
    
    var that = this;

    this.loadingText;
    this.readingText;    //Indicate the r/w state of the dialog text
    this.things;                    //Interactive playfield objects
    this.sounds;                    //Game music, dialog and SFX
    this.items;                     //Items in the player's inventory
    this.globals;                   //Variables accesible by all levels
    this.textLines;                 //Dialog written to the UI textbox
    this.interactive;                 //Allows suspension of user input
    this.triggers;                       //Timed scripting events
    this.sequencer;                //The engine's MIDI sequencer recieved on creation from Core.java
    this.mainCharacter;                 //The Thing currently defined as the player character
    this.startWalk;                   //Raised to initiate a player character walk tween
    this.cbString;                     //Script to be executed when player character reaches destination
    this.destX;                           //Walk destination X component
    this.destY;                           //Walk destination Y component
    this.walkmap;               //Defines the area in which the player can walk
    //public polygonMap walkmap;                //This will replace the BufferedImage in future revisions
    this.activeItem;                     //The currently equipped item, if one is equipped
    this.activeTool;                  //The handle of the currently equipped tool eg. 'walk' or 'key_1'
    this.level;                        //The path to the current level file
    this.processing;                  //Used to lock access to Trigger objects when parsing them
    this.mousex;
    this.mousey;                  //Location of the mouse cursor
    this.linePosition;                    //Topmost Line to which the UI textbox is scrolled
    
    this.init();

    //Basic constructor setting all of the tree's assets to null values
    this.init = function() {
        that.things = []; //new ArrayList();
        that.sounds = []; //new ArrayList();
        that.items = []; //new ArrayList();
        that.globals = []; //new ArrayList();
        that.triggers = []; //new ArrayList();
        that.textLines = []; //new ArrayList();
        //this.sequencer = newSequencer;
        that.walkmap = null;
        that.activeTool = "walk";
        that.level = "";
        that.processing = false;
        that.mousex = 0;
        that.mousey = 0;
        that.linePosition = 0;
        that.loadingText = false;
        that.readingText = false;
        that.interactive = true;
        
    }
    
    //Tell the engine which Thing in the scene is to be the player character
    //This will be the object acted on by walkTo commands
    this.setCharacter function(charThing){
        
        //Set the main character reference and make sure it is set to perform
        //a proper walk animation loop. Then ensure it is set to its idle
        //frame, which is defined as the last frame in the folder
        that.mainCharacter = charThing; 
        that.mainCharacter.looped = true;
        that.mainCharacter.setFrame(that.mainCharacter.getFrameCount()-1);
    
    }
    
    //This command can be called by the level script to make the player 
    //character attempt to walk to the destination at (x,y)
    //If and when the character arrives at the destination, the script stored
    //in callback is executed
    this.walkTo = function(x, y, callback) {
        
        //Don't even bother if there's no character defined
        if(that.mainCharacter != null){
            
            //Indicate to the Core object that it should begin cycling 
            //the frames of the player character on render, then set 
            //the character's destination coordinates and callback
            //and raise startWalk, which will trigger the timing thread
            //to begin or modify a walk event
            that.mainCharacter.animationOn = true;
            that.destX = that.x;
            that.destY = that.y;
            that.cbString = callback;
            that.startWalk = true;
            
        }
        
    }
    
    //Append text to the content of the UI textbox
    //This method splits the given string into lines based on the
    //width of the textbox/font and inserts those lines into the 
    //InterfaceTree's collection to be drawn by the Core rendering loop
    this.printLine = function(newText) {
        
        var CHARS_PER_LINE = 42;      //Const character length of a line
        var newLines, i;                    //Number of lines to be added by this op and a generic index variable
        var tempString;                  //Container for building each new line into
        
        //In case the game developer wants to use the console for
        //debug output
        console.log("Printing '".concat(newText).concat("'"));
        
        //Wait until the rendering loop is no longer accessing the line data
        while(that.readingText == true);
        
        //Indicate to the render loop that we are accessing the lines
        that.loadingText = true;
        
        //Calculate the number of new lines this will produce
        newLines = Math.ceil(parseFloat(newText.length()) / CHARS_PER_LINE);
        
        //For each new line, get the corresponding substring from the
        //input and add it to the textLines list
        for(i = 0; i < newLines; i++){
            
       
            if(i == newLines - 1){
                tempString = newText.substring(i*CHARS_PER_LINE);
            }else{
                tempString = newText.substring(i*CHARS_PER_LINE, (i+1)*CHARS_PER_LINE);
            }
            
            that.textLines.push(tempString);
        }
        
        //Scroll to the top of the newly added text and release our lock on the list
        that.linePosition = that.textLines.size() - newLines + 1;
        that.loadingText = false;
        
    }
    
    //Clear the content of the UI textbox
    this.resetText = function() {
        that.textLines = [];
        that.linePosition = 0;
    }
    
    //Search the tree for the Thing with the provided handle
    this.getThing = function(name) {
        var i;
        
        for(i = 0; i < that.things.length; i++){
            if(things[i].handle.matches(name)) return things[i];
        }
        
        return null;
        
    }    
    
    //Interface for instantiating a new Thing object
    this.makeThing = function(newImage, newHandle) {
        return new Thing(newImage, newHandle);
    }
    
    //AM HERE

    //Insert a Thing object into the scene
    public void appendThing(Thing newThing) {
        this.things.add(newThing);
    }
    
    //Remove a Thing object from the scene
    public void deleteThing(Thing delThing) {
        this.things.remove(delThing);
    }   
    
    //Search the tree for the Item with the provided handle
    public Item getItem(String name){
        Iterator itemIterator = this.items.iterator();
        Item tempItem;
        
        while(itemIterator.hasNext()){
            tempItem = (Item)itemIterator.next();
            if(tempItem.handle.matches(name)) return tempItem;
        }
        
        return null;
                
    }
    
    //Interface for instantiating a new Item object
    public Item makeItem(String newImage, String newHandle) {
        return new Item(newImage, newHandle);
    }
    
    //Insert an Item into the inventory box
    public void appendItem(Item newItem) {
        this.items.add(newItem);
    } 
    
    //Remove an Item from the inventory box
    public void deleteItem(Item delItem) {
        this.items.remove(delItem);
    }
    
    //Search the tree for the sound with the provided handle    
    public Sound getSound(String name){
        Iterator soundIterator = this.sounds.iterator();
        Sound tempSound;
        
        while(soundIterator.hasNext()){
            tempSound = (Sound)soundIterator.next();
            if(tempSound.handle.matches(name)) return tempSound;
        }
        
        return null;
        
    }
    
    //Remove a Sound object from the scene
    public void deleteSound(Sound delSound) {
        this.sounds.remove(delSound);
    }
    
    //Interface for instantiating a new Sound object
    public Sound makeSound(String newSource, String newHandle) {
        return new Sound(this.sequencer, newSource, newHandle);
    }
    
    //Insert a Sound object into the scene
    public void appendSound(Sound newSound) {
        this.sounds.add(newSound);
    }
    
    //Clear the scene
    //This initializes everything except for Globals,
    //the textbox and the inventory box
    public void resetChildren(){
        this.triggers.clear();
        this.mainCharacter = null;
        this.sounds.clear();
        this.things.clear();
        this.walkmap = null;
    }
    
    //Interface for getting the system time
    public long now() {
        return new Date().getTime();
    }
    
    //Schedule a timed event
    //Takes the system time in ms at which to execute and a script to be executed
    public void addTrigger(long time, String callback){
        triggers.add(new Trigger(time, callback));
    }
    
    //Load a bitmap which defines where the player can and cannot walk
    //Black pixels in the image are unwalkable areas
    //This is to be replaced in the future by a vector-polygon based system
    public void loadWalkmap(String file) {
        try{    
            walkmap = ImageIO.read(new File(file));
        }catch(IOException e){
            walkmap = null;
        }
        
        //The below will be substituted when the visibility graph based walk
        //systemis fully developed
        //walkmap = new polygonMap(new File(file));
    }
    
    //Get the handle of the current action/Item the user has equipped 
    public String getTool() {
        return this.activeTool;
    }
    
    //Equip the user's cursor with an Item object
    public void setTool(Item newTool){
        
        this.activeItem = newTool;
        this.activeTool = newTool.handle;
        
    }
    
    //Equip the user's tool with one of the action options
    public void setTool(String newToolName){
        
        if(newToolName.matches("walk") || newToolName.matches("look") || newToolName.matches("use")) {
            this.activeTool = newToolName;
        }
        
    }
    
    //Cycle through the installed Trigger objects and return the concatenated 
    //scripts of those whose time has arrived
    //This method is called repeatedly by the timing thread in order to make 
    //the timed event system operate
    public String processTriggers() {
        
        //Lock other threads out of the list
        this.processing = true;
        
        Trigger tempTrigger;
        String returnString = "";
        Iterator triggerIterator = this.triggers.iterator();
                
                while(triggerIterator.hasNext()){
                    tempTrigger = (Trigger)triggerIterator.next();
                    if(this.now() >= ((Trigger)tempTrigger).time) {
                            triggerIterator.remove();
                            returnString = returnString.concat(tempTrigger.callback);
                   }
                }
       
       //Release the lock and return the conglomerated script
       this.processing = false;     
       return returnString;       
                
    }
   
    //Look for and return the Global with the provided handle/key
    public Global findGlobal(String seekHandle){
        Iterator globalIterator = this.globals.iterator();
        Global tempGlobal;
        
        while(globalIterator.hasNext()){
            tempGlobal = (Global)globalIterator.next();
            if(tempGlobal.getHandle().contentEquals(seekHandle)) 
                return tempGlobal;
        }
        
        return null;
    }
    
    //Create a new Global object with a null value and add it to the tree
    public void makeGlobal(String newHandle) {
        
        Global tempGlobal;
        
        //If the global already exists don't bother creating a new one
        tempGlobal = this.findGlobal(newHandle);
        
        if(tempGlobal == null){
            tempGlobal = new Global(newHandle);
            this.globals.add(tempGlobal);
        }
        
    }
    
    //Create a new Global object with the provided value and add it to the tree
    public void makeGlobal(String newHandle, String newValue) {
        
        Global tempGlobal;
        
        //If the Global already exists, don't bother creating a new one
        tempGlobal = findGlobal(newHandle);
        
        if(tempGlobal == null){
            tempGlobal = new Global(newHandle);
            this.globals.add(tempGlobal);
        }
        
        tempGlobal.setValue(newValue);
            
    }
    
    //Get the value of the Global with the provided handle/key
    public String getGlobal(String seekHandle){
        
        Global tempGlobal = this.findGlobal(seekHandle);
        
        if(tempGlobal == null)
            return tempGlobal.value;
        else
            return "";
        
    }
    
    //Find the Global with the provided handle/key and assign it the provided value
    public void setGlobal(String seekHandle, String newValue){
        Global tempGlobal = this.findGlobal(seekHandle);
        
        if(tempGlobal != null){
            tempGlobal.setValue(newValue);
        }
        
    }
    
}

function AEngineCore() {

    var that = this;

    this.aengine;       //The object which contains the game state and is exposed to scripting
    this.engine;    //The Rhino Javascript engine which is used to interpret and execute the level scripts
    this.offscreen;     //The working, non-displayed bitmap in the double-buffer scheme
    this.g2d;              //Used to perform Graphics2D operations on the paint() loop's Graphics object
    this.midiEngine;        //Plays the cheezy background music loaded by the InterfaceTree
    this.uiImage;
    this.walkButton;
    this.lookButton;
    this.useButton;    //Bitmaps for the UI elements (background + buttons)
    this.itemHighlight;
    this.itemScrollDown;
    this.itemScrollUp;   //More UI bitmaps (item select rectangle, scroll arrows)
    this.walkTool;
    this.lookTool;
    this.useTool;
    this.toolStub;         //Bitmaps for cursor images, built-in and Item-defined
    this.mousePt;               //The location of the mouse as populated by the MouseListener
    this.panelPt;               //Playfield top-left in desktop coordinates, subtracted from mousePt to get in-window coordinates
    this.animToggle;          //Limits animation updates to every other frame. Makes mouse look smoother while keeping 12fps animations
    this.tempImg;       //Used to transform Thing and Item bitmaps and render them to the backbuffer
    this.scroll;
    this.maxScroll;
    this.txtScroll;
    this.maxTxtScroll;      //Parameters defining the state of the UI textbox
    this.lastTime;             //Timecode captured at the start of last frame, used to frame-limit render loop to 24fps
    this.lastLevel;            //Level file path captured from the InterfaceTree on previous render, used to trigger new level load
    this.timerLoop;         //The thread which handles global timing, triggering of render loop and player character path solving
   
      //The render loop which draws the UI elements and the scene defined by the
      //InterfaceTree onto the Core JPanel
      this.paint = function() {
       
            //Define a general-purpose indexing variable for use in the various loops below
            var i;                                              
       
            //Check the level file path stored in the interface tree (the aengine object) 
            //and trigger a new level load if it doesn't match the path of the currently
            //loaded level
            //if(that.aengine.level != that.lastLevel)
                //that.initTree(that.aengine.level);
                        
            //----------| RENDERING OF Thing OBJECTS TO PLAYFIELD |----------//
            
            //Initialize local variables used to draw 
            var gScreen = tempCanvas.getContext('2d');                        //Cast the Graphics object to Graphics2D for the expanded capabilities
            //Iterator thingIterator = aengine.things.listIterator();     //Used to cycle through the Thing objects in the InterfaceTree
            var frame;                                                  //The current frame of the Thing being rendered
            
            //Sort the list of Things in the interface tree by their z-index
            //so that we can simply iterate through the Thing objects during
            //render and guarantee that they are drawn in the correct order
            //as to occlude each other as the scene defines it
            that.aengine.things.sort(function(o1, o2) {
              if(o1.z == o2.z)
                return 0;
              return o1.z > o2.z ? 1 : -1;
            });
                      
            //Start the fresh Thing render only if it has been 1/24 of a second since last render
            if(that.aengine.now() >= that.lastTime + 80){
                
                //Update the most recent render time
                that.lastTime = that.aengine.now();
                
                //Cycle through every Thing currently in the InterfaceTree
                that.aengine.things.forEach(function(tempThing) {
                                       
                   //Don't bother with any processing on the Thing if we can't see it
                   if(!tempThing.hidden){
                   
                       //If the current Thing is the player character and it's 
                       //in the middle of walking we should auto-increment the
                       //frame number
                       //We do this in a block seperate from the standard Thing
                       //animation due to the special properties of the player
                       //character -- notably that it defaults to its idle frame
                       //when not in motion and that the idle frame is defined to 
                       //be the last frame. Therefore, we make sure to increment
                       //before we render so that if the walk was just initialized
                       //that the Thing is out of idle by the time it is drawn and 
                       //we cycle back to frame 0 one frame early so that we don't
                       //pass through the idle frame
                       if((tempThing === that.aengine.mainCharacter) && tempThing.animationOn) {
                            frame = tempThing.getFrame() + 1;
                            if(frame > tempThing.getFrameCount() - 2) {
                                frame = 0;
                            }
                            tempThing.setFrame(frame);
                        }

                       //TODO --> Reconfigure this to mirror the player from a character sheet prerender
                       //If the current Thing is mirrored, create a new AffineTransform
                       //set to mirror it. Otherwise, just create a blank AffineTransform
                       /*
                       if(tempThing.mirrored){
                            at = AffineTransform.getScaleInstance(-1, 1);
                            at.translate(-tempThing.imageData.getWidth(null), 0);
                       }else{
                            at = new AffineTransform();
                       }
                       */

                       //Use the new AffineTransform to apply the Things scale ratio to
                       //the bitmap to be rendered
                       var tempHeight, tempWidth;
                       tempHeight = tempThing.scale * tempThing.image.height
                       tempWidth = tempThing.scale * tempThing.image.width

                       //Finally, copy the modified bitmap to the screen
                       that.gScreen.drawImage(tempImg, tempThing.x, tempThing.y, tempWidth, tempHeight); 

                       //And progress the frame of the thing if it's animated
                       //(and, importantly, *not* the player character)
                       if((tempThing !== that.aengine.mainCharacter) && tempThing.animationOn){
                            frame = tempThing.getFrame() + 1;
                            if(frame > tempThing.getFrameCount() - 1) {
                                
                                //Make sure we kill the animation if we hit the
                                //end and the thing isn't looped
                                if(tempThing.looped){
                                    frame = 0;
                                }else{
                                    frame = tempThing.getFrameCount() - 1;
                                    tempThing.animationOn = false;
                                }
                            }
                            tempThing.setFrame(frame);
                        }
                   }
                   
                });
                
    //----------| RENDERING OF THE UI OVER THE FINISHED PLAYFIELD |----------//
                
                //Slap the main UI 'drawer' image to the bottom of the screen
                that.gScreen.drawImage(that.uiImage, 0, 360);
 
    //----------| RENDERING OF THE Item OBJECTS INTO THE INVENTORY BOX |----------//
                
                //Initialization of local variables used in the rendering of the 
                //UI's inventory box
                //Iterator itemIterator = aengine.items.iterator();   //Used to cycle through the InterfaceTree's item list
                var itemCounter = 0;                                //Tracks the index of the item being processed
                var itemX = 519;                                    //Initial point in the window to begin placing the items
                var itemY = 377;                                    //Initial point in the window to begin placing the items
                var tempItem;                                      //Used to cast items in the InterfaceTree ArrayList to Item objects
                var drawBorder = false;                         //The mouse is or is not over one of the items in the item box.
                
                //Calculate the number of rows the user should be able
                //to scroll down in the inventory based on the number
                //of Item objects in the InterfaceTree
                that.maxScroll = Math.ceil((that.aengine.items.size()-1) / 2) - 1;
                
                //Cycle through and ignore all of the Item objects
                //preceeding the first item in the current topmost 
                //visible row of the inventory box
                for(i = 0; i < (2*that.scroll) && i < that.aengine.items.length; i++)
                    tempItem = that.aengine.items[i];
                
                //Get up to the next four Item objects, if available,
                //and draw their bitmaps to the item box, increasing
                //the working placement coordinates accordingly
                for( ; i < that.aegine.items.length && i < (2*that.scroll) + 4; i++ ){
                    tempItem = that.aengine.items[i];
                    that.gScreen.drawImage(tempItem.image, itemX, itemY);
                    
                    itemX += 46;
                    if(itemX == 611){
                        itemX = 519;
                        itemY += 46;
                    }
                }
                
                //The following mass of conditionals simply checks to see if the
                //mouse coordinates fall into the bounds of each of the items
                //displayed in the inventory box in turn and, if they do, if
                //that slot is occupied. If both of these conditions is met
                //the highlight image is rendered over that position
                if(that.aengine.mousex >= 517 && that.aengine.mousex <= 562){
                    if(that.aengine.mousey >= 375 && that.aengine.mousey <= 419){
                        that.aengine.items.get(scroll*2);
                        drawBorder = true;
                        if(drawBorder)
                            that.gScreen.drawImage(that.itemHighlight, 517, 375);
                    }
                    if(that.aengine.mousey >= 421 && that.aengine.mousey <= 467) {
                        that.aengine.items.get((scroll+1)*2);
                        drawBorder = true;
                        if(drawBorder)
                            that.gScreen.drawImage(that.itemHighlight, 517, 421);
                    }
                }
                if(that.aengine.mousex >= 563 && that.aengine.mousex <= 608){
                    if(that.aengine.mousey >= 375 && that.aengine.mousey <= 419){
                        that.aengine.items.get((scroll*2)+1);
                        drawBorder = true;
                        if(drawBorder)    
                            that.gScreen.drawImage(that.itemHighlight, 563, 375);
                    }
                    if(that.aengine.mousey >= 421 && that.aengine.mousey <= 467) {
                        that.aengine.items.get(((1+scroll)*2)+1);
                        drawBorder = true;
                        if(drawBorder)
                            that.gScreen.drawImage(that.itemHighlight, 563, 421);
                    }
                }
                
                //----------| RENDERING OF THE DIALOG TEXT INTO THE UI TEXT BOX |----------//
                            
                //NOTE: This area requires fixes as the properties of the monospaced font 
                //varies from platform to platform causing lines to be spaced oddly and/or
                //fall outside of the text box. 
                //Current proposal is to replace the Graphics2D text routines with a simple
                //custom renderer based on a custom bitmap font
                
                //This is a simple lock to prevent simultaneous access 
                //to the collection of text lines in the InterfaceTree
                //by the rendering routine here and the text setter called
                //by the current script
                if(that.aengine.loadingText == false) {
                    
                    //We gained access, lock out others while we work
                    that.aengine.readingText = true;
                    
                    //Set up the local variables we'll use in rendering the text
                    //Iterator textIterator = aengine.textLines.listIterator();   //Used to cycle through the lines of text in the InterfaceTree
                    var tempString;                                          //The string value of the line being operated upon

                    //Skip through all of the lines preceeding the topmost line
                    //visible in the textbox
                    //for(i = 0; i < aengine.linePosition-1 && textIterator.hasNext(); i++){
                    //     textIterator.next();
                    //}

                    //Set up the font, red and monospaced
                    that.gScreen.fillStyle = '#FF0000';
                    that.gScreen.font = "15px monospace";

                    //Get the next five lines, if availible, and print them to
                    //the textbox with increasing y-index
                    for(i = that.aengine.linePosition ; i < that.aengine.textLines.count && i < that.aengine.linePosition + 5; i++ ){
                        tempString = that.aengine.textLines[i];
                        that.gScreen.fillText(tempString, 106, 400+((i-that.aengine.linePosition)*15));
                    }
                    
                    //We're done accesing the list of lines, so we'll release our lock
                    that.aengine.readingText = false;
                }
                
    //----------| RENDERING OF HIGHLIGHTED UI BUTTONS |----------//
                
                //Check to see if the mouse coordinates overlap any of
                //the action buttons and, if so, superimpose the
                //highlighted button image over the base UI image
                if(that.aengine.mousex <= 91 && that.aengine.mousex >= 6) {
                    if(that.aengine.mousey >= 366 && that.aengine.mousey <= 398) {
                        that.gScreen.drawImage(that.walkButton, 6, 366);
                    }
                    if(that.aengine.mousey >= 404 && that.aengine.mousey <= 438) {
                        that.gScreen.drawImage(that.lookButton, 6, 404);
                    }
                    if(that.aengine.mousey >= 440 && that.aengine.mousey <= 475) {
                        that.gScreen.drawImage(that.useButton, 6, 440);
                    }
                }
                
                //Check to see if the mouse coordinates overlap either of
                //the text scroll buttons and if there are lines to view in
                //that direction
                //If so, superimpose the highlighted button image over the
                //base UI image
                if(that.aengine.mousex <= 505 && that.aengine.mousex >= 489){
                    if(that.aengine.mousey >= 372 && that.aengine.mousey <= 383 && that.aengine.linePosition > 1)
                        that.gScreen.drawImage(that.itemScrollUp, 489, 372);
                    
                    if(that.aengine.mousey >= 457 && that.aengine.mousey <= 468 && that.aengine.linePosition + 5 < that.aengine.textLines.length)
                        that.gScreen.drawImage(that.itemScrollDown, 489, 457);
                }
                
                //Check to see if the mouse coordinates overlap either of
                //the item scroll buttons and if there are items to view in
                //that direction
                //If so, superimpose the highlighted button image over the
                //base UI image
                if(that.aengine.mousex <= 625 && that.aengine.mousex >= 609){
                    if(that.aengine.mousey >= 372 && that.aengine.mousey <= 383 && that.scroll > 0)
                        that.gScreen.drawImage(that.itemScrollUp, 609, 372);
                    
                    if(that.aengine.mousey >= 457 && that.aengine.mousey <= 468 && that.scroll < that.maxScroll) 
                        that.gScreen.drawImage(that.itemScrollDown, 609, 457);
                }
                
    //----------| RENDERING OF THE CURSOR |----------//
                
                //If the engine is set to non-interactive mode (eg: in the middle
                //of a cutscene) then don't render the cursor to the screen at all
                if(that.aengine.interactive) {
                    
                    //Render the cursor image appropriate to the currently selected tool
                    if(that.aengine.getTool().matches("walk")) {
                        that.gScreen.drawImage(that.walkTool, that.aengine.mousex, that.aengine.mousey);
                    }else if(that.aengine.getTool().matches("look")){
                        that.gScreen.drawImage(that.lookTool, that.aengine.mousex, that.aengine.mousey);
                    }else if(that.aengine.getTool().matches("use")) {
                        that.gScreen.drawImage(that.useTool, that.aengine.mousex, that.aengine.mousey);
                    }else{
                        //If the selected tool is an item, render the pointer and then the
                        //item image below it
                        that.gScreen.drawImage(that.aengine.activeItem.imageData, that.aengine.mousex + 4, that.aengine.mousey + 4);
                        that.gScreen.drawImage(that.toolStub, that.aengine.mousex, that.aengine.mousey);
                    }
                    
                }
                
            }
               
            //Indicate, for the sake of 12fps animations, that the next
            //frame will or will not be an 'update' frame
            this.animToggle = !this.animToggle;
                       
            //Put the finished backbuffer on the JFrame
            var rect = canvas.getBoundingClientRect();
            tempContext.rect(0, 0, 640, 480);
            tempContext.fillStyle = 'red';
            tempContext.fill();
            tempContext.drawImage(imageObj, x, y);
            context.drawImage(tempCanvas, 0, 0, rect.width, rect.height);      
      } 

      this.clickHandler = function(e) {

      }

      this.mouseOverHandler = function(e) {
          var rect = canvas.getBoundingClientRect();
          that.aengine.mousex = e.pageX - rect.left;
          that.aengine.mousey = e.pageY - rect.top;
          that.aengine.mousex *= 640.0/rect.width;
          that.aengine.mousey *= 480.0/rect.height;
      } 

       this.fullscreen = function(){ 
          if(canvas.webkitRequestFullScreen) {
            canvas.webkitRequestFullScreen();
          } else {
            canvas.mozRequestFullScreen();
          }    
      }    

      this.fs_ready = function() {
        canvas.height = window.innerHeight; 
        canvas.width = (canvas.height * 640.0) / 480.0;
      }

         //This is the constructor of the Core object which initializes the
         //state of the engine, installs the MIDI sequencer, Mouse Listener 
         //and timing thread, and finally loads the root level file located
         //at 'game/start.xml'
         this.start = function() {
                
                //Initialize the UI and render state
                that.animToggle = false;
                that.scroll = 0;
                that.maxScroll = 0;
                that.lastTime = 0;

                that.canvas = document.getElementById('a2canvas');
                that.tempCanvas = document.createElement('canvas');
                that.tempCanvas.width = 640;
                that.tempCanvas.height = 480; 

                document.addEventListener('mozfullscreenchange', that.fs_ready);
                document.addEventListener('webkitfullscreenchange', that.fs_ready);

                //TODO - Figure out html5 audio
                //Initialize the MIDI sequencer
                //NOTE: Apparently they removed the software synth from
                //CoreAudio in Mavericks, so no more cheezy MIDI on OSX
                //unless we go to the touble of writing our own sampler!
                //try{
                //    this.midiEngine = MidiSystem.getSequencer();
                //    midiEngine.open();
                //}catch(MidiUnavailableException e){
                    console.log("Midi is unsupported on this system!");
                //}
                /*
                //Add an event listener to the MIDI sequencer to either unload
                //the track or restart it, if it is set to loop, when it completes
                midiEngine.addMetaEventListener(new MetaEventListener() {
                    public void meta(MetaMessage msg) {
                        if (msg.getType() == 0x2F) { // End of track
                           // Restart the song
                          Iterator soundIterator = aengine.sounds.iterator();
                          Sound tempSound = null;
                          boolean looping = false;
                          while(soundIterator.hasNext()){
                              tempSound = (Sound)soundIterator.next();
                              if(tempSound.playing){
                                  looping = tempSound.loop;
                                  break;
                              }
                                  
                          }
                          if(looping){
                                midiEngine.setTickPosition(0);
                                midiEngine.start();
                          }
                        }
                    }
                });
                */

                //Install the mouse handler
                //this.addMouseListener(new thisMouseListener());
                
                //Create the InterfaceTree which will hold the game state
                //and be exposed to the scripting engine 
                that.aengine = new InterfaceTree();

                //Start the global timing thread               
                that.theTimer = setInterval((new TimingLoop(aengine, that.paint)).run(), 0);
                that.canvas.onclick = that.clickHandler;
                that.canvas.onmouseover = that.mouseOverHandler;
               
                //Load the UI skin from the game folder
                that.uiImage = new Image(); that.uiImage.src = "game/global/ui/ui.png";
                that.walkTool = new Image(); that.walkTool.src = "game/global/ui/walktool.png";
                that.lookTool = new Image(); that.lookTool.src = "game/global/ui/looktool.png";
                that.useTool = new Image(); that.useTool.src = "game/global/ui/usetool.png";
                that.toolStub = new Image(); that.toolStub.src = "game/global/ui/toolstub.png";
                that.walkButton = new Image(); that.walkButton.src = "game/global/ui/walkbutton.png";
                that.lookButton = new Image(); that.lookButton.src = "game/global/ui/lookbutton.png";
                that.useButton = new Image(); that.useButton.src = "game/global/ui/usebutton.png";
                that.itemHighlight = new Image(); that.itemHighlight.src = "game/global/ui/itemhighlight.png";
                that.itemScrollUp = new Image(); that.itemScrollUp.src = "game/global/ui/scrollup.png";
                that.itemScrollDown = new Image(); that.itemScrollDown.src = "game/global/ui/scrolldown.png";
                                              
                
                //This is the object from which our scripting engine will be spawned
                //manager = new ScriptEngineManager();
                
                //Load the initial level               
                //that.initTree("game/start.json");
                
      }

}
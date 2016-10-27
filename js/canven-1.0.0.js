window.requestAnimFrame = (function () {
	return window.requestAnimationFrame ||
			window.webkitRequestAnimationFrame ||
			window.mozRequestAnimationFrame ||
			window.oRequestAnimationFrame ||
			window.msRequestAnimationFrame ||
			function (/* function */ callback, /* DOMElement */ element) {
				window.setTimeout(callback, 1000 / 60);
			};
})();

function Canven(config) {
	let me = this;
	me.Assets = undefined;
	me.canvas = null;
	me.canvasId = "theEngine";
	me.clearClr = '#ffffff';
	me.ctx = null;
	me.ctxType = '2d';
	me.deadEntities = new Array();
	me.entityList = new Array();
	me.fps = 60;
	me._fpsCnt = 0;
	me._fpsCurr = 120;
	me._fpsShow = true;
	me._simCnt = 0;
	me._simCurr = 60;
	me.isReady = false;
	me.isSimulating = false;
	me.mousePos = null;
	me.removeByRun = false;
	me.size = new Vector2D(800,600); 
	me.splashDone = false;
	me.Events = null;
	me.deltaTime = 0.5;

	me.AddEntity = (...ent) => {
		let el = me.entityList;
		for (let i = 0; i < ent.length; ++i) {
			let idx = el.length;
			let e = ent[i];
			e.Init({});
			e.Id = idx;
			e.Parent = me;
			el[idx] = e;

			// Check if there is a controller tied to the entity
			if (typeof (e.Controller) != 'undefined') {
				let ctrl = e.Controller;
				ctrl.Init();
				// We need to map the events to the controller
				if (typeof (ctrl.HandleKeyDown)) {
					this.Events.KeyDown(ctrl.HandleKeyDown);
				}
				if (typeof (ctrl.HandleKeyUp) != 'undefined') {
					this.Events.KeyUp(ctrl.HandleKeyUp);
				}
			}// Endif e.Controller is a valid controller 
		}// End for index loop


	}

	me.Clear = (ctx) => {
		if (!me.IsValidObject(ctx)) {
			console.error('Not a valid context');
		}
		let oldStyle = ctx.fillStyle;
		ctx.fillStyle = me.clearClr;
		ctx.fillRect(0, 0, me.size.x, me.size.y);

		ctx.fillStyle = oldStyle;

		return me;
	};

	me.Close = () => {
		me.isReady = false;
		me.entityList = new Array();
		me.deadEntities = new Array();
		console.log('Engine closed for business');
	};

	me.fpsUpdate = () => {
		if (me.isReady) {
			me._fpsCurr = me._fpsCnt;
			me._fpsCnt = 0;
			me._simCurr = me._simCnt;
			me._simCnt = 0;
			setTimeout(me.fpsUpdate, 1000);
		}
	};

	me.fpsShow = (ctx) => {
		if (!me.IsValidObject(ctx)) {
			console.error('Context is endefined!');
			return;
		}

		let oldStyle = ctx.fillStyle;
		let oldFont = ctx.font;

		let msg = `FPS: ${me._fpsCurr} Sim: ${me._simCurr}`;
		let obj = `Game Objects: ${this.entityList.length}`;
		ctx.font = '12pt Georgia';

		let width = ctx.measureText(obj).width;

		ctx.fillStyle = 'rgba(0,0,0,0.7)';
		ctx.fillRect(25, 5, width + 20, 60);

		ctx.fillStyle = '#909090';
		ctx.fillText(msg, 30, 25);

		ctx.fillText(obj, 30, 50);

		ctx.font = oldFont;
		ctx.fillStyle = oldStyle;

		return me;
	};

	me.HexToRGB = (hex) => {
		if(hex[0] = '#'){
			hex = hex.substring(1, hex.length).trim();
		}

		return me.CreateRGB(
				parseInt(hex.substr(0, 2), 16),
				parseInt(hex.substr(2, 2), 16),
				parseInt(hex.substr(4, 2), 16)
			);
	};

	me.CreateRGB = (r,g,b) => {
		let rgb = {
			r: r, g: g, b: b, toString: function () {
				return `${this.r},${this.b},${this.b}`;
			}
		}

		return rgb;
	}

	me.IndexEntities = () => {
		for (let i = 0; i < me.entityList.length; ++i) {
			me.entityList[i].id = i;
		}
	};

	me.Init = () =>{
		me.canvas = document.getElementById(me.canvasId);
		if (typeof (me.canvas) == 'undefined' || me.canvas == null) {
			// We are going to try and create a canvas element
			this.canvas = document.createElement('canvas');
			this.canvas.width = window.innerWidth - 50;
			this.canvas.height = window.innerHeight - 100;
			// Add my canvas to the body of the page
			document.body.insertBefore(this.canvas, document.body.childNodes[0]);
		}
		// Make sure we have a valid canvas object
		if (me.canvas != null && typeof (me.canvas) != 'undefined') {
			me.ctx = me.canvas.getContext(me.ctxType);
			if (me.ctx != null && typeof (me.ctx) != null) {
				me.isReady = true;
				me.size = new Vector2D(me.canvas.width, me.canvas.height);

				setTimeout(me.fpsUpdate, 1000);
			}
		} else {
			// Huston we have a problem, a failure to launch!
			console.error(`Canvas #${me.canvasId} was not found and auto create didn't create canvas.`);
			return;
		}

		me.Events = new Events();
		me.Events.Init(me);
		me.Events.AddEventType('splashend');

		// Create asset manager and provide it with our context
		me.Assets = new Assets({ ctx: me.ctx });

		// Connect to mouse tracking
		me.mousePos = new Vector2D(0, 0);
		document.onmousemove = me.MouseMove;

		me.Splash();
		return me;
	};

	me.IsValidObject = (obj) => {
		return typeof (obj) != 'undefined' && obj != null;
	};

	me.MouseMove = (e) => {
		e = e || window.event;

		me.mousePos.x = e.clientX;
		me.mousePos.y = e.clientY;
	};

	me.Physics = () => {
		// Run physics simulation
		for (let i = 0; i < me.entityList.length; ++i) {
			let ent = me.entityList[i];
			if (typeof (ent.collider) != 'undefined' && ent.collider != null) {
				// Need to check this will all entities
				for (let j = i + 1; j < me.entityList.length; ++j) {
					let other = me.entityList[j];
					if (typeof (other.collider) == 'undefined' || other.collider == null) {
						continue;
					}
					// Check if there was a hit
					if (ent.collider.CheckHit(other)) {
						// Hit detrected so tell the colliders to handle it
						//console.log(`Hit: ${ent.id} and ${other.id}`);
						let entVel = ent.collider.HandleCollision(other);
						let othVel = other.collider.HandleCollision(ent);
						ent.Velocity.set(entVel.x, entVel.y);
						other.Velocity.set(othVel.x, othVel.y);
						if (typeof (ent.collider.Callback) == 'function') {
							ent.collider.Callback(other);
						}
					}
				}
			}
		}
	};

	me.RemoveEntity = (entity) => {// Sorry fokes this is still O = n
		if (me.removeByRun) {
			// Check if we have more then one entity to delete
			if (me.deadEntities.length > 1) {
				// Going the slow route to remove entities
				for (let i = 0; i < me.deadEntities.length; ++i) {
					// If I have more than one entity to remove this will get sticky
					let ent = me.deadEntities[i]
					me.entityList.splice(me.entityList.indexOf(ent), 1);
				}
				// Re index the entity list
				me.IndexEntities();
			} else if (me.deadEntities.length == 1) {
				me.entityList.splice(me.entityList.indexOf(me.deadEntities[0]), 1);
			}
			me.deadEntities = [];
			me.removeByRun = false;
		} else if(me.IsValidObject(entity) && me.entityList.indexOf(entity)) {
			// Don't just remove an entity until the proper time in the main game loop
			// So for now going to add it to the delete pile
			me.deadEntities[me.deadEntities.length] = entity;
		}
	};

	me.Run = () => {
		if (!me.splashDone) {
			setTimeout(me.Run, 500);
			return;
		}
		if (!me.isSimulating) {
			me.Simulate();
		}
		if (me.isReady) {
			me.Clear(me.ctx);
			for (let i = 0; i < me.entityList.length; ++i) {
				me.entityList[i].EngineDraw(me.ctx);
			}

			++me._fpsCnt;
			me.removeByRun = true;
			me.RemoveEntity();
			// Process events in the message pump
			me.Events.handleEvents();

			if (me._fpsShow) {
				me.fpsShow(me.ctx);
			}

			requestAnimationFrame(me.Run);
		}
	};

	me.Simulate = () => {
		if (me.isReady) {
			me.isSimulating = true;
			let t0 = performance.now();

			// Going to see what the difference is if we test for collisions first before we move
			me.Physics();
			for (let i = 0; i < me.entityList.length; ++i) {
				me.entityList[i].EngineMove(me.deltaTime);
			}

			let t1 = performance.now();
			let waitTime = Math.max(1, (1000 / 120) - (t1 - t0));
			setTimeout(me.Simulate, waitTime);
			//console.log(waitTime);

			// Calculate the deltaTime from this frame amount
			me.deltaTime = Math.max(0, me._fpsCurr / me._simCurr);
			if (isNaN(me.deltaTime)) me.deltaTime = 0.5;
			++me._simCnt;
		}
	};

	me.Splash = (config) => {
		if (!me.IsValidObject(me.ctx)) {
			console.error('Not a valid context for engine');
			return;
		}

		let sp = this;
		sp.duration = 1000;
		sp.frames = 60;
		sp.timed = 0;
		sp.splashReady = false;

		sp.RunSplash = () => {
			let perc = sp.timed / sp.frames;

			sp.Draw(me.ctx, perc);
			if (sp.timed != sp.frames) {
				requestAnimationFrame(sp.RunSplash);
				++sp.timed;
				++me._fpsCurr;
			} else {
				me.splashDone = true;
				// Tell anyone who cares the splash has completed
				me.Events.raiseEvent({ id: 0, type: 'splashend', e: {} });
			}
		};

		sp.Draw = (ctx, perc) => {
			let oldStyle = ctx.fillStyle;
			let oldFont = ctx.font;

			let msg = "Welcom to Canven";

			ctx.font = "30pt Georgia";
			let size = ctx.measureText(msg);
			let x = me.size.x / 2 - (size.width / 2);
			let y = me.size.y / 2;

			ctx.fillStyle = "#000000";
			ctx.fillRect(0, 0, me.size.x, me.size.y);
			ctx.fillStyle = "#ffffff";
			ctx.fillText(msg, x, y);

			ctx.font = "14pt Georgia";
			msg = "Programmed by Leland Ede";
			size = ctx.measureText(msg);
			x = (me.size.x / 2) - (size.width / 2);
			y += 30;
			ctx.fillText(msg, x, y);

			let rgb = me.HexToRGB(me.clearClr);
			
			ctx.fillStyle = `rgba(${rgb.toString()},${perc})`;
			ctx.fillRect(0, 0, me.size.x, me.size.y);

			ctx.font = oldFont;
			ctx.fillStyle = oldStyle;
		};


		Object.assign(sp, config);
		sp.Draw(me.ctx, 0);
		setTimeout(sp.RunSplash, 3000);
	};

	me.toString = () => {
		let str = "Canven: {\r\n";
		let keys = Object.keys(me);
		for (let i = 0; i < keys.length; ++i) {
			let k = keys[i];
			//if (k[0] == '_') continue;
			if (typeof (me[k]) == 'function') continue;
			str += `\t[${k}]=${me[k]}\r\n`;
		}
		str += "}\r\n";

		return str;
	};

	// Apply config settings
	Object.assign(me, config);
};

// Asset Manager Class
// Converting the new class definition to the old object definition style so that this can be
// a module to export, maybe...

class Assets {
	constructor(config) {
		this.pendingFiles = [];
		this.fileList = {};
		this.toLoad = 0;
		this.loaded = 0;

		this.imageTypes = ['png', 'jpg', 'jpeg', 'gif'];
		this.dataTypes = ['json']; // Not sure if I want to support XML but it could be easily added
		this.audioTypes = ['wav', 'mp3', 'ogg', 'webm'];
		this.fontTypes = ['ttf', 'otf', 'ttc', 'woff']; // Need to look up different font extensions

		Object.assign(this, config);
		if (typeof (this.ctx) == 'undefined' || this.ctx == null) {
			console.error(`Context was not provided to the asset manager! Font's will not preload'`);
		}
	};

	// The load function needs to support promises.  That way we can reliably count the files being loaded and hadnle failed
	// file loads.
	Load(...files) {
		return new Promise(resolve => {
			let loadHandler = () => {
				this.loaded += 1;
				if (this.loaded == this.toLoad) {
					// Reset the load tracking system
					this.loaded = 0;
					this.toLoad = 0;

					// We will want to complete the promise now that everything is loaded
					resolve();
				}
				// We should know that an assets was successfully loaded
				console.log(`Assets loaded.`);
			};

			this.toLoad += files.length;
			while (files.length > 0) {
				let file = files.pop();
				let ext = file.split('.').pop();
				if (this.imageTypes.indexOf(ext) >= 0) {
					// Need to load an image
					this.LoadImage(file, loadHandler);
				} else if (this.dataTypes.indexOf(ext) >= 0) {
					// Need to load a data file
					this.LoadJson(file, loadHandler);
				} else if (this.audioTypes.indexOf(ext) >= 0) {
					// Need to load an audio file
					this.LoadAudio(file, loadHandler);
				} else if (this.fontTypes.indexOf(ext) >= 0) {
					// Need to load a font which is tricky :/
					this.LoadFont(file, loadHandler);
				} else {
					console.error(`Unknown file type ${ext} in file ${file}`);
				}
				// Add file to the pending load list
				this.pendingFiles.push(file);
			}
		});
	};

	LoadImage(file, loadHandler) {
		let img = new Image();
		// Connect the load event to our event handler
		img.addEventListener('load', loadHandler, false);
		// Store image in the asset list
		this[file] = img;
		// Start the image loading process
		img.src = file;
	};

	LoadJson(file, loadHandler) {
		// Time to load some data so that the game can either pull it from a static file or if your good with server code
		// it can be pulled dynamically from a database or cloud service....
		let xhr = new XMLHttpRequest();
		xhr.open('GET', file, true);
		// Let system know we want a text file
		xhr.responseType = 'text';
		xnh.onload = event => {
			if (xhr.status == 200) {
				// Parse the server response
				let data = JSON.parse(xhr.responseText);
				// Add the file name to the data structure
				data.name = file;
				// Store our loaded data!
				this[file] = data;
				loadHandler();
			}
		};
		xhr.send();
	};

	LoadAudio(file, loadHandler) {
		// Will update this when I have some audio files to load for now it is just a stub
		this[file] = undefined;
		loadHandler();
	};

	LoadFont(file, loadHandler) {
		// Fonts are very tricky to load so the first thing we will do is add a new style to the document header
		// Then if ctx is defined we will try and write the font name to the canvas
		let fontName = file.split('/').pop().split('.')[0];
		let newStyle = document.createElement("style");
		let fontFace = `@font-face{font-family: ${fontName}; src: url('${file}');`;
		newStyle.appendChild(fontFace);
		document.head.appendChild(newStyle);
		// Try and force the font to load by drawing it to the canvas
		if (typeof (this.ctx) != 'undefined' && this.ctx != null) {
			// Need to test this with a font to see if we will get it to work
			let oldFont = ctx.font;
			let oldStyle = ctx.fillStyle;
			ctx.font = `12pt ${fontName}`;
			ctx.fillStyle = 'rgba(0,0,0,1)';

			ctx.fillText(fontName);

			ctx.font = oldFont;
			ctx.fillStyle = oldStyle;
		}
		loadHandler();
	};
};

class Controller {
	constructor(config) {
		this.keys = {}; // Create a blank object to store key mappings
		this.keysDown = [];
		Object.assign(this, config);

		this.HandleKeyDown = (e) => {
			e = e || windows.event;
			this.keysDown[e.which] = true;
		};

		this.HandleKeyUp = (e) => {
			e = e || windows.event;
			this.keysDown[e.which] = false;
		};
	};

	Init() {
		// Initialize the keyDown array
		for (let i = 0; i < 255; ++i) {
			this.keysDown[i] = false;
		}
	};

	// Check if a key state is down
	KeyDown(key) {
		let code = key;
		// We should check and see if this is a mapped key code
		if (typeof (this.keys[key]) != 'undefined') {
			// Pull the key code from the key map
			code = this.keys[key];
		}
		let retVal = false;
		if (code >= 0 && code < 255) {
			retVal = this.keysDown[code];
		}
		return retVal;
	};


	// Change of plan I want to make this function actually work since we do have the kep map in this object
	HasInput(key) {
		return typeof (this.keys[key]) != 'undefined';
	};
}

class Collider {
	constructor(config) {
		this.entity = null;
		this.colliderActive = false;
		this.Callback = null; // Put a function in the callback if you want a message that a collision was handled

		Object.assign(this, config);
	}

	HandleCollision(you) {
		console.error("Collision happend so handle it!");
	}

	CheckHit(you) {
		console.error("Checking for hit to bad we don't have and logic for this!");
	}

}

class Effect {
	constructor(config, ctx) {
		this.name = "Null Effect"; // Change name in your effect to properly describe it
		this.effectType = 'normal';
		this.effectFunc = ctx.globalCompositeOperations;

		// Lazy mans way of pushing settings
		Object.assign(this, config);
	}

	start(ctx) {
		// Put your effect code into this section.
		ctx.save();
		if (typeof (this.effectFunc) == 'function') {
			this.effectFunc(ctx.effectType);
		} else {
			console.error('No defined context effect function!');
		}
		ctx.globalCompositeOperations(this.effectType);
	}

	end(ctx) {
		// Put any ending effect items in this section.
		ctx.restore();
	}
}

class EffectMultiply extends Effect {
	constructor(config, ctx) {
		super(config, ctx);

		this.name = "Multiply Effect";
		// For a simple effect this is all we have to do :D
		this.effectType = "multiply";
	}
}

class Entity{
	constructor(config) {
		this._id = -1;
		this.collider = null;
		this.children = [];
		this._debug = false;
		this.effects = [];
		this._layer = 1;
		this.name = "Entity";
		this.Parent = null;
		this._position = new Vector2D(0, 0);
		this._size = { height: 0, width: 0 }; // Create a new height and width object
		this.Rotation = 0;
		this._pivot = new Vector2D(0.5, 0.5); // Set default pivot point at the center of our object
		this.Scale = new Vector2D(1, 1);
		this.Velocity = new Vector2D(0, 0);

		Object.assign(this, config);
	};

	AddChild(child) {
		let list = this.children;
		let id = `${this.id}:${list.length}`;
		child.Init({});
		child.Id = id;
		child.Parent = this;
		list[list.length] = child;

		return this;
	};

	AddEffect(effect) {
		let idx = this.effects.length;
		effect.id = idx;
		this.effects[idx] = effect;
	};

	get Debug() {
		return this._debug;
	};

	set Debug(value) {
		// Make sure debug is a boolean value
		this._debug = value == true;
	};
	
	Draw(ctx) {
		console.error("No defined draw method for entity");
		return this;
	};

	get Empty() {
		return this.children.length == 0;
	};

	EngineDraw(ctx) { // DO NOT overload this method unless you know what the f*ck your doing!
		// Start pre rendering tasks
		ctx.save();
		let pos = this.Position;
		// Calculate the objects draw position.
		let mx = pos.x - (this.Pivot.x * this.Size.width);
		let my = pos.y + (this.Pivot.y * this.Size.height);

		ctx.translate(mx, my);

		if (this.Rotation != 0) {
			// Before we can rotate we need to translate the object to the rotation center
			// Need to convert the rotation from degrees into radians
			let radians = this.Rotation * (180 / Math.PI);
			ctx.rotate(radians);
		}

		ctx.scale(this.Scale.x, this.Scale.y);

		// Call the client entity draw routine now that the core engine code is ready
		this.Draw(ctx);
		// Process each child object
		if (this.children.length > 0) {
			for (let i = 0; i < this.children.length; ++i) {
				this.children[i].EngineDraw(ctx);
			}
		}

		ctx.scale(1.0, 1.0);
		if (this.Rotation != 0) {
			let radians = this.Rotation * (180 / Math.PI);
			ctx.rotate(-radians);
		}
		ctx.translate(-mx, -my);
		ctx.restore();
	};

	EngineMove(deltaTime) {// Don't overload the engine move method unless you know what the F*ck your doing!!!
		// First move myself
		this.Move(deltaTime);
		// Check if we have any children
		if (!this.Empty) {
			// Process each child move
			for (let i = 0; i < this.children.length; ++i) {
				this.children[i].EngineMove(deltaTime);
			}// End for index loop
		}// Endif children are not empty
	};

	get Id() {
		return this._id;
	};

	set Id(value) {
		this._id = value;
	};

	Init(config) {
		Object.assign(this, config);
	};

	get Layer() {
		return this._layer;
	}

	set Layer(value) {
		this._layer = value;
		// We need to resort the parent array
		if (typeof (this.Parent) != 'undefined' && this.Parent != null) {
			this.Parent.children.sort((a, b) => a._layer - b._layer);
		}
	}

	Move(deltaTime) {
		//this.Position.x += this.Velocity.x * deltaTime;
		//this.Position.y += this.Velocity.y * deltaTime;
		return this;

	};

	get Pivot() {
		return this._pivot;
	}

	get Position() {
		return this._position;
	};

	set Position(pos) {
		this._position.x = pos.x;
		this._position.y = pos.y;
	};

	get RealPos() {
		let pos = null;
		// Try and not calculate the parent location if there is no parent defined
		if (this.Parent != null) {
			pos = new Vector2D(this.Position.x, this.Position.y);
			let parPos = this.Parent.RealPos();
			pos.x += parPos.x;
			pos.y += parPos.y;
		} else {
			pos = this._position;
		}

		return pos;
	};

	RemoveChild(child) {
		if (this.children.indexOf(child) >= 0) {
			// Remove child from array
			this.children.splice(this.children.indexOf(child), 1);
		} else {
			// Report the child isn't mine
			console.error(`Child ${child.Id} is not mine! Doesn anyone know who his parent is?`);
		}
	}

	get Size() {
		return this._size;
	};

	set Size(value) {
		// Validate value object properties
		if (typeof (value.height) != 'undefined') this._size.height = value.height;
		if (typeof (value.width) != 'undefined') this._size.width = value.width;
	}

}// End Entity Definition


// TODO: Create a road path to the entities in the scene so that they can be simulated in one physics world.
class Scene extends Entity {
	constructor(config) {
		super(config);

		this._camera = undefined;
		this._layers = []; // Yes this will support layers but alas I don't recomend going to deep.
		this._debug = false;
	};

	Draw(ctx) {
		// No need to call each child the entity engine draw method will deal with that.
		if (this._debug) {
			// What do we want to show about the scene?
			// - Total scene objects
			// - How many objects are in view
			// - any other metrics that might be interesting
		}
	};

	Move(deltaTime) {
		// Typically we don't want to move the scene, we should define a camera for scene scrolling.
		// In the camera entity we will add the culling ability to remove non visible objects from the draw method
	};

	Add(entity) {// Create a shortcut to the child utility
		this.AddChild(entity);
	}

	get Camera() {
		return this._camera;
	};

	set Camera(cam) {
		this._camera = cam;
		cam.Parent = this;
	};

	set Debug(debug) {
		// Make sure a valid true value is passed
		this._debug = debug == true;
	}
}

class Camera extends Entity {
	constructor(config) {
		super(config);
		this._constroller = undefined;
	};

	Draw(ctx) {
		ctx.translate(this.Position.x, this.Position.y);
	};

	Move(deltaTime) {
		let speed = { x: 0, y: 0 };
		if (typeof (this._controller) != 'undefined') {
			// Try and move the camera based on the controller input
		}
	};

	get Controller() {
		return this._constroller;
	};

	set Controller(ctrl) {
		this._constroller = ctrl;
	};

	get WorldPos() {
		let xy = { x: this.Position.x, y: this.Position.y };
		return xy;
	};
}

class Circle extends Entity {
	constructor(config) {
		super(config);
	};
}

class Rectangle extends Entity {
	constructor(config) {
		super(config);
	};
}

class Sprite extends Entity {
	constructor(config) {
		super(config);
	};

	Draw(ctx) {

	};
}

// There are several things we can do as an event system and so many different ways to do them.  For now
// I think it would be good to program the event system to capture and event and then wait for the right
// polling time before the event is processed and handled.
// The other way to handle this is when an event is registered is to process it right away.  Both ways have
// their pros and cons.  But from the engine side it might make more sense to have it hold all events and then
// process these events when the game loop is ready for events so that events don't interupt a frame draw or other
// important step.  So with that we need to create a message pump so that events can be sent to it when ever but then
// have them process when the engine is ready.

class Events {
	constructor(config) {
		this.pendingEvents = [];
		this.events = {
			click: [],
			keydown: [],
			keyup: [],
			mousemove: []
		};

		this.maxEventHandles = 15;

		let em = this; // Event manager, yes I know I'm really lazy and don't like to type that much

		// Update events data stgructure with config
		Object.assign(this, config);

		this.handleClick = function (e) {
			e = e || windows.event;
			e.preventDefault();
			// Example of how we are going to handle events
			let evt = {
				id: 0,
				type: 'click',
				e: e
			};
			// There is a scope issue here so calling this method crunches the class scope
			em.raiseEvent(evt);
		};

		this.handleKeyDown = function (e) {
			e = e || windows.event;
			let evt = {
				id: 0,
				type: 'keydown',
				e: e
			};
			em.raiseEvent(evt);
		};

		this.handleKeyUp = function (e) {
			e = e || windows.event;
			let evt = {
				id: 0,
				type: 'keyup',
				e: e
			};
			em.raiseEvent(evt);
		};

		this.handleMouseMove = function (e) {
			e = e || windows.event;
			let evt = {
				id: 0,
				type: 'mousemove',
				e: e
			};
			em.raiseEvent(evt);
		};
	};

	Init(eng) {
		// We need to connect all the events we want to listen for to the canvas window
		eng.canvas.onclick = this.handleClick;
		window.onkeydown = this.handleKeyDown;
		window.onkeyup = this.handleKeyUp;
		eng.canvas.onmousemove = this.handleMouseMove;
	};

	raiseEvent(evt) {
		let idx = this.pendingEvents.length;
		evt.id = idx;

		// Put the new event at the end of the messages
		this.pendingEvents.push(evt);
	};

	handleEvents() {
		// Start processing events from the front of the line
		let cnt = 0;
		// Keep going until there are no message to process, kind of
		while (this.pendingEvents.length > 0) {
			// Get message from front of line
			let evt = this.pendingEvents.shift();
			let evtType = evt.type;
			if (typeof (this.events[evtType]) != 'undefined') {
				for (let i = 0; i < this.events[evtType].length; ++i) {
					// Dereference the event data
					this.events[evtType][i].handle(evt.e);
				}
			}

			// Kill this loop after the number of maxEventHandles has been processed
			if (++cnt > this.maxEventHandles) break;
		}
	};

	// Add a new event handler
	AddEventHandler(eventType, handler) {
		if (Object.keys(this.events).indexOf(eventType) == -1) {
			this.AddEventType(eventType);
		}
		this.events[eventType].push({ handle: handler });
	};

	// Make it so custom event types can be defined.  Line the game egnine may need to crate a bunch of event types
	AddEventType(type) {
		this.events[type] = [];
	};

	///////////////////////////////////////////////////////
	// Quick methods to add events to common event types
	///////////////////////////////////////////////////////
	Click(handler) {
		this.AddEventHandler('click', handler);
	};

	KeyDown(handler) {
		this.AddEventHandler('keydown', handler);
	}

	KeyUp(handler) {
		this.AddEventHandler('keyup', handler);
	}
}

class Vector2D {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	set(x, y) {
		this.x = x;
		this.y = y;
	};

	toString() {
		return `[${this.x}, ${this.y}]`;
	}
}

function lerp(t, a, b) {
	return (1 - t) * a + t * b;
}
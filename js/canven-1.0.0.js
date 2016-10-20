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
	me.canvas = null;
	me.canvasId = "theEngine";
	me.clearClr = '#ffffff';
	me.ctx = null;
	me.ctxType = '2d';
	me.deadEntities = new Array();
	me.entityList = new Array();
	me.fps = 60;
	me._fpsCnt = 0;
	me._fpsCurr = 0;
	me._fpsShow = true;
	me.isReady = false;
	me.mousePos = null;
	me.removeByRun = false;
	me.size = null;
	me.splashDone = false;

	me.AddEntity = (ent) => {
		let el = me.entityList;
		let idx = el.length;
		ent.Init({});
		ent.id = idx;
		el[idx] = ent;
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
		me._fpsCurr = me._fpsCnt;
		me._fpsCnt = 0;
		if (me._isReady) {
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
		ctx.fillStyle = '#909090';
		ctx.font = '12pt Georgia';

		let msg = `FPS: ${me._fpsCurr}`;

		ctx.fillText(msg, 30, 25);

		ctx.font = oldFont;
		ctx.fillStyle = oldStyle;

		return me;
	};

	me.HexToRGB = (hex) => {
		let rgb = {
			r: 0, g: 0, b: 0, toString: function () {
				return `${this.r},${this.b},${this.b}`;
		} };
		if(hex[0] = '#'){
			hex = hex.substring(1, hex.length).trim();
		}

		rgb.r = parseInt(hex.substr(0, 2), 16);
		rgb.g = parseInt(hex.substr(2, 2), 16);
		rgb.b = parseInt(hex.substr(4, 2), 16);

		return rgb;
	};

	me.IndexEntities = () => {
		for (let i = 0; i < me.entityList.length; ++i) {
			me.entityList[i].id = i;
		}
	};

	me.Init = () =>{
		me.canvas = document.getElementById(me.canvasId);
		if (me.canvas != null && typeof (me.canvas) != 'undefined') {
			me.ctx = me.canvas.getContext(me.ctxType);
			if (me.ctx != null && typeof (me.ctx) != null) {
				me.isReady = true;
				me.size = new Vector2D(me.canvas.width, me.canvas.height);

				setTimeout(me.fpsUpdate, 1000);
			}
		} else {
			console.error(`Canvas #${me.canvasId} was not found in document`);
			return;
		}

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
					// Check if there was a hit
					if (ent.collider.CheckHit(other)) {
						// Hit detrected so tell the colliders to handle it
						console.log(`Hit: ${ent.id} and ${other.id}`);
						ent.collider.Collision(other);
						other.collider.Collision(ent);
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
					let idx = me.deadEntities[i].id;
					for (let j = 0; j < me.entityList.length; ++i) {
						if (me.entityList[j].id == idx) {
							// Remove entity and stop looking
							me.entityList.splice(j, 1);
							break;
						}
					}
				}
				// Re index the entity list
				me.IndexEntities();
				me.deadEntities = new Array();
			} else if (me.deadEntities.length == 1) {
				// Yeah only one to remove
				let idx = me.deadEntities[0].id;
				// Remove entity
				me.entityList.splice(idx, 1);
				me.IndexEntities();
				me.deadEntities = new Array();
			}
			me.removeByRun = false;
		} else if(me.IsValidObject(entity)) {
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
		if(me.isReady){
			me.Clear(me.ctx);
			if (me._fpsShow) {
				me.fpsShow(me.ctx);
			}
			let deltaTime = 1.0;
			for (let i = 0; i < me.entityList.length; ++i) {
				me.entityList[i].EngineDraw(me.ctx);
				me.entityList[i].Move(deltaTime);
			}

			// Run the physics simulation
			me.Physics();

			++me._fpsCnt;
			me.removeByRun = true;
			me.RemoveEntity();

			requestAnimationFrame(me.Run);
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

class Collider {
	constructor(config) {
		this.entity = null;
		this.colliderActive = false;
		Object.assign(this, config);
	}

	Collision(you) {
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
		this.id = -1;
		this.collider = null;
		this.children = [];
		this.effects = [];
		this.name = "Entity";
		this.Position = new Vector2D(0, 0);
		this.Rotation = 0;
		this.RotationCenter = new Vector2D(0, 0);
		this.Scale = new Vector2D(1, 1);
		this.Velocity = new Vector2D(0, 0);

		Object.assign(this, config);
	}

	AddChild(child) {
		let list = this.children;
		let id = `${this.id}:${list.length}`;
		child.Init({ id: id });
		list[list.length] = child;

		return this;
	}

	AddEffect(effect) {
		let idx = this.effects.length;
		effect.id = idx;
		this.effects[idx] = effect;
	}

	EngineDraw(ctx) { // DO NOT overload this method unless you know what the f*ck your doing!
		// So am I qualified to write code in here?
		ctx.save();
		if (this.Rotation != 0) {
			// Before we can rotate we need to translate the object to the rotation center
			let move = new Vector2D(0, 0);
			move.x = this.Position.x + this.RotationCenter.x;
			move.y = this.Position.y + this.RotationCenter.y;
			ctx.transform(move.x, move.y);
			// Need to convert the rotation from degrees into radians
			let radians = this.Rotation * (180 / Math.PI);
			ctx.rotate(radians);
		}

		// First do a translate and see if we can get this to work
		ctx.translate(this.Position.x, this.Position.y);
		ctx.scale(this.Scale.x, this.Scale.y);

		// Call the client entity draw routine now that the core engine code is ready
		this.Draw(ctx);

		ctx.scale(1.0, 1.0);
		ctx.translate(-this.Position.x, -this.Position.y);
		ctx.restore();
	}

	Draw(ctx) {
		console.error("No defined draw method for entity");
		return this;
	}

	Init(config) {
		Object.assign(this, config);
	}

	Move(deltaTime) {
		this.Position.x += this.Velocity.x * deltaTime;
		this.Position.y += this.Velocity.y * deltaTime;
		return this;

	}
}

class Vector2D {
	constructor(x, y) {
		this.x = x;
		this.y = y;
	}

	toString() {
		return `[${this.x}, ${this.y}]`;
	}
}

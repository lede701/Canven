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
				me.size = new Vector2D({ x: me.canvas.width, y: me.canvas.height });

				setTimeout(me.fpsUpdate, 1000);
			}
		} else {
			console.error(`Canvas #${me.canvasId} was not found in document`);
			return;
		}

		// Connect to mouse tracking
		me.mousePos = me.NewVector2D(0, 0);
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

	me.NewCollider = (config) => {
		return new Collider(config);
	};

	me.NewEntity = (config) => {
		return Entity(config);
	};

	me.NewVector2D = (x, y) => {
		return new Vector2D({ x: x, y: y });
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
						console.log(`Hit between ${ent.id} and ${other.id}`);
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
				me.entityList.splice(idx);
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
				me.entityList[i].Draw(me.ctx);
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

	function Collider(config) {
		let coll = this;

		coll.entity = null;

		coll.Collision = (you) => {
			console.error("Collision happend so handle it!");
		};

		coll.CheckHit = (you) => {
			console.error("Checking for hit to bad we don't have and logic for this!");
		};

		Object.assign(coll, config);
	}

	function Entity(config) {
		let ent = {
			id: -1,
			collider: null,
			childre: [],
			name: "Entity",
			Position: me.NewVector2D(0, 0),
			Rotation: me.NewVector2D(0, 0),
			Scale: me.NewVector2D(1, 1),
			Velocity: me.NewVector2D(0, 0),
			AddChild: (child) => {
				let chld = ent.children;
				let id = `${me.id}:${chld.length}`;
				child.Init({ id: id });
				chld[chld.length] = child;

				return this;
			},
			Draw: (ctx) => {
				console.error("No defined draw method for entity");
				return this;
			},
			Move: (deltaTime) => {
				ent.Position.x += ent.Velocity.x * deltaTime;
				ent.Position.y += ent.Velocity.y * deltaTime;
				return this;
			},
			Init: (config) => {
				Object.assign(ent, config);
				return this;
			}
		};

		Object.assign(ent, config);
		return ent;
	}

	function Vector2D(config) {
		let v = this;
		v.x = 0;
		v.y = 0;
		Object.assign(v, config);

		v.toString = () => {
			return `[${v.x}, ${v.y}]`;
		};
	};

};

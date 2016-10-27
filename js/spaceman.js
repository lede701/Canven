// Welcome to space man the new space fighter game.  Play at your own risk!

/* Okay all joking aside we need to do some documentation about how this game is played.  The first step is to make some game
* design decisions.

* What is the Ganre? Topdown scroller
* What is the premis?  You have just joined the Galaxysquad who sole purpose in life is to defent the universe from people
*		like me who just want to send asteroids and aliens to kill everything in sight.
* Now that we know were going to be a space jocky what are we going to do to be a hero?
* Shoot anything that isn't friendly!  Yikes with what?
* Well, we are going to give you a SLF-119 fighter which is equiped with a very powerful laser gun.
* Yeah anything esle?  I mean come on guys there isn't enough laser power in the universe that can save us from the
* onslaught of enemies your going to throw at me!
* Since you are such a big baby how about we add some VERY powerful missle to your arsinel?  Will that help you go forth
* and desroy everything in your sights?
* Err yes I guess so....

* So now our journey begins.  We need to find a ship for the player that can shoot laser guns and missles that blow sh*t up!
* Oh wait a second how am I suppose to control this ship and target enemies?
* So we will need a way for the player to control their awesome ship.  How about for now we make it easy and give them
* some basic controls:
*	[DONE]		[A] - Move the ship left
*	[DONE]		[D] - Move the ship right
*	[DONE]		[S] - Move the ship down / slow it down so we will need some reverse thrusters :D
*	[DONE]		[W] - Move the ship forward / yeahaw booster time!
*	[DONE]	[Space] - Fire laser guns!  Blow some sh*t up
*			[Enter] - Fire missles to do radius damage
* Be careful when programming this one because we could do some real damage with the enter key!

* So who are we going to fight?
* Since you ask we are going to first start you out simple and have you clear the battle field of asteroids and debris.  Once
* you understand how this all works we will send you one a few easy missions until your qualified to fight real ace pilots.
* Level 1 - Asteroids and space debris
* Level 2 - Training targets
* Level 3 - Easy missions
* Level 4 - Ace missions

* So we are going to let you go from very to very hard in 4 steps.  Doesn't seem fair does it :D

* Required Assets for the game
*  1. Sprite sheet for main hero character the SLF-119
*  2. Sprite sheets for asteroids
*  3. Sprite sheets for debris
*  4. Sprite sheet for alien space ship
*  5. World texture map
*  6. SOUND: Main Laser sounds
*  7. SOUND: 5 different enemy explosions
*  8. SOUND: main thrusters
*  9. SOUND: reverse thrusters for main ship
* 10. Etc...

* As the project progress we will update these design documents.

//////////////////////////////////////////////////////////////////////
// Bugs
//////////////////////////////////////////////////////////////////////

	1. When the laser is removed from the game world it will randomly delete another entity.  The first time this happened
		the [A] button was removed the scond time the main space ship.
		Fixed: The issue was in the remove entity core engine method.  I switched the way the entity array removes
			items so now the object is used to find the index in the array.  Much fast at removing and more accurate.
	2. When changing directions there is a smooth transition but then the ship stops and starts again.

//*/

// First thing we need to do is connect our script to the page loaded event

if (window.addEventListener) {
	window.addEventListener('load', Spaceman, false);
} else {
	window.attachEvent('onload', Spaceman);
}

function Spaceman()
{
	let engine = new Canven({
		canvasId: 'theCanvas',
		//_fpsShow: false,
		clearClr: '#00002a'
	});
	engine.Init();

	let ship = new Fighter();
	ship.Setup(engine.size);
	ship.Controller = new KeyboardController();
	ship.Engine = engine;
	engine.AddEntity(ship);

	SetupKeys(engine, 'A', 65, { x: 100, y: engine.size.y - 100 });
	SetupKeys(engine, 'S', 83, { x: 140, y: engine.size.y - 100 });
	SetupKeys(engine, 'D', 68, { x: 180, y: engine.size.y - 100 });
	SetupKeys(engine, 'W', 87, { x: 140, y: engine.size.y - 140 });

	engine.Events.KeyUp((e) => {
		e = e || windows.event;
		switch (e.which) {
			case 81:
				engine.Close();
				break;
			default:
				console.info(`Key: ${e.which}`);
				break;
		}

	});

	engine.Run();
}

function SetupKeys(engine, char, code, pos) {
	// Add visual keyboard so we can debug movement
	let key = new KeySprite();
	key.letter = char;
	key.keyCode = code;
	key.Position.x = pos.x;
	key.Position.y = pos.y;
	engine.AddEntity(key);

	engine.Events.KeyDown(key.handleKeyDown);
	engine.Events.KeyUp(key.handleKeyUp);
}

/////////////////////////////////////////
// Input controller definitions
////////////////////////////////////////

class KeyboardController extends Controller {
	constructor(config) {
		super(config);
		let keymap = this.keys;
		keymap.quit = 81;	// Need a way to quite the game which will be Q
		keymap.up = 87;		// Assign the W key to this value
		keymap.down = 83;	// Assign the S key to this value
		keymap.left = 65;	// Assign the A key to this value
		keymap.right = 68;	// Assign the D key to this value
		keymap.fire1 = 32;	// Assign the SPACE key to this value
		keymap.fire2 = 13;	// Assign the ENTER key to this value
	};
}

/////////////////////////////////////////
// Space ship definitions
////////////////////////////////////////

class Fighter extends Entity {
	constructor(config) {
		super(config);
		this.Size = { width: 30, height: 80 };
		this.Debug = true;
		this._controller = undefined;
		this.Speed = 15;
		this.frameX = 0;
		this.frameY = 0;
		this.fireRate = 0.3;
		this.nextFire = 0;
		this._engine = null;
	};

	get Engine() {
		return this._engine;
	}

	set Engine(value) {
		this._engine = value;
	}

	Draw(ctx) {
		// Why is the draw routine being called twice?
		let oldStyle = ctx.fillStyle;
		let x = -(this.Size.width / 2)
		let y = -(this.Size.height / 2);
		// TODO: move the RGBA color to a defined sprite color
		ctx.fillStyle = 'rgba(255,255,255,255)';
		ctx.beginPath();
		ctx.rect(x, y, this.Size.width, this.Size.height);
		ctx.closePath();
		ctx.fill();

		// Show some basic sprite debug code
		if (this.Debug) {
			let pos = this.Position;
			let oldFont = ctx.font;
			let msg = `[${parseInt(pos.x)}, ${parseInt(pos.y)}]`;
			let width = ctx.measureText(msg).width;
			ctx.font = "8pt Georgia";
			ctx.fillText(msg, x - (width / 4), -(y - 12));
			ctx.font = oldFont;
		}

		ctx.fillStyle = oldStyle;
		return this;
	};

	Move(deltaTime) {
		let vel = this.Velocity;
		let vx = 0;
		let vy = 0;
		let spDrift = 60;
		//Move can be so much fun!
		if (typeof (this.Controller) != 'undefined') {
			let ctrl = this.Controller;
			if (ctrl.KeyDown('up')) {
				vy = -1 * this.Speed;
			} else if (ctrl.KeyDown('down')) {
				vy = this.Speed;
			}

			if (ctrl.KeyDown('right')) {
				vx = this.Speed;
			} else if (ctrl.KeyDown('left')) {
				vx = -this.Speed;
			}

			if (ctrl.KeyDown('fire1') && performance.now() > this.nextFire) {
				console.log('Fire lasers Mr. Scotty!');
				this.nextFire = performance.now() + (this.fireRate * 1000);
				// We need to spawn a laser and add it to the game engine
				let laser = new Laser({});
				laser.Position.x = this.Position.x - (this.Size.width / 2);
				laser.Position.y = this.Position.y;
				laser.Engine = this.Engine;
				laser.Color = '#3e7ded';
				this.Engine.AddEntity(laser);
			}
		}

		// if vel.x is 0 and the new vx is different we need to reset the frame count

		if (vx != vel.x) {
			vx = lerp(this.frameX / spDrift, vel.x, vx);
			this.frameX = (this.frameX + 1) % spDrift;
			if (this.frameX == 0) {
				if (vel.x == 0) {
					vel.x = (vx / Math.abs(vx)) * this.Speed;
				} else {
					vel.x = 0;
				}
			}
		}

		if (vy != vel.y) {
			vy = lerp(this.frameY / spDrift, vel.y, vy);
			this.frameY = (this.frameY + 1) % spDrift;
			if (this.frameY == 0) {
				if (vel.y == 0) {
					vel.y = (vy / Math.abs(vy)) * this.Speed;
				} else {
					vel.y = 0;
				}
			}
		}

		let mx = vx * deltaTime;
		let my = vy * deltaTime;

		// We should now be able to move
		this.Position.x += mx * deltaTime;
		this.Position.y += my * deltaTime;

	};

	Setup(world) {
		this.Position.x = (world.x / 2) + (this.Size.width / 2);
		this.Position.y = world.y - 200;
	}

	get Controller() {
		return this._controller;
	};

	set Controller(value) {
		// Validate controller
		if (value.HasInput('up')
			&& value.HasInput('down')
			&& value.HasInput('left')
			&& value.HasInput('right')
			&& value.HasInput('fire1')
			&& value.HasInput('fire2')
			) {
			this._controller = value;
		} else {
			// Throw a game error
			console.error('Invalid controller!');
		}
	};
};

/////////////////////////////////////////
// Key Feedback sprite
////////////////////////////////////////

class KeySprite extends Entity {
	constructor(config) {
		super(config);

		this.letter = '';
		this.keyCode = 0;
		this.width = 30;
		this.height = 30;
		this.color = 'rgba(255,255,255,0.5)';
		this.normalColor = 'rgba(255,255,255,0.5)';
		this.downColor = 'rgba(255,255,80,0.8)';
		this.textColor = 'rgba(255,255,255,1)';
		this.font = "14pt Georgia";

		this.handleKeyDown = (e) =>{
			e = e || window.event;
			if (e.which == this.keyCode) {
				this.color = this.downColor;
			}
		};

		this.handleKeyUp = (e) => {
			e = e || window.event;
			if (e.which == this.keyCode) {
				this.color = this.normalColor;
			}
		};
	}

	Draw(ctx) {
		let oldFont = ctx.font;
		let oldStyle = ctx.fillStyle;

		let x = -(this.width / 2);
		let y = -(this.height / 2);
		ctx.beginPath();
		ctx.fillStyle = this.color;
		ctx.rect(x, y, this.height, this.width);
		ctx.closePath();
		ctx.fill();

		ctx.font = this.font;
		ctx.fillStyle = this.textColor;
		let width = ctx.measureText(this.letter).width;
		let height = ctx.measureText('M').width;

		// Try and center the letter in the box
		let tx = -((this.width / 2) - (width / 2));
		let ty = (this.height / 2) - (height / 2);
		ctx.fillText(this.letter, tx, ty);

		// Show some basic sprite debug code
		if (this.Debug) {
			let pos = this.Position;
			let msg = `[${parseInt(pos.x)}, ${parseInt(pos.y)}]`;
			let width = ctx.measureText(msg).width;
			ctx.font = "8pt Georgia";
			ctx.fillText(msg, x - (width / 4), -(y - 15));
		}

		ctx.font = oldFont;
		ctx.fillStyle = oldStyle;
	};
};

/////////////////////////////////////////
// Laser sprite
////////////////////////////////////////


class Laser extends Entity {
	constructor(config) {
		super(config);
		this._speed = 0;
		this.width = 60;
		this.height = 60;
		this.alpha = 0.6;
		this.isAlive = true;

		this.Scale.x = 0.2;

		this.color = `rgba(255,255,255,0.6)`;

		this.Speed = -10;
		this._engine = undefined;
	};

	get Color() {
		return this.color;
	}

	set Color(value) {
		if (typeof (this._engine) != 'undefined') {
			let rgb = this.Engine.HexToRGB(value);
			this.color = `rgba(${rgb.toString()},${this.alpha})`;
		}
	}

	get Engine() {
		return this._engine;
	}

	set Engine(value) {
		this._engine = value;
	}

	set Speed(value) {
		this._speed = value;
		this.Velocity.y = value;
	}

	Draw(ctx) {
		let oldStyle = ctx.fillStyle;
		// Calculate the center position of rectangle
		let x = -(this.width / 2);
		let y = -(this.height / 2);

		let grad = ctx.createRadialGradient(0, 0, 1, 0, 0, 30);
		grad.addColorStop(0, 'rgba(255,255,255,1)');
		grad.addColorStop(0.2, this.color);
		grad.addColorStop(1, 'rgba(0,0,0,0');

		// Start drawing the laser
		ctx.beginPath();
		ctx.fillStyle = grad;
		ctx.rect(x, y, this.width, this.height);
		// Done drawing the rectangle/laser
		ctx.closePath();
		ctx.fill();
		// Return fill back to original
		ctx.fillStyle = oldStyle;
	}

	Move(deltaTime) {
		if (this.isAlive) {
			// Well lasers go in one direction!
			this.Position.y += this.Velocity.y * deltaTime;
			// Just in case we want to make it move left to right some day
			this.Position.x += this.Velocity.x * deltaTime;

			if (this.Position.y < 50) {
				this.Engine.RemoveEntity(this);
				this.isAlive = false;
			}
		}
	};

};
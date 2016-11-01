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

* Weapons - The playerws spaceship will need to have power ups that can do the following:
*	1. Add the number of lasers it fires in each round
*	2. Speed up or slow down fire rate
*	3. Change the type of laser guns the ship uses
* These power ups will be dropped by the enemy at random intervals when they are descroyed.

* So who are we going to fight?
* Since you ask we are going to first start you out simple and have you clear the battle field of asteroids and debris.  Once
* you understand how this all works we will send you one a few easy missions until your qualified to fight real ace pilots.
* Level 1 - Asteroids and space debris
* Level 2 - Training targets
* Level 3 - Easy missions
* Level 4 - Ace missions

* So we are going to let you go from very easy to very hard in 4 levels.  Doesn't seem fair does it :D

* Required Assets for the game
*  1. Sprite sheet for main hero character the SLF-119
*  2. Sprite sheets for asteroids
*  3. Sprite sheets for debris
*  4. Sprite sheet for alien space ship
*  5. Special Effects: Explosions, Lasers, etc.
*  6. World texture map
*  7. SOUND: Main Laser sounds
*  8. SOUND: 5 different enemy explosions
*  9. SOUND: main thrusters
* 10. SOUND: reverse thrusters for main ship
* 11. Etc...
*
* Resources:
* TexturePacker - https://www.codeandweb.com/sprite-sheet-maker?_cawex=2
* Explosion Generator - http://explosiongenerator.com/
*
* As the project progress we will update these design documents.

//////////////////////////////////////////////////////////////////////
// Bugs
//////////////////////////////////////////////////////////////////////

	1. When the laser is removed from the game world it will randomly delete another entity.  
		The first time this happened the [A] button was removed the scond time the main space ship.
		[Fixed]: The issue was in the remove entity core engine method.  I switched the way the 
		entity array removes items so now the object is used to find the index in the array.  
		Much fast at removing and more accurate.
	2. When changing directions there is a smooth transition but then the ship stops and starts 
		again. - We are going to work on this now!
		[Fixed]: The issue was when the movement function would update the entity velocity to the
		real ships velocity after the lerp was done.  The algorithm would ignore the new velocity
		and when the lerp drift amount was complete it would check if the real velocity was 0 and
		when it wasn't just kill the speed.  Storing the original change in velocity request in an
		additional value allowed for the storing of the real velocity to occure because we checked
		if it wasn't 0 then we want to store the new ships velocity.  Now we have smooth transitions
		between direction changes.
	3. When adding the asset manager as a module the import command caused a browser bug which
		makes it hard to break the code into multiple files.  Need to research this process so
		the game engine can be broken down into small files for easier management.
	4. When the game starts up some times the ship is set to NaN location.
	5. When asteroids are deleted multiple objects get deleted.
		[Fixed]: The original fix only fixed a few situations.  Changed it so the game play now is that after the hit the
		ship is indestructable for 1 second.  This way we can prevent multiple enemies hammering the player.
	6. When an asteroid hits the ship with the shields on the ship gets destroyed.
		[Fixed]: Many games when you lose life will set a time out so the player is invulnerable for a few seconds which
		has now been added to the collision handeler for the ship.
	7. It seems that after the shields have been lost when we get to close to an asteroid it
		will register a hit even though we aren't that close.
	8. Shield is turning on just before the end of current wave. This has a lot to do with timing
		and where we want to start the dropping of the next wave of asteroids. We will want to 
		add a startup wave function where we can turn on the shields after the wait time has
		completed for the in between waves.
		[Fixed]: The timming of when the start of the wave needed to be broken out into two 
		functions.  The first function would update the wave information and then set the timeout
		for the start of the wave.  In the start we turn the shields on and call the asteroid
		spawing system.

[Updates]

10/31/2016 - Happy Holloween!  So today we added the star field in the background.  This is a semi
	sudo particle effect type object but instead of using full particles we used a simple object
	that then is added to the star field.

	Next we added physics to all the game objects and put in initial physics handlers that
	properly remove game objects based on their entity name.  We will probably change this to
	be a entity tag or layer so we only have to check for one type of object instead of each name
	of all the different enemies for the game.  The game also now will spawn waves of asteroids
	until the play is killed or you quit.  Nothing special though.
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
		clearClr: '#00001a'
	});
	engine.Init();
	// Start the asset loading process
	console.log('Start loading assets!');
	engine.Assets.Load('/assets/fighter.png', '/assets/asteroid_01.png', '/assets/explosion.json').then(() => setup());

	// We need a way to start a wave of enemies/asteroids
	let Player = undefined;

	function setup() {
		player = new Fighter({
			image: engine.Assets['/assets/fighter.png'],
			Tag: 'Player',
			Debug: false
		});
		player.Setup(engine.size);
		player.Controller = new KeyboardController();
		player.Engine = engine;

		let fieldRect = { x: 0, y: 0, width: engine.size.x, height: engine.size.y };
		let starField = new StarField({ fieldRect });
		starField.Position.x = 0;
		starField.Position.y = 0;
		engine.AddEntity(starField);

		engine.AddEntity(player);

		SetupKeys(engine, 'A', 65, { x: 100, y: engine.size.y - 100 });
		SetupKeys(engine, 'S', 83, { x: 140, y: engine.size.y - 100 });
		SetupKeys(engine, 'D', 68, { x: 180, y: engine.size.y - 100 });
		SetupKeys(engine, 'W', 87, { x: 140, y: engine.size.y - 140 });

		SetupWave();
	}

	let WaveNumber = 0;
	let waveCount = 0;
	function SetupWave() {
		if (engine.isReady) {
			setTimeout(StartWave, 5000);
			waveCount = 0;
			WaveNumber++;
			console.log(`Starting Wave ${WaveNumber}`);
		}
	};

	function StartWave() {
		// Turn shields on for each wave
		player.shieldsUp = true;
		AsteroidWave();
	};

	// Create a asteroid entity
	function AsteroidMe() {
		let ast = new Asteroid({
			spriteSheet: engine.Assets['/assets/asteroid_01.png'],
			MaxY: engine.size.y + 200,
			Tag: 'Enemy',
			Debug: false
		});
		ast.Position.x = parseInt((Math.random() * (engine.size.x - 256)) + 128);
		ast.Position.y = -128;
		ast.Velocity.y = (Math.random() * 6) + 3;

		engine.AddEntity(ast);
	};

	function AsteroidWave() {
		AsteroidMe();
		if (waveCount++ < (20 * WaveNumber) && engine.isReady) {
			// The time between asteroids shouldn't be static it makes for a very boaring wave
			let timeout = parseInt(Math.random() * 800) + 300;
			setTimeout(AsteroidWave, timeout);
		} else {
			SetupWave();
		}
	}

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
// Colliders
////////////////////////////////////////

class RadiusCollider extends Collider {
	constructor(config) {
		super(config);
		this.radius = 5;
		Object.assign(this, config);
	};

	HandleCollision(you) {
		// For this collider type we don't have any physics resolutions to work out.
		// All game logic will be handled by the Entities.
		return undefined;
	};

	CheckHit(you) {
		let retVal = false;

		let ent = this.entity;
		let myColl = ent.collider;
		let youColl = you.collider;
		// Setup the math variable we need
		let youPos = you.Position;
		let mePos = ent.Position;
		// Calculate the square radius for both colliders
		let youRaidus = youColl.radius * you.Scale.x;
		let meRadius = myColl.radius * ent.Scale.x;

		// Calculate the square distance for both colliders
		let a2 = Math.abs(mePos.x - youPos.x);
		let b2 = Math.abs(mePos.y - youPos.y);
		let sqDiff = (a2 * a2) + (b2 * b2);
		// Calculate the square of the radius
		let sqRadius = (youRaidus + meRadius) * (youRaidus + meRadius);
		retVal = sqDiff < sqRadius;

		// Report if there was a collision based on the square distance and sqaure raidus
		return retVal;
	};
}

/////////////////////////////////////////
// Space ship definitions
////////////////////////////////////////

class Fighter extends Entity {
	constructor(config) {
		super(config);
		// We should really pull this from the image and then scale it down properly so we
		// don't get image distortion
		this.Size = { width: 80, height: 80 };
		this.Debug = false;
		this._controller = undefined;
		this.Speed = 10;
		this.frameX = 0;
		this.frameY = 0;
		this.fireRate = 0.20; // This will be 4 shots per second
		this.nextFire = 0;
		this._engine = null;
		this.shieldsUp = true;
		this.name = 'Fighter';
		this.Tag = 'none';

		this.LastHit = -1;

		this.HandleCollision = (other) => {
			if (this.Tag != other.Tag && other.Tag != 'none') {
				// We have been hit so time to kill ship shields
				if (this.shieldsUp) {
					this.shieldsUp = false;
				} else if (this.LastHit < performance.now()) {
					if (typeof (this.Parent.RemoveEntity) != 'undefined') {
						this.Parent.RemoveEntity(this);
						// We need to do a game over man function
						this.Parent.Close();
					}
				}
				// Record time so we know how long the ship will be invulnerable
				this.LastHit = performance.now() + 1000;
			}
		};

		// Create a collider for the ship
		this.collider = new RadiusCollider({
			entity: this,
			radius: 70,
			Callback: this.HandleCollision
		});

		if (typeof (this.image) != 'undefined' && this.image != null) {
			this.Size.width = this.image.width;
			this.Size.height = this.image.height;
			let maxSize = 80;
			if (this.Size.width > maxSize) {
				let scale = maxSize / this.Size.width;
				this.Size.width *= scale;
				this.Size.height *= scale;
			}
		}

		Object.assign(this, config);
	};

	get Engine() {
		return this._engine;
	};

	set Engine(value) {
		this._engine = value;
	};

	Draw(ctx) {
		// Why is the draw routine being called twice?
		let oldStyle = ctx.fillStyle;
		let x = -(this.Size.width / 2)
		let y = -(this.Size.height / 2);
		let size = this.Size;

		if (typeof (this.image) != 'undefined') {
			// Calculate the image position
			let sx = 0;
			let sy = 0;
			let sw = this.image.width;
			let sh = this.image.height;

			// Blit the sprite to the screen!
			ctx.drawImage(this.image, sx, sy, sw, sh, x, y, size.width, size.height);
		} else {
			// TODO: move the RGBA color to a defined sprite color
			ctx.fillStyle = 'rgba(255,255,255,255)';
			ctx.beginPath();
			ctx.rect(x, y, size.width, size.height);
			ctx.closePath();
			ctx.fill();
		}

		if (this.shieldsUp) {
			// Create shield texture
			let shield = ctx.createRadialGradient(0, 0, 1, 0, 0, this.collider.radius);
			shield.addColorStop(0, 'rgba(36,116,216,0');
			shield.addColorStop(0.6, 'rgba(36,116,216,0.05');
			shield.addColorStop(0.9, 'rgba(36,116,216,0.2');
			shield.addColorStop(1, 'rgba(66,137,223,0.5');

			// Draw shield over spaceship
			ctx.fillStyle = shield;
			ctx.beginPath();
			ctx.arc(0, 0, this.collider.radius, 0, Math.PI * 2);
			ctx.closePath();
			ctx.fill();
		}

		// Show some basic sprite debug code
		if (this.Debug) {
			let pos = this.Position;
			let oldFont = ctx.font;
			let oldStyle = ctx.fillStyle;

			let msg = `[${parseInt(pos.x)}, ${parseInt(pos.y)}]`;
			let width = ctx.measureText(msg).width;
			ctx.fillStyle = 'rgba(255,255,255,0.8)';
			ctx.font = "8pt Georgia";
			ctx.fillText(msg, x + (width / 2), -(y - 12));

			ctx.fillStyle = oldStyle;
			ctx.font = oldFont;

			// Draw collider over the space ship
			ctx.fillStyle = 'rgba(0,250,0,0.2)';
			ctx.beginPath();
			ctx.arc(0, 0, this.collider.radius, 0, Math.PI * 2);
			ctx.closePath();
			ctx.fill();
		}

		ctx.fillStyle = oldStyle;
		return this;
	};

	Move(deltaTime) {
		// Calulate the ship movement based on the controller requests
		let vel = this.Velocity;
		let vx = 0;
		let vy = 0;
		let spDrift = 20; // TODO: Move drift aka momentum and inertia using in the lerp method
		//Moving can be so much fun!
		if (typeof (this.Controller) != 'undefined') {
			let ctrl = this.Controller;
			if (ctrl.KeyDown('up')) {
				vy = -this.Speed;
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

				// We can change the fire patter by just changing the spawn position array
				// As we progress the game should be able to change the firing array so that we
				// can have different weapons that do different things
				let offset = 22;
				let posX = this.Position.x - (this.Size.width / 2);
				let pos = [
					{ x: posX - offset, y: this.Position.y, dir: -1 },
					{ x: posX + offset, y: this.Position.y, dir: 1 }
				];
				for (let i = 0; i < pos.length; ++i) {
					let laser = new Laser({Tag: 'Player'});
					laser.Position.x = pos[i].x
					laser.Position.y = pos[i].y;
					// Define laser speed so that our ship can't out run its own shots
					laser.Speed = -(this.Speed + 10);
					laser.Engine = this.Engine;
					laser.Color = '#3e7ded';
					// Hmm I think having some particle fly off the ships guns as it fires a
					// laser might look cook.
					let pfx = new Particles({ maxParticles: 3, particlesPerFrame: 5, maxAge: 5, fadeAge: 1 });
					// Calulate particle position relitive to the ship
					pfx.Position.x = offset * pos[i].dir;
					pfx.Position.y = -45;

					this.Parent.AddEntity(laser);
					this.AddChild(pfx);
				}// End for index of each laser's position
			}// Endif fire1 is pressed
		}// Endif controller is defined


		// if vel.x is 0 and the new vx is different we need to reset the frame count
		let diag = { x: vx, y: vy };
		if (vx != vel.x) {
			// Calculate the linear interpolation of the change in speed
			vx = lerp(this.frameX / spDrift, vel.x, vx);
			this.frameX = (this.frameX + 1) % (spDrift);
			if (this.frameX == 0) {
				// Check to see if it is time to update the real velocity object
				if (vel.x == 0 || diag.x != 0) {
					vel.x = (vx / Math.abs(vx)) * this.Speed;
				} else {
					// There is no energy so lets kill the speed
					vel.x = 0;
				}
			}
		}
		if (vy != vel.y) {
			// Calculate the linear interpolation of the change in speed
			vy = lerp(this.frameY / spDrift, vel.y, vy);
			this.frameY = (this.frameY + 1) % spDrift;
			if (this.frameY == 0) {
				// Check to see if we have energy to apply to the real velocity
				if (vel.y == 0 || diag.y != 0) {
					vel.y = (vy / Math.abs(vy)) * this.Speed;
				} else {
					// There is no energy to deal with so shut movement down
					vel.y = 0;
				}
			}
		}

		let mx = vx * deltaTime;
		let my = vy * deltaTime;

		// We should now be able to move
		this.Position.x += mx;
		this.Position.y += my;

		// TODO: Move this to setup
		let gutter = this.gutter;

		// We now need to make sure the ship doesn't fly outside the game screen boundary
		if (this.Position.x < gutter.x) {
			this.Position.x = gutter.x;
		} else if (this.Position.x > gutter.width) {
			this.Position.x = gutter.width;
		}
		if (this.Position.y < gutter.y) {
			this.Position.y = gutter.y;
		} else if (this.Position.y > gutter.height) {
			this.Position.y = gutter.height;
		}
	};

	Setup(world) {
		this.Position.x = (world.x / 2) + (this.Size.width / 2);
		this.Position.y = world.y - 140;
		this.gutter = { x: this.Size.width + (this.Size.width / 2), y: 250, width: world.x - (this.Size.width / 2), height: world.y - this.Size.height };
	};

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
// Asteroid Sprite
////////////////////////////////////////

class Asteroid extends Entity {
	constructor(config) {
		super(config);
		this.spriteSheet = undefined;

		this.Velocity.y = 5;
		this.Size.x = 128;
		this.Size.y = 128;

		this.MaxY = 1000;
		this.name = 'Asteroid';
		this.Debug = false;
		this.Tag = 'none';

		// Defining function here for scope reasons.
		// This needs to be defined before we define the collider
		this.HandleCollision = (other) => {
			// TODO: Add an explosion to the scene where I used to be.
			// Check if we hit a different tag
			if (this.Tag != other.Tag) {
				if (other.Tag != 'none') {
					// We need to get the explosion assets
					let Data = this.Assets['/assets/explosion.json'];
					// Spawn an explosion because we hit something
					let ex = Explosion({ Data });
					// Testing if we can set the object position from my position
					ex.Position = this.Position;
					ex.Position.x -= 256;
					ex.Position.y -= 256;
					ex.Scale = { x: 2, y: 2 };
					// Try and find the AddEntity method
					let p = this.Parent;
					while (typeof (p.AddEntity) == 'undefined') {
						p = p.Parent;
						if (typeof (p) == 'undefined') {
							log.error(`Unable to find AddEntity in parent tree ${this.name}`);
						}
					}
					if (typeof (p) != 'undefined') {
						p.AddEntity(ex);
					}

					// Need to delete myself from the game
					if (typeof (this.Parent.RemoveEntity) != 'undefined') {
						this.Parent.RemoveEntity(this);
					} else if (typeof (this.Parent.RemoveChild) != 'undefined') {
						this.Parent.RemoveChild(this);
					}
					this.collider.Callback = undefined;
				}
			} else {
				// We hit a friendly object so we should change directions
			}
		};

		this.collider = new RadiusCollider({
			entity: this,
			radius: 50,
			Callback: this.HandleCollision
		});


		Object.assign(this, config);
	};

	Draw(ctx) {
		if (typeof (this.spriteSheet) != 'undefined') {
			let x = -32;
			let y = -32;
			let sx = 0;
			let sy = 0;
			let sw = this.Size.x;
			let sh = this.Size.y;

			// Blit the sprite to the sDrawingcreen!
			ctx.drawImage(this.spriteSheet, sx, sy, sw, sh, x, y, sw, sh);
			// Used for debugging collisions
			if (this.Debug) {
				let oldStyle = ctx.fillStyle;
				ctx.fillStyle = 'rgba(240, 0, 0, 0.3)';
				ctx.beginPath();
				ctx.arc(-x, -y, this.collider.radius, 0, Math.PI * 2);
				ctx.closePath();
				ctx.fill();
			}
		}

		return this;
	};

	Move(deltaTime) {
		this.Position.x += this.Velocity.x * deltaTime;
		this.Position.y += this.Velocity.y * deltaTime;

		if (this.Position.y > this.MaxY) {
			if (typeof (this.Parent.RemoveEntity) != 'undefined') {
				this.Parent.RemoveEntity(this);
			} else if (typeof (this.Parent.RemoveChild) != 'undefined') {
				this.Parent.RemoveChild(this);
			}
		}

		return this;
	};
}

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
		this.Tag = 'none';

		this.handleKeyDown = (e) => {
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
	};

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
		this.name = 'Laser';
		this.Tag = 'none';

		this.Scale.x = 0.2;

		this.color = `rgba(255,255,255,0.6)`;

		this.Speed = -10;

		this.HandleCollision = (other) => {
			// Check who we hit
			if (other.name != 'Fighter') {
				// We hit an enemey so kill the laser
				this.RemoveMe();
			}
		};

		this.collider = new RadiusCollider({
			entity: this,
			radius: 10,
			Callback: this.HandleCollision
		});

		Object.assign(this, config);
	};

	get Color() {
		return this.color;
	};

	set Color(value) {
		if (typeof (this._engine) != 'undefined') {
			let rgb = this.Engine.HexToRGB(value);
			this.color = `rgba(${rgb.toString()},${this.alpha})`;
		}
	};

	set Speed(value) {
		this._speed = value;
		this.Velocity.y = value;
	};

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
	};

	Move(deltaTime) {
		if (this.isAlive) {
			// Well lasers go in one direction!
			this.Position.y += this.Velocity.y * deltaTime;
			// Just in case we want to make it move left to right some day
			this.Position.x += this.Velocity.x * deltaTime;

			if (this.Position.y < 50) {
				this.RemoveMe();
				this.isAlive = false;
			}
		}
	};

	RemoveMe() {
		if (typeof (this.Parent.RemoveEntity) != 'undefined') {

			this.Parent.RemoveEntity(this);
		} else if (typeof (this.Parent.RemoveChild) != 'undefined') {
			this.Parent.RemoveChild(this);
		}
	};
};

/////////////////////////////////////////
// Particle Entities
////////////////////////////////////////
/*
 * So the particles seem to be working perfectly.  Now we need a way so that the particles never
 * get removed and can be our star effects.  So for this set of code we will create a new class
 * called StarField.  Here is a list of features we will need it to do:
 * - Create a bunch of stars with varying brightness and color.  Start with 100
 * - The stars need to slowly move down the field so the ship looks like it is moving forward.
 *		stars when they reach the bottom should be removed and new starts should be created to
 *		take their place.
 * Issue: When cranking the particles up to high on the star field it causes a major drop in
 *		frames.  Both the physics system and the draw system slow down.  Need to think of a faster
 *		algorithym to process more stars that won't degrade the frame rate
 */

function SimpleParticle() {
	let sp = this;
	sp.x = 0;
	sp.y = 0;
	sp.radius = 1;
	sp.speed = 0.3;
	sp.color = {
		r: 255,
		g: 255,
		b: 255,
		a: 1.0,
		toString: () => { return `rgba(${sp.color.r},${sp.color.g},${sp.color.b},${sp.color.a})`; }
	};
}

// It is best to set the star field to 0,0 when putting it on the scene stack
class StarField extends Entity {
	constructor(config) {
		super(config);
		// Changes to the number of particles has a major impact on the game engine
		this.maxParticles = 100;
		this.particleCount = 0;
		this.maxAge = 200;
		this.fadeAge = 10;
		this.name = "Star Field"
		this.Tag = 'none';
		this.fieldRect = { x: 10, y: -10, width: 1000, height: 900 };
		this.Velocity.y = 0.3;
		// Doing this so that we don't overwite settings while setting up the particles
		Object.assign(this, config);

		this.stars = [];
		let rect = this.fieldRect;
		for (let i = 0; i < this.maxParticles; ++i) {
			let star = new SimpleParticle();
			star.x = parseInt((Math.random() * (rect.width - rect.x)) + rect.x);
			star.y = parseInt((Math.random() * (rect.height - rect.y)) + rect.y);
			let alpha = (Math.random() * 2) - 1;
			star.color.a = alpha;
			star.speed = (Math.random() * 0.4) + 0.1;
			this.stars.push(star);
		}

	};

	Draw(ctx) {
		if (this.stars.length > 0) {
			let oldStyle = ctx.fillStyle;
			// Calculate what two times PI so we don't have to do it every time
			let PI2 = Math.PI * 2;
			for (let i = 0; i < this.stars.length; ++i) {
				let star = this.stars[i];
				ctx.beginPath();
				ctx.fillStyle = star.color.toString();
				ctx.arc(star.x, star.y, star.radius, 0, PI2);
				ctx.closePath();
				ctx.fill();
			}

			ctx.fillStyle = oldStyle;
		}

		return this;
	};

	Move(deltaTime) {
		// Need to move the stars now
		for (let i = 0; i < this.stars.length; ++i) {
			let s = this.stars[i];
			let ny = (s.y + (s.speed * deltaTime)) % this.fieldRect.height;
			s.y = ny;
			if (ny >= 0 && ny <= s.speed) {
				s.x = (Math.random() * (this.fieldRect.width - this.fieldRect.x)) + this.fieldRect.x;
				s.color.a = (Math.random() * 2) - 1;
				s.speed = (Math.random() * 0.4) + 0.1;
			}
		}
	};
}

class Particles extends Entity {
	constructor(config) {
		super(config);
		this.maxParticles = 50;
		this.particlesPerFrame = 20;
		this.particleCount = 0;
		this.maxAge = 200;
		this.fadeAge = 10;
		this.name = "Particles Manager"
		this.Tag = 'none';
		// Doing this so that we don't overwite settings while setting up the particles
		Object.assign(this, config);
	};

	Draw(ctx) {
		// Check if the current number of particles is greater than my max
		if (this.Count < this.maxParticles) {
			// How many particles am I suppose to release?  We can't exceed my max so make sure we have room.
			let release = Math.min(this.particlesPerFrame, this.maxParticles - this.Count);
			for (let i = 0; i < release; ++i) {
				// Create a new particle
				let p = new Particle({ maxAge: this.maxAge, fadeAge: this.fadeAge });
				this.AddChild(p);
				++this.particleCount;
			}
		}
		if (this.children.length == 0) {
			if (typeof (this.Parent.RemoveEntity) != 'undefined') {
				this.Parent.RemoveEntity(this);
			} else if (typeof (this.Parent.RemoveChild) != 'undefined') {
				this.Parent.RemoveChild(this);
			}
		}
	};

	Move(deltaTime) {
		this.Position.x += this.Velocity.x * deltaTime;
		this.Position.y += this.Velocity.y * deltaTime;
	};

	get Count() {
		return this.particleCount;
	};
}

class Particle extends Entity {
	constructor(config) {
		super(config);
		this.rgba = {r: 255, g: 250, b: 200, a:1.0}
		this.maxAge = parseInt(Math.random() * 30) + 10; // Max particle age
		this.age = 0;
		this.fadeAge = 10;
		this.speed = 5;
		this.radius = 1;

		Object.assign(this, config);
		// Set the special value for a particle that can never die
		this.infiniteLige = -1;
		// Hmm this needs to be a range from -100 to 100
		let speedXper = ((parseInt(Math.random() * 200) - 100) / 100);
		let speedYper = ((parseInt(Math.random() * 200) - 100) / 100);
		this.Velocity.x = this.speed * speedXper;
		this.Velocity.y = this.speed * speedYper;
	};

	Draw(ctx) {
		if (this.age++ < this.maxAge || this.maxAge == this.infiniteLige) {
			let oldStyle = ctx.fillStyle;
			// Check age of particle and see if we need to start fading
			if (this.age >= this.fadeAge) {
				let ageDiff = this.maxAge - this.fadeAge;// equal to 80
				let currDiff = this.maxAge - this.age; // When age = 81 this will equal 79
				this.rgba.a = parseInt(ageDiff / Math.max(1, currDiff));
			}
			let rgb = this.rgba;
			let clr = `rgba(${rgb.r},${rgb.g},${rgb.b},${rgb.a})`;

			ctx.fillStyle = clr;
			ctx.beginPath();
			// Draw a 1 pixel size rectangle or in my case a particle
			ctx.arc(0, 0, this.radius, 0, 2 * Math.PI);
			//ctx.rect(0, 0, 3, 3);
			ctx.closePath();
			ctx.fill();

			ctx.fillStyle = oldStyle;
		}
		if (this.IsDead) {
			if (typeof (this.Parent.RemoveEntity) != 'undefined') {
				this.Parent.RemoveEntity(this);
			} else if (typeof (this.Parent.RemoveChild) != 'undefined') {
				this.Parent.RemoveChild(this);
			}
		}
	};

	Move(deltaTime) {
		if (this.age <= this.maxAge) {
			this.Position.x += this.Velocity.x * deltaTime;
			this.Position.y += this.Velocity.y * deltaTime;

			this.Velocity.y += 0.2;
		}
	};

	get IsDead() {
		return this.age >= this.maxAge && this.maxAge != this.infiniteLige;
	};
}

/**
* Create a basic explosion based from the engine sprite system
**/

function Explosion(config) {
	// Create a new sprite and return it to caller
	let ex = new Sprite(config);
	// Keep the Draw method for sprite around so it can still be used to draw sprite
	ex.OriginalDraw = ex.Draw;
	ex.Draw = (ctx) => {
		ex.OriginalDraw(ctx);
		// Check when current frame is past the sprite animation
		if (ex.currentFrame++ > ex.Data.frames.length) {
			// Sprite is done so time to remove it from the game
			if (typeof (ex.Parent.RemoveEntity) != 'undefined') {
				ex.Parent.RemoveEntity(ex);
			} else if (typeof (ex.Parent.RemoveChild) != 'undefined') {
				ex.Parent.RemoveChild(ex);
			}
		}
	};

	return ex;
}
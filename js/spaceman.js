// Welcome to space man the new space fighter game.  Play at your own risk!

/* Okay all joking aside we need to do some documentation about how this game is played.  The first step is to make some game
* design decisions.

* What is the Ganre? Topdown scroller
* What is the premis?  You have just joined the Galaxysquad who sole purpose in life is to defent the universe from people
*		like me who just want to send asteroids and aliens to kill everything in sight.
* Now that we know were going to be a space jocky what are we going to do to me a hero?
* Shoot anything that isn't friendly!  Yikes with what?
* Well we are going to give you a SLF-119 fighter which is equiped with a very powerful lazer gun.
* Yeah anything esle?  I mean come on guys there isn't enough lazer power in the universe that can save us from the
* onslaught of enemies your going to throw at me!
* Since you are such a big baby how about we add some VERY powerful missle to your arsinel?  Will that help you go forth
* and desroy everything in your sights?
* Err yes I guess so....

* So now our journey begins.  We need to find a ship for the player that can shoot lazer guns and missles that blow sh*t up!
* Oh wait a second how am I suppose to control this ship and target enemies?
* So we will need a way for the player to control their awesome ship.  How about for now we make it easy and give them
* some basic controls:
*			[A] - Move the ship left
*			[D] - Move the ship right
*			[S] - Move the ship down / slow it down so we will need some reverse thrusters :D
*			[W] - Move the ship forward / yeahaw booster time!
*			[Space] - Fire laser guns!  Blow some sh*t up
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
		clearClr: '#000000'
	});
	engine.Init();

	let ship = new Fighter();
	ship.Setup(engine.size);
	ship.Controller = new KeyboardController();
	engine.AddEntity(ship);

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
	};

	Draw(ctx) {
		// Why is the draw routine being called twice?
		let oldStyle = ctx.fillStyle;
		let x = -(this.Size.width / 2)
		let y = -(this.Size.height / 2);
		// TODO: move the RGBA color to a defined sprite color
		ctx.fillStyle = 'rgba(255,255,255,255)';
		ctx.rect(x, y, this.Size.width, this.Size.height);
		ctx.fill();

		// Show some basic sprite debug code
		if (this.Debug) {
			let oldFont = ctx.font;
			let msg = this.Position.toString();
			let width = ctx.measureText(msg).width;
			ctx.font = "8pt Georgia";
			ctx.fillText(msg, x - (width / 4), -(y - 12));
			ctx.font = oldFont;
		}

		ctx.fillStyle = oldStyle;
		return this;
	};

	Move(deltaTime) {
		let vx = 0;
		let vy = 0;
		//Move can be so much fun!
		if (typeof (this.Controller) != 'undefined') {
			let ctrl = this.Controller;
			if (ctrl.KeyDown('up')) {
				vx = this.Velocity.x;
			}else if(ctrl.KeyDown('down'))
			{
				vx = -this.Velocity.x;
			}

			if (ctrl.KeyDown('right')) {
				vy = this.Velocity.y;
			} else if (ctrl.KeyDown('left')) {
				vy = -this.Velocity.y;
			}
		}

		// We should now be able to move
		this.Position.x += vx;
		this.Position.y += vy;
	};

	Setup(world) {
		this.Position.x = 50;
		this.Position.y = 300;
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
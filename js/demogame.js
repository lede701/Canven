/**
	Issues that need to be debug:
	1. When the ball hits the wall every once in a while it sticks to the wall
		Fixed: The reason this happened was because the ball would be in a position where
		the x flipping would occure every frame so it seemed not to move.
	2. When balls are being removed from the scene multiple balls will be removed at the same time
		Issue: When one ball goes through the remove process it seems to also be connected to all the other
		balls in the game.  Working on a fix for this one.
		Fixed: There was an error in the engine array splice method where it was just wacking off all objects after the one
		set to be deleted.  Add 1 to the splice method so that only one array element is removed.
	3. When the ball hits the ground some times the y velocity is removed even though there should still be bouncing
		Fixed: This was the same issue that happened with the x bounderies.  Now when velocity is flipped the y position
		is set to the ground plane.
	4. Now the balls don't stop bouncing.
		Fixed: The frame count was not high enough to accoung for the low bounce frame count.
	5. When a ball is suppose to be removed it still is being processed.
		Fixed: The remove process needed to be cleaned up to only remove items when the engine calls them so that
		potentially we don't remove an item that is in the process of being drawn.
*/

// Connect the game to the load event
if (window.addEventListener) {
	window.addEventListener('load', demoGame, false);
} else {
	window.attachEvent('onload', demoGame);
}


// First thing I need to do is create an event for the site when it is complete
// There are multiple ways to do this but for today I'm going to be lazy and use jQuery
function demoGame () {
	// Before we initialize the engine we need to create a config object
	let cfg = {
		clearClr: '#202020',
		canvasId: 'theCanvas'
	};
	// Now when the page is done loading it is time to initialize the game engine
	let engine = new Canven(cfg);

	let score = 0;

	class LineEntity extends Entity{
		constructor(config) {
			super(config);
			this.name = "Line";
			this.color = '#c0c0c0';
		}
		Draw(ctx){
			// Draw a line down the middle of the field
			let oldStyle = ctx.strokeStyle;
			let x = (engine.size.x / 2)-5;

			ctx.beginPath();
			let rgb = engine.HexToRGB(this.color);
			ctx.strokeStyle = `rgba(${rgb.toString()},0.5`;
			ctx.lineWidth = 1;

			ctx.moveTo(x, 0);
			ctx.lineTo(x, engine.size.y);
			ctx.stroke();

			ctx.strokeStyle = oldStyle;
		}
	}

	class Score extends Entity {
		constructor(config) {
			super(config);

			this.Position.x = engine.size.x - 200;
			this.Position.y = 25;
		};

		Draw(ctx) {
			let msg = `Score: ${score}`;
			let oldFont = ctx.font;
			let oldStyle = ctx.fillStyle;

			ctx.font = "14pt Georgia";
			ctx.fillStyle = this.color;
			ctx.fillText(msg, 0, 0);

			ctx.font = oldFont;
			ctx.fillStyle = oldStyle;
		};
	}

	// Need a new entity object we can use to add into the game engine
	class GravBall extends Entity {
		constructor(config){
			super(config);
			this.name = "Gravity Ball";
			this.alpha = 1.0;
			this.ballFriction = 0.007;
			this.ballSize = 10;
			this.color = '#ffffff';
			this.frameCnt = 0;
			this.gravity = 0.2;
			this.isMoving = true;
			this.speed = -15;
		};

		Calculate(){
			// Setup the needed values for the rise over run formula
			let delta = new Vector2D(0, 0);
			// Need the differences of each value in the vector/point
			delta.x = this.Position.x - this.Target.x;
			delta.y = this.Position.y - this.Target.y;
			let numerator = Math.abs(delta.x) + Math.abs(delta.y);

			// Set initial velocity for the ball
			this.Velocity.x = (delta.x / numerator) * this.speed;
			this.Velocity.y = (delta.y / numerator) * this.speed;
		};

		Draw(ctx){
			// ctx is provided by the game engine when the draw
			// routine is called.

			// Save the ctx fill style before we wack it out
			let oldStyle = ctx.fillStyle;
			let b = this; // Add this so the arc command is on one line

			// Convert ball color into RGB
			let rgb = engine.HexToRGB(b.color);

			let ballSize = b.ballSize;// * this.Scale.x;

			ctx.fillStyle = `rgba(${rgb.toString()},${b.alpha}`;
			ctx.beginPath();
			// The core engine handles placing the object in the right location so just start the drawing at 0,0
			ctx.arc(0, 0, ballSize, 0, 2 * Math.PI);
			ctx.fill();

			// Return the style back to original value before I wakced it
			ctx.fillStyle = oldStyle;
		};

		Move(deltaTime){
			// I don't like these but I'm to lazy to refactor right now
			if (!this.isMoving) return;

			let ground = engine.size.y - 60;
			// Just change the position based on the entoty velocity
			this.Position.x += this.Velocity.x * deltaTime;
			this.Position.y += this.Velocity.y * deltaTime;
			// Adjust the velocity by my FAKE gravity
			//*
			this.Velocity.y += this.gravity;

			// Need to add in a ground layer collision detection
			if (this.Position.y > ground) {
				if (this.frameCnt > 18) {
					this.Velocity.y *= -0.8 // Just an estimate for now
				} else {
					// Fix the gitter after physics has depleted the y energy
					this.Velocity.y = 0
				}
				this.Position.y = ground;
				this.frameCnt = 0;
			}

			// Ball went bye bye :(
			if (this.Position.x > engine.size.x - 10 || this.Position.x < 10) {
				// Need to flip x velocity
				this.Velocity.x *= -0.7;
				if (this.Position.x > engine.size.x - 10) {
					this.Position.x = engine.size.x - 10;
				} else {
					this.Position.x = 10;
				}
			}

			// Slow down ball when on the ground
			if (this.Position.y == ground && this.Velocity.x != 0) {
				// So we need to always subtract the friction from velocity
				this.Velocity.x -= this.ballFriction
					* (this.Velocity.x / Math.abs(this.Velocity.x));
				// Clean up the velocity and make it stop moving
				if (Math.abs(this.Velocity.x) < 0.01) {
					this.Velocity.x = 0;
				}
			}
			// Adding a kill ball and remove from simulation process
			if (this.Velocity.x == 0 && this.Velocity.y == 0) {
				this.isMoving = false;
				setTimeout(this.RemoveBall, 1000, this);
			}

			// Get distasnce ball is from ground to add that 2.5D effect to the balls
			let ballDist = ground - this.Position.y;
			// Calculate the ballScale and limit its range from 1.0 to 0.6
			let ballScale = 0.6 + (0.4 * (1.0 - (ballDist / ground)));

			// Getting closer now I just need to limit to be between 1.0 and 0.5
			this.Scale.x = ballScale;
			this.Scale.y = ballScale;

			// Need to figure out how far from the floor the ball is

			++this.frameCnt;
			//*/
		};

		RemoveBall(ball){
			// Not perfect but it is getting there
			// It would be nice to fade ball out instead of doing a harsh rip out of game engine
			let steps = 1 / 60; // 1.0 divided by 60 frames
			this.alpha -= steps;
			if (this.alpha > 0) {
				setTimeout(this.RemoveBall, 1000 / 60, ball);
			} else {
				// This method doesn't exists so time to make it
				engine.RemoveEntity(ball);
			}
		};
	};

	class BallCollider extends Collider {
		constructor(config) {
			super(config);
			this.radius = 0;
			this.colliderActive = true;
			this.Callback = function (ent) {
				// Ah much better to now just have one item add the score
				score += 15;
				// Time to be evil and delete the other entity I hit
				// There may be a dead lock in the delete entity code
				//engine.RemoveEntity(ent);
			};
		};

		HandleCollision(you) {
			// Need to figure out what to do when another ball hits me
			let dirChange = -1;
			let youPos = you.Position;
			let mePos = this.entity.Position;
			let vel = this.entity.Velocity;

			let velSum = Math.abs(vel.x) + Math.abs(vel.y);

			let delta = new Vector2D(youPos.x - mePos.x, youPos.y - mePos.y);
			let numerator = Math.abs(delta.x) + Math.abs(delta.y);

			vel.x = dirChange * ((delta.x / numerator) * velSum);
			vel.y = dirChange * ((delta.y / numerator) * velSum);
		};

		CheckHit(you) {
			let ent = this.entity;
			// Setup the math variable we need
			let youPos = you.Position;
			let mePos = ent.Position;
			// Adjusting the radius to allow for ball scale
			let youRaidus = you.ballSize * you.Scale.x;
			let meRadius = ent.ballSize * ent.Scale.x;

			// Calculate the square of the two lines
			let sqDiff = (Math.abs(mePos.x - youPos.x) * Math.abs(mePos.x - youPos.x)) +
				(Math.abs(mePos.y - youPos.y) * Math.abs(mePos.y - youPos.y));
			// Calculate the square of the radius
			let sqRadius = (youRaidus + meRadius) * (Math.abs(mePos.y - youPos.y));

			return sqDiff < sqRadius;
		};
	}

	class Ground extends Entity {
		constructor(config) {
			super(config);
			this.name = "Ground";
			this.color = '#814607';
		};

		Draw(ctx) {
			let pos = this.Position;
			let oldStyle = ctx.fillStyle;

			ctx.fillStyle = this.color;
			ctx.fillRect(0, engine.size.y - 50, engine.size.x, engine.size.y);

			ctx.fillStyle = oldStyle;
		};
	}

	// Now I want to add a gun to the scene :)
	class TheBigGun extends Entity{
		constructor(config) {
			super(config);
			this.name = "The BIG Gun!";
			this.color = "#ff0000";
		};

		Draw(ctx){
			let oldStyle = ctx.fillStyle;
			ctx.fillStyle = this.color;
			// Position is the center point so calculate the rect
			let rect = { x: 0, y: 0, h: 50, w: 10 };

			ctx.fillRect(-5, 0, rect.w, rect.h);

			ctx.fillStyle = oldStyle;
			return this;
		};

		Move(deltaTime) {
			return this;
		};
	}

	// Run the initialization part of the engine
	engine.Init();

	// Don't do this because it is really EVIL!!!!
	function CrazyFire()
	{
		// Get the event object
		let x = (Math.random() * (engine.size.x - 20)) + 10;
		let clickPos = new Vector2D(x , 10 );
		// Add this so we can debug the start position
		let startPos = new Vector2D((engine.size.x / 2) - 5, engine.size.y - 100);
		// Need to create a new ball each time
		let newball = new GravBall({
			Position: startPos,
			Target: clickPos,
		});
		newball.collider = new BallCollider({ entity: newball });
		// Need to calculate the velocity as it is shot to the click position
		newball.Calculate();
		// Need to add the ball to the simulator or noting will happen duh!?!?
		engine.AddEntity(newball);

		x = 10;
		let y = (Math.random() * (engine.size.y - 70)) + 10;
		clickPos = new Vector2D(x, y);
		startPos = new Vector2D(engine.size.x - 10, engine.size.y / 2);
		newball = new GravBall({
			Position: startPos,
			Target: clickPos
		});
		newball.collider = new BallCollider({ entity: newball });
		newball.Calculate();
		engine.AddEntity(newball);

		x = engine.size.x - 10;
		y = (Math.random() * (engine.size.y - 70)) + 10;
		clickPos = new Vector2D(x, y);
		startPos = new Vector2D(10, engine.size.y / 2);
		newball = new GravBall({
			Position: startPos,
			Target: clickPos
		});
		newball.collider = new BallCollider({ entity: newball });
		newball.Calculate();
		engine.AddEntity(newball);

		// Fire 12 balls per second!
		setTimeout(CrazyFire, 1000/12);
	}

	engine.Events.AddEventHandler('splashend', CrazyFire);


	// Time to test the new event system.  How much will this code blow up my browser/compputer
	engine.Events.Click((e) => {
		// Get the event object
		e = e || windows.event;
		let clickPos = new Vector2D(
			e.pageX - engine.canvas.offsetLeft,
			e.pageY - engine.canvas.offsetTop);
		// Add this so we can debug the start position
		let startPos = new Vector2D((engine.size.x / 2) - 5, engine.size.y - 100);
		// Need to create a new ball each time
		let newball = new GravBall({
			Position: startPos,
			Target: clickPos,
		});
		newball.collider = new BallCollider({ entity: newball });
		// Need to calculate the velocity as it is shot to the click position
		newball.Calculate();
		// Need to add the ball to the simulator or noting will happen duh!?!?
		engine.AddEntity(newball);
	});

	engine.Events.KeyUp((e) => {
		e = e || windows.event;
		if (e.which == 81) {
			engine.Close();
		}
	});

	let line = new LineEntity({ color: '#ffffff' });
	let scoreLine = new Score({color: '#ffffff' });
	let ground = new Ground({});
	let theBigOne = new TheBigGun({ Position: new Vector2D((engine.size.x / 2) - 5, engine.size.y - 80) });
	engine.AddEntity(line);
	engine.AddEntity(scoreLine);
	engine.AddEntity(theBigOne);
	engine.AddEntity(ground);

	// Run the simulation
	engine.Run();
};

// Sorry right now I am unable to get the chat section to work.  I'm not trying to ignore you just message are no longer being sent to me via the chat window.  If you would like to ask questions feel free to send anything to info@zaxis-studios.com
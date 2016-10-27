class Entity {
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
		//if (this.children.length > 0) {
		//	for (let i = 0; i < this.children.length; ++i) {
		//		this.children[i].EngineDraw(ctx);
		//	}
		//}

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

	get Size() {
		return this._size;
	};

	set Size(value) {
		// Validate value object properties
		if (typeof (value.height) != 'undefined') this._size.height = value.height;
		if (typeof (value.width) != 'undefined') this._size.width = value.width;
	}

}// End Entity Definition
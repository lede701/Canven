window.onload = function () {
	let eng = new Canven({
		canvasId: "theCanvas"
	})

	class Ball extends Entity {
		constructor(config) {
			super(config);
			this.name = "Ball Entity";
			this.color = '#303030';
		}

		Draw(ctx) {
			let oldStyle = ctx.fillStyle;

			ctx.fillStyle = this.color;
			ctx.beginPath();
			ctx.arc(this.Position.x, this.Position.y, 10, 0, 2 * Math.PI);
			ctx.fill();

			ctx.fillStyle = oldStyle;
		}
	}

	let obj = new Ball({ Position: new Vector2D(400, 200) });

	eng.Init();
	eng.AddEntity(obj);
	console.log(eng.size);
	eng.Run();
}
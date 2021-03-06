// An object constructor used to define a enemy entity within the
// impactJS library. This specific enemy was designed to use the
// short range machine gun weapon.

ig.module('game.entities.enemy_short_A')
.requires('impact.entity', 'game.entities.pathing_entities', 'game.entities.enemy_entities', 'game.aStar', 'game.warplib', 'game.entities.enemy_destroyed_A', 'impact.sound')
.defines(function()
{
    ShortAttack = Enemies.extend(
    {
		name: "ENEMY",
		size: null,
		offset: null,
		type: ig.Entity.TYPE.A,
		checkAgainst: ig.Entity.TYPE.A,
		collisionDmg: null,
		radius: null,
		pathRadius: 20,
		moveRadius: 0,
		circleRange: 250, //distance in pixels that the ship will try to stay from the player
		laserSFX: new ig.Sound('media/sounds/smallLaser.*'),
		explosionSFX: new ig.Sound('media/sounds/explosion.*'),
		zIndex: 1000,
		value: null,
		
		protect: {},
		
		weapons: null,
		
        animSheet: null,
		
		//A constructor to create an instance of this type of enemy
        init: function (x, y, settings) {
            		if(settings.tier === 1){
				this.initTier1(settings);
			} else 
			if(settings.tier === 2){
				this.initTier2(settings);
			} else
			if(settings.tier === 3){
				this.initTier3(settings);
			}
            		this.addAnim ('blob', 0.1, [0]);
			this.currentAnim = this.anims.blob
			this.game = settings.game;

            		this.parent (x, y, settings);
            		this.findDestination();
		},

		//This and the next two functions are used to determine whether the enemy is a 
		//small medium or large ship. The stats and visuals are set accordingly.
		initTier1: function (settings) {
			this.animSheet = new ig.AnimationSheet ('media/tier1short.png', 34, 34);
			this.weapons = [{damage: 20, range: 250, reload: 0.2, charge: 0, delay: 0.0001, fire: 1.0, target:{x: 0, y: 0}}];
			this.armor = 70 + 10 * settings.level;
			this.shieldStrength = 0.5 + 0.05 * settings.level;
			this.weapons[0].damage = 50 + 6 * settings.level;
			this.maxVel.x = 140;
			this.maxVel.y = 140;
			this.size = {x: 34, y: 34};
			this.offset = {x: 0, y: 0};
			this.radius = 16;
			this.collisionDmg = 200;
			this.value = 20 + (settings.level*3);
		},

		initTier2: function (settings) {
			this.animSheet = new ig.AnimationSheet ('media/tier2short.png', 40, 40);
			this.weapons = [{damage: 20, range: 250, reload: 0.2, charge: 0, delay: 0.0001, fire: 1.0, target:{x: 0, y: 0}}];
			this.armor = 100 + 13 * settings.level;
			this.shieldStrength = 1.0 + 0.1 * settings.level;
			this.weapons[0].damage = 70 + 8 * settings.level;
			this.maxVel.x = 120;
			this.maxVel.y = 120;
			this.size = {x: 40, y: 40};
			this.offset = {x: 0, y: 0};
			this.radius = 20;
			this.collisionDmg = 300;
			this.value = 40 + (settings.level*4);
		},

		initTier3: function (settings) {
			this.animSheet = new ig.AnimationSheet ('media/tier3short.png', 46, 50);
			this.weapons = [{damage: 20, range: 250, reload: 0.2, charge: 0, delay: 0.0001, fire: 1.0, target:{x: 0, y: 0}}];
			this.armor = 200 + 15 * settings.level;
			this.shieldStrength = 2.0 + 0.2 * settings.level;
			this.weapons[0].damage = 130 + 13 * settings.level;
			this.maxVel.x = 110;
			this.maxVel.y = 110;
			this.size = {x: 44, y: 44};
			this.offset = {x: 1, y: 3};
			this.radius = 25;
			this.collisionDmg = 500;
			this.value = 60 + (settings.level*5);
		},
        
		//Enemies will always rotate to be aiming at the player.
		rotate: function () {
			var xDiff = -this.game.player.pos.x - this.game.player.size.x + this.pos.x + this.size.x;
			var yDiff = -this.game.player.pos.y - this.game.player.size.y + this.pos.y + this.size.y;
			var angle = Math.atan(yDiff / xDiff);
			if (xDiff < 0) {
				angle += Math.PI;
			}
			
			this.currentAnim.angle = angle;
		},
        
		//This function regularly calls all the ships behavior functions.
        update: function () {
			if (!this.protect || this.protect.pos === undefined || this.protect === this.game.player || this.protect.isDead) {
				this.findProtect();
				this.findDestination();
			}
			this.newpath = this.move();
            if (this.newpath) {
                this.findDestination();
			}
			this.fire();
			this.rotate();
			this.parent();
		},
		
		//This function establishes the enemies attack behavior
		fire: function () {
			var targetx = this.game.player.pos.x + this.game.player.size.x / 2;
			var targety = this.game.player.pos.y + this.game.player.size.y / 2;
			//This code makes it so that ships will target the players fighter drones if they are nearby.
			if (!inRange(this.pos.x, targetx, this.pos.y, targety, this.weapons[0].range) && this.weapons[0].charge <= 0) {
				var enemies = this.game.getEntitiesByType ('Fighter');
				for (var i = 0; i < enemies.length; i++) {
					var ent = enemies[i];
					if (inRange(this.pos.x, ent.pos.x, this.pos.y, ent.pos.y, this.weapons[0].range)) {
						var dis = getRange (this.pos.x, ent.pos.x, this.pos.y, ent.pos.y);
						targetx = ent.pos.x + (ent.vel.x * dis / 600);
						targety = ent.pos.y + (ent.vel.y * dis / 600);
						break;
					}
				}
			}
			
			//This ship will always shoot at the player when in range.
			if (inRange(this.pos.x, targetx, this.pos.y, targety, this.weapons[0].range) && this.weapons[0].charge <= 0) {
				this.weapons[0].fire = this.weapons[0].delay;
				this.weapons[0].target.x = targetx + Math.random() * 4 - 2;
				this.weapons[0].target.y = targety + Math.random() * 4 - 2;
				this.weapons[0].charge = this.weapons[0].reload;
			}
			//These three if statements control the fire rate of the short machine gun.
			if (this.weapons[0].charge > 0) {
				this.weapons[0].charge -= 1 / FPS;
			}
			if (this.weapons[0].fire <= this.weapons[0].delay) {
				this.weapons[0].fire -= 1 / FPS;
			}
			if (this.weapons[0].fire <= 0) {
				this.weapons[0].fire = this.weapons[0].delay * 2;
				var settings = {parentShip: this, damage: this.weapons[0].damage, 
								target: this.weapons[0].target, game: this.game, color: "red", smallLaserSFX: this.laserSFX};
				ig.game.spawnEntity (SmallLaser, this.pos.x + (this.size.x/2), this.pos.y + (this.size.y/2), settings);
			}
			
		},
		
		//This makes the ShortAttack enemy attempt to find a nearby
		//MissileAttack ship to protect. If found that ship gets set
		//as this ships protect target.
		findProtect: function () {
			var target = {};
			var closest = 10000;
			var enemies = this.game.getEntitiesByType ('MissileAttack');
			for (var i = 0; i < enemies.length; i++) {
				var ent = enemies[i];
				if (ent === this) {
					continue;
				}
				var range = getRange (this.pos.x, ent.pos.x, this.pos.y, ent.pos.y);
				if (range < closest) {
					target = ent;
					closest = range;
				}
			}
			this.protect = target;
		},
		
		//This calculates a random nearby location for this ship to
		//path to. If the destination calculated would cause a collision
		//a new one is calculated until a good destination is found.
		chooseLocation: function (ent) {
			var goodEnd = false;
			while(!goodEnd){
				this.destY = ent.pos.y + Math.random() * this.circleRange * 2 - this.circleRange;
				this.destX = ent.pos.x + Math.random() * this.circleRange * 2 - this.circleRange;
				if (!collisionCheck(this.destX, this.destY, this, this.game.entities)) {
					goodEnd = true;
					this.newpath = false;
				}
			}
		},

		//This chooses how to choose a location based on whether or not
		//this ship is currently protecting another.
        findDestination: function () {
			if (this.protect === {} || this.protect.pos === undefined) {
				this.protect = {};
			}

			if (this.protect !== {} && this.protect.pos !== undefined) {
				this.chooseLocation(this.protect);
				this.redefinePath();
				return;
			}
		
			this.chooseLocation(this.game.player);
			this.redefinePath();
		}
    });
});


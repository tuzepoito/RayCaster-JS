// JavaScript Ray Caster: algorithm
// author: Cédric "tuzepoito" Chartron

// function for modulo with negative numbers

function realmod(x,y) {
  return x < 0 ? y + (x % y) : x % y;
}

// function for pixel manipulation

Pixels = function (imageData, width, height) {
  this.data = imageData.data;
  this.width = width;
  this.height = height;
  this.offsets = []
  for (var y = 0; y < height; y++) {
    this.offsets[y] = y * width * 4;
  }
}

Pixels.prototype.getPixel = function (x,y) {
  var offset = this.offsets[y] + 4*x;
  return this.data[offset] +
    (this.data[offset+1] << 8) +
    (this.data[offset+2] << 16) +
    (this.data[offset+3] << 24);
}

Pixels.prototype.getRGB = function (x,y) {
  var offset = this.offsets[y] + 4*x;
  return {
    r: this.data[offset],
    g: this.data[offset+1],
    b: this.data[offset+2]
  };
}

Pixels.prototype.setRGB = function (x,y,color) {
  var offset = this.offsets[y] + 4*x;
  this.data[offset] = Math.round(color.r);
  this.data[offset+1] = Math.round(color.g);
  this.data[offset+2] = Math.round(color.b);
  this.data[offset+3] = 255;
}

Pixels.prototype.copyPixel = function (src, srcX, srcY, dstX, dstY) {
  this.setPixel(dstX, dstY, src.getPixel(srcX, srcY));
}

// Ray Caster

var gridSize = 64;
var fov = 90;

var mapSize = 4;

var wallsH = [
  [1,1,1,1],
  [1,0,0,0],
  [0,1,1,0],
  [0,1,1,1],
  [1,1,1,1]
];

var wallsV = [
  [1,1,1,1],
  [0,1,0,0],
  [0,0,0,0],
  [1,0,0,0],
  [1,1,1,1]
];

RayCaster = {
  init: function(canvas, start) {
    this.img = new Image();
    this.img.src = 'img/wall.png';
    this.offCanvas = document.createElement('canvas');

    this.currentAngle = 0;
    this.x = 32;
    this.y = 32;

    this.sinTable = [];
    this.cosTable = [];
    this.deltaAngles = [];

    var fovtan = Math.tan(Math.PI * fov / 360); // tan(fov / 2)

    // try with tables
    for (var x = 0; x < 360; x++) {
      this.sinTable[x] = Math.sin(Math.PI * x / 180);
      this.cosTable[x] = Math.cos(Math.PI * x / 180);
    }

    // calculate angles for each column
    for (var x=0; x<canvas.width; x++) {
      var deltaAngle = Math.atan(fovtan * (1 - 2 * x / canvas.width));
      this.deltaAngles[x] = realmod(Math.round(180 * deltaAngle / Math.PI), 360);
    }

    // console.debug(this.deltaAngles);

    var self = this;

    this.img.onload = function() {
      self.offCanvas.width = self.img.width;
      self.offCanvas.height = self.img.height;
      self.offCanvas.getContext('2d').drawImage(self.img, 0, 0);
      var offData = self.offCanvas.getContext('2d').getImageData(0, 0, self.img.width, self.img.height);
      self.offPixels = new Pixels(offData, self.offCanvas.width, self.offCanvas.height);

      start();
    };
  },

  update: function(pixels) {

    var pointH = {
      x: 0,
      y: 0
    };
    var pointV = {
      x: 0,
      y: 0
    };

    // current cell in map
    var currentCellX = Math.floor(this.x / gridSize);
    var currentCellY = Math.floor(this.y / gridSize);

    for (var x=0; x<pixels.width; x++) {
      var angle = realmod(this.currentAngle + this.deltaAngles[x], 360);

      var textureX = 0; // X texture coordinate
      var deltaDistance = 0;
      var deltaCell = 0;

      // check vertical wall
      var cellX = 0;

      if (this.cosTable[angle] > 0) { // to the right
        // start at previous wall
        pointV.x = currentCellX * gridSize;
        cellX = currentCellX+1;
        deltaCell = 1;
      } else { // to the left
        // start at next wall
        pointV.x = (currentCellX+1) * gridSize;
        cellX = currentCellX;
        deltaCell = -1;
      }
      deltaDistance = gridSize / this.cosTable[angle];
      pointV.y = this.y + (pointV.x - this.x) * this.sinTable[angle] / this.cosTable[angle];
      var distanceV = (pointV.x - this.x) / this.cosTable[angle]; // initial distance

      // step every gridSize
      var deltaX = deltaCell * gridSize;
      var deltaY = deltaCell * gridSize * this.sinTable[angle] / this.cosTable[angle];

      pointV.x += deltaX;
      pointV.y += deltaY;
      distanceV += deltaCell * deltaDistance;

      var cellY = Math.floor(pointV.y / gridSize);
      var wallV = 0;

      while (cellX >= 0 && cellY >= 0 && cellX <= mapSize && cellY < mapSize) {
        wallV = wallsV[cellX][cellY];
        if (wallV > 0) {
            break;
        }

        pointV.x += deltaX;
        pointV.y += deltaY;
        distanceV += deltaCell * deltaDistance;
        cellX += deltaCell;
        cellY = Math.floor(pointV.y / gridSize);
      }

      // check horizontal wall
      if (this.sinTable[angle] > 0) { // up
        // start at bottom wall
        pointH.y = currentCellY * gridSize;
        cellY = currentCellY+1;
        deltaCell = 1;
      } else { // down
        // start at upwards wall
        pointH.y = (currentCellY+1) * gridSize;
        cellY = currentCellY;
        deltaCell = -1;
      }
      deltaDistance = gridSize / this.sinTable[angle];
      pointH.x = this.x + (pointH.y - this.y) * this.cosTable[angle] / this.sinTable[angle];
      var distanceH = (pointH.y - this.y) / this.sinTable[angle]; // initial distance

      // step every gridSize
      deltaX = deltaCell * gridSize * this.cosTable[angle] / this.sinTable[angle];
      deltaY = deltaCell * gridSize;

      pointH.x += deltaX;
      pointH.y += deltaY;
      distanceH += deltaCell * deltaDistance;

      cellX = Math.floor(pointH.x / gridSize);
      var wallH = 0;

      while (cellX >= 0 && cellY >= 0 && cellX < mapSize && cellY <= mapSize) {
        wallH = wallsH[cellY][cellX];
        if (wallH > 0) {
            break;
        }

        pointH.x += deltaX;
        pointH.y += deltaY;
        distanceH += deltaCell * deltaDistance;
        cellX = Math.floor(pointH.x / gridSize);
        cellY += deltaCell;
      }

      var distance = -1;
      if (distanceH < distanceV && wallH > 0) {
        distance = distanceH;
        textureX = realmod(pointH.x, gridSize);
      } else if (wallV > 0) {
        distance = distanceV;
        textureX = realmod(pointV.y, gridSize);
      }

      var displayDistance = (pixels.height / 2) * (gridSize / 2) / (this.cosTable[this.deltaAngles[x]] * distance);
      var realTextureX = Math.floor(this.offPixels.width * textureX / gridSize);
      var fade = Math.max(1 - distance / (mapSize * gridSize), 0.1);

      if (distance > 0) {
        for (var y=0; y<pixels.height; y++) {
          if (Math.abs(pixels.height / 2 - y) <= displayDistance) {
            var realTextureY = (this.offPixels.height-1) * (y - (pixels.height - 2 * displayDistance) / 2) / (2*displayDistance);
            var textureColorFloor = this.offPixels.getRGB(realTextureX, Math.floor(realTextureY));
            // var textureColorCeil = this.offPixels.getRGB(realTextureX, Math.ceil(realTextureY));
            // var blend = realmod(realTextureY, 1);

            // var textureColor = {
            //   r: fade * (textureColorCeil.r * blend + textureColorFloor.r * (1-blend)),
            //   g: fade * (textureColorCeil.g * blend + textureColorFloor.g * (1-blend)),
            //   b: fade * (textureColorCeil.b * blend + textureColorFloor.b * (1-blend))
            // };
            var textureColor = {
              r: fade * textureColorFloor.r,
              g: fade * textureColorFloor.g,
              b: fade * textureColorFloor.b
            };
            pixels.setRGB(x, y, textureColor);
          }
        }
      }

    }
  }
};

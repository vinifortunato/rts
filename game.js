let canvas = null;
let lastTime = Date.now();
let fps = 0;
let gameObjects = [];
let selectedGameObject = null;

class GameObject {
  constructor({ x = 0, y = 0, width = 20, height = 20 }) {
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.selected = false;
  }

  update(deltaTime) {

  }

  render(context) {

  }

  isClicked(x, y) {
    return x >= this.x && x <= this.x + this.width &&
           y >= this.y && y <= this.y + this.height;
  }
}

class Tree extends GameObject {
  constructor(props) {
    super(props);
    this.amount = 100;
  }

  render(context) {
    context.fillStyle = '#0f0';
    context.fillRect(this.x, this.y, this.width, this.height);

    context.fillStyle = '#fff';
    context.font = '12px Arial';
    context.fillText(this.amount, this.x, this.y - 5);
  }
}

class Base extends GameObject {
  constructor(props) {
    super(props);
    this.inventory = [];
  }

  render(context) {
    context.fillStyle = this.selected ? 'yellow' : 'blue';
    context.fillRect(this.x, this.y, this.width, this.height);
  }
}

class Worker extends GameObject {
  constructor(props) {
    super(props);
    this.moveSpeed = 100;
    this.target = null;
    this.state = 'idle';
    this.timeout = null;
    this.harvestingTime = 1000;
    this.inventory = [];
    this.invetoryWeight = 0;
    this.inventoryCapacity = 100;
  }

  update(deltaTime) {
    if (this.state === 'harvesting') {
      return;
    }

    if (this.target) {
      const dx = this.target.x - this.x;
      const dy = this.target.y - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance >= this.width) {
        const vx = dx / distance * this.moveSpeed;
        const vy = dy / distance * this.moveSpeed;

        this.x += vx * deltaTime;
        this.y += vy * deltaTime;

        this.state = 'moving';
      } else {
        if (this.target instanceof Base) {
          this.state = 'dropping';

          if (this.inventory.length === 0) {
            this.state = 'idle';
            this.target = null;
            return;
          }

          this.timeout = setTimeout(() => {
            this.inventory.forEach((item) => {
              const baseItem = this.target.inventory.find((baseItem) => baseItem.id === item.id);
              if (baseItem) {
                baseItem.amount += item.amount;
              } else {
                this.target.inventory.push({ id: item.id, amount: item.amount });
              }
            });

            this.inventory = [];
            this.invetoryWeight = this.calculateWeight();

            this.state = 'idle';
          }, 1000);

          return;
        }


        if (this.target instanceof Tree) {
          this.state = 'harvesting';

          if (this.target.amount <= 0) {
            this.state = 'idle';
            this.target = null;
            return;
          }

          this.timeout = setTimeout(() => {
            this.target.amount -= 10;
            const item = this.inventory.find((item) => item.id === "wood");
            if (item) {
              item.amount += 10;
            } else {
              this.inventory.push({ id: "wood", amount: 10 });
            }

            this.invetoryWeight = this.calculateWeight();
            if (this.invetoryWeight >= this.inventoryCapacity) {
              this.state = 'idle';
              this.target = null;

              const base = gameObjects.find((gameObject) => gameObject instanceof Base);
              if (base) {
                this.moveTo(base);
              }

              return;
            }

            this.state = 'idle';
          }, this.harvestingTime);

          return;
        }

        this.state = 'idle';
        this.target = null;
      }
    }
  }

  render(context) {
    context.fillStyle = this.selected ? 'yellow' : 'gray';
    context.fillRect(this.x, this.y, this.width, this.height);

    context.fillStyle = '#fff';
    context.font = '12px Arial';
    context.fillText(this.state, this.x, this.y - 5);
  }

  moveTo(gameObject) {
    this.target = gameObject;
    this.state = 'moving';

    if (this.timeout) {
      clearTimeout(this.timeout);
    }
  }

  handle(gameObject) {
    this.moveTo(gameObject);
  }

  calculateWeight() {
    let total = 0;
    this.inventory.forEach((item) => {
      total += item.amount;
    });

    return total;
  }
}

function update(deltaTime) {
  gameObjects.forEach((gameObject) => {
    gameObject.update(deltaTime);
  });
}

function render() {
  const context = canvas.getContext('2d');

  context.fillStyle = '#000';
  context.fillRect(0, 0, canvas.width, canvas.height);

  gameObjects.forEach((gameObject) => {
    gameObject.render(context);
  });

  context.fillStyle = '#fff';
  context.font = '12px Arial';
  context.fillText(`FPS: ${fps}`, 10, 20);

  if (selectedGameObject) {
    context.fillStyle = '#fff';
    context.font = '12px Arial';


    if (selectedGameObject instanceof Worker) {
      context.fillText(`Worker Inventory:`, 10, 40);
      if (selectedGameObject.inventory.length === 0) {
        context.fillText(`Empty`, 10, 60);
      }

      selectedGameObject.inventory.forEach((item, index) => {
        context.fillText(`${item.id}: ${item.amount}`, 10, 60 + 20 * index);
      });
      return;
    }

    if (selectedGameObject instanceof Base) {
      context.fillText(`Base Inventory:`, 10, 40);
      if (selectedGameObject.inventory.length === 0) {
        context.fillText(`Empty`, 10, 60);
      }

      selectedGameObject.inventory.forEach((item, index) => {
        context.fillText(`${item.id}: ${item.amount}`, 10, 60 + 20 * index);
      });
    }
  }
}

function gameLoop() {
  const now = Date.now();
  const deltaTime = (now - lastTime) / 1000;

  update(deltaTime);
  render();

  lastTime = now;
  fps = Math.round(1 / deltaTime);

  window.requestAnimationFrame(gameLoop);
}

function createTrees() {
  for (let i = 0; i < 10; i++) {
    const tree = new Tree({ x: Math.random() * canvas.width, y: Math.random() * canvas.height });
    gameObjects.push(tree);
  }
}

function init() {
  canvas = document.getElementById('canvas');

  canvas.width = 800;
  canvas.height = 600;

  // right mouse click
  canvas.addEventListener('contextmenu', (event) => {
    event.preventDefault();

    const x = event.offsetX;
    const y = event.offsetY;

    let clicked = null;
    for (let i = 0; i < gameObjects.length; i++) {
      const gameObject = gameObjects[i];
      if (gameObject.isClicked(x, y)) {
        clicked = gameObject;
        break;
      }
    }

    if (selectedGameObject) {
      if (selectedGameObject instanceof Worker) {
        if (clicked) {
          selectedGameObject.handle(clicked);
        } else {
          selectedGameObject.moveTo({ x, y });
        }
        return;
      }

      selectedGameObject.selected = false;
      selectedGameObject = null;
    }
  });

  canvas.addEventListener('click', (event) => {
    const x = event.offsetX;
    const y = event.offsetY;

    let clicked = null;
    for (let i = 0; i < gameObjects.length; i++) {
      const gameObject = gameObjects[i];
      if (gameObject.isClicked(x, y)) {
        clicked = gameObject;
        break;
      }
    }

    if (clicked) {
      if (selectedGameObject) {
        selectedGameObject.selected = false;
      }
      selectedGameObject = clicked;
      selectedGameObject.selected = true;

      return;
    }

    if (selectedGameObject) {
      selectedGameObject.selected = false;
      selectedGameObject = null;
    }
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      if (selectedGameObject) {
        selectedGameObject.selected = false;
        selectedGameObject = null;
      }
    }
  });

  createTrees();

  gameObjects.push(new Base({ x: 400, y: 400 }));
  gameObjects.push(new Worker({ x: 100, y: 100 }));
  gameObjects.push(new Worker({ x: 200, y: 200 }));
  gameObjects.push(new Worker({ x: 300, y: 300 }));

  gameLoop();
}

document.addEventListener('DOMContentLoaded', function() {
  init();
});

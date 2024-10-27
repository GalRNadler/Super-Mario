const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const playButton = document.getElementById("playButton");
const pauseButton = document.getElementById("pauseButton");
const muteButton = document.getElementById("muteButton");
let allLevelResults = [];

const config = {
  nBack: 0,
  // colors: ['red', 'green', 'yellow' , 'blue', 'pink','orange'],
  // colors: ['blue', 'green'],
  colors: ["red", "pink", "yellow", "gray"],
  gameSpeed: 10,
  playerSize: 70,
  mushroomSize: 81,
  pipeWidth: 70,
  pipeHeight: 100,
  jumpHeight: 300, 
  maxMushroomHeight: 250, 
  cloudCount: 4,
  cloudScale: 0.5, 
  floorHeight: 50, 
  treeCount: 3,
  bushCount: 5,
  treeSize: { width: 100, height: 120 },
  bushSize: { width: 60, height: 40 },
  mushroomInterval : 2000,
};


let gameState = {
  score: 0,
  mushroomHistory: [],
  playerPosition: {
    x: 25,
    y: canvas.height - config.pipeHeight - config.playerSize,
  },
  jumping: false,
  jumpVelocity: 0,
  gameRunning: false,
  lastMushroomTime: 0,
  currentMushroom: null,
  paused: false,
  muted: true,
  movingToMushroom: false,  
  targetX: 0, 
  returningToStart: false,
  startX: 25,
  startY: canvas.height - config.floorHeight - config.playerSize,
  jumpingToMushroom: false,
  jumpProgress: 0,
  jumpStartX: 0,
  jumpStartY: 0,
  jumpTargetX: 0,
  jumpTargetY: 0,
  returningToStart: false,
  levelTime: 43000,
  levelTimeUp: false,
  mushroomsToCollect : 0,
  mushroomsToAvoid : 0,
  mushroomsCollected : 0,
  mushroomsAvoided : 0,
  reactionTimes : [], 
  falseReactionTimes : [],
  currentMushroomReactionStartTime : null,
  currentMushroomReactionEndTime : null,
  currentMushroomAppearTime : null,
  nextMushroomTime : 0, 
  mushroomInterval : 2000,
  mushroomsAppeared: 0,
  targetMushroom: null, //0
  targetShown: true, //0
};

function generateMushroom() {
  let color;
  const shouldBeCorrect = Math.random() < 0.5;
  gameState.currentMushroomAppearTime = performance.now();
  if (shouldBeCorrect) {
    color = gameState.targetMushroom.color;
    gameState.mushroomsToCollect++;
    
  } else {
    const availableColors = config.colors.filter(c => c !== gameState.targetMushroom.color);
    color = availableColors[Math.floor(Math.random() * availableColors.length)];
    gameState.mushroomsToAvoid++;
  }

  const minY = canvas.height - config.maxMushroomHeight - config.floorHeight;
  const maxY = canvas.height - config.floorHeight - config.mushroomSize;

  return {
    x: canvas.width,
    y: Math.random() * (maxY - minY) + minY,
    color: color,
    image: loadMushroomImage(color),
    collected: false,
    reactionStarted: false,
  };
}

function handleInput(event) {
  if (!gameState.gameRunning || gameState.paused) return;

  if (event.key === "ArrowLeft" && gameState.playerPosition.x > 20) {
    gameState.playerPosition.x -= 5;
  } else if (event.key === "ArrowRight") {
    gameState.currentMushroomReactionEndTime = performance.now();
    moveToMushroom();
  } else if (event.key === "ArrowUp" && !gameState.jumping) {
    gameState.jumping = true;
    gameState.jumpVelocity = -Math.sqrt(2 * 0.8 * config.jumpHeight);
  }
}


function updateMushrooms(timestamp) {
  const elapsedTime = timestamp - gameState.levelStartTime;
  const remainingTime = gameState.levelTime - elapsedTime;

  if (gameState.currentMushroom) {
    gameState.currentMushroom.x -= config.gameSpeed;
    
    if (!gameState.currentMushroom.reactionStarted && 
      gameState.currentMushroom.x + config.mushroomSize / 2 <= canvas.width) {
    gameState.currentMushroom.reactionStarted = true;
    gameState.currentMushroomReactionStartTime = performance.now();
  }
    ctx.drawImage(
      gameState.currentMushroom.image,
      gameState.currentMushroom.x,
      gameState.currentMushroom.y,
      config.mushroomSize,
      config.mushroomSize
    );
    if (gameState.currentMushroom.x + config.mushroomSize < 0) {
      if ((gameState.currentMushroom.color !== gameState.targetMushroom.color)) {
        gameState.mushroomsAvoided++;
      }
      gameState.currentMushroom = null;
      gameState.currentMushroomReactionStartTime = null;
      gameState.currentMushroomReactionEndTime = null;
    }
  }

  if (timestamp >= gameState.nextMushroomTime && remainingTime > 2000) {
    gameState.currentMushroom = generateMushroom();
    gameState.mushroomHistory.push({
      color: gameState.currentMushroom.color,
      collected: false
    });
    
    if (gameState.mushroomHistory.length > 5) {
      gameState.mushroomHistory.shift();
    }


    gameState.nextMushroomTime = timestamp + gameState.mushroomInterval;
  }
}

function collectMushroom() {
  if (gameState.currentMushroom && !gameState.currentMushroom.collected) {
    const reactionTime = gameState.currentMushroomReactionEndTime - gameState.currentMushroomReactionStartTime;
    if (gameState.currentMushroom.color === gameState.targetMushroom.color) {
      gameState.score += 10;
      gameState.mushroomsCollected++;
      gameState.reactionTimes.push(reactionTime);
      console.log("Correct match! +10 points");
    } else {
      gameState.score -= 5;
      gameState.falseReactionTimes.push(reactionTime);
      console.log("Incorrect match. -5 points");
    }
    
    gameState.currentMushroom.collected = true;
    updateScore();
    gameState.returningToStart = true;
    gameState.currentMushroom = null;
    gameState.currentMushroomReactionStartTime = null;
    gameState.currentMushroomReactionEndTime = null;
  }
}


const playerImage = new Image();
playerImage.src = "assets/images/Super_Mario.png";
const player1Image = new Image();
player1Image.src = "assets/images/Super_Mario1.png";
const mushroomImages = {};

function loadMushroomImage(color) {
  if (!mushroomImages[color]) {
    mushroomImages[color] = new Image();
    mushroomImages[color].src = `assets/images/${color}_mushroom.png`;
    console.log(`Loading mushroom image: ${mushroomImages[color].src}`);
    mushroomImages[color].onload = () => console.log(`Mushroom image loaded: ${color}`);
    mushroomImages[color].onerror = () => console.error(`Failed to load mushroom image: ${color}`);
  }
  return mushroomImages[color];
}

const pipeImage = new Image();
pipeImage.src = "assets/images/green_pipe.png";

const cloudImage = new Image();
cloudImage.src = "assets/images/cloud.png";

const treeImage = new Image();
treeImage.src = "assets/images/tree.png";

const bushImage = new Image();
bushImage.src = "assets/images/bush.png";

const brickImage = new Image();
brickImage.src = "assets/images/brick.png";
const floorImage = new Image();
floorImage.src = "assets/images/floor_tile.png";
let floorX = 0;

const clouds = Array(config.cloudCount)
  .fill()
  .map(() => ({
    x: Math.random() * canvas.width,
    y: Math.random() * (canvas.height / 2),
    speed: 0.5 + Math.random() * 0.5,
  }));

function updateClouds() {
  if (!cloudImage.complete) return;

  clouds.forEach((cloud) => {
    cloud.x -= cloud.speed;
    if (cloud.x + cloudImage.width * config.cloudScale < 0) {
      cloud.x = canvas.width;
      cloud.y = Math.random() * (canvas.height / 2);
    }
    ctx.drawImage(
      cloudImage,
      cloud.x,
      cloud.y,
      cloudImage.width * config.cloudScale,
      cloudImage.height * config.cloudScale
    );
  });
}
const trees = Array(config.treeCount)
  .fill()
  .map(() => ({
    x: Math.random() * canvas.width,
    y: canvas.height - config.floorHeight - config.treeSize.height,
  }));

const bushes = Array(config.bushCount)
  .fill()
  .map(() => ({
    x: Math.random() * canvas.width,
    y: canvas.height - config.floorHeight - config.bushSize.height,
  }));

function updateScenery() {
  const treeSpeed = config.gameSpeed * 0.5;
  const bushSpeed = config.gameSpeed * 0.7;

  trees.forEach((tree) => {
    tree.x -= treeSpeed;
    if (tree.x + config.treeSize.width < 0) {
      tree.x = canvas.width;
      tree.y = canvas.height - config.floorHeight - config.treeSize.height;
    }
  });

  bushes.forEach((bush) => {
    bush.x -= bushSpeed;
    if (bush.x + config.bushSize.width < 0) {
      bush.x = canvas.width;
      bush.y = canvas.height - config.floorHeight - config.bushSize.height;
    }
  });
}

function generateTargetMushroom() { //0
  const colorIndex = Math.floor(Math.random() * config.colors.length);
  const color = config.colors[colorIndex];
  const image = loadMushroomImage(color);
  
  gameState.targetMushroom = { color, image };
  
}

function drawTargetMushroom() {
  if (gameState.targetMushroom && gameState.targetShown) {
    const centerX = canvas.width / 2 - config.mushroomSize / 2;
    const centerY = canvas.height / 2 - config.mushroomSize / 2;

    ctx.drawImage(
      gameState.targetMushroom.image,
      centerX,
      centerY,
      config.mushroomSize,
      config.mushroomSize
    );

 
    ctx.fillStyle = 'black';
    ctx.font = '20px Arial';
    ctx.fillText('Target:', centerX, centerY - 20);
  }
}


const backgroundMusic = new Audio("assets/sounds/super_mario_theme.mp3");
backgroundMusic.loop = true;


function gameLoop(timestamp) {
  if (!gameState.gameRunning || gameState.paused) return;

  const elapsedTime = timestamp - gameState.levelStartTime;
  if (elapsedTime >= gameState.levelTime && !gameState.levelTimeUp) {
    gameState.levelTimeUp = true;
    handleLevelCompletion();
    return;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  updateBackground();
  updateScenery();
  updateClouds();
  updatePlayer();
  updateMushrooms(timestamp);
  checkCollisions();
  drawTargetMushroom(); //0
  

  if (!gameState.levelTimeUp) {
    requestAnimationFrame(gameLoop);
  }
}

function handleLevelCompletion() {
  gameState.gameRunning = false;
  gameState.paused = true;
  console.log("Level completed! Final score:", gameState.score);
  const successRate = gameState.mushroomsCollected / gameState.mushroomsToCollect;
  const avoidRate = gameState.mushroomsAvoided / gameState.mushroomsToAvoid;
  const overallSuccess = (gameState.mushroomsCollected + gameState.mushroomsAvoided) / 
              (gameState.mushroomsToCollect + gameState.mushroomsToAvoid);
  const avgReactionTime = gameState.reactionTimes.length > 0 ?
    gameState.reactionTimes.reduce((a, b) => a + b, 0) / gameState.reactionTimes.length : 0;
  const avgFalseReactionTime = gameState.falseReactionTimes.length > 0 ?
    gameState.falseReactionTimes.reduce((a, b) => a + b, 0) / gameState.falseReactionTimes.length : 0;
  
  allLevelResults.push({
    level: allLevelResults.length + 1,
    reactionTimes: gameState.reactionTimes,
    falseReactionTimes : gameState.falseReactionTimes,
    Averege : avgReactionTime,
    FalseAverege : avgFalseReactionTime,
    collected : gameState.mushroomsCollected,
    toCollect : gameState.mushroomsToCollect,
    successRate: successRate,
    avoided : gameState.mushroomsAvoided,
    toAvoid : gameState.mushroomsToAvoid,
    avoidRate: avoidRate,
    overallSuccess: overallSuccess
  });
  saveLevelResults();

  displayResults();
  if (allLevelResults.length === 10) {
    generateAndDownloadCSV();
  } else {
    setTimeout(() => {
      const nextLevelButton = document.getElementById("nextLevelButton");
      if (nextLevelButton) {
        nextLevelButton.click();
      } else {
        console.error("Next Level button not found");
      }
    }, 5000); 
  }
}

function updateBackground() {
  ctx.fillStyle = "#619FFC";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  const floorY = canvas.height - config.floorHeight;
  if (floorImage.complete) {
    for (let x = floorX; x < canvas.width; x += floorImage.width) {
      ctx.drawImage(
        floorImage,
        x,
        floorY,
        floorImage.width,
        config.floorHeight
      );
    }
  }

  if (treeImage.complete) {
    trees.forEach((tree) => {
      ctx.drawImage(
        treeImage,
        tree.x,
        tree.y,
        config.treeSize.width,
        config.treeSize.height
      );
      tree.y = canvas.height - config.floorHeight - config.treeSize.height + 17;
    });
  }

  if (bushImage.complete) {
    bushes.forEach((bush) => {
      ctx.drawImage(
        bushImage,
        bush.x,
        bush.y,
        config.bushSize.width,
        config.bushSize.height
      );
      bush.y =
        canvas.height - config.floorHeight - config.bushSize.height + 7.5;
    });
  }
  floorX -= config.gameSpeed;
  if (floorX <= -floorImage.width) {
    floorX = 0;
  }
}

function drawPipe() {
  ctx.drawImage(
    pipeImage,
    20,
    canvas.height - config.pipeHeight - 40,
    config.pipeWidth,
    config.pipeHeight
  );
}


function updatePlayer() {
  if (gameState.jumpingToMushroom) {
    gameState.jumpProgress += 0.05; 

    if (gameState.jumpProgress >= 1) {
      gameState.jumpingToMushroom = false;
      gameState.playerPosition.x = gameState.jumpTargetX;
      gameState.playerPosition.y = gameState.jumpTargetY;
      collectMushroom();
      returnToStart();
    } else {
      
      const jumpHeight = 100; 
      gameState.playerPosition.x = lerp(gameState.jumpStartX, gameState.jumpTargetX, gameState.jumpProgress);
      gameState.playerPosition.y = lerp(gameState.jumpStartY, gameState.jumpTargetY, gameState.jumpProgress) 
                                   - Math.sin(gameState.jumpProgress * Math.PI) * jumpHeight;
    }
  } else if (gameState.returningToStart) {
    const moveSpeed = 7; 
    if (gameState.playerPosition.x > gameState.startX) {
      gameState.playerPosition.x -= moveSpeed;
    } else {
      gameState.playerPosition.x = gameState.startX;
    }
    
    if (gameState.playerPosition.y < gameState.startY) {
      gameState.playerPosition.y += moveSpeed;
    } else {
      gameState.playerPosition.y = gameState.startY;
    }
    
    if (Math.abs(gameState.playerPosition.x - gameState.startX) < moveSpeed && 
        Math.abs(gameState.playerPosition.y - gameState.startY) < moveSpeed) {
      gameState.playerPosition.x = gameState.startX;
      gameState.playerPosition.y = gameState.startY;
      gameState.returningToStart = false;
      gameState.currentMushroom = null;
      gameState.lastMushroomTime = performance.now();
    }
  }

  if (gameState.jumping) {
    gameState.playerPosition.y += gameState.jumpVelocity;
    gameState.jumpVelocity += 0.8;
    const floorY = canvas.height - config.floorHeight - config.playerSize;
    if (gameState.playerPosition.y >= floorY) {
      gameState.playerPosition.y = floorY;
      gameState.jumping = false;
      gameState.jumpVelocity = 0;
    }
  }

  ctx.drawImage(
    playerImage,
    gameState.playerPosition.x,
    gameState.playerPosition.y,
    config.playerSize,
    config.playerSize
  );
}

function checkCollisions() {
  if (!gameState.currentMushroom || gameState.currentMushroom.collected) return;

  const player = {
    x: gameState.playerPosition.x,
    y: gameState.playerPosition.y,
    width: config.playerSize,
    height: config.playerSize,
  };

  const mushroom = gameState.currentMushroom;

  if (
    player.x < mushroom.x + config.mushroomSize &&
    player.x + player.width > mushroom.x &&
    player.y < mushroom.y + config.mushroomSize &&
    player.y + player.height > mushroom.y
  ) {
    collectMushroom();
  }
}

function updateScore() {
  if (scoreElement) {
    scoreElement.textContent = gameState.score;
  }
}

function startGame() {
  gameState.gameRunning = true;
  gameState.paused = false;
  gameState.score = 0;
  gameState.mushroomsAppeared = 0;
  gameState.mushroomHistory = [];
  gameState.playerPosition = {
    x: 50,
    y: canvas.height - config.floorHeight - config.playerSize,
  };
  gameState.lastMushroomTime = 0;
  gameState.currentMushroom = null;
  gameState.targetShown = false;
  playButton.disabled = true;
  gameState.levelStartTime = performance.now();
  gameState.nextMushroomTime = gameState.levelStartTime + gameState.mushroomInterval;
  gameState.levelTimeUp = false;
  gameState.lastMushroomTime = performance.now();
  gameState.mushroomsToCollect = 0;
  gameState.mushroomsToAvoid = 0;
  gameState.mushroomsCollected = 0;
  gameState.mushroomsAvoided = 0;
  gameState.reactionTimes = [];
  loadLevelResults();
  
  const nextLevelButton = document.getElementById("nextLevelButton");
  if (nextLevelButton) {
      nextLevelButton.style.display = "none";
  }


  setTimeout(() => {
    const moveInterval = setInterval(() => {
      gameState.playerPosition.x += 2;
      if (gameState.playerPosition.x >= 50) {
        clearInterval(moveInterval);
      }
    }, 20);
  }, 800); 

  if (!gameState.muted) {
    backgroundMusic.play().catch((e) => console.log("Audio play failed:", e));
  }

  requestAnimationFrame(gameLoop);
}


function pauseGame() {
  gameState.paused = !gameState.paused;
  pauseButton.textContent = gameState.paused ? "Resume" : "Pause";
  if (gameState.paused) {
    backgroundMusic.pause();
  } else {
    resumeGame(); 
  }
}

function resumeGame() {
  if (!gameState.muted) {
    backgroundMusic.play().catch((e) => console.log("Audio play failed:", e));
  }
  requestAnimationFrame(gameLoop);
}


function toggleMute() {
  gameState.muted = !gameState.muted;
  muteButton.textContent = gameState.muted ? "Unmute" : "Mute";
  backgroundMusic.muted = gameState.muted;
}

function initGame() {
  document.addEventListener("keydown", handleInput);
  playButton.addEventListener("click", startGame);
  
  preloadImages(() => {
      console.log("All images loaded");
      generateTargetMushroom();
      drawInitialScene();
  });
}


function drawInitialScene() {
  ctx.fillStyle = "#619FFC";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const floorY = canvas.height - config.floorHeight;
  drawPipe();
  if (floorImage.complete) {
    for (let x = 0; x < canvas.width; x += floorImage.width) {
      ctx.drawImage(
        floorImage,
        x,
        floorY,
        floorImage.width,
        config.floorHeight
      );
    }
  }

  if (treeImage.complete) {
    trees.forEach((tree) => {
      ctx.drawImage(
        treeImage,
        tree.x,
        tree.y,
        config.treeSize.width,
        config.treeSize.height + 17
      );
      tree.y = canvas.height - config.floorHeight - config.treeSize.height;
    });
  }

  if (bushImage.complete) {
    bushes.forEach((bush) => {
      ctx.drawImage(
        bushImage,
        bush.x,
        bush.y,
        config.bushSize.width,
        config.bushSize.height + 7.5
      );
      bush.y = canvas.height - config.floorHeight - config.bushSize.height;
    });
  }

  ctx.drawImage(
    player1Image,
    gameState.playerPosition.x - 7,
    gameState.playerPosition.y - 40,
    config.playerSize,
    config.playerSize
  );

  drawTargetMushroom();
}

const essentialImages = [playerImage, floorImage, pipeImage];
Promise.all(
  essentialImages.map((img) => new Promise((resolve) => (img.onload = resolve)))
).then(() => initGame());

function lazyLoadBackgroundElements() {
  const backgroundImages = [treeImage, bushImage, cloudImage, floorImage];
  backgroundImages.forEach((img) => {
    if (!img.src) {
      img.src = img.dataset.src;
    }
  });
}


function moveToMushroom() {
  if (gameState.currentMushroom && !gameState.currentMushroom.collected && !gameState.returningToStart) {
    if (gameState.mushroomHistory.length >= config.nBack) {
      gameState.jumpingToMushroom = true;
      gameState.jumpProgress = 0;
      gameState.jumpStartX = gameState.playerPosition.x;
      gameState.jumpStartY = gameState.playerPosition.y;
      gameState.jumpTargetX = gameState.currentMushroom.x - config.playerSize / 2;
      gameState.jumpTargetY = gameState.currentMushroom.y + config.mushroomSize - config.playerSize;
    }
  }
}

function lerp(start, end, t) {
  return start * (1 - t) + end * t;
}


function returnToStart() {
  gameState.returningToStart = true;
  const moveSpeed = 7; // Adjusted for smoother movement
  
  function moveStep() {
   
    if (gameState.playerPosition.x > gameState.startX) {
      gameState.playerPosition.x -= moveSpeed;
    } else {
      gameState.playerPosition.x = gameState.startX;
    }
 
    if (gameState.playerPosition.y < gameState.startY) {
      gameState.playerPosition.y += moveSpeed;
    } else {
      gameState.playerPosition.y = gameState.startY;
    }
    
    if (Math.abs(gameState.playerPosition.x - gameState.startX) < moveSpeed && 
        Math.abs(gameState.playerPosition.y - gameState.startY) < moveSpeed) {
      gameState.playerPosition.x = gameState.startX;
      gameState.playerPosition.y = gameState.startY;
      gameState.returningToStart = false;
      gameState.currentMushroom = null;
      gameState.lastMushroomTime = performance.now();
    } else {
      requestAnimationFrame(moveStep);
    }
  }
  
  moveStep();
}

function preloadImages(callback) {
  const imagesToLoad = [
    playerImage,
    player1Image,
    pipeImage,
    cloudImage,
    treeImage,
    bushImage,
    brickImage,
    floorImage,
    ...config.colors.map(color => loadMushroomImage(color))
  ];

  let loadedImages = 0;
  imagesToLoad.forEach(img => {
    if (img.complete) {
      loadedImages++;
    } else {
      img.onload = () => {
        loadedImages++;
        if (loadedImages === imagesToLoad.length) {
          callback();
        }
      };
    }
  });

  if (loadedImages === imagesToLoad.length) {
    callback();
  }
}

function drawScore() {
  ctx.fillStyle = "white";
  ctx.font = "bold 24px Arial";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(`Score: ${gameState.score}`, 10, 10);
}

function drawScore() {
  const scoreText = `Score: ${gameState.score}`;
  const padding = 5;
  
  ctx.font = "bold 24px Arial";
  const textMetrics = ctx.measureText(scoreText);
  const textWidth = textMetrics.width;
  const textHeight = 24; 

  ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
  ctx.fillRect(5, 5, textWidth + padding * 2, textHeight + padding * 2);


  ctx.fillStyle = "white";
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillText(scoreText, 10, 10);
}

function displayResults() {
  ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "white";
  ctx.font = "48px Arial";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  ctx.fillText("Level Completed!", canvas.width / 2, canvas.height / 2);
}

function generateAndDownloadCSV() {
  let csvContent = "data:text/csv;charset=utf-8,";
  csvContent += "Level,Reaction Times,Average Reaction Time,Success,Avoid,Overall, Success Rate,Avoid Rate,Overall Success\n";

  let totalReactionTime = 0;
  let totalReactionCount = 0;

  allLevelResults.forEach(result => {
    const reactionTimesString = result.reactionTimes.join(' ; ');
    const avgReactionTime = result.reactionTimes.length > 0 ? 
      result.reactionTimes.reduce((a, b) => a + b, 0) / result.reactionTimes.length : 0;
    totalReactionTime += result.reactionTimes.reduce((a, b) => a + b, 0);
    totalReactionCount += result.reactionTimes.length;
    const successRate = gameState.mushroomsToCollect!= 0 ?`${gameState.mushroomsCollected}/${gameState.mushroomsToCollect}` : 0 ;
    const avoidanceRate = gameState.mushroomsToAvoid != 0 ? `${gameState.mushroomsAvoided}/${gameState.mushroomsToAvoid}`: 0;
    const overallRate = (gameState.mushroomsToCollect + gameState.mushroomsToAvoid)!=0 ? `${gameState.mushroomsCollected + gameState.mushroomsAvoided}/${gameState.mushroomsToCollect + gameState.mushroomsToAvoid}`: 0 ;

    csvContent += `${result.level},"${reactionTimesString}",${avgReactionTime.toFixed(4)},${successRate}, ${avoidanceRate} ,${overallRate} ,${result.successRate.toFixed(4)},${result.avoidRate.toFixed(4)},${result.overallSuccess.toFixed(4)}\n`;
  });


  const overallAvgReactionTime = totalReactionCount > 0 ? totalReactionTime / totalReactionCount : 0;
  csvContent += `\nOverall Average Reaction Time,${overallAvgReactionTime.toFixed(2)}`;

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "super_mario_results.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
function loadLevelResults() {
  const storedResults = localStorage.getItem('allLevelResults');
  if (storedResults) {
    allLevelResults = JSON.parse(storedResults);
  }
}

function saveLevelResults() {
  localStorage.setItem('allLevelResults', JSON.stringify(allLevelResults));
}

window.onload = function() {
  console.log("Window loaded, initializing game");
  initGame();
};
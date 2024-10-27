const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const config = {
    playerSize: 70,
    mushroomSize: 81,
    pipeWidth: 70,
    pipeHeight: 100,
    floorHeight: 50,
    treeCount: 3,
    bushCount: 5,
    treeSize: { width: 100, height: 120 },
    bushSize: { width: 60, height: 40 },
};

let gameState = {
    playerPosition: {
        x: 25,
        y: canvas.height - config.pipeHeight - config.playerSize,
    },
    showingOpeningPage: true,
};

const font = new FontFace('Super Mario 256', 'url(assets/fonts/SuperMario256.ttf)');
const font2 = new FontFace('Highway Gothic', 'url(assets/fonts/HWYGNRRW.ttf)');

const playerImage = new Image();
playerImage.src = "assets/images/Super_Mario1.png";
const pipeImage = new Image();
pipeImage.src = "assets/images/green_pipe.png";
const treeImage = new Image();
treeImage.src = "assets/images/tree.png";
const bushImage = new Image();
bushImage.src = "assets/images/bush.png";
const floorImage = new Image();
floorImage.src = "assets/images/floor_tile.png";

Promise.all([font.load(), font2.load()])
    .then(function(loadedFonts) {
        loadedFonts.forEach(font => document.fonts.add(font));
        console.log("All fonts loaded successfully");
        initOpeningPage();
    })
    .catch(function(error) {
        console.error('Font loading failed:', error);
        initOpeningPage();
    });

function showOpeningPage() {
    const openingText = [
        "",
       "Welcome to the ",
        "",
        "Mario Mushroom Game!",
        "",
        "in this experiment you will play",
        "",
        "a Super-Mario game ",
        "",
        "we will start with 2 practice stages",
        "",
        "Read the instruction carefully",
        "",
        "Good luck and have fun!",
        "",
        "Press 'Start' to begin the practice."
    ];

    ctx.textAlign = 'center';
    let yPosition = 30;

    openingText.forEach((line, index) => {
        if (index === 1) {
          ctx.font = '48px "Super Mario 256", Arial';
          ctx.fillStyle = '#FBD000';
        } else if (index === 3) {
            ctx.font = '48px "Super Mario 256", Arial';
            ctx.fillStyle = '#FBD000';
    
        } else {
          ctx.font = '29px "Highway Gothic", Arial';
          ctx.fillStyle = 'white';
        }
        ctx.fillText(line, canvas.width / 2, yPosition);
        yPosition += (index === 2) ? 60 : (index === 3) ? 30 : 20;
    });
}

function drawInitialScene() {
    ctx.fillStyle = "#619FFC";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const floorY = canvas.height - config.floorHeight;
    drawPipe();
    
    if (floorImage.complete) {
        for (let x = 0; x < canvas.width; x += floorImage.width) {
            ctx.drawImage(floorImage, x, floorY, floorImage.width, config.floorHeight);
        }
    }

    if (treeImage.complete) {
        for (let i = 0; i < config.treeCount; i++) {
            const x = Math.random() * canvas.width;
            const y = canvas.height - config.floorHeight - config.treeSize.height;
            ctx.drawImage(treeImage, x, y, config.treeSize.width, config.treeSize.height + 17);
        }
    }

    if (bushImage.complete) {
        for (let i = 0; i < config.bushCount; i++) {
            const x = Math.random() * canvas.width;
            const y = canvas.height - config.floorHeight - config.bushSize.height;
            ctx.drawImage(bushImage, x, y, config.bushSize.width, config.bushSize.height + 7.5);
        }
    }

    ctx.drawImage(
        playerImage,
        gameState.playerPosition.x - 7,
        gameState.playerPosition.y - 40,
        config.playerSize,
        config.playerSize
    );
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

function initOpeningPage() {
    drawInitialScene();
    showOpeningPage();
}


window.onload = function() {
    console.log("Window loaded, initializing opening page");
    initOpeningPage();
};
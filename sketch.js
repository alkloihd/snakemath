// Game Constants
const CELL_SIZE = 40;
const GRID_WIDTH = 20;  // 800 / 40
const GRID_HEIGHT = 15; // 600 / 40
const BG_COLOR = '#32A852';
const TOP_PANEL_COLOR = '#228B22';
const FOOD_COLOR = '#C8C8C8';
const SNAKE_COLOR = '#0000FF';
const TEXT_COLOR = '#FFFFFF';
const X_COLOR = '#FF0000';
const CHECK_COLOR = '#00FF00';
const FPS_VALUES = {1:5, 2:6, 3:7, 4:8, 5:9}; // Speed selection mapping

let snake = [];
let direction = 'RIGHT';
let lives = 5;
let score_correct = 0;
let score_total = 0;
let current_problem = {};
let food = [];
let x_marks = [];
let check_marks = [];
let confetti_particles = [];
let game_state = 'WELCOME'; // WELCOME, RUNNING, PAUSED, GAME_OVER
let selected_speed = 3; // Default speed

// Title and Subtitle
let title = "Math Snake by M. Lodhia";
let subtitle = "Use arrow keys to play and press Esc to pause";

// Game Speed Label
let speedLabel = "Game Speed";

// HTML Elements
let welcomeScreen;
let startButton;
let speedButtons;

// p5.js Canvas
let canvas;

function setup() {
    // No canvas creation here. Canvas will be created when the game starts.
    noCanvas(); // Remove default canvas creation
    textFont('Arial');
    initSnake();
    initFood();
}

function draw() {
    if (game_state !== 'RUNNING') {
        return; // Skip drawing when not running
    }

    background(BG_COLOR);

    drawTopPanel();
    drawGrid();

    moveSnake();
    handleCollisions();

    drawSnake();
    drawFoodItems();
    drawConfettiParticles();
    drawXMarks();
    drawCheckMarks();

    if (game_state === 'PAUSED') {
        drawPauseMenu();
    }
    if (game_state === 'GAME_OVER') {
        drawGameOver();
    }
}

function keyPressed() {
    if (game_state === 'RUNNING') {
        if (keyCode === UP_ARROW && direction !== 'DOWN') {
            direction = 'UP';
        } else if (keyCode === DOWN_ARROW && direction !== 'UP') {
            direction = 'DOWN';
        } else if (keyCode === LEFT_ARROW && direction !== 'RIGHT') {
            direction = 'LEFT';
        } else if (keyCode === RIGHT_ARROW && direction !== 'LEFT') {
            direction = 'RIGHT';
        } else if (key === 'Escape') {
            game_state = 'PAUSED';
        }
    }

    if (game_state === 'PAUSED') {
        if (key === 'C' || key === 'c') {
            game_state = 'RUNNING';
        } else if (key === 'R' || key === 'r') {
            resetGame();
        }
    }

    if (game_state === 'GAME_OVER') {
        if (key === 'R' || key === 'r') {
            resetGame();
        } else if (key === 'Q' || key === 'q') {
            // Reload the page to restart
            window.location.reload();
        }
    }
}

// Initialize HTML Elements after DOM is loaded
window.addEventListener('DOMContentLoaded', () => {
    // Welcome Screen Elements
    welcomeScreen = document.getElementById('welcome-screen');
    startButton = document.getElementById('start-button');
    speedButtons = document.querySelectorAll('.speed-btn');

    // Add Event Listeners to Speed Buttons
    speedButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove 'active' class from all buttons
            speedButtons.forEach(btn => btn.classList.remove('active'));
            // Add 'active' class to the clicked button
            button.classList.add('active');
            // Update selected speed
            selected_speed = parseInt(button.getAttribute('data-speed'));
            if (game_state === 'RUNNING') {
                frameRate(FPS_VALUES[selected_speed]);
            }
        });
    });

    // Set default active speed
    document.getElementById('default-speed').classList.add('active');

    // Start Button Event Listener
    startButton.addEventListener('click', () => {
        // Hide welcome screen
        welcomeScreen.style.display = 'none';
        // Show game container
        document.getElementById('game-container').style.display = 'block';
        // Create the canvas and append to game-container
        canvas = createCanvas(CELL_SIZE * GRID_WIDTH, CELL_SIZE * GRID_HEIGHT + 100);
        canvas.parent('game-container');
        frameRate(FPS_VALUES[selected_speed]);
        game_state = 'RUNNING';
    });
});

// Function to initialize the snake
function initSnake() {
    snake = [];
    let center_x = floor(GRID_WIDTH / 2);
    let center_y = floor(GRID_HEIGHT / 2);
    for (let i = 0; i < 5; i++) {
        snake.push({x: center_x - i, y: center_y});
    }
}

// Function to generate a math problem
function generateMathProblem() {
    let operations = ['+', '-', '*', '/'];
    let operation = random(operations);
    let a, b, question, answer;

    switch(operation) {
        case '+':
            a = floor(random(0, 51));
            b = floor(random(0, 51 - a));
            question = `${a} + ${b}`;
            answer = a + b;
            break;
        case '-':
            a = floor(random(0, 51));
            b = floor(random(0, a + 1));
            question = `${a} - ${b}`;
            answer = a - b;
            break;
        case '*':
            a = floor(random(1, 13));
            b = floor(random(1, 13));
            question = `${a} × ${b}`;
            answer = a * b;
            break;
        case '/':
            b = floor(random(1, 13));
            answer = floor(random(1, 13));
            a = b * answer;
            question = `${a} ÷ ${b}`;
            break;
    }

    return {question, answer};
}

// Function to generate incorrect answers
function generateIncorrectAnswers(correct_answer, count=3) {
    let incorrect = new Set();
    while (incorrect.size < count) {
        let delta = floor(random(-10, 11));
        let wrong = correct_answer + delta;
        if (wrong !== correct_answer && wrong >= 0) {
            incorrect.add(wrong);
        }
    }
    return Array.from(incorrect);
}

// Function to generate food items based on math problems
function generateFood() {
    current_problem = generateMathProblem();
    let correct_answer = current_problem.answer;
    let incorrect_answers = generateIncorrectAnswers(correct_answer);
    let all_answers = [correct_answer, ...incorrect_answers];
    shuffle(all_answers, true);
    food = [];
    let food_positions = new Set();
    snake.forEach(segment => {
        food_positions.add(`${segment.x},${segment.y}`);
    });

    all_answers.forEach(value => {
        let pos;
        do {
            pos = {x: floor(random(0, GRID_WIDTH)), y: floor(random(0, GRID_HEIGHT))};
        } while (food_positions.has(`${pos.x},${pos.y}`));
        food_positions.add(`${pos.x},${pos.y}`);
        food.push({
            x: pos.x,
            y: pos.y,
            value: value,
            is_correct: value === correct_answer
        });
    });
}

// Initialize food items
function initFood() {
    food = [];
    generateFood();
}

// Function to move the snake
function moveSnake() {
    let head = Object.assign({}, snake[0]);
    switch(direction) {
        case 'UP':
            head.y -=1;
            break;
        case 'DOWN':
            head.y +=1;
            break;
        case 'LEFT':
            head.x -=1;
            break;
        case 'RIGHT':
            head.x +=1;
            break;
    }
    // Wrap around the grid
    head.x = (head.x + GRID_WIDTH) % GRID_WIDTH;
    head.y = (head.y + GRID_HEIGHT) % GRID_HEIGHT;
    snake.unshift(head);
    snake.pop();
}

// Function to handle collisions
function handleCollisions() {
    let head = snake[0];
    for (let i = 0; i < food.length; i++) {
        let item = food[i];
        if (head.x === item.x && head.y === item.y) {
            if (item.is_correct) {
                // Correct Answer
                snake.push(Object.assign({}, snake[snake.length -1]));
                score_correct +=1;
                score_total +=1;
                lives +=1;
                emitConfetti((head.x + 0.5) * CELL_SIZE, (head.y + 0.5) * CELL_SIZE + 100);
                emitCheckMark((head.x + 0.5) * CELL_SIZE, (head.y + 0.5) * CELL_SIZE + 100);
                // Generate new problem
                generateFood();
            } else {
                // Incorrect Answer
                if (snake.length > 1) {
                    snake.pop(); // Shrink Snake
                }
                score_total +=1;
                lives -=1;
                emitXMark((item.x + 0.5) * CELL_SIZE, (item.y + 0.5) * CELL_SIZE + 100);
                // Remove incorrect food
                food.splice(i,1);
            }
            break;
        }
    }

    if (lives <=0) {
        game_state = 'GAME_OVER';
    }
}

// Function to draw the top panel
function drawTopPanel() {
    fill(TOP_PANEL_COLOR);
    noStroke();
    rect(0, 0, width, 100);

    // Draw Math Problem
    fill(TEXT_COLOR);
    textSize(24);
    textAlign(CENTER, CENTER);
    text(`Solve: ${current_problem.question}`, width / 2, 60);

    // Draw Score and Lives
    textSize(20);
    textAlign(RIGHT, TOP);
    text(`Score: ${score_correct}/${score_total}    Lives: ${lives}`, width - 20, 20);
}

// Function to draw the grid
function drawGrid() {
    stroke(0);
    strokeWeight(1); // Ensure grid lines are not bold
    for (let x = 0; x <= width; x += CELL_SIZE) {
        line(x, 100, x, height);
    }
    for (let y = 100; y <= height; y += CELL_SIZE) {
        line(0, y, width, y);
    }
}

// Function to draw the snake
function drawSnake() {
    for (let i =0; i < snake.length; i++) {
        let segment = snake[i];
        let seg_x = segment.x * CELL_SIZE + CELL_SIZE/4;
        let seg_y = segment.y * CELL_SIZE + 100 + CELL_SIZE/4;
        fill(SNAKE_COLOR);
        noStroke();
        rect(seg_x, seg_y, CELL_SIZE/2, CELL_SIZE/2);
        if (i ===0) {
            // Draw smiley face on the head
            fill(0);
            ellipse(seg_x + CELL_SIZE/4, seg_y + CELL_SIZE/4, CELL_SIZE/8, CELL_SIZE/8); // Head
            // Eyes
            ellipse(seg_x + CELL_SIZE/4 - CELL_SIZE/16, seg_y + CELL_SIZE/4 - CELL_SIZE/16, CELL_SIZE/32, CELL_SIZE/32);
            ellipse(seg_x + CELL_SIZE/4 + CELL_SIZE/16, seg_y + CELL_SIZE/4 - CELL_SIZE/16, CELL_SIZE/32, CELL_SIZE/32);
            // Mouth
            noFill();
            stroke(0);
            strokeWeight(1);
            arc(seg_x + CELL_SIZE/4, seg_y + CELL_SIZE/4 + CELL_SIZE/32, CELL_SIZE/8, CELL_SIZE/8, 0, PI);
        }
    }
}

// Function to draw food items
function drawFoodItems() {
    for (let item of food) {
        fill(FOOD_COLOR);
        stroke(0);
        rect(item.x * CELL_SIZE, item.y * CELL_SIZE + 100, CELL_SIZE, CELL_SIZE);
        fill(TEXT_COLOR);
        noStroke();
        textSize(24);
        textAlign(CENTER, CENTER);
        text(item.value, (item.x +0.5)*CELL_SIZE, (item.y +0.5)*CELL_SIZE + 100);
    }
}

// Function to emit confetti particles
function emitConfetti(x, y) {
    for (let i=0; i <30; i++) { // Reduced number for performance
        let angle = random(TWO_PI);
        let speed = random(1,3);
        confetti_particles.push({
            x: x,
            y: y,
            vx: cos(angle) * speed,
            vy: sin(angle) * speed,
            color: random(['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FFA500', '#800080']),
            lifetime: 60
        });
    }
}

// Function to emit check marks
function emitCheckMark(x, y) {
    check_marks.push({x: x, y: y, lifetime: 30});
}

// Function to emit X marks
function emitXMark(x, y) {
    x_marks.push({x: x, y: y, lifetime: 30});
}

// Function to update and draw confetti particles
function emitConfettiParticles() {
    for (let i = confetti_particles.length -1; i >=0; i--) {
        let particle = confetti_particles[i];
        fill(particle.color);
        noStroke();
        ellipse(particle.x, particle.y, 5,5);
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.lifetime -=1;
        if (particle.lifetime <=0) {
            confetti_particles.splice(i,1);
        }
    }
}

// Function to draw confetti particles
function drawConfettiParticles() {
    emitConfettiParticles();
}

// Function to draw X marks
function drawXMarks() {
    for (let i = x_marks.length -1; i >=0; i--) {
        let mark = x_marks[i];
        stroke(X_COLOR);
        strokeWeight(3);
        line(mark.x -10, mark.y -10, mark.x +10, mark.y +10);
        line(mark.x -10, mark.y +10, mark.x +10, mark.y -10);
        mark.lifetime -=1;
        if (mark.lifetime <=0) {
            x_marks.splice(i,1);
        }
    }
}

// Function to draw check marks
function drawCheckMarks() {
    for (let i = check_marks.length -1; i >=0; i--) {
        let mark = check_marks[i];
        stroke(CHECK_COLOR);
        strokeWeight(3);
        noFill();
        beginShape();
        vertex(mark.x -10, mark.y);
        vertex(mark.x -3, mark.y +10);
        vertex(mark.x +10, mark.y -5);
        endShape();
        mark.lifetime -=1;
        if (mark.lifetime <=0) {
            check_marks.splice(i,1);
        }
    }
}

// Function to draw the pause menu
function drawPauseMenu() {
    fill('rgba(0,0,0,0.5)');
    noStroke();
    rect(0,0,width,height);

    fill(TEXT_COLOR);
    textSize(24);
    textAlign(CENTER, CENTER);
    text("Game Paused", width/2, height/2 - 50);
    text("Press 'C' to Continue or 'R' to Restart.", width/2, height/2);
}

// Function to draw the game over screen
function drawGameOver() {
    fill('rgba(0,0,0,0.7)');
    noStroke();
    rect(0,0,width,height);

    fill(TEXT_COLOR);
    textSize(40);
    textAlign(CENTER, CENTER);
    text("Game Over!", width/2, height/2 - 100);

    textSize(24);
    text(`Final Score: ${score_correct}/${score_total}`, width/2, height/2 - 50);
    text("Press 'R' to Restart or 'Q' to Quit.", width/2, height/2);
}

// Function to reset the game
function resetGame() {
    initSnake();
    initFood();
    direction = 'RIGHT';
    lives = 5;
    score_correct = 0;
    score_total = 0;
    game_state = 'RUNNING';
    x_marks = [];
    check_marks = [];
    confetti_particles = [];
}

// Function to shuffle an array (Fisher-Yates Shuffle)
function shuffle(array, bool=false) {
    let m = array.length, t, i;
    while (m) {
        i = floor(random(0, m--));
        t = array[m];
        array[m] = array[i];
        array[i] = t;
    }
    return array;
}

// Game Constants
const GRID_WIDTH = 26;  // Original 20 + 6 additional boxes
const GRID_HEIGHT = 17; // Original 15 + 2 additional boxes
const CELL_SIZE = 800 / GRID_WIDTH; // Adjusted CELL_SIZE
const BG_COLOR = '#32A852';
const TOP_PANEL_COLOR = '#228B22';
const FOOD_COLOR = '#FFFFFF'; // White background for food
const FOOD_TEXT_COLOR = '#000000'; // Black text on food
const SNAKE_COLOR = '#0000FF';
const TEXT_COLOR = '#FFFFFF';
const X_COLOR = '#FF0000';
const CHECK_COLOR = '#00FF00';
const FPS_VALUES = {1:5, 2:6, 3:7, 4:8, 5:9}; // Speed selection mapping
const MAX_SNAKE_LENGTH = 24; // Maximum snake length
const INITIAL_LIVES = 10; // Starting lives and snake length

let snake = [];
let direction = 'RIGHT';
let lives = INITIAL_LIVES; // Start with 10 lives
let score_correct = 0;
let score_total = 0;
let current_problem = {};
let food = [];
let x_marks = [];
let check_marks = [];
let confetti_particles = [];
let game_state = 'WELCOME'; // WELCOME, RUNNING, PAUSED, GAME_OVER
let selected_speed = 3; // Default speed

// Buttons
let speedButtons = [];
let startButton;

// Title and Subtitle
let title = "Math Snake by M. Lodhia";
let subtitle = "Use arrow keys or WASD to play and press Esc to pause";

// Game Speed Label
let speedLabel = "Game Speed";

let canvas; // Declare canvas globally
let canvasX, canvasY; // To store canvas position

function setup() {
    canvas = createCanvas(CELL_SIZE * GRID_WIDTH, CELL_SIZE * GRID_HEIGHT + 100);
    canvas.parent('game-container');
    frameRate(FPS_VALUES[selected_speed]);
    textFont('Arial');
    initSnake();
    initFood();

    // Get canvas position
    let canvasRect = canvas.elt.getBoundingClientRect();
    canvasX = canvasRect.left;
    canvasY = canvasRect.top;

    createWelcomeScreen();
}

function draw() {
    background(BG_COLOR);

    if (game_state === 'WELCOME') {
        drawWelcomeScreen();
        return; // Skip other drawing
    }

    drawTopPanel();
    drawGrid();

    if (game_state === 'RUNNING') {
        moveSnake();
        handleCollisions();
    }

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
        if ((keyCode === UP_ARROW || key === 'W' || key === 'w') && direction !== 'DOWN') {
            direction = 'UP';
        } else if ((keyCode === DOWN_ARROW || key === 'S' || key === 's') && direction !== 'UP') {
            direction = 'DOWN';
        } else if ((keyCode === LEFT_ARROW || key === 'A' || key === 'a') && direction !== 'RIGHT') {
            direction = 'LEFT';
        } else if ((keyCode === RIGHT_ARROW || key === 'D' || key === 'd') && direction !== 'LEFT') {
            direction = 'RIGHT';
        } else if (keyCode === 27) { // Escape key
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
            // Return to main menu
            lives = INITIAL_LIVES;
            score_correct = 0;
            score_total = 0;
            game_state = 'WELCOME';
            initSnake();
            initFood();
            createWelcomeScreen();
        }
    }
}

// Function to create Welcome Screen Buttons
function createWelcomeScreen() {
    // Create Speed Selection Buttons
    let total_buttons_width = 5 * 60 + 4 * 20;
    let start_x = (width - total_buttons_width) / 2;

    for (let i = 1; i <= 5; i++) {
        let btn = createButton(i.toString());
        btn.position(start_x + (i - 1) * 80 + canvasX, 220 + canvasY); // Adjusted position
        btn.size(60, 60);
        btn.style('font-size', '20px');
        btn.style('background-color', '#FFF');
        btn.style('border', '2px solid #000');
        btn.mousePressed(() => selectSpeed(i));
        speedButtons.push(btn);
    }

    // Create Start Button
    startButton = createButton('Start Game');
    startButton.position(width / 2 - 100 + canvasX, 300 + canvasY); // Adjusted position
    startButton.size(200, 60);
    startButton.style('font-size', '24px');
    startButton.style('background-color', '#FFF');
    startButton.style('border', '2px solid #000');
    startButton.mousePressed(() => startGame());
}

function selectSpeed(speed) {
    selected_speed = speed;
    frameRate(FPS_VALUES[selected_speed]);
    // Highlight selected button
    speedButtons.forEach((btn, index) => {
        if (index + 1 === speed) {
            btn.style('background-color', '#AAF'); // Highlight color
        } else {
            btn.style('background-color', '#FFF'); // Default color
        }
    });
}

function startGame() {
    game_state = 'RUNNING';
    // Hide buttons
    speedButtons.forEach(btn => btn.hide());
    startButton.hide();
}

function initSnake() {
    snake = [];
    let center_x = floor(GRID_WIDTH / 2);
    let center_y = floor(GRID_HEIGHT / 2);
    for (let i = 0; i < INITIAL_LIVES; i++) {
        snake.push({ x: center_x - i, y: center_y });
    }
}

function generateMathProblem() {
    let operations = ['+', '-', '*', '/'];
    let operation = random(operations);
    let a, b, question, answer;

    switch (operation) {
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

    return { question, answer };
}

function generateIncorrectAnswers(correct_answer, count = 3) {
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
            pos = { x: floor(random(0, GRID_WIDTH)), y: floor(random(0, GRID_HEIGHT)) };
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

function initFood() {
    food = [];
    generateFood();
}

function moveSnake() {
    let head = Object.assign({}, snake[0]);
    switch (direction) {
        case 'UP':
            head.y -= 1;
            break;
        case 'DOWN':
            head.y += 1;
            break;
        case 'LEFT':
            head.x -= 1;
            break;
        case 'RIGHT':
            head.x += 1;
            break;
    }
    // Wrap around the grid
    head.x = (head.x + GRID_WIDTH) % GRID_WIDTH;
    head.y = (head.y + GRID_HEIGHT) % GRID_HEIGHT;
    snake.unshift(head);
    snake.pop();
}

function handleCollisions() {
    let head = snake[0];
    for (let i = 0; i < food.length; i++) {
        let item = food[i];
        if (head.x === item.x && head.y === item.y) {
            if (item.is_correct) {
                // Correct Answer
                score_correct += 1;
                score_total += 1;

                // Increase lives and grow snake every 5 correct answers
                if (score_correct % 5 === 0) {
                    if (lives < MAX_SNAKE_LENGTH) {
                        lives += 1;
                        snake.push(Object.assign({}, snake[snake.length - 1]));
                    }
                }

                emitConfetti((head.x + 0.5) * CELL_SIZE, (head.y + 0.5) * CELL_SIZE + 100);
                emitCheckMark((head.x + 0.5) * CELL_SIZE, (head.y + 0.5) * CELL_SIZE + 100);
                // Generate new problem
                generateFood();
            } else {
                // Incorrect Answer
                if (snake.length > 1) {
                    snake.pop(); // Shrink Snake
                }
                score_total += 1;
                lives -= 1;
                emitXMark((item.x + 0.5) * CELL_SIZE, (item.y + 0.5) * CELL_SIZE + 100);
                // Remove incorrect food
                food.splice(i, 1);
            }
            break;
        }
    }

    if (lives <= 0) {
        game_state = 'GAME_OVER';
    }
}

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

function drawSnake() {
    for (let i = 0; i < snake.length; i++) {
        let segment = snake[i];
        let seg_x = segment.x * CELL_SIZE + CELL_SIZE / 4;
        let seg_y = segment.y * CELL_SIZE + 100 + CELL_SIZE / 4;
        fill(SNAKE_COLOR);
        noStroke();
        rect(seg_x, seg_y, CELL_SIZE / 2, CELL_SIZE / 2);
        if (i === 0) {
            // Draw smiley face on the head
            fill(0);
            ellipse(seg_x + CELL_SIZE / 4, seg_y + CELL_SIZE / 4, CELL_SIZE / 8, CELL_SIZE / 8); // Head
            // Eyes
            ellipse(seg_x + CELL_SIZE / 4 - CELL_SIZE / 16, seg_y + CELL_SIZE / 4 - CELL_SIZE / 16, CELL_SIZE / 32, CELL_SIZE / 32);
            ellipse(seg_x + CELL_SIZE / 4 + CELL_SIZE / 16, seg_y + CELL_SIZE / 4 - CELL_SIZE / 16, CELL_SIZE / 32, CELL_SIZE / 32);
            // Mouth
            noFill();
            stroke(0);
            strokeWeight(1);
            arc(seg_x + CELL_SIZE / 4, seg_y + CELL_SIZE / 4 + CELL_SIZE / 32, CELL_SIZE / 8, CELL_SIZE / 8, 0, PI);
        }
    }
}

function drawFoodItems() {
    for (let item of food) {
        fill(FOOD_COLOR);
        stroke(0);
        rect(item.x * CELL_SIZE, item.y * CELL_SIZE + 100, CELL_SIZE, CELL_SIZE);
        fill(FOOD_TEXT_COLOR);
        noStroke();
        textSize(CELL_SIZE * 0.6); // Adjusted text size to fit within the box
        textAlign(CENTER, CENTER);
        text(item.value, (item.x + 0.5) * CELL_SIZE, (item.y + 0.5) * CELL_SIZE + 100);
    }
}

function emitConfetti(x, y) {
    for (let i = 0; i < 30; i++) {
        let angle = random(TWO_PI);
        let speed = random(1, 3);
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

function emitCheckMark(x, y) {
    check_marks.push({ x: x, y: y, lifetime: 30 });
}

function emitXMark(x, y) {
    x_marks.push({ x: x, y: y, lifetime: 30 });
}

function emitConfettiParticles() {
    for (let i = confetti_particles.length - 1; i >= 0; i--) {
        let particle = confetti_particles[i];
        fill(particle.color);
        noStroke();
        ellipse(particle.x, particle.y, 5, 5);
        particle.x += particle.vx;
        particle.y += particle.vy;
        particle.lifetime -= 1;
        if (particle.lifetime <= 0) {
            confetti_particles.splice(i, 1);
        }
    }
}

function drawConfettiParticles() {
    emitConfettiParticles();
}

function drawXMarks() {
    for (let i = x_marks.length - 1; i >= 0; i--) {
        let mark = x_marks[i];
        stroke(X_COLOR);
        strokeWeight(3);
        line(mark.x - 10, mark.y - 10, mark.x + 10, mark.y + 10);
        line(mark.x - 10, mark.y + 10, mark.x + 10, mark.y - 10);
        mark.lifetime -= 1;
        if (mark.lifetime <= 0) {
            x_marks.splice(i, 1);
        }
    }
}

function drawCheckMarks() {
    for (let i = check_marks.length - 1; i >= 0; i--) {
        let mark = check_marks[i];
        stroke(CHECK_COLOR);
        strokeWeight(3);
        noFill();
        beginShape();
        vertex(mark.x - 10, mark.y);
        vertex(mark.x - 3, mark.y + 10);
        vertex(mark.x + 10, mark.y - 5);
        endShape();
        mark.lifetime -= 1;
        if (mark.lifetime <= 0) {
            check_marks.splice(i, 1);
        }
    }
}

function drawWelcomeScreen() {
    // Draw Title
    fill(TEXT_COLOR);
    textSize(32);
    textAlign(CENTER, CENTER);
    text(title, width / 2, 80); // y-position set to 80px

    // Draw Subtitle
    textSize(20);
    text(subtitle, width / 2, 130); // y-position set to 130px

    // Draw Game Speed Label
    textSize(24);
    text(speedLabel, width / 2, 180); // y-position set to 180px

    // Buttons are already created and positioned
}

function drawPauseMenu() {
    fill('rgba(0,0,0,0.5)');
    noStroke();
    rect(0, 0, width, height);

    fill(TEXT_COLOR);
    textSize(24);
    textAlign(CENTER, CENTER);
    text("Game Paused", width / 2, height / 2 - 50);
    text("Press 'C' to Continue or 'R' to Restart.", width / 2, height / 2);
}

function drawGameOver() {
    fill('rgba(0,0,0,0.7)');
    noStroke();
    rect(0, 0, width, height);

    fill(TEXT_COLOR);
    textSize(40);
    textAlign(CENTER, CENTER);
    text("Game Over!", width / 2, height / 2 - 100);

    textSize(24);
    text(`Final Score: ${score_correct}/${score_total}`, width / 2, height / 2 - 50);
    text("Press 'R' to Restart or 'Q' to Quit.", width / 2, height / 2);
}

function resetGame() {
    initSnake();
    initFood();
    direction = 'RIGHT';
    lives = INITIAL_LIVES; // Reset lives to initial value
    score_correct = 0;
    score_total = 0;
    game_state = 'RUNNING';
    x_marks = [];
    check_marks = [];
    confetti_particles = [];
}

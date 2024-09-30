from js import document
import asyncio
import random
import math

# Initialize Canvas
canvas = document.getElementById("game-canvas")
ctx = canvas.getContext("2d")

# Game Constants
CELL_SIZE = 40
GRID_WIDTH = canvas.width // CELL_SIZE  # 600 // 40 = 15
GRID_HEIGHT = (canvas.height - 100) // CELL_SIZE  # 900 -100=800 //40=20
BG_COLOR = "#32A852"
TOP_PANEL_COLOR = "#228B22"
FOOD_COLOR = "#C8C8C8"
SNAKE_COLOR = "#0000FF"
TEXT_COLOR = "#FFFFFF"
X_COLOR = "#FF0000"
CHECK_COLOR = "#00FF00"

# Directions
UP = (0, -1)
DOWN = (0, 1)
LEFT = (-1, 0)
RIGHT = (1, 0)

# Game Settings
INITIAL_SNAKE_LENGTH = 5
INITIAL_LIVES = 5
FPS_VALUES = {1:5, 2:6, 3:7, 4:8, 5:9}  # Speed selection mapping

# Fonts
PROBLEM_FONT = "24px Arial"
SCORE_FONT = "20px Arial"
NUMBER_FONT = "24px Arial"
TITLE_FONT = "40px Arial"
BUTTON_FONT = "20px Arial"

# Game Variables
snake = []
direction = RIGHT
lives = INITIAL_LIVES
score_correct = 0
score_total = 0
current_problem = {}
food = []
x_marks = []
confetti_particles = []
check_marks = []
fps = 7  # Default speed
game_state = 'WELCOME'  # WELCOME, RUNNING, PAUSED, GAME_OVER

# Initialize Snake
def init_snake():
    global snake
    snake = []
    center_x = GRID_WIDTH // 2
    center_y = GRID_HEIGHT // 2
    for i in range(INITIAL_SNAKE_LENGTH):
        snake.append((center_x - i, center_y))

# Generate Math Problem
def generate_math_problem():
    operations = ['+', '-', '*', '/']
    operation = random.choice(operations)
    
    if operation == '+':
        a = random.randint(0, 50)
        b = random.randint(0, 50 - a)
        question = f"{a} + {b}"
        answer = a + b
    elif operation == '-':
        a = random.randint(0, 50)
        b = random.randint(0, a)
        question = f"{a} - {b}"
        answer = a - b
    elif operation == '*':
        a = random.randint(1, 12)
        b = random.randint(1, 12)
        question = f"{a} × {b}"
        answer = a * b
    elif operation == '/':
        b = random.randint(1, 12)
        answer = random.randint(1, 12)
        a = b * answer
        question = f"{a} ÷ {b}"
    return {"question": question, "answer": answer}

# Generate Incorrect Answers
def generate_incorrect_answers(correct_answer, count=3):
    incorrect = set()
    while len(incorrect) < count:
        delta = random.randint(-10, 10)
        wrong = correct_answer + delta
        if wrong != correct_answer and wrong >= 0:
            incorrect.add(wrong)
    return list(incorrect)

# Get Random Position
def get_random_position(snake, food_positions):
    while True:
        pos = (random.randint(0, GRID_WIDTH -1), random.randint(0, GRID_HEIGHT -1))
        if pos not in snake and pos not in food_positions:
            return pos

# Initialize Food
def init_food():
    global food, current_problem
    current_problem = generate_math_problem()
    correct_answer = current_problem['answer']
    incorrect_answers = generate_incorrect_answers(correct_answer)
    all_answers = [correct_answer] + incorrect_answers
    random.shuffle(all_answers)
    food = []
    food_positions = set()
    for answer in all_answers:
        pos = get_random_position(snake, food_positions)
        food.append({"pos": pos, "value": answer, "is_correct": answer == correct_answer})
        food_positions.add(pos)

# Draw Functions
def draw_top_panel():
    ctx.fillStyle = TOP_PANEL_COLOR
    ctx.fillRect(0, 0, canvas.width, 100)
    ctx.fillStyle = TEXT_COLOR
    ctx.font = PROBLEM_FONT
    problem_text = f"Solve: {current_problem['question']}"
    ctx.textAlign = "center"
    ctx.fillText(problem_text, canvas.width // 2, 60)
    score_text = f"Score: {score_correct}/{score_total}    Lives: {lives}"
    ctx.font = SCORE_FONT
    ctx.fillText(score_text, canvas.width - 100, 30)

def draw_grid():
    ctx.strokeStyle = BLACK
    for x in range(0, canvas.width, CELL_SIZE):
        ctx.beginPath()
        ctx.moveTo(x, 100)
        ctx.lineTo(x, canvas.height)
        ctx.stroke()
    for y in range(100, canvas.height, CELL_SIZE):
        ctx.beginPath()
        ctx.moveTo(0, y)
        ctx.lineTo(canvas.width, y)
        ctx.stroke()

def draw_snake():
    for idx, segment in enumerate(snake):
        x, y = segment
        rect_x = x * CELL_SIZE + CELL_SIZE//4
        rect_y = y * CELL_SIZE + 100 + CELL_SIZE//4
        ctx.fillStyle = SNAKE_COLOR
        ctx.fillRect(rect_x, rect_y, CELL_SIZE//2, CELL_SIZE//2)
        if idx == 0:
            # Draw smiley face on the head
            ctx.fillStyle = BLACK
            ctx.beginPath()
            ctx.arc(rect_x + CELL_SIZE//4, rect_y + CELL_SIZE//4, CELL_SIZE//8, 0, 2 * math.pi)
            ctx.fill()
            # Eyes
            ctx.beginPath()
            ctx.arc(rect_x + CELL_SIZE//4 - CELL_SIZE//16, rect_y + CELL_SIZE//4 - CELL_SIZE//16, CELL_SIZE//32, 0, 2 * math.pi)
            ctx.arc(rect_x + CELL_SIZE//4 + CELL_SIZE//16, rect_y + CELL_SIZE//4 - CELL_SIZE//16, CELL_SIZE//32, 0, 2 * math.pi)
            ctx.fill()
            # Mouth
            ctx.beginPath()
            ctx.arc(rect_x + CELL_SIZE//4, rect_y + CELL_SIZE//4, CELL_SIZE//8, math.pi, 0, False)
            ctx.stroke()

def draw_food_items():
    for item in food:
        x, y = item['pos']
        rect_x = x * CELL_SIZE
        rect_y = y * CELL_SIZE + 100
        ctx.fillStyle = FOOD_COLOR
        ctx.fillRect(rect_x, rect_y, CELL_SIZE, CELL_SIZE)
        ctx.strokeStyle = BLACK
        ctx.strokeRect(rect_x, rect_y, CELL_SIZE, CELL_SIZE)
        # Draw number
        ctx.fillStyle = TEXT_COLOR
        ctx.font = NUMBER_FONT
        ctx.textAlign = "center"
        ctx.fillText(str(item['value']), rect_x + CELL_SIZE//2, rect_y + CELL_SIZE//2 + 10)

def draw_confetti_particles():
    for particle in confetti_particles[:]:
        ctx.fillStyle = particle['color']
        ctx.beginPath()
        ctx.arc(particle['x'], particle['y'], 3, 0, 2 * math.pi)
        ctx.fill()
        # Update particle position
        particle['x'] += particle['dx']
        particle['y'] += particle['dy']
        particle['lifetime'] -= 1
        if particle['lifetime'] <= 0:
            confetti_particles.remove(particle)

def draw_x_marks():
    for x_mark in x_marks[:]:
        pos = x_mark['position']
        ctx.strokeStyle = X_COLOR
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(pos[0] - 10, pos[1] - 10)
        ctx.lineTo(pos[0] + 10, pos[1] + 10)
        ctx.stroke()
        ctx.beginPath()
        ctx.moveTo(pos[0] - 10, pos[1] + 10)
        ctx.lineTo(pos[0] + 10, pos[1] - 10)
        ctx.stroke()
        # Update timer
        x_mark['timer'] -= 1
        if x_mark['timer'] <= 0:
            x_marks.remove(x_mark)

def draw_check_marks():
    for check_mark in check_marks[:]:
        pos = check_mark['position']
        ctx.strokeStyle = CHECK_COLOR
        ctx.lineWidth = 3
        ctx.beginPath()
        ctx.moveTo(pos[0] - 10, pos[1])
        ctx.lineTo(pos[0] - 3, pos[1] + 10)
        ctx.lineTo(pos[0] + 10, pos[1] - 5)
        ctx.stroke()
        # Update timer
        check_mark['timer'] -= 1
        if check_mark['timer'] <= 0:
            check_marks.remove(check_mark)

def draw_pause_menu():
    ctx.fillStyle = "rgba(0, 0, 0, 0.5)"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = TEXT_COLOR
    ctx.font = SCORE_FONT
    ctx.textAlign = "center"
    ctx.fillText("Game Paused", canvas.width // 2, canvas.height // 2 - 50)
    ctx.fillText("Press R to Restart or C to Continue.", canvas.width // 2, canvas.height // 2)

def draw_game_over():
    ctx.fillStyle = "rgba(0, 0, 0, 0.7)"
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.fillStyle = TEXT_COLOR
    ctx.font = TITLE_FONT
    ctx.textAlign = "center"
    ctx.fillText("Game Over!", canvas.width // 2, canvas.height // 2 - 100)
    ctx.font = SCORE_FONT
    ctx.fillText(f"Final Score: {score_correct}/{score_total}", canvas.width // 2, canvas.height // 2 - 50)
    ctx.fillText("Press R to Restart or Q to Quit.", canvas.width // 2, canvas.height // 2)

# Game Logic
def emit_confetti(position):
    x, y = position
    for _ in range(30):  # Reduced number for performance
        dx = random.uniform(-2, 2)
        dy = random.uniform(-2, 2)
        color = random.choice(["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FFA500", "#800080"])
        confetti_particles.append({"x": x, "y": y, "dx": dx, "dy": dy, "color": color, "lifetime": 30})

def emit_check_mark(position):
    x, y = position
    check_marks.append({'position': (x, y), 'timer': 30})  # 30 frames (~0.5 sec)

# Handle Collisions
def handle_collisions():
    global snake, score_correct, score_total, lives, game_state
    head = snake[0]
    for item in food[:]:
        if head == item['pos']:
            if item['is_correct']:
                snake.append(snake[-1])  # Grow Snake
                score_correct += 1
                score_total += 1
                lives += 1
                emit_confetti((head[0] * CELL_SIZE + CELL_SIZE//2, head[1] * CELL_SIZE + 100 + CELL_SIZE//2))
                emit_check_mark((head[0] * CELL_SIZE + CELL_SIZE//2, head[1] * CELL_SIZE + 100 + CELL_SIZE//2))
                # Proceed to next problem
                init_food()
            else:
                if len(snake) > 1:
                    snake.pop()  # Shrink Snake
                score_total += 1
                lives -= 1
                # Add red 'X' at the incorrect food position
                x_pos = item['pos'][0] * CELL_SIZE + CELL_SIZE//2
                y_pos = item['pos'][1] * CELL_SIZE + 100 + CELL_SIZE//2
                x_marks.append({'position': (x_pos, y_pos), 'timer': 30})  # 30 frames (~0.5 sec)
                # Remove the incorrect food
                food.remove(item)
            break

    if lives <= 0:
        game_state = 'GAME_OVER'

# Game Loop
async def game_loop():
    global game_state
    while True:
        await asyncio.sleep(1 / fps)
        if game_state == 'RUNNING':
            # Move Snake
            new_head = (snake[0][0] + direction[0], snake[0][1] + direction[1])
            new_head = (new_head[0] % GRID_WIDTH, new_head[1] % GRID_HEIGHT)
            snake.insert(0, new_head)
            snake.pop()
            
            # Check Collisions
            handle_collisions()
        
        # Render
        ctx.fillStyle = BG_COLOR
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        draw_top_panel()
        draw_grid()
        draw_snake()
        draw_food_items()
        draw_confetti_particles()
        draw_x_marks()
        draw_check_marks()
        
        if game_state == 'PAUSED':
            draw_pause_menu()
        elif game_state == 'GAME_OVER':
            draw_game_over()

# Event Handlers
def key_down(event):
    global direction, game_state
    key = event.key
    if game_state == 'WELCOME':
        if key in ['1', '2', '3', '4', '5']:
            speed = int(key)
            if speed in FPS_VALUES:
                global fps
                fps = FPS_VALUES[speed]
        elif key == 'Enter':
            game_state = 'RUNNING'
    elif game_state == 'RUNNING':
        if key == 'ArrowUp' and direction != DOWN:
            direction = UP
        elif key == 'ArrowDown' and direction != UP:
            direction = DOWN
        elif key == 'ArrowLeft' and direction != RIGHT:
            direction = LEFT
        elif key == 'ArrowRight' and direction != LEFT:
            direction = RIGHT
        elif key == 'Escape':
            game_state = 'PAUSED'
    elif game_state == 'PAUSED':
        if key.lower() == 'c':
            game_state = 'RUNNING'
        elif key.lower() == 'r':
            reset_game()
    elif game_state == 'GAME_OVER':
        if key.lower() == 'r':
            reset_game()
        elif key.lower() == 'q':
            # PyScript cannot close the browser tab for security reasons
            # Instead, reload the page or display a message
            # Here, we'll reload the page to reset
            window.location.reload()

def reset_game():
    global snake, direction, lives, score_correct, score_total, game_state, confetti_particles, x_marks, check_marks
    init_snake()
    init_food()
    direction = RIGHT
    lives = INITIAL_LIVES
    score_correct = 0
    score_total = 0
    game_state = 'RUNNING'
    confetti_particles = []
    x_marks = []
    check_marks = []

# Attach Event Listener
document.addEventListener("keydown", key_down)

# Initialize Game
init_snake()
init_food()

# Start Game Loop
asyncio.ensure_future(game_loop())

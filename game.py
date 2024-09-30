import asyncio
import random
from js import document, window
from pyodide import create_proxy

# Get references to HTML elements
math_problem_element = document.getElementById("math-problem")
game_over_element = document.getElementById("game-over")
score_element = document.getElementById("score")
restart_button = document.getElementById("restart-button")
canvas = document.getElementById("game-canvas")
ctx = canvas.getContext("2d")

# Game settings
CELL_SIZE = 20
GRID_SIZE = 30  # 600 / 20
INITIAL_SNAKE_LENGTH = 5
MAX_ERRORS = 5

# Directions
UP = (0, -1)
DOWN = (0, 1)
LEFT = (-1, 0)
RIGHT = (1, 0)

# Global game state
snake = []
direction = RIGHT
food_items = []
current_problem = {}
score = 0
errors = 0
game_running = True

def start_game():
    global snake, direction, food_items, current_problem, score, errors, game_running
    snake = [(GRID_SIZE // 2 - i, GRID_SIZE // 2) for i in range(INITIAL_SNAKE_LENGTH)]
    direction = RIGHT
    food_items = []
    current_problem = generate_math_problem()
    score = 0
    errors = 0
    game_running = True
    math_problem_element.textContent = f"Solve: {current_problem['question']}"
    game_over_element.classList.remove("show")
    place_food()
    draw()
    asyncio.create_task(game_loop())

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

def generate_incorrect_answers(correct_answer, count=3):
    incorrect = set()
    while len(incorrect) < count:
        delta = random.randint(-10, 10)
        wrong = correct_answer + delta
        if wrong != correct_answer and wrong >= 0:
            incorrect.add(wrong)
    return list(incorrect)

def place_food():
    global food_items
    food_items = []
    correct_answer = current_problem['answer']
    incorrect_answers = generate_incorrect_answers(correct_answer)
    all_answers = [correct_answer] + incorrect_answers
    random.shuffle(all_answers)
    for ans in all_answers:
        pos = get_random_position()
        food_items.append({"pos": pos, "value": ans, "is_correct": ans == correct_answer})
    # Ensure all food items are at unique positions
    positions = set()
    for item in food_items:
        while item["pos"] in positions:
            item["pos"] = get_random_position()
        positions.add(item["pos"])

def get_random_position():
    return (random.randint(0, GRID_SIZE -1), random.randint(0, GRID_SIZE -1))

def draw():
    # Clear canvas
    ctx.fillStyle = "#e0e0e0"
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    # Draw food items
    for food in food_items:
        x, y = food["pos"]
        ctx.fillStyle = food["is_correct"] and "#4CAF50" or "#f44336"
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE)
        ctx.fillStyle = "#000"
        ctx.font = "16px Arial"
        ctx.textAlign = "center"
        ctx.textBaseline = "middle"
        ctx.fillText(str(food["value"]), x * CELL_SIZE + CELL_SIZE / 2, y * CELL_SIZE + CELL_SIZE / 2)

    # Draw snake
    for segment in snake:
        x, y = segment
        ctx.fillStyle = "#0000FF"
        ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE)

def move_snake():
    global game_running, score, errors, current_problem
    head_x, head_y = snake[0]
    dx, dy = direction
    new_head = ((head_x + dx) % GRID_SIZE, (head_y + dy) % GRID_SIZE)
    
    # Check collision with self
    if new_head in snake:
        end_game()
        return
    
    snake.insert(0, new_head)
    
    # Check if food is eaten
    eaten = None
    for food in food_items:
        if food["pos"] == new_head:
            eaten = food
            break
    
    if eaten:
        if eaten["is_correct"]:
            score += 1
            # Don't remove tail to grow
            # Generate new problem
            current_problem = generate_math_problem()
            math_problem_element.textContent = f"Solve: {current_problem['question']}"
            place_food()
        else:
            errors += 1
            score = max(score -1, 0)
            if errors >= MAX_ERRORS:
                end_game()
            else:
                # Remove tail to shrink
                snake.pop()
                place_food()
        food_items.remove(eaten)
    else:
        # Remove tail
        snake.pop()

def end_game():
    global game_running
    game_running = False
    game_over_element.classList.add("show")
    score_element.textContent = f"Your Score: {score}"
    window.clearInterval(game_interval)

async def game_loop():
    global game_running
    while game_running:
        move_snake()
        draw()
        await asyncio.sleep(0.2)  # Adjust game speed here

def change_direction(event):
    global direction
    key = event.key
    if key == "ArrowUp" and direction != DOWN:
        direction = UP
    elif key == "ArrowDown" and direction != UP:
        direction = DOWN
    elif key == "ArrowLeft" and direction != RIGHT:
        direction = LEFT
    elif key == "ArrowRight" and direction != LEFT:
        direction = RIGHT

def restart_game(event):
    start_game()

# Event listeners
document.addEventListener("keydown", create_proxy(change_direction))
restart_button.addEventListener("click", create_proxy(restart_game))

# Start the game when the script loads
start_game()

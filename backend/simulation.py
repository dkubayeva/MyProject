import random

def generate_clicks(num_clicks=100):
    """
    Generates a list of simulated clicks within a fixed 800x600 canvas.
    """
    width, height = 800, 600  # Use a fixed canvas size
    clicks = []
    personas = ['top_down', 'center_focused', 'random_explorer']

    for _ in range(num_clicks):
        persona = random.choice(personas)

        if persona == 'top_down':
            x = random.randint(0, width)
            y = random.randint(0, int(height * 0.5))
        elif persona == 'center_focused':
            x = int(random.gauss(width / 2, width / 6))
            y = int(random.gauss(height / 2, height / 6))
            x = max(0, min(width, x))
            y = max(0, min(height, y))
        elif persona == 'random_explorer':
            x = random.randint(0, width)
            y = random.randint(0, height)

        clicks.append({'x': x, 'y': y})

    return clicks
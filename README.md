zsh: command not found: pip# Science Problem Solver

A web application that helps solve math, physics, and chemistry problems using Python and Flask.

## Features

- Solve mathematical equations
- Calculate physics problems (velocity, distance, time)
- Solve chemistry problems (molarity calculations)
- Modern and user-friendly interface
- Real-time problem solving

## Installation

1. Clone the repository
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows, use: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Running the Application

1. Activate the virtual environment if not already activated
2. Run the Flask application:
   ```bash
   python app.py
   ```
3. Open your web browser and go to `http://localhost:5000`

## Usage

1. Select the type of problem (Math, Physics, or Chemistry)
2. Enter your problem in the text area
3. Click "Solve" to get the solution

## Examples

### Mathematics
- Enter equations like: "x**2 - 4 = 0"

### Physics
- Enter problems like: "velocity 20 time 5"

### Chemistry
- Enter problems like: "molarity 2 4"

## Technologies Used

- Flask (Backend)
- Bootstrap 5 (Frontend)
- SymPy (Mathematical computations)
- NumPy (Scientific computations) 
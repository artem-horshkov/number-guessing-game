# Number Guessing Game

A simple command-line number guessing game built with Node.js.

This project is based on the Number Guessing Game challenge from roadmap.sh:
https://roadmap.sh/projects/number-guessing-game

## Features

- Random number generation between 1 and 100
- Three difficulty levels:
    - Easy (10 chances)
    - Medium (5 chances)
    - Hard (3 chances)
- Input validation
- Hints after each incorrect guess
- Replay support
- Basic high score tracking (per session)

## Requirements

- Node.js 18 or newer

## Installation

Clone the repository and move into the project folder:

```bash
git clone https://github.com/artem-horshkov/number-guessing-game.git
cd number-guessing-game
```

## Usage

Run the game with:

```bash
npm start
```

Example output

```bash

======================================
 Welcome to the Number Guessing Game!
======================================

I'm thinking of a number between 1 and 100.
Your task is to guess it in a limited number of attempts.

High scores (fewest attempts):
- Easy: No record yet.
- Medium: No record yet.
- Hard: No record yet.

Please select the difficulty level:
1. Easy (10 chances)
2. Medium (5 chances)
3. Hard (3 chances)

Enter your choice (number):
```

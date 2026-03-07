#!/usr/bin/env node

import readline from 'node:readline/promises';
import logUpdate from "log-update";

const rl = readline.createInterface({ 
    input: process.stdin,
    output: process.stdout
});

const DIFFICULTIES = {
    1: { name: 'Easy', chances: 10 },
    2: { name: 'Medium', chances: 5 },
    3: { name: 'Hard', chances: 3 },
}

const highScores = {
    Easy: null,
    Medium: null,
    Hard: null,
};

function getRandomInt(min, max) {
    const lower = Math.ceil(min);
    const upper = Math.floor(max);
    return Math.floor((Math.random() * (upper - lower + 1)) + lower);
}

function formatDuration(duration) {
    const totalSeconds = Math.floor(duration / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    if (minutes === 0) return `${seconds}s`;
    return `${minutes}m ${seconds}s`;
}

let interrupted = false;

process.on('SIGINT', () => {
  interrupted = true;
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function animLog(message, delay = 100) {
  if (message == null) throw new Error('Message is required');
  if (!isFinite(delay) || delay < 0) {
    throw new Error('Delay must be a non-negative finite number');
  }

  const text = String(message);
  let output = '';

  try {
    for (const ch of text) {
      if (interrupted) break;

      output += ch;
      logUpdate(output + '▋');
      await sleep(delay);
    }

    if (!interrupted) {
      logUpdate(output);
    }
  } finally {
    logUpdate.done();
  }

  if (interrupted) {
    console.log('\nThe game was interrupted by the user.');
    process.exitCode = 0;
  }
}

function printWelcome() {
    console.log('\n======================================');
    console.log(' Welcome to the Number Guessing Game!');
    console.log('======================================');
    console.log('\nI\'m thinking of a number between 1 and 100.');
    console.log('Your task is to guess it in a limited number of attempts.');
}

async function askDifficulty() {
    console.log('\nPlease select the difficulty level:');
    console.log('1. Easy (10 chances)');
    console.log('2. Medium (5 chances)');
    console.log('3. Hard (3 chances)');
    while (true) {

        const answer = (await rl.question('\nEnter your choice (number): ')).trim();

        if (DIFFICULTIES[answer]) {
            return DIFFICULTIES[answer];
        }

        console.log('\nInvalid choice. Please enter 1, 2, or 3.');
    }
}

async function askGuess() {
    while (true) {
        const answer = (await rl.question('Enter your guess: ')).trim();
        
        if (!/^\d+$/.test(answer)) {
            console.log('Invalid input. Please enter a natural number.');
            continue;            
        }

        const guess = Number(answer);

        if (guess < 1 || guess > 100) {
            console.log('Out of range. Please enter a number between 1 and 100.');
            continue;
        }
        
        return guess;
    }
}

function printHighScores() {
    console.log('\nHigh scores (fewest attempts):');
    for (const level of Object.keys(highScores)) {
        const score = highScores[level];
        console.log(`- ${level}: ${score ?? 'No record yet.'}`);
    }
}

function updateHighScore(levelName, attemptsUsed) {
    const current = highScores[levelName];
    if (current === null || attemptsUsed < current) {
        highScores[levelName] = attemptsUsed;
        return true;
    }
    return false;
}

async function playRound() {
    const difficulty = await askDifficulty();
    const secretNumber = getRandomInt(1, 100);
    const maxAttempts = difficulty.chances;
    const startedAt = Date.now();

    console.log(`\nGreat! You have selected the ${difficulty.name} difficulty level.`);
    console.log(`You have ${maxAttempts} chances to guess the correct number.`);
    console.log('Let\'s start the game!');

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        console.log(`\nAttempt ${attempt}/${maxAttempts}`);
        const guess = await askGuess();

        if (guess === secretNumber) {
            const duration = Date.now() - startedAt;
            console.log(
                `Congratulations! You guessed the correct number in ${attempt} ${attempt === 1 ? 'attempt' : 'attempts'}.`
            );
            
            console.log(`Time taken: ${formatDuration(duration)}.`);

            const isNewRecord = updateHighScore(difficulty.name, attempt);
            if (isNewRecord) {
                console.log(`New high score for ${difficulty.name}!`);
            }

            return;
        }

        if (attempt === maxAttempts) {
            break;
        }

        console.log(
            `Incorrect! The number is ${guess < secretNumber ? 'greater' : 'less'} than ${guess}.`
        );
    }

    console.log('\nGame over! You ran out of chances.');
    console.log(`The correct number was ${secretNumber}.`);
}

async function askPlayAgain() {
    while (true) {
        const answer = (await rl.question('\nDo you want to play again? (y/n): '))
        .trim().toLowerCase();

        if (answer === 'y' || answer === 'yes') return true;
        if (answer === 'n' || answer === 'no') return false;

        console.log('Invalid input. Please answer with y or n.');
    }
}

async function main() {
    try {
        printWelcome();

        let keepPlaying = true;

        while (keepPlaying) {
            printHighScores();
            await playRound();
            keepPlaying = await askPlayAgain();
        }

        console.log('\nThanks for playing!');
    } catch (error) {
        console.error('\nUnexpected error:', error);
        process.exitCode = 1;
    } finally {
        rl.close();
    }
}

main();
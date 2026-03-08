#!/usr/bin/env node

import readline from 'node:readline/promises';
import logUpdate from "log-update";
import chalk from 'chalk';

const rl = readline.createInterface({ 
    input: process.stdin,
    output: process.stdout
});

let shutdownController = new AbortController();

process.on('SIGINT', () => {
    shutdownController.abort(new Error('Interrupted by user'));
    logUpdate.done();
});

function throwIfInterrupted() {
    shutdownController.signal.throwIfAborted();
}

const DIFFICULTIES = {
    1: { name: 'Easy', chances: 10, color: '#2ECC71'},
    Easy: { name: 'Easy', chances: 10, color: '#2ECC71'},
    2: { name: 'Medium', chances: 5, color: '#F39C12'},
    Medium: { name: 'Medium', chances: 5, color: '#F39C12'},
    3: { name: 'Hard', chances: 3, color: '#E74C3C' },
    Hard: { name: 'Hard', chances: 3, color: '#E74C3C' },
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

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function animLog(message, delay = 3, delay2 = 2) {
	throwIfInterrupted();

	if (message == null) throw new Error('Message is required');
	if (!Number.isFinite(delay) || delay < 0) {
		throw new Error('Delay must be a non-negative finite number');
	}

	const text = String(message);
	let output = '';
	let i = 0;

	for (const ch of text) {
		throwIfInterrupted();

		output += ch;
		logUpdate(output + '▋');

		if (i >= delay2) {
			await sleep(delay, undefined, {signal: shutdownController.signal});
            i = 0;
        }

		i++;
	}
    logUpdate(output);
    logUpdate.done();
}

async function printWelcome() {
    await animLog(chalk.dim('\n======================================'));
    await animLog(' Welcome to the Number Guessing Game!');
    await animLog(chalk.dim('======================================'));
    await animLog('\nI\'m thinking of a number between 1 and 100.');
    await animLog('Your task is to guess it in a limited number of attempts.');
}

async function printHighScores() {
    await animLog(`\nHigh scores ${chalk.dim('(fewest attempts)')}:`);
    for (const level of Object.keys(highScores)) {
        const score = highScores[level];
        const color = highScores[level] ? DIFFICULTIES[level].color : '#898989';
        await animLog(`- ${chalk.hex(color)(level)}: ${score ?? 'No record yet.'}`);
    }
}

async function ask(prompt) {
    throwIfInterrupted();
    return await rl.question(prompt, {
            signal: shutdownController.signal
    });
}

async function askDifficulty() {
    await animLog('\nPlease select the difficulty level:');
    await animLog(`1. ${chalk.hex('#2ECC71')('Easy')} (10 chances)`);
    await animLog(`2. ${chalk.hex('#F39C12')('Medium')} (5 chances)`);
    await animLog(`3. ${chalk.hex('#E74C3C')('Hard')} (3 chances)`);
    
    while (true) {
        const answer = (await ask(`\nEnter your choice ${chalk.dim('(number)')}: `))
            .trim();
        
        if (DIFFICULTIES[answer]) {
            return DIFFICULTIES[answer];
        }
        
        await animLog('\nInvalid choice. Please enter 1, 2, or 3.');
    }
}

async function askPlayAgain() {
    while (true) {
        const answer = (await ask('\nDo you want to play again? (y/n): '))
            .trim()
            .toLowerCase();

        if (answer === 'y' || answer === 'yes') return true;
        if (answer === 'n' || answer === 'no') return false;

        await animLog('Invalid input. Please answer with y or n.');
    }
}

async function askGuess() {
    while (true) {
        const answer = (await ask('Enter your guess: ')).trim();

        if (!/^\d+$/.test(answer)) {
            await animLog('\nInvalid input. Please enter a natural number.');
            continue;
        }

        const guess = Number(answer);

        if (guess < 1 || guess > 100) {
            await animLog('\nOut of range. Please enter a number between 1 and 100.');
            continue;
        }

        return guess;
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

    await animLog(`\nGreat! You have selected the ${difficulty.name} difficulty level.`);
    await animLog(`You have ${maxAttempts} chances to guess the correct number.`);
    await animLog('Let\'s start the game!');

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        await animLog(`\nAttempt ${attempt}/${maxAttempts}`);
        const guess = await askGuess();

        if (guess === secretNumber) {
            const duration = Date.now() - startedAt;
            await animLog(
                `Congratulations! You guessed the correct number in ${attempt} ${attempt === 1 ? 'attempt' : 'attempts'}.`
            );
            
            await animLog(`Time taken: ${formatDuration(duration)}.`);

            const isNewRecord = updateHighScore(difficulty.name, attempt);
            if (isNewRecord) {
                await animLog(`New high score for ${difficulty.name}!`);
            }

            return;
        }

        if (attempt === maxAttempts) {
            break;
        }

        if (guess < secretNumber) {
            const greater = chalk.white.bgHex('#F28C28');
            await animLog(`Incorrect! The number is ${greater} than ${guess}.`);
        } else {
            const less = chalk.white.bgHex('#28CEF2');
            await animLog(`Incorrect! The number is ${less} than ${guess}.`);
        }
    }

    await animLog('\nGame over! You ran out of chances.');
    await animLog(`The correct number was ${secretNumber}.`);
}

async function main() {
    try {
        await printWelcome();

        let keepPlaying = true;

        while (keepPlaying) {
            await printHighScores();
            await playRound();
            keepPlaying = await askPlayAgain();
        }

        await animLog('\nThanks for playing!');
    } catch (error) {
        if (
            error?.name === 'AbortError' ||
            error?.code === 'ABORT_ERR' ||
            error?.message === 'Interrupted by user'
        ) {
            console.log('\nThe game was interrupted by the user.');
            process.exitCode = 0;
        } else {
            console.error('\nUnexpected error:', error);
            process.exitCode = 1;
        }
    }    finally {
        logUpdate.done();
        rl.close();
    }
}

main();
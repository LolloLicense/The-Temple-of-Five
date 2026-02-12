
let totalTime = 0;
let roomTime = 0;

let totalMinutes = 0;
let roomMinutes = 0; 

let totalTimerInterval: any;
let roomTimerInterval: any;

export function testFunction() {
	console.log('Hello world from utils.ts');
}

export function startTimer(id: number): void {
	if (id === 0) {
		totalTimerInterval = setInterval( function() { timerTick(0) } , 1000); // om funktionen slutar funka testa setInterval(() => timerTick(0), 1000);
	} else {
		roomTimerInterval = setInterval( function() { timerTick(id) } , 1000); // om funktionen slutar funka testa setInterval(() => timerTick(id), 1000);
	}
}

export function stopTimer(id: number): void {
	if (id === 0) {
		clearInterval(totalTimerInterval);
	} else {
		clearInterval(roomTimerInterval);
	}
}

function timerTick(id: number) {
	if (id === 0) {
		totalTime++;
		if (totalTime > 59) {
			totalMinutes++;
			totalTime = 0;
		}
		console.log(`Total time: ${totalTime} seconds`);
		console.log(`Total minutes: ${totalMinutes} minutes`);
	} else {
		roomTime++;
		if (roomTime > 59) {
			roomMinutes++;
			roomTime = 0;
		}
		console.log(`Room minutes: ${roomMinutes} minutes`);
		console.log(`Room time: ${roomTime} seconds`);
	}

}
	

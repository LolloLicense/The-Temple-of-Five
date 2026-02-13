import './sass/style.scss';
import { startTimer, stopTimer } from './script/utils.ts';

console.log('Running startTimer(0) (total) imported from utils.ts');
startTimer(0);

console.log('Running startTimer(1) (room1) in 5 seconds');
setTimeout(function () {
	startTimer(1);
}, 5000);

console.log('Stopping both timers in 65 seconds');
setTimeout(function () {
	stopTimer(0);
	stopTimer(1);
	console.log('Both timers have been stopped');
}, 65000);

import { testFunction } from './utils.ts';

export function room1Function() {
	console.log('Running testFunction imported from utils.ts');
	testFunction();
}

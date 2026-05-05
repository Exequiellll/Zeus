const button = document.getElementById('clickMe');
const counter = document.getElementById('counter');
let clicks = 0;

button.addEventListener('click', () => {
    clicks++;
    counter.textContent = `Clicks: ${clicks}`;
});
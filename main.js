let questions = [];
let currentQuestionIndex = 0;
let timerId = null;

// The random timer interval boundaries in milliseconds (2 to 5 minutes)
const MIN_TIME = 2 * 60 * 1000;
const MAX_TIME = 5 * 60 * 1000;

const questionContainer = document.getElementById('question-container');
const questionText = document.getElementById('question-text');
const answerSlider = document.getElementById('answer-slider');
const sliderValueDisplay = document.getElementById('slider-value');
const submitButton = document.getElementById('submit-button');

// Load questions from local JSON file
async function loadQuestions() {
    try {
        const response = await fetch('questions.json');
        questions = await response.json();
        
        // Start the continuous ambient loop
        startTimer();
    } catch (error) {
        console.error("Failed to load questions:", error);
        questionText.textContent = "Could not load reflection questions.";
    }
}

function showNextQuestion() {
    if (questions.length === 0) return;
    
    // Pick a random question
    const randomIndex = Math.floor(Math.random() * questions.length);
    questionText.textContent = questions[randomIndex];
    
    // Reset slider
    answerSlider.value = 5;
    sliderValueDisplay.textContent = "5";
    
    // Fade in the UI
    questionContainer.classList.add('visible');
}

function hideQuestion() {
    questionContainer.classList.remove('visible');
}

function startTimer() {
    // Determine random interval between MIN_TIME and MAX_TIME
    const waitTime = Math.random() * (MAX_TIME - MIN_TIME) + MIN_TIME;
    
    timerId = setTimeout(() => {
        showNextQuestion();
    }, waitTime);
}

// Event Listeners
answerSlider.addEventListener('input', (e) => {
    sliderValueDisplay.textContent = e.target.value;
});

submitButton.addEventListener('click', () => {
    // Record the answer (in a real app, send to database)
    console.log(`Answered: ${answerSlider.value} for question: "${questionText.textContent}"`);
    
    // Hide UI and restart the ambient phase
    hideQuestion();
    startTimer();
});

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', loadQuestions);

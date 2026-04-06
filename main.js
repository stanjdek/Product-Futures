let questions = [];
let currentQuestionIndex = 0;
let timerId = null;

// The timer interval in milliseconds.
// Set to 8 seconds for testing. In prod this will be 3 * 60 * 1000 to 5 * 60 * 1000.
const TIMER_INTERVAL = 8000; 

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
    // Determine random interval between 3 to 5 minutes for production
    // const waitTime = Math.random() * (5 * 60 * 1000 - 3 * 60 * 1000) + 3 * 60 * 1000;
    
    // Using 8 seconds for testing
    const waitTime = TIMER_INTERVAL;
    
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

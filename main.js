let questionsObj = {};
let activeQuestionPool = [];
let surveyQuestions = [];

let currentSurveyIndex = 0;
let surveyScores = [];
let userPersonality = null;
let userName = '';

// Supabase Setup
// We still need your real Anon Key to make this work!
const supabaseUrl = 'https://kvefgffuwftxwbaizggp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2ZWZnZmZ1d2Z0eHdiYWl6Z2dwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NTM1MjIsImV4cCI6MjA5MTEyOTUyMn0.zYxLGvN5pKq2b58JreXI9jtQcqe1AvsJraCRvFHdltM';
let supabase = null;
try {
    if (window.supabase) {
        supabase = window.supabase.createClient(supabaseUrl, supabaseKey);
    } else {
        console.warn("Supabase library not found. Was it blocked by an adblocker?");
    }
} catch (e) {
    console.error("Failed to initialize Supabase:", e);
}

// App phases: "SURVEY" or "REFLECTION"
let appPhase = "SURVEY";

let timerId = null;

// The random timer interval boundaries in milliseconds (2 to 5 minutes)
const MIN_TIME = 2 * 60 * 1000;
const MAX_TIME = 5 * 60 * 1000;

// If you want to test the ambient wait, comment out the lines above and uncomment below
// const MIN_TIME = 5000; 
// const MAX_TIME = 10000;

const questionContainer = document.getElementById('question-container');
const phaseSubtitle = document.getElementById('phase-subtitle');
const questionText = document.getElementById('question-text');
const answerSlider = document.getElementById('answer-slider');
const sliderValueDisplay = document.getElementById('slider-value');
const submitButton = document.getElementById('submit-button');
const labelLeft = document.querySelector('.label-left');
const labelRight = document.querySelector('.label-right');

const nameOverlay = document.getElementById('name-overlay');
const userNameInput = document.getElementById('user-name-input');
const startSurveyButton = document.getElementById('start-survey-button');

// Load configurations
async function loadConfig() {
    try {
        const [qsRes, surveyRes] = await Promise.all([
            fetch('questions.json'),
            fetch('survey.json')
        ]);
        questionsObj = await qsRes.json();
        surveyQuestions = await surveyRes.json();
        
        // Wait for the user to enter their name instead of auto-starting
        console.log("Config loaded. Waiting for user name.");
    } catch (error) {
        console.error("Failed to load configs:", error);
        questionText.textContent = "Could not load components.";
    }
}

function startSurvey() {
    appPhase = "SURVEY";
    phaseSubtitle.textContent = `Personality Baseline (${currentSurveyIndex + 1}/${surveyQuestions.length})`;
    
    if (surveyQuestions.length > 0) {
        showQuestion(surveyQuestions[currentSurveyIndex]);
    } else {
        finishSurvey();
    }
}

function finishSurvey() {
    // Calculate category
    const totalScore = surveyScores.reduce((a, b) => a + b, 0);
    const averageScore = totalScore / surveyScores.length;
    
    if (averageScore < 2.5) {
        userPersonality = "introvert";
    } else if (averageScore <= 3.5) {
        userPersonality = "ambivert";
    } else {
        userPersonality = "extrovert";
    }
    
    // Save the score and personality to local storage so it can be checked later
    localStorage.setItem('surveyAverageScore', averageScore.toFixed(2));
    localStorage.setItem('surveyPersonality', userPersonality);
    localStorage.setItem('surveyRawScores', JSON.stringify(surveyScores));
    
    console.log(`Survey complete. Average: ${averageScore.toFixed(1)}. Categorized as: ${userPersonality}`);
    
    // Attempt to save to Supabase
    if (supabase && supabaseKey !== 'YOUR_ANON_KEY_HERE') {
        supabase.from('survey_responses').insert([{
            name: userName,
            personality: userPersonality,
            average_score: averageScore,
            raw_scores: surveyScores
        }]).then((response) => {
            if (response.error) console.error("Error saving to Supabase:", response.error);
            else console.log("Successfully saved to Supabase!");
        });
    } else {
        console.warn("Could not save to Supabase: The Anon Key is missing or Supabase failed to load.");
    }
    
    // Set our active pool
    activeQuestionPool = questionsObj[userPersonality] || [];
    
    // Move to ambient state
    appPhase = "REFLECTION";
    hideQuestion();
    startAmbientTimer();
}

function showQuestion(text) {
    questionText.textContent = text;
    
    if (appPhase === "SURVEY") {
        answerSlider.min = "1";
        answerSlider.max = "5";
        labelLeft.textContent = "1 - Strongly Disagree";
        labelRight.textContent = "5 - Strongly Agree";
        answerSlider.value = 3;
        sliderValueDisplay.textContent = "3";
    } else {
        answerSlider.min = "1";
        answerSlider.max = "10";
        labelLeft.textContent = "1 - Doesn't apply to me";
        labelRight.textContent = "10 - Very much applies to me";
        answerSlider.value = 5;
        sliderValueDisplay.textContent = "5";
    }
    
    // Fade in
    questionContainer.classList.add('visible');
}

function hideQuestion() {
    questionContainer.classList.remove('visible');
}

function startAmbientTimer() {
    phaseSubtitle.textContent = ``;
    
    const waitTime = Math.random() * (MAX_TIME - MIN_TIME) + MIN_TIME;
    console.log(`Waiting for ${Math.round(waitTime / 1000)}s before next reflection.`);
    
    timerId = setTimeout(() => {
        if (activeQuestionPool.length === 0) return;
        
        // Pick random question from evaluated active pool
        const randomIndex = Math.floor(Math.random() * activeQuestionPool.length);
        
        showQuestion(activeQuestionPool[randomIndex]);
    }, waitTime);
}

// Event Listeners
answerSlider.addEventListener('input', (e) => {
    sliderValueDisplay.textContent = e.target.value;
});

submitButton.addEventListener('click', () => {
    const score = parseInt(answerSlider.value, 10);
    
    if (appPhase === "SURVEY") {
        surveyScores.push(score);
        hideQuestion();
        
        currentSurveyIndex++;
        
        // Wait 3 seconds for calm ambient reset between survey questions
        setTimeout(() => {
            if (currentSurveyIndex < surveyQuestions.length) {
                phaseSubtitle.textContent = `Personality Baseline (${currentSurveyIndex + 1}/${surveyQuestions.length})`;
                showQuestion(surveyQuestions[currentSurveyIndex]);
            } else {
                finishSurvey();
            }
        }, 3000); 
        
    } else if (appPhase === "REFLECTION") {
        console.log(`Answered ambient reflection: ${score}`);
        hideQuestion();
        startAmbientTimer();
    }
});

startSurveyButton.addEventListener('click', () => {
    const freshInput = document.getElementById('user-name-input');
    const enteredName = freshInput ? freshInput.value.trim() : '';

    if (enteredName === '') {
        // Flash the input red to indicate a name is required
        if (freshInput) {
            freshInput.classList.add('error');
            setTimeout(() => freshInput.classList.remove('error'), 800);
        }
        return;
    }
    
    // Give immediate feedback
    startSurveyButton.textContent = "Starting...";
    startSurveyButton.style.opacity = '0.5';
    
    userName = enteredName;
    
    // Wait briefly so they see the button react, then fade overlay fast
    setTimeout(() => {
        nameOverlay.classList.remove('visible');
        setTimeout(() => {
            nameOverlay.style.display = 'none'; // fully remove from flow 
            startSurvey();
        }, 800); 
    }, 200);
});

// Allow hitting enter key for the name input
userNameInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        startSurveyButton.click();
    }
});

// Start the app when DOM is ready
document.addEventListener('DOMContentLoaded', loadConfig);

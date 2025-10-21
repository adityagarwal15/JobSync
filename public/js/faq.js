document.addEventListener("DOMContentLoaded", () => {
//toggle FAQ answers
const faqCards= document.querySelectorAll(".faq-card");
const searchInput = document.getElementById("faqSearch");
let isSpeaking = false;
let currentUtterance= null;

faqCards.forEach(card => {
    const question = card.querySelector(".faq-question");
    const answer = card.querySelector(".faq-answer");
    const speakBtn = card.querySelector(".speak-btn");
    answer.style.display= "none";

    question.addEventListener("click", () => {
        const isVisible = answer.style.display === "block";
        gsap.to(answer, {
            duration: 0.3,
            height: isVisible ? 0 : "auto", 
            opacity: isVisible ? 0 : 1,
            onStart: () => {
                if(!isVisible) answer.style.display = "block";
            },
            onComplete: () => {
                if(isVisible) answer.style.display = "none";
            }
        });
    });
    

//voice answer using Web Speech API
//document.querySelectorAll(".speak-btn").forEach(btn => {
    speakBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        const answerText= e.currentTarget.dataset.answer;
        if (!"speechSynthesis" in window) {
            alert("Sorry, your browser does not support voice playback.");
            return;
        } 
        if (isSpeaking) {   
            speechSynthesis.cancel(); //stop existing speech
            isSpeaking= false;
            speakBtn.textContent= "🔊";
            return;
        }
        //start speaking
        currentUtterance = new SpeechSynthesisUtterance(answerText);
        currentUtterance.lang= "en-IN";
        currentUtterance.rate = 1;
        currentUtterance.pitch = 1;

        speechSynthesis.cancel(); //stop ongoing
        speechSynthesis.speak(currentUtterance);
        speakBtn.textContent= "⏹️";
        isSpeaking= true;

        //reset button when speech ends
        currentUtterance.onend= () => {
            isSpeaking= false;
            speakBtn.textContent= "🔊";
        };
    });
});

    //search filtering
    if(searchInput) {
        searchInput.addEventListener("input",(e)=> {
            const query= e.target.value.toLowerCase();
            faqCards.forEach(card => {
                const text= card.querySelector(".faq-question span").textContent.toLowerCase();
                card.style.display= text.includes(query) ? "block" : "none";
            });
        });
    }
});
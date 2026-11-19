// ======================================================
// 1. CAREER SKILLS
// ======================================================

const careerSkills = {
    frontend: ["HTML", "CSS", "JavaScript", "React"],

    python: ["Python", "SQL", "Django", "Git"],

    data: ["Python", "SQL", "Excel", "Power BI"],

    cybersecurity: [
        "Networking",
        "Linux",
        "Python",
        "Cybersecurity Fundamentals",
        "SIEM"
    ],

    machinelearning: [
        "Python",
        "Statistics",
        "Machine Learning",
        "SQL",
        "TensorFlow"
    ],

    uiux: [
        "Figma",
        "Wireframing",
        "Prototyping",
        "User Research",
        "Visual Design"
    ],

    fullstack: [
        "HTML",
        "CSS",
        "JavaScript",
        "React",
        "Node.js",
        "Express",
        "SQL",
        "Git"
    ],

    cloud: [
        "Linux",
        "Networking",
        "AWS",
        "Docker",
        "Git"
    ]
};


// ======================================================
// 2. CAREER NAMES
// ======================================================

const careerNames = {
    frontend: "Frontend Developer",
    python: "Python Developer",
    data: "Data Analyst",
    cybersecurity: "Cybersecurity Analyst",
    machinelearning: "Machine Learning Engineer",
    uiux: "UI/UX Designer",
    fullstack: "Full Stack Developer",
    cloud: "Cloud Engineer"
};


// ======================================================
// 3. SKILL DETAILS
// ======================================================

const skillDetails = {
    HTML: "Learn webpage structure and semantic HTML elements.",
    CSS: "Learn styling, layouts, colors, and responsive design.",
    JavaScript: "Learn programming fundamentals and interactive webpages.",
    React: "Learn components, props, state, and React fundamentals.",
    Python: "Learn Python syntax, functions, loops, and data structures.",
    SQL: "Learn database queries and data management.",
    Django: "Learn Django basics and how to build web applications.",
    Git: "Learn version control and managing code changes.",
    Excel: "Learn spreadsheets, formulas, and data analysis.",
    "Power BI": "Learn data visualization and dashboard creation.",
    Networking: "Learn network fundamentals and communication protocols.",
    Linux: "Learn Linux commands and operating system fundamentals.",
    "Cybersecurity Fundamentals": "Learn security principles and common cyber threats.",
    SIEM: "Learn security monitoring and event analysis.",
    Statistics: "Learn probability, statistics, and data interpretation.",
    "Machine Learning": "Learn machine learning concepts and algorithms.",
    TensorFlow: "Learn the basics of building machine learning models.",
    Figma: "Learn interface design using Figma.",
    Wireframing: "Learn to create basic layouts for digital products.",
    Prototyping: "Learn to create interactive design prototypes.",
    "User Research": "Learn how to understand user needs and behavior.",
    "Visual Design": "Learn visual hierarchy, typography, and design principles.",
    "Node.js": "Learn server-side JavaScript development.",
    Express: "Learn how to build web servers and APIs using Express.",
    AWS: "Learn cloud computing fundamentals using AWS.",
    Docker: "Learn containerization and basic Docker workflows."
};


// ======================================================
// 4. GET HTML ELEMENTS
// ======================================================

const careerSelect = document.getElementById("career");

const roadmapButton = document.getElementById("show-roadmap");

const skillsContainer = document.getElementById("dynamic-skills");

const analyzeButton = document.getElementById("analyze-skills");

const userSkillsInput = document.getElementById("user-skills");

const resultsContainer = document.getElementById("skill-gap-results");


// ======================================================
// 5. DATABASE PROGRESS VARIABLES
// ======================================================

// Progress received from the Flask database API.

let serverProgress = {};

let selectedCareerFromServer = null;


// ======================================================
// 6. SAVE SELECTED CAREER TO DATABASE
// ======================================================

async function saveSelectedCareer(career) {

    if (!career || !careerSkills[career]) {
        return;
    }

    try {

        const response = await fetch("/api/career", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                career: career
            })

        });

        if (!response.ok) {
            throw new Error("Could not save selected career.");
        }

        selectedCareerFromServer = career;

        // Keep this for compatibility with the resources page.
        localStorage.setItem("selectedCareer", career);

    } catch (error) {

        console.error("Career saving error:", error);

    }
}


// ======================================================
// 7. SAVE SKILL PROGRESS TO DATABASE
// ======================================================

async function saveSkillProgress(career, skill, completed) {

    try {

        const response = await fetch("/api/progress", {

            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({

                career: career,

                skill: skill,

                completed: completed

            })

        });

        if (!response.ok) {
            throw new Error("Could not save skill progress.");
        }

        // Update local JavaScript progress after successful saving.
        if (!serverProgress[career]) {
            serverProgress[career] = {};
        }

        serverProgress[career][skill] = completed;

        updateProgress();

    } catch (error) {

        console.error("Progress saving error:", error);

        alert("Unable to save your progress. Please try again.");

    }
}


// ======================================================
// 8. LOAD PROGRESS FROM DATABASE
// ======================================================

async function loadServerProgress() {

    try {

        const response = await fetch("/api/progress");

        if (!response.ok) {
            throw new Error("Could not load saved progress.");
        }

        const data = await response.json();

        serverProgress = data.progress || {};

        selectedCareerFromServer = data.selectedCareer || null;

        // Keep the selected career available to the resources page.
        if (selectedCareerFromServer) {

            localStorage.setItem(
                "selectedCareer",
                selectedCareerFromServer
            );

        }

        return true;

    } catch (error) {

        console.error("Database loading error:", error);

        return false;

    }
}


// ======================================================
// 9. GET COMPLETED SKILLS
// ======================================================

function isSkillCompleted(career, skill) {

    if (!serverProgress[career]) {
        return false;
    }

    return serverProgress[career][skill] === true;

}


// ======================================================
// 10. UPDATE ROADMAP PROGRESS
// ======================================================

function updateProgress() {

    if (!skillsContainer) {
        return;
    }

    const checkboxes = skillsContainer.querySelectorAll(".skill-check");

    const total = checkboxes.length;

    let completed = 0;

    checkboxes.forEach(function(checkbox) {

        if (checkbox.checked) {
            completed++;
        }

    });

    const percentage = total > 0
        ? Math.round((completed / total) * 100)
        : 0;

    const progressText = document.getElementById("progress-text");

    const progressFill = document.getElementById("progress-fill");

    if (progressText) {
        progressText.textContent = percentage + "% Completed";
    }

    if (progressFill) {
        progressFill.style.width = percentage + "%";
    }

}


// ======================================================
// 11. GENERATE CAREER ROADMAP
// ======================================================

function generateRoadmap(selectedCareer) {

    if (!selectedCareer || !careerSkills[selectedCareer]) {
        return;
    }

    if (!skillsContainer) {
        return;
    }

    // Save selected career.
    saveSelectedCareer(selectedCareer);

    // Clear previous roadmap.
    skillsContainer.innerHTML = "";

    const skills = careerSkills[selectedCareer];

    skills.forEach(function(skill, index) {

        const skillCard = document.createElement("div");

        skillCard.className = "skill-card";

        const skillTitle = document.createElement("h3");

        skillTitle.textContent = "Step " + (index + 1) + ": " + skill;

        const skillDescription = document.createElement("p");

        skillDescription.textContent =
            skillDetails[skill] || "Learn the fundamentals of " + skill + ".";

        const checkboxContainer = document.createElement("label");

        checkboxContainer.className = "skill-label";

        const checkbox = document.createElement("input");

        checkbox.type = "checkbox";

        checkbox.className = "skill-check";

        checkbox.checked = isSkillCompleted(selectedCareer, skill);

        const checkboxText = document.createElement("span");

        checkboxText.textContent = "Mark as completed";

        checkbox.addEventListener("change", function() {

            saveSkillProgress(
                selectedCareer,
                skill,
                checkbox.checked
            );

        });

        checkboxContainer.appendChild(checkbox);

        checkboxContainer.appendChild(checkboxText);

        skillCard.appendChild(skillTitle);

        skillCard.appendChild(skillDescription);

        skillCard.appendChild(checkboxContainer);

        skillsContainer.appendChild(skillCard);

    });

    updateProgress();

}


// ======================================================
// 12. CAREER RECOMMENDATIONS
// ======================================================

function getCareerRecommendations(existingSkills) {

    const recommendations = [];

    Object.keys(careerSkills).forEach(function(career) {

        const requiredSkills = careerSkills[career];

        let matchedSkills = 0;

        requiredSkills.forEach(function(skill) {

            if (existingSkills.includes(skill.toLowerCase())) {
                matchedSkills++;
            }

        });

        const matchPercentage = Math.round(
            (matchedSkills / requiredSkills.length) * 100
        );

        recommendations.push({

            career: career,

            name: careerNames[career],

            matchedSkills: matchedSkills,

            totalSkills: requiredSkills.length,

            percentage: matchPercentage

        });

    });

    recommendations.sort(function(a, b) {

        return b.percentage - a.percentage;

    });

    return recommendations;

}


// ======================================================
// 13. ANALYZE SKILL GAPS
// ======================================================

function analyzeSkillGaps() {

    if (!userSkillsInput || !resultsContainer) {
        return;
    }

    const input = userSkillsInput.value.trim();

    if (!input) {

        resultsContainer.innerHTML =
            "<p>Please enter your existing skills first.</p>";

        return;

    }

    // Convert entered skills into an array.
    const existingSkills = input
        .split(",")
        .map(function(skill) {
            return skill.trim().toLowerCase();
        })
        .filter(function(skill) {
            return skill !== "";
        });

    // Get career recommendations.
    const recommendations = getCareerRecommendations(existingSkills);

    resultsContainer.innerHTML = "";

    const heading = document.createElement("h2");

    heading.textContent = "Your Career Recommendations";

    resultsContainer.appendChild(heading);

    // Display recommendations.
    recommendations.forEach(function(recommendation) {

        const recommendationCard = document.createElement("div");

        recommendationCard.className = "recommendation-card";

        const careerHeading = document.createElement("h3");

        careerHeading.textContent = recommendation.name;

        const matchText = document.createElement("p");

        matchText.textContent =
            "Skill Match: " + recommendation.percentage + "%";

        const matchedText = document.createElement("p");

        matchedText.textContent =
            "Matched Skills: " +
            recommendation.matchedSkills +
            " / " +
            recommendation.totalSkills;

        const selectButton = document.createElement("button");

        selectButton.textContent = "Choose This Career";

        selectButton.type = "button";

        selectButton.addEventListener("click", function() {

            selectRecommendedCareer(recommendation.career);

        });

        recommendationCard.appendChild(careerHeading);

        recommendationCard.appendChild(matchText);

        recommendationCard.appendChild(matchedText);

        recommendationCard.appendChild(selectButton);

        resultsContainer.appendChild(recommendationCard);

    });

}


// ======================================================
// 14. SELECT A RECOMMENDED CAREER
// ======================================================

function selectRecommendedCareer(career) {

    if (!careerSkills[career]) {
        return;
    }

    if (careerSelect) {
        careerSelect.value = career;
    }

    saveSelectedCareer(career);

    // Generate the selected career's roadmap.
    generateRoadmap(career);

    // Display missing skills.
    displaySkillGaps(career);

}


// ======================================================
// 15. DISPLAY MISSING SKILLS
// ======================================================

function displaySkillGaps(career) {

    if (!resultsContainer || !careerSkills[career]) {
        return;
    }

    const existingSkills = userSkillsInput
        ? userSkillsInput.value
            .split(",")
            .map(function(skill) {
                return skill.trim().toLowerCase();
            })
        : [];

    const missingSkills = careerSkills[career].filter(function(skill) {

        return !existingSkills.includes(skill.toLowerCase());

    });

    const gapSection = document.createElement("div");

    gapSection.className = "skill-gap-section";

    const heading = document.createElement("h3");

    heading.textContent = "Your Missing Skills";

    gapSection.appendChild(heading);

    if (missingSkills.length === 0) {

        const message = document.createElement("p");

        message.textContent =
            "Great! You already have all the listed skills for this career.";

        gapSection.appendChild(message);

    } else {

        const list = document.createElement("ul");

        missingSkills.forEach(function(skill) {

            const item = document.createElement("li");

            item.textContent = skill;

            list.appendChild(item);

        });

        gapSection.appendChild(list);

    }

    resultsContainer.appendChild(gapSection);

    // Keep missing skills available for the resources page.
    localStorage.setItem(
        "missingSkills",
        JSON.stringify(missingSkills)
    );

}


// ======================================================
// 16. CAREER DROPDOWN EVENT
// ======================================================

if (careerSelect) {

    careerSelect.addEventListener("change", function() {

        const selectedCareer = careerSelect.value;

        if (selectedCareer && careerSkills[selectedCareer]) {

            saveSelectedCareer(selectedCareer);

        }

    });

}


// ======================================================
// 17. ROADMAP BUTTON EVENT
// ======================================================

if (roadmapButton) {

    roadmapButton.addEventListener("click", function() {

        const selectedCareer = careerSelect
            ? careerSelect.value
            : "";

        if (!selectedCareer || !careerSkills[selectedCareer]) {

            alert("Please select a career first.");

            return;

        }

        generateRoadmap(selectedCareer);

    });

}


// ======================================================
// 18. ANALYZE BUTTON EVENT
// ======================================================

if (analyzeButton) {

    analyzeButton.addEventListener("click", function() {

        analyzeSkillGaps();

    });

}


// ======================================================
// 19. LOAD SAVED ROADMAP WHEN PAGE OPENS
// ======================================================

document.addEventListener("DOMContentLoaded", async function() {

    const loaded = await loadServerProgress();

    if (!loaded) {
        return;
    }

    if (
        selectedCareerFromServer &&
        careerSkills[selectedCareerFromServer]
    ) {

        if (careerSelect) {
            careerSelect.value = selectedCareerFromServer;
        }

        generateRoadmap(selectedCareerFromServer);

    }

});

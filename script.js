// POULT PAL - MAIN JAVASCRIPT
// ===================================
 
 
// GET HTML ELEMENTS
 
const usernameInput = document.getElementById("username");
const startBtn = document.getElementById("start-btn");
const signUpBtn = document.getElementById("signup-btn");
 
const homeScreen = document.getElementById("home-screen");
const eggScreen = document.getElementById("egg-screen");
const hatchingScreen = document.getElementById("hatching-screen");
const introScreen = document.getElementById("intro-screen");
const instructionsScreen = document.getElementById("instructions-screen");
const gameplayScreen = document.getElementById("gameplay-screen");
 
const eggButtons = document.querySelectorAll(".egg");
const eggMessage = document.getElementById("egg-message");
 
const hatchingEgg = document.getElementById("hatching-egg");
const hatchingMessage = document.getElementById("hatching-message");
 
const instructionsBtn = document.getElementById("instructions-btn");
const beginCareBtn = document.getElementById("begin-care-btn");
 
 
// ===================================
// PLAYER PROFILE SYSTEM
// ===================================
 
// Load saved player data safely from this browser's local storage.
let gameRecords = [];
let playerProfiles = {};
try {
    gameRecords = JSON.parse(localStorage.getItem("poultPalRecords")) || [];
    playerProfiles = JSON.parse(localStorage.getItem("poultPalPlayers")) || {};
} catch (error) {
    console.warn("Poult Pal could not read saved data:", error);
}
 
let chickenStatus = {
    hunger: 100,
    thirst: 100,
    health: 100,
    stress: 0
};
 
let currentUsername = "";
let currentPlayer = null;
 
let selectedEgg = null;
let isHatching = false;
 
let currentChickName = "";
 
// ===================================
// FOOD AND WATER VARIABLES
// ===================================
 
let foodTimeout = null;
let waterTimeout = null;
 
let foodIsAvailable = false;
let waterIsAvailable = false;
 
 
// ===================================
// SCREEN MANAGEMENT
// ===================================
 
function showScreen(screenToShow) {
 
    const screens = [
        homeScreen,
        eggScreen,
        hatchingScreen,
        introScreen,
        instructionsScreen,
        gameplayScreen
    ];
 
    screens.forEach(function(screen) {
        screen.classList.add("hidden");
    });
 
    screenToShow.classList.remove("hidden");
 
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
 
}
 
 
// ===================================
// PLAYER DASHBOARD
// ===================================
 
function updateDashboard() {
    const totalGamesEl = document.getElementById("total-games");
    const highScoreEl = document.getElementById("high-score");
    const lastScoreEl = document.getElementById("last-score");
    const sessionSummary = document.getElementById("session-summary");
 
    // Show the signed-in player's saved statistics; keep older profiles compatible.
    if (currentPlayer) {
        currentPlayer.gamesPlayed = Number(currentPlayer.gamesPlayed) || 0;
        currentPlayer.highScore = Number(currentPlayer.highScore) || 0;
        currentPlayer.lastScore = Number(currentPlayer.lastScore) || 0;
 
        totalGamesEl.textContent = currentPlayer.gamesPlayed;
        highScoreEl.textContent = currentPlayer.highScore;
        lastScoreEl.textContent = currentPlayer.lastScore;
 
        if (currentPlayer.savedGame) {
            const saved = currentPlayer.savedGame;
            sessionSummary.textContent =
                "Saved game: Day " + (saved.gameDay || 1) + " of 3 · " +
                (saved.chickName || currentPlayer.chickName || "Your chick") +
                " · Score " + (saved.currentScore || 0);
        } else if (currentPlayer.lastGame) {
            const last = currentPlayer.lastGame;
            const resultText = last.result === "completed"
                ? "Completed all 3 days"
                : "Game over on Day " + (last.day || 1);
            sessionSummary.textContent =
                "Last game: " + resultText + " · Score " + (last.score || 0);
        } else {
            sessionSummary.textContent = "No saved game yet. Start your first game!";
        }
    } else {
        totalGamesEl.textContent = "0";
        highScoreEl.textContent = "0";
        lastScoreEl.textContent = "0";
        sessionSummary.textContent = "Sign in to view your saved game.";
    }
 
    // Show the five highest saved scores from all players.
    const leaderboardList = document.getElementById("leaderboard-list");
    leaderboardList.innerHTML = "";
 
    const sortedRecords = [...gameRecords].sort(function(a, b) {
        return (Number(b.score) || 0) - (Number(a.score) || 0);
    });
 
    const topPlayers = sortedRecords.slice(0, 5);
    if (topPlayers.length === 0) {
        leaderboardList.innerHTML = "<li>No records yet. Start playing!</li>";
        return;
    }
 
    topPlayers.forEach(function(record, index) {
        const listItem = document.createElement("li");
        listItem.textContent =
            (index + 1) + ". " + record.username + " - " +
            (Number(record.score) || 0) + " points";
        leaderboardList.appendChild(listItem);
    });
}
 
// ===================================
// PLAYER LOGIN / REGISTRATION
// ===================================
 
const loginMessage = document.getElementById("login-message");
 
// Sign in opens an existing profile; sign up creates a new username.
startBtn.addEventListener("click", function() {
    handlePlayerAccount("signin");
});
 
signUpBtn.addEventListener("click", function() {
    handlePlayerAccount("signup");
});
 
usernameInput.addEventListener("keydown", function(event) {
    if (event.key === "Enter") {
        handlePlayerAccount("signin");
    }
});
 
function handlePlayerAccount(mode) {
    const username = usernameInput.value.trim();
 
    if (username === "") {
        loginMessage.textContent = "Please enter your username first.";
        usernameInput.focus();
        return;
    }
 
    if (!/^[a-zA-Z0-9_ ]{3,20}$/.test(username)) {
        loginMessage.textContent =
            "Use 3–20 letters, numbers, spaces, or underscores.";
        usernameInput.focus();
        return;
    }
 
    currentUsername = username;
 
    if (mode === "signup") {
        // A username can only be registered once in this browser.
        if (playerProfiles[currentUsername]) {
            loginMessage.textContent =
                "That username is already registered. Please press Sign In.";
            return;
        }
 
        // Create a fresh player profile before allowing access to the game.
        currentPlayer = {
            username: currentUsername,
            chickName: "",
            savedGame: null,
            gamesPlayed: 0,
            highScore: 0,
            lastScore: 0,
            lastGame: null
        };
 
        playerProfiles[currentUsername] = currentPlayer;
        savePlayerProfiles();
        loginMessage.textContent = "Account created! Welcome to Poult Pal! 🐣";
    } else {
        // Sign in is only for usernames that already have a registered profile.
        if (!playerProfiles[currentUsername]) {
            currentPlayer = null;
            loginMessage.textContent =
                "Username not found. Please press Sign Up to create your account and start playing.";
            updateDashboard();
            return;
        }
 
        currentPlayer = playerProfiles[currentUsername];
        currentPlayer.username = currentUsername;
        currentPlayer.gamesPlayed = Number(currentPlayer.gamesPlayed) || 0;
        currentPlayer.highScore = Number(currentPlayer.highScore) || 0;
        currentPlayer.lastScore = Number(currentPlayer.lastScore) || 0;
        savePlayerProfiles();
        loginMessage.textContent = "Welcome back, " + currentUsername + "!";
 
        if (currentPlayer.savedGame) {
            const choice = confirm(
                "Welcome back, " + currentUsername + "!\n\n" +
                "We found your saved game.\n" +
                "Current progress: Day " + (currentPlayer.savedGame.gameDay || 1) +
                " of 3 | Score: " + (currentPlayer.savedGame.currentScore || 0) + "\n\n" +
                "Press OK to CONTINUE your game.\n" +
                "Press CANCEL to START A NEW GAME."
            );
 
            if (choice) {
                loadSavedGame();
                updateDashboard();
                return;
            }
 
            const confirmNewGame = confirm(
                "Start a new game? Your saved progress will be replaced."
            );
            if (!confirmNewGame) {
                updateDashboard();
                return;
            }
 
            currentPlayer.savedGame = null;
            savePlayerProfiles();
        }
    }
 
    // Only a successfully registered or signed-in player can enter the game.
    prepareNewGame();
    eggMessage.textContent = "Select one egg to continue.";
    showScreen(eggScreen);
    updateDashboard();
}
 
// ===================================
// SAVE PLAYER PROFILES
// ===================================
 
function savePlayerProfiles() {
 
    localStorage.setItem(
        "poultPalPlayers",
        JSON.stringify(playerProfiles)
    );
 
}
 
// ===================================
// SAVE CURRENT GAME
// ===================================
 
function saveCurrentGame() {
 
    if (!currentPlayer || !gameIsActive) {
        return;
    }
 
    currentPlayer.chickName = currentChickName;
 
    currentPlayer.savedGame = {
        selectedEgg: selectedEgg,
        chickName: currentChickName,
 
        chickenStatus: {
            hunger: chickenStatus.hunger,
            thirst: chickenStatus.thirst,
            health: chickenStatus.health,
            stress: chickenStatus.stress
        },
 
        currentScore: currentScore,
 
        elapsedGameMinutes: elapsedGameMinutes,
        gameHour: gameHour,
        gameDay: gameDay,
 
        lightsAreOn: lightsAreOn
    };
 
    playerProfiles[currentUsername] = currentPlayer;
 
    savePlayerProfiles();
}
 
// ===================================
// LOAD SAVED GAME
// ===================================
 
function loadSavedGame() {
 
    if (!currentPlayer || !currentPlayer.savedGame) {
        return;
    }
 
    const saved = currentPlayer.savedGame;
 
    // Restore player information.
 
    currentChickName = saved.chickName;
    selectedEgg = saved.selectedEgg;
 
    // Restore chicken status.
 
    chickenStatus = {
        hunger: Number(saved.chickenStatus?.hunger ?? 100),
        thirst: Number(saved.chickenStatus?.thirst ?? 100),
        health: Number(saved.chickenStatus?.health ?? 100),
        stress: Number(saved.chickenStatus?.stress ?? 0)
    };
 
    // Restore score and game time.
 
    currentScore = Number(saved.currentScore) || 0;
 
    elapsedGameMinutes = Number(saved.elapsedGameMinutes) || 0;
    gameHour = Number.isFinite(Number(saved.gameHour))
        ? Number(saved.gameHour) : 6;
    gameDay = Number(saved.gameDay) || 1;
 
    lightsAreOn = saved.lightsAreOn !== false;
 
    // Restore gameplay display.
 
    chickenNameDisplay.textContent = currentChickName;
 
    playerGreeting.textContent =
        "Welcome back, " + currentUsername + "!";
 
    scoreDisplay.textContent = currentScore;
 
    if (lightsAreOn) {
        chickenEnvironment.classList.remove("lights-off");
        lightsBtn.textContent = "💡 Lights On";
    } else {
        chickenEnvironment.classList.add("lights-off");
        lightsBtn.textContent = "🌙 Lights Off";
    }
 
    updateChickenStatus();
    updateGameClock();
 
    // Open gameplay screen.
 
    showScreen(gameplayScreen);
 
    // Resume game timer.
 
    startResumedGameClock();
 
}
 
// ===================================
// PREPARE NEW GAME
// ===================================
 
function prepareNewGame() {
 
    currentChickName = "";
    selectedEgg = null;
 
    chickenStatus = {
        hunger: 100,
        thirst: 100,
        health: 100,
        stress: 0
    };
 
    currentScore = 0;
 
    elapsedGameMinutes = 0;
    gameHour = 6;
    gameDay = 1;
 
    lightsAreOn = true;
 
    resetFoodAndWater();
 
    chickenNameDisplay.textContent = "Your Chick";
 
    chickenMessage.textContent =
        "Your new chicken adventure begins! 🐥";
 
    updateChickenStatus();
    updateGameClock();
 
}
 
// ===================================
// RESUME SAVED GAME CLOCK
// ===================================
 
function startResumedGameClock() {
 
    if (gameInterval !== null) {
        clearInterval(gameInterval);
    }
 
    gameIsActive = true;
 
    gameInterval = setInterval(function() {
 
        elapsedGameMinutes++;
 
        gameHour++;
 
        if (gameHour >= 24) {
            gameHour = 0;
        }
 
        gameDay = Math.min(
            3,
            Math.floor(elapsedGameMinutes / 24) + 1
        );
 
        updateGameClock();
 
        if (elapsedGameMinutes % 3 === 0) {
            decreaseChickenNeeds();
        }
 
        if (elapsedGameMinutes >= 72 && gameIsActive) {
            finishGame("completed");
        }
 
        if (gameIsActive) {
            saveCurrentGame();
        }
 
    }, 60000);
 
}
 
// ===================================
// EGG SELECTION
// ===================================
 
eggButtons.forEach(function(egg) {
 
    egg.addEventListener("click", function() {
 
        // Prevent selecting multiple eggs during hatching
        if (isHatching) return;
 
        // Remove previous selection
        eggButtons.forEach(function(button) {
            button.classList.remove("selected");
        });
 
        // Select current egg
        egg.classList.add("selected");
 
        // Get egg number
        selectedEgg = egg.dataset.egg;
 
        // Save selected egg
        localStorage.setItem("poultPalSelectedEgg", selectedEgg);
 
        eggMessage.textContent =
            `You selected Egg ${selectedEgg}! Get ready to meet your chicken! 🐣`;
 
        // Start hatching after a short delay
        isHatching = true;
 
        setTimeout(function() {
            startHatching();
        }, 1000);
 
    });
 
});
 
 
// ===================================
// HATCHING ANIMATION
// ===================================
 
function startHatching() {
 
    showScreen(hatchingScreen);
 
    // Reset hatching animation
    hatchingEgg.classList.remove("hatched");
 
    hatchingEgg.textContent = "🥚";
    hatchingMessage.textContent = "Your egg is hatching...";
 
    // After the egg shakes, reveal the chicken
    setTimeout(function() {
 
        hatchingEgg.classList.add("hatched");
 
        hatchingEgg.textContent = "🐥";
 
        hatchingMessage.textContent =
            "Congratulations! Your chicken has hatched!";
 
    }, 1800);
 
    // Proceed to introduction
    setTimeout(function() {
 
        // Show chick naming after hatching.
 
chickNaming.classList.remove("hidden");
 
chickNameInput.value = "";
chickNameMessage.textContent = "";
 
hatchingMessage.textContent =
    "Your egg has hatched! Meet your new chick! 🐤";
 
        isHatching = false;
 
    }, 3000);
 
}
 
// ===================================
// CARE INSTRUCTIONS
// ===================================
 
instructionsBtn.addEventListener("click", function() {
 
    showScreen(instructionsScreen);
 
});
 
 
// ===================================
// BEGIN CARE
// ===================================
 
beginCareBtn.addEventListener("click", function() {
 
    showScreen(gameplayScreen);
 
    playerGreeting.textContent = "Hello, " + currentUsername + "!";
 
    chickenNameDisplay.textContent = currentChickName;
 
    startGameClock();
 
});
 
 
// ===================================
// INITIALIZE GAME
// ===================================
 
updateDashboard();
 
 
// ===================================
// POULT PAL - CHICKEN CARE SYSTEM
// ===================================
 
// CHICKEN STATUS
 
let currentScore = 0;
let lightsAreOn = true;
 
 
// GET GAMEPLAY ELEMENTS
 
const playerGreeting = document.getElementById("player-greeting");
 
const hungerValue = document.getElementById("hunger-value");
const thirstValue = document.getElementById("thirst-value");
const healthValue = document.getElementById("health-value");
const stressValue = document.getElementById("stress-value");
 
const hungerBar = document.getElementById("hunger-bar");
const thirstBar = document.getElementById("thirst-bar");
const healthBar = document.getElementById("health-bar");
const stressBar = document.getElementById("stress-bar");
 
const chickenMessage = document.getElementById("chicken-message");
const chickenEnvironment = document.getElementById("chicken-environment");
 
const foodContainer = document.getElementById("food-container");
const waterContainer = document.getElementById("water-container");
 
const scoreDisplay = document.getElementById("current-score");
 
const lightsBtn = document.getElementById("lights-btn");
 
// ===================================
// CHICK NAMING ELEMENTS
// ===================================
 
const chickNaming = document.getElementById("chick-naming");
const chickNameInput = document.getElementById("chick-name-input");
const confirmChickNameBtn = document.getElementById("confirm-chick-name-btn");
const chickNameMessage = document.getElementById("chick-name-message");
const chickenNameDisplay = document.getElementById("chicken-name");
 
// ===================================
// CONFIRM CHICK NAME
// ===================================
 
confirmChickNameBtn.addEventListener("click", function() {
 
    const chickName = chickNameInput.value.trim();
 
    if (chickName === "") {
        chickNameMessage.textContent =
            "Please give your chick a name!";
        return;
    }
 
    if (!currentPlayer) {
        chickNameMessage.textContent =
            "Player profile not found!";
        return;
    }
 
    currentChickName = chickName;
 
    // Save chick name to player profile.
 
    currentPlayer.chickName = chickName;
 
    playerProfiles[currentUsername] = currentPlayer;
 
    savePlayerProfiles();
 
    // Display chick name.
 
    chickenNameDisplay.textContent = currentChickName;
 
    chickNameMessage.textContent =
        "Meet " + currentChickName + "! 🐤";
 
    // Continue to instructions.
 
    setTimeout(function() {
 
        chickNaming.classList.add("hidden");
 
        showScreen(introScreen);
 
    }, 1000);
 
});
 
// ===================================
// UPDATE CHICKEN STATUS
// ===================================
 
function updateChickenStatus() {
 
    hungerValue.textContent = chickenStatus.hunger + "%";
    thirstValue.textContent = chickenStatus.thirst + "%";
    healthValue.textContent = chickenStatus.health + "%";
    stressValue.textContent = chickenStatus.stress + "%";
 
    hungerBar.style.width = chickenStatus.hunger + "%";
    thirstBar.style.width = chickenStatus.thirst + "%";
    healthBar.style.width = chickenStatus.health + "%";
    stressBar.style.width = chickenStatus.stress + "%";
 
    scoreDisplay.textContent = currentScore;
 
}
 
 
// ===================================
// UPDATE SCORE
// ===================================
 
function addScore(points) {
 
    currentScore += points;
 
    scoreDisplay.textContent = currentScore;
    saveCurrentGame();
 
}
 
// ===================================
// FEED CHICKEN
// ===================================
 
document.getElementById("feed-btn").addEventListener("click", function() {
 
    if (!gameIsActive) return;
 
    if (foodIsAvailable) {
        chickenMessage.textContent =
            "There is already food in the container! 🌾";
        return;
    }
 
    if (chickenStatus.hunger >= 100) {
        chickenMessage.textContent =
            "Your chicken is not hungry right now! 🐤";
        return;
    }
 
    foodIsAvailable = true;
 
    chickenStatus.hunger = Math.min(
        100,
        chickenStatus.hunger + 25
    );
 
    foodContainer.innerHTML =
        "🌾<small>Chicken is eating...</small>";
 
    chickenMessage.textContent =
        "Food served! Your chicken is enjoying its meal. 🌾";
 
    addScore(5);
    updateChickenStatus();
 
    foodTimeout = setTimeout(function() {
 
        foodContainer.innerHTML = "🌾<small>Food</small>";
 
        foodIsAvailable = false;
        foodTimeout = null;
 
        chickenMessage.textContent =
            "Your chicken finished eating! 🐤";
 
    }, 8000);
 
});
 
// ===================================
// RESET FOOD AND WATER
// ===================================
 
function resetFoodAndWater() {
 
    if (foodTimeout !== null) {
        clearTimeout(foodTimeout);
        foodTimeout = null;
    }
 
    if (waterTimeout !== null) {
        clearTimeout(waterTimeout);
        waterTimeout = null;
    }
 
    foodIsAvailable = false;
    waterIsAvailable = false;
 
    foodContainer.innerHTML = "🌾<small>Food</small>";
    waterContainer.innerHTML = "💧<small>Water</small>";
 
}
 
 
// ===================================
// GIVE WATER
// ===================================
 
// ===================================
// GIVE WATER
// ===================================
 
document.getElementById("water-btn").addEventListener("click", function() {
 
    if (!gameIsActive) return;
 
    if (waterIsAvailable) {
        chickenMessage.textContent =
            "There is already water in the container! 💧";
        return;
    }
 
    if (chickenStatus.thirst >= 100) {
        chickenMessage.textContent =
            "Your chicken is not thirsty right now! 🐤";
        return;
    }
 
    waterIsAvailable = true;
 
    chickenStatus.thirst = Math.min(
        100,
        chickenStatus.thirst + 25
    );
 
    waterContainer.innerHTML =
        "💧<small>Chicken is drinking...</small>";
 
    chickenMessage.textContent =
        "Fresh water served! Your chicken is drinking. 💧";
 
    addScore(5);
    updateChickenStatus();
 
    waterTimeout = setTimeout(function() {
 
        waterContainer.innerHTML = "💧<small>Water</small>";
 
        waterIsAvailable = false;
        waterTimeout = null;
 
        chickenMessage.textContent =
            "Your chicken finished drinking! 🐤";
 
    }, 8000);
 
});
 
// ===================================
// GIVE VITAMINS
// ===================================
 
document.getElementById("vitamins-btn").addEventListener("click", function() {
 
    if (!gameIsActive) return;
 
    if (chickenStatus.health >= 100) {
        chickenMessage.textContent =
            "Your chicken is already healthy! 💚";
        return;
    }
 
    chickenStatus.health = Math.min(
        100,
        chickenStatus.health + 10
    );
 
    chickenMessage.textContent =
        "Your chicken received its vitamins! 💊";
 
    addScore(5);
    updateChickenStatus();
 
});
 
 
// ===================================
// SLEEP
// ===================================
 
// ===================================
// SLEEP / REST
// ===================================
 
document.getElementById("sleep-btn").addEventListener("click", function() {
 
    if (!gameIsActive) return;
 
    if (!lightsAreOn) {
        chickenMessage.textContent =
            "Your chicken is already resting! 🌙";
        return;
    }
 
    lightsAreOn = false;
 
    chickenEnvironment.classList.add("lights-off");
 
    lightsBtn.textContent = "🌙 Lights Off";
 
    chickenStatus.stress = Math.max(
        0,
        chickenStatus.stress - 10
    );
 
    chickenMessage.textContent =
        "Your chicken is resting. Good night! 🌙";
 
    addScore(5);
    updateChickenStatus();
 
});
 
// ===================================
// COMFORT CHICKEN
// ===================================
 
document.getElementById("comfort-btn").addEventListener("click", function() {
 
    if (!gameIsActive) return;
 
    if (chickenStatus.stress === 0) {
        chickenMessage.textContent =
            "Your chicken is already comfortable! 💚";
        return;
    }
 
    chickenStatus.stress = Math.max(
        0,
        chickenStatus.stress - 20
    );
 
    chickenMessage.textContent =
        "Your chicken feels more comfortable now! 💚";
 
    addScore(5);
    updateChickenStatus();
 
});
 
// ===================================
// LIGHTS ON / OFF
// ===================================
 
lightsBtn.addEventListener("click", function() {
 
    if (!gameIsActive) return;
 
    lightsAreOn = !lightsAreOn;
 
    if (lightsAreOn) {
 
        chickenEnvironment.classList.remove("lights-off");
 
        lightsBtn.textContent = "💡 Lights On";
 
        chickenMessage.textContent =
            "The lights are on. Good morning! ☀️";
 
    } else {
 
        chickenEnvironment.classList.add("lights-off");
 
        lightsBtn.textContent = "🌙 Lights Off";
 
        chickenMessage.textContent =
            "The lights are off. Time to rest! 🌙";
 
    }
 
    saveCurrentGame();
 
});
 
// ===================================
// PLAYER GREETING
// ===================================
 
playerGreeting.textContent = "Hello, " + currentUsername + "!";
 
 
// ===================================
// INITIALIZE CHICKEN STATUS
// ===================================
 
updateChickenStatus();
 
 
/* ===================================
   GAME CLOCK AND AUTOMATIC NEEDS
=================================== */
 
let gameInterval = null;
let gameIsActive = false;
 
let elapsedGameMinutes = 0;
let gameHour = 6;
let gameDay = 1;
 
const gameClock = document.getElementById("game-clock");
const gameDayDisplay = document.getElementById("game-day");
 
 
// ===================================
// UPDATE GAME CLOCK
// ===================================
 
function updateGameClock() {
 
    let period = gameHour >= 12 ? "PM" : "AM";
 
    let displayHour = gameHour % 12;
 
    if (displayHour === 0) {
        displayHour = 12;
    }
 
    gameClock.textContent =
        String(displayHour).padStart(2, "0") + ":00 " + period;
 
    gameDayDisplay.textContent =
        "📅 Day " + gameDay + " of 3";
 
}
 
 
// ===================================
// AUTOMATIC CHICKEN NEEDS
// ===================================
 
 
function decreaseChickenNeeds() {
 
    chickenStatus.hunger = Math.max(
        0,
        chickenStatus.hunger - 15
    );
 
    chickenStatus.thirst = Math.max(
        0,
        chickenStatus.thirst - 15
    );
 
    chickenStatus.stress = Math.min(
        100,
        chickenStatus.stress + 5
    );
 
    if (
        chickenStatus.hunger === 0 ||
        chickenStatus.thirst === 0
    ) {
 
        chickenStatus.health = Math.max(
            0,
            chickenStatus.health - 5
        );
 
    }
 
    updateChickenStatus();
    saveCurrentGame();
 
    if (chickenStatus.health <= 0) {
        finishGame("gameover");
    }
 
}
 
 
 
// ===================================
// START GAME CLOCK
// ===================================
 
function startGameClock() {
 
    if (gameInterval !== null) {
        clearInterval(gameInterval);
    }
 
    // Reset food and water.
 
    resetFoodAndWater();
 
    // Reset chicken status.
 
    chickenStatus = {
        hunger: 100,
        thirst: 100,
        health: 100,
        stress: 0
    };
 
    currentScore = 0;
 
    elapsedGameMinutes = 0;
    gameHour = 6;
    gameDay = 1;
 
    lightsAreOn = true;
 
    chickenEnvironment.classList.remove("lights-off");
 
    lightsBtn.textContent = "💡 Lights On";
 
    chickenMessage.textContent =
        "Your chicken is feeling good! 🐤";
 
    updateChickenStatus();
    updateGameClock();
 
    // Automatically save the player's progress.
 
    gameIsActive = true;
    saveCurrentGame();
 
    gameInterval = setInterval(function() {
 
        elapsedGameMinutes++;
 
        gameHour++;
 
        if (gameHour >= 24) {
            gameHour = 0;
        }
 
        gameDay = Math.min(
            3,
            Math.floor(elapsedGameMinutes / 24) + 1
        );
 
        updateGameClock();
 
        if (elapsedGameMinutes % 3 === 0) {
            decreaseChickenNeeds();
        }
 
        if (elapsedGameMinutes >= 72 && gameIsActive) {
            finishGame("completed");
            return;
        }
 
        // Save the current needs, score, and game time every in-game minute.
        if (gameIsActive) saveCurrentGame();
 
    }, 60000);
 
}
 
/* ===================================
   GAME ENDING AND SCORE RECORDING
=================================== */
 
function finishGame(result) {
 
    // Prevent multiple game endings.
 
    if (!gameIsActive) return;
 
    gameIsActive = false;
    resetFoodAndWater();
 
    if (gameInterval !== null) {
        clearInterval(gameInterval);
        gameInterval = null;
    }
 
    // Calculate final score.
 
    let finalScore = currentScore + chickenStatus.health;
 
    // Save game record.
 
    const newRecord = {
        username: currentUsername,
        score: finalScore,
        result: result
    };
 
    gameRecords.push(newRecord);
 
    localStorage.setItem(
        "poultPalRecords",
        JSON.stringify(gameRecords)
    );
 
    if (currentPlayer) {
 
    currentPlayer.gamesPlayed =
        (currentPlayer.gamesPlayed || 0) + 1;
 
    currentPlayer.highScore = Math.max(
        currentPlayer.highScore || 0,
        finalScore
    );
    currentPlayer.lastScore = finalScore;
    currentPlayer.lastGame = {
        day: gameDay,
        score: finalScore,
        result: result,
        chickName: currentChickName,
        finishedAt: new Date().toISOString()
    };
 
    currentPlayer.savedGame = null;
 
    savePlayerProfiles();
 
    }
 
    // Update player dashboard.
 
    updateDashboard();
 
    // Show result.
 
    if (result === "completed") {
 
        alert(
            "🎉 Congratulations, " + currentUsername + "!\n\n" +
            "You completed all 3 days of chicken care!\n\n" +
            "Final Score: " + finalScore + " points"
        );
 
    } else if (result === "gameover") {
 
        alert(
            "Oh no! Your chicken needs more care. 🐥\n\n" +
            "Game Over!\n\n" +
            "Final Score: " + finalScore + " points"
        );
 
    } else {
 
        alert(
            "Game ended.\n\n" +
            "Final Score: " + finalScore + " points"
        );
 
    }
 
    // Return to home screen.
 
    showScreen(homeScreen);
 
}
 
 
/* ===================================
   QUIT GAME
=================================== */
 
document.getElementById("quit-btn").addEventListener("click", function() {
 
    if (!gameIsActive) return;
 
    const confirmQuit = confirm(
        "Save your progress and return to the home screen?"
    );
 
    if (confirmQuit) {
        saveCurrentGame();
        gameIsActive = false;
 
        if (gameInterval !== null) {
            clearInterval(gameInterval);
            gameInterval = null;
        }
 
        resetFoodAndWater();
        updateDashboard();
        loginMessage.textContent = "Your game is saved. Sign in to continue!";
        showScreen(homeScreen);
    }
 
});
 
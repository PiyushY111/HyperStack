window.focus(); // Capture keys right away (by default focus is on editor)

let camera, scene, renderer; // ThreeJS globals
let world; // CannonJs world
let lastTime; // Last timestamp of animation
let stack; // Parts that stay solid on top of each other
let overhangs; // Overhanging parts that fall down
const boxHeight = 1; // Height of each layer
const originalBoxSize = 3; // Original width and height of a box
let autopilot;
let gameEnded;
let robotPrecision; // Determines how precise the game is on autopilot
let currentUser = null; // Current logged in user
let currentScore = 0; // Current game score

// API Configuration
const API_URL = 'http://localhost:5001/api';

const scoreElement = document.getElementById("score");
const instructionsElement = document.getElementById("instructions");
const resultsElement = document.getElementById("results");

// Authentication & Leaderboard Elements
const loginModal = document.getElementById("loginModal");
const leaderboardModal = document.getElementById("leaderboardModal");
const usernameInput = document.getElementById("usernameInput");
const loginBtn = document.getElementById("loginBtn");
const loginError = document.getElementById("loginError");
const gameUI = document.getElementById("gameUI");
const currentUserSpan = document.getElementById("currentUser");
const logoutBtn = document.getElementById("logoutBtn");
const leaderboardBtn = document.getElementById("leaderboardBtn");
const closeLeaderboard = document.getElementById("closeLeaderboard");
const saveScoreBtn = document.getElementById("saveScoreBtn");
const viewLeaderboardBtn = document.getElementById("viewLeaderboardBtn");
const finalScoreElement = document.getElementById("finalScore");

// Check if user is already logged in
checkAuth();

function checkAuth() {
    const savedUser = localStorage.getItem("hyperstack_user");
    if (savedUser) {
        currentUser = savedUser;
        showGame();
    } else {
        showLoginModal();
    }
}

function showLoginModal() {
    loginModal.style.display = "flex";
    gameUI.style.display = "none";
}

function showGame() {
    loginModal.style.display = "none";
    gameUI.style.display = "block";
    currentUserSpan.textContent = `Player: ${currentUser}`;
    init();
}

async function login() {
    const username = usernameInput.value.trim();
    if (username.length < 3) {
        loginError.textContent = "Username must be at least 3 characters";
        return;
    }
    if (username.length > 20) {
        loginError.textContent = "Username must be less than 20 characters";
        return;
    }
    
    try {
        loginBtn.textContent = "Logging in...";
        loginBtn.disabled = true;
        
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username })
        });
        
        const data = await response.json();
        
        if (data.success) {
            currentUser = username;
            localStorage.setItem("hyperstack_user", username);
            loginError.textContent = "";
            showGame();
        } else {
            loginError.textContent = data.message || "Login failed";
        }
    } catch (error) {
        console.error('Login error:', error);
        loginError.textContent = "Server error. Please try again.";
    } finally {
        loginBtn.textContent = "Start Playing";
        loginBtn.disabled = false;
    }
}

function logout() {
    currentUser = null;
    localStorage.removeItem("hyperstack_user");
    showLoginModal();
    
    // Clean up game
    if (renderer && renderer.domElement) {
        renderer.domElement.remove();
    }
}

async function autoSaveScore() {
    if (!currentUser || currentScore === 0) return;
    
    try {
        if (saveScoreBtn) {
            saveScoreBtn.textContent = "Saving score...";
            saveScoreBtn.disabled = true;
        }
        
        const response = await fetch(`${API_URL}/leaderboard/save`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                username: currentUser,
                score: currentScore
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            console.log('Score auto-saved successfully:', currentScore);
            if (saveScoreBtn) {
                saveScoreBtn.textContent = "Score Saved! ✓";
                saveScoreBtn.style.background = "linear-gradient(135deg, #4CAF50, #45a049)";
                saveScoreBtn.style.color = "white";
            }
            // Show the view leaderboard button
            if (viewLeaderboardBtn) {
                viewLeaderboardBtn.style.display = "block";
            }
        } else {
            console.error('Auto-save failed:', data.message);
            if (saveScoreBtn) {
                saveScoreBtn.textContent = "Save Score";
                saveScoreBtn.disabled = false;
            }
        }
    } catch (error) {
        console.error('Auto-save score error:', error);
        if (saveScoreBtn) {
            saveScoreBtn.textContent = "Save Score";
            saveScoreBtn.disabled = false;
        }
    }
}

async function saveScore() {
    // This function is no longer needed as auto-save handles everything
    // Just show the leaderboard when the button is clicked
    showLeaderboard();
}

async function showLeaderboard() {
    try {
        const response = await fetch(`${API_URL}/leaderboard/global/10`);
        const data = await response.json();
        
        const leaderboardList = document.getElementById("leaderboardList");
        
        if (!data.success || data.leaderboard.length === 0) {
            leaderboardList.innerHTML = '<p style="text-align: center; padding: 20px;">No scores yet. Be the first!</p>';
        } else {
            leaderboardList.innerHTML = data.leaderboard.map((entry, index) => {
                const rank = index + 1;
                let rankClass = "";
                let medal = "";
                if (rank === 1) {
                    rankClass = "gold";
                    medal = "🥇";
                } else if (rank === 2) {
                    rankClass = "silver";
                    medal = "🥈";
                } else if (rank === 3) {
                    rankClass = "bronze";
                    medal = "🥉";
                }
                
                const isCurrentUser = entry.username === currentUser;
                
                return `
                    <div class="leaderboard-item ${isCurrentUser ? 'current-user' : ''}">
                        <span class="leaderboard-rank ${rankClass}">${medal ? medal : '#' + rank}</span>
                        <span class="leaderboard-name">${entry.username}</span>
                        <span class="leaderboard-score">${entry.score} pts</span>
                    </div>
                `;
            }).join('');
        }
        
        leaderboardModal.style.display = "flex";
    } catch (error) {
        console.error('Leaderboard error:', error);
        const leaderboardList = document.getElementById("leaderboardList");
        leaderboardList.innerHTML = '<p style="text-align: center; padding: 20px; color: #ffcccc;">Error loading leaderboard. Please try again.</p>';
        leaderboardModal.style.display = "flex";
    }
}

function hideLeaderboard() {
    leaderboardModal.style.display = "none";
}

// Event Listeners for Authentication & Leaderboard
loginBtn.addEventListener("click", login);
usernameInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") login();
});
logoutBtn.addEventListener("click", logout);
leaderboardBtn.addEventListener("click", showLeaderboard);
closeLeaderboard.addEventListener("click", hideLeaderboard);
saveScoreBtn.addEventListener("click", showLeaderboard);
if (viewLeaderboardBtn) {
    viewLeaderboardBtn.addEventListener("click", showLeaderboard);
}

// Close modals when clicking outside
leaderboardModal.addEventListener("click", (e) => {
    if (e.target === leaderboardModal) hideLeaderboard();
});

// Don't call init() here - it will be called by showGame() after login

// Determines how precise the game is on autopilot
function setRobotPrecision() {
    robotPrecision = Math.random() * 1 - 0.5;
}

function init() {
    // Only initialize if user is logged in
    if (!currentUser) return;
    
    autopilot = true;
    gameEnded = false;
    lastTime = 0;
    stack = [];
    overhangs = [];
    setRobotPrecision();
    
    // Reset save button state
    if (saveScoreBtn) {
        saveScoreBtn.textContent = "Saving score...";
        saveScoreBtn.disabled = true;
        saveScoreBtn.style.background = "";
        saveScoreBtn.style.color = "";
    }

    // Initialize CannonJS
    world = new CANNON.World();
    world.gravity.set(0, -10, 0); // Gravity pulls things down
    world.broadphase = new CANNON.NaiveBroadphase();
    world.solver.iterations = 40;

    // Initialize ThreeJs
    const aspect = window.innerWidth / window.innerHeight;
    const width = 10;
    const height = width / aspect;

    camera = new THREE.OrthographicCamera(
        width / -2, // left
        width / 2, // right
        height / 2, // top
        height / -2, // bottom
        0, // near plane
        100 // far plane
    );

    // If you want to use perspective camera instead, uncomment these lines
    camera = new THREE.PerspectiveCamera(
        45, // field of view
        aspect, // aspect ratio
        1, // near plane
        100 // far plane
    );

    camera.position.set(4, 4, 4);
    camera.lookAt(0, 0, 0);

    scene = new THREE.Scene();

    // Foundation
    addLayer(0, 0, originalBoxSize, originalBoxSize);

    // First layer
    addLayer(-10, 0, originalBoxSize, originalBoxSize, "x");

    // Set up lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 0.6);
    dirLight.position.set(10, 20, 0);
    scene.add(dirLight);

    // Set up renderer
    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(animation);
    document.body.appendChild(renderer.domElement);
}

function startGame() {
    autopilot = false;
    gameEnded = false;
    lastTime = 0;
    stack = [];
    overhangs = [];
    currentScore = 0;

    if (instructionsElement) instructionsElement.style.display = "none";
    if (resultsElement) resultsElement.style.display = "none";
    if (scoreElement) scoreElement.innerText = 0;
    
    // Reset save score button
    if (saveScoreBtn) {
        saveScoreBtn.textContent = "Save Score";
        saveScoreBtn.disabled = false;
    }

    if (world) {
        // Remove every object from world
        while (world.bodies.length > 0) {
            world.remove(world.bodies[0]);
        }
    }

    if (scene) {
        // Remove every Mesh from the scene
        while (scene.children.find((c) => c.type == "Mesh")) {
            const mesh = scene.children.find((c) => c.type == "Mesh");
            scene.remove(mesh);
        }

        // Foundation
        addLayer(0, 0, originalBoxSize, originalBoxSize);

        // First layer
        addLayer(-10, 0, originalBoxSize, originalBoxSize, "x");
    }

    if (camera) {
        // Reset camera positions
        camera.position.set(4, 4, 4);
        camera.lookAt(0, 0, 0);
    }
}

function addLayer(x, z, width, depth, direction) {
    const y = boxHeight * stack.length; // Add the new box one layer higher
    const layer = generateBox(x, y, z, width, depth, false);
    layer.direction = direction;
    stack.push(layer);
}

function addOverhang(x, z, width, depth) {
    const y = boxHeight * (stack.length - 1); // Add the new box one the same layer
    const overhang = generateBox(x, y, z, width, depth, true);
    overhangs.push(overhang);
}

function generateBox(x, y, z, width, depth, falls) {
    // ThreeJS
    const geometry = new THREE.BoxGeometry(width, boxHeight, depth);
    // Alternate between white and grey as blocks move upward
    const color = stack.length % 2 === 0 ? 0xffffff : 0x808080;
    const material = new THREE.MeshLambertMaterial({ color });
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    scene.add(mesh);

    // CannonJS
    const shape = new CANNON.Box(
        new CANNON.Vec3(width / 2, boxHeight / 2, depth / 2)
    );
    let mass = falls ? 5 : 0; // If it shouldn't fall then setting the mass to zero will keep it stationary
    mass *= width / originalBoxSize; // Reduce mass proportionately by size
    mass *= depth / originalBoxSize; // Reduce mass proportionately by size
    const body = new CANNON.Body({ mass, shape });
    body.position.set(x, y, z);
    world.addBody(body);

    return {
        threejs: mesh,
        cannonjs: body,
        width,
        depth,
    };
}

function cutBox(topLayer, overlap, size, delta) {
    const direction = topLayer.direction;
    const newWidth = direction == "x" ? overlap : topLayer.width;
    const newDepth = direction == "z" ? overlap : topLayer.depth;

    // Update metadata
    topLayer.width = newWidth;
    topLayer.depth = newDepth;

    // Update ThreeJS model
    topLayer.threejs.scale[direction] = overlap / size;
    topLayer.threejs.position[direction] -= delta / 2;

    // Update CannonJS model
    topLayer.cannonjs.position[direction] -= delta / 2;

    // Replace shape to a smaller one (in CannonJS you can't simply just scale a shape)
    const shape = new CANNON.Box(
        new CANNON.Vec3(newWidth / 2, boxHeight / 2, newDepth / 2)
    );
    topLayer.cannonjs.shapes = [];
    topLayer.cannonjs.addShape(shape);
}

window.addEventListener("mousedown", eventHandler);
window.addEventListener("touchstart", eventHandler);
window.addEventListener("keydown", function (event) {
    if (event.key == " ") {
        event.preventDefault();
        eventHandler();
        return;
    }
    if (event.key == "R" || event.key == "r") {
        event.preventDefault();
        startGame();
        return;
    }
});

function eventHandler() {
    if (autopilot) startGame();
    else splitBlockAndAddNextOneIfOverlaps();
}

function splitBlockAndAddNextOneIfOverlaps() {
    if (gameEnded) return;

    const topLayer = stack[stack.length - 1];
    const previousLayer = stack[stack.length - 2];

    const direction = topLayer.direction;

    const size = direction == "x" ? topLayer.width : topLayer.depth;
    const delta =
        topLayer.threejs.position[direction] -
        previousLayer.threejs.position[direction];
    const overhangSize = Math.abs(delta);
    const overlap = size - overhangSize;

    if (overlap > 0) {
        cutBox(topLayer, overlap, size, delta);

        // Overhang
        const overhangShift =
            (overlap / 2 + overhangSize / 2) * Math.sign(delta);
        const overhangX =
            direction == "x"
                ? topLayer.threejs.position.x + overhangShift
                : topLayer.threejs.position.x;
        const overhangZ =
            direction == "z"
                ? topLayer.threejs.position.z + overhangShift
                : topLayer.threejs.position.z;
        const overhangWidth = direction == "x" ? overhangSize : topLayer.width;
        const overhangDepth = direction == "z" ? overhangSize : topLayer.depth;

        addOverhang(overhangX, overhangZ, overhangWidth, overhangDepth);

        // Next layer
        const nextX = direction == "x" ? topLayer.threejs.position.x : -10;
        const nextZ = direction == "z" ? topLayer.threejs.position.z : -10;
        const newWidth = topLayer.width; // New layer has the same size as the cut top layer
        const newDepth = topLayer.depth; // New layer has the same size as the cut top layer
        const nextDirection = direction == "x" ? "z" : "x";

        currentScore = stack.length - 1;
        if (scoreElement) scoreElement.innerText = currentScore;
        addLayer(nextX, nextZ, newWidth, newDepth, nextDirection);
    } else {
        missedTheSpot();
    }
}

function missedTheSpot() {
    const topLayer = stack[stack.length - 1];

    // Turn to top layer into an overhang and let it fall down
    addOverhang(
        topLayer.threejs.position.x,
        topLayer.threejs.position.z,
        topLayer.width,
        topLayer.depth
    );
    world.remove(topLayer.cannonjs);
    scene.remove(topLayer.threejs);

    gameEnded = true;
    
    // Update final score display
    if (finalScoreElement) {
        finalScoreElement.textContent = `Score: ${currentScore}`;
    }
    
    // Auto-save score
    if (currentUser && currentScore > 0 && !autopilot) {
        autoSaveScore();
    }
    
    if (resultsElement && !autopilot) resultsElement.style.display = "flex";
}

function animation(time) {
    if (lastTime) {
        const timePassed = time - lastTime;
        const speed = 0.008;

        const topLayer = stack[stack.length - 1];
        const previousLayer = stack[stack.length - 2];

        // The top level box should move if the game has not ended AND
        // it's either NOT in autopilot or it is in autopilot and the box did not yet reach the robot position
        const boxShouldMove =
            !gameEnded &&
            (!autopilot ||
                (autopilot &&
                    topLayer.threejs.position[topLayer.direction] <
                        previousLayer.threejs.position[topLayer.direction] +
                            robotPrecision));

        if (boxShouldMove) {
            // Keep the position visible on UI and the position in the model in sync
            topLayer.threejs.position[topLayer.direction] += speed * timePassed;
            topLayer.cannonjs.position[topLayer.direction] +=
                speed * timePassed;

            // If the box went beyond the stack then show up the fail screen
            if (topLayer.threejs.position[topLayer.direction] > 10) {
                missedTheSpot();
            }
        } else {
            // If it shouldn't move then is it because the autopilot reached the correct position?
            // Because if so then next level is coming
            if (autopilot) {
                splitBlockAndAddNextOneIfOverlaps();
                setRobotPrecision();
            }
        }

        // 4 is the initial camera height
        if (camera.position.y < boxHeight * (stack.length - 2) + 4) {
            camera.position.y += speed * timePassed;
        }

        updatePhysics(timePassed);
        renderer.render(scene, camera);
    }
    lastTime = time;
}

function updatePhysics(timePassed) {
    world.step(timePassed / 1000); // Step the physics world

    // Copy coordinates from Cannon.js to Three.js
    overhangs.forEach((element) => {
        element.threejs.position.copy(element.cannonjs.position);
        element.threejs.quaternion.copy(element.cannonjs.quaternion);
    });
}

window.addEventListener("resize", () => {
    // Adjust camera
    console.log("resize", window.innerWidth, window.innerHeight);
    const aspect = window.innerWidth / window.innerHeight;
    const width = 10;
    const height = width / aspect;

    camera.top = height / 2;
    camera.bottom = height / -2;

    // Reset renderer
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.render(scene, camera);
});

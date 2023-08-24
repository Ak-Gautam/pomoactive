// Define some constants for the timer modes and periods
var NORMAL_MODE = 0;
var DEEP_WORK_MODE = 1;
var WORK_PERIOD = 0;
var BREAK_PERIOD = 1;

// Define some variables to store the timer state
var timerMode = NORMAL_MODE; // The current timer mode
var timerRunning = false; // Whether the timer is running or not
var workPeriod = 25 * 60 * 1000; // The duration of a work period in milliseconds
var breakPeriod = 5 * 60 * 1000; // The duration of a break period in milliseconds
var timerId = null; // The id of the timer interval
var timerEnd = null; // The timestamp of the timer end
var currentTask = null; // The current task to display

// Add an event listener to handle messages from the popup
chrome.runtime.onMessage.addListener(handleMessage);

// Define the function to handle messages from the popup
function handleMessage(message, sender, sendResponse) {
    // Check the action of the message
    switch (message.action) {
        case "toggle":
            // Toggle the timer mode if it is not running
            if (!timerRunning) {
                toggleMode();
            }
            break;
        case "start":
            // Start the timer if it is not running
            if (!timerRunning) {
                startTimer();
            }
            break;
        case "stop":
            // Stop the timer if it is running
            if (timerRunning) {
                stopTimer();
            }
            break;
        case "update":
            // Update the current task if there is one
            if (currentTask) {
                updateTask();
            }
            break;
    }
}

// Define the function to toggle the timer mode
function toggleMode() {
    // Switch between normal and deep work modes
    if (timerMode == NORMAL_MODE) {
        timerMode = DEEP_WORK_MODE;
    } else if (timerMode == DEEP_WORK_MODE) {
        timerMode = NORMAL_MODE;
    }
}

// Define the function to start the timer
function startTimer() {
    // Set the timer running flag to true
    timerRunning = true;

    // Get the first task from the chrome storage if there is one
    chrome.storage.local.get("taskList", function(result) {
        var taskList = result.taskList || [];
        if (taskList.length > 0) {
            currentTask = taskList[0];
        } else {
            currentTask = null;
        }
    });

    // Set the timer end timestamp based on the timer mode and work period
    if (timerMode == NORMAL_MODE) {
        timerEnd = Date.now() + workPeriod;
    } else if (timerMode == DEEP_WORK_MODE) {
        timerEnd = Date.now() + workPeriod * 4;
    }

    // Set the timer interval to update every second
    timerId = setInterval(updateTimer, 1000);

    // Display a notification with the current task and timer end time
    displayNotification();
}

// Define the function to stop the timer
function stopTimer() {
    // Set the timer running flag to false
    timerRunning = false;

    // Clear the timer interval and reset the timer id and end timestamp
    clearInterval(timerId);
    timerId = null;
    timerEnd = null;

    // Reset the current task to null
    currentTask = null;
}

// Define the function to update the timer
function updateTimer() {
    // Get the current time
    var now = Date.now();

    // Check if the timer has reached its end time
    if (now >= timerEnd) {
        // Clear the timer interval and reset the timer id and end timestamp
        clearInterval(timerId);
        timerId = null;
        timerEnd = null;

        // Switch between work and break periods based on the timer mode
        if (timerMode == NORMAL_MODE) {
            // If it was a work period, start a break period
            if (workPeriod > 0) {
                workPeriod = 0;
                breakPeriod = 5 * 60 * 1000;
                timerEnd = now + breakPeriod;
                displayNotification("Break Time", "Take a short break and relax.");
            } else {
                // If it was a break period, start a new work period and update the current task
                workPeriod = 25 * 60 * 1000;
                breakPeriod = 0;
                updateTask();
                timerEnd = now + workPeriod;
                displayNotification("Work Time", "Time to get back to work.");
            }
        } else if (timerMode == DEEP_WORK_MODE) {
            // If it was a work period, start a long break period and reset the current task
            if (workPeriod > 0) {
                workPeriod = 0;
                breakPeriod = 20 * 60 * 1000;
                currentTask = null;
                timerEnd = now + breakPeriod;
                displayNotification("Break Time", "You have completed a deep work session. Take a long break and reward yourself.");
            } else {
                // If it was a break period, start a new work period and get a new task from the chrome storage
                workPeriod = 90 * 60 * 1000;
                breakPeriod = 0;
                chrome.storage.local.get("taskList", function(result) {
                    var taskList = result.taskList || [];
                    if (taskList.length > 0) {
                        currentTask = taskList[0];
                    } else {
                        currentTask = null;
                    }
                });
                timerEnd = now + workPeriod;
                displayNotification("Work Time", "Time to start a new deep work session.");
            }
        }

        // Set the timer interval to update every second again
        timerId = setInterval(updateTimer, 1000);
    }

    // Send a message to the popup to update the timer element
    chrome.runtime.sendMessage({
        action: "update",
        remaining: timerEnd - now, // The remaining time in milliseconds
        mode: timerMode, // The current timer mode
        period: workPeriod > 0 ? WORK_PERIOD : BREAK_PERIOD // The current timer period
    });
}

// Define the function to display a notification with the current task and timer end time
function displayNotification(title, message) {
    // Create a notification options object
    var options = {
        type: "basic",
        iconUrl: "images/icon128.png",
        title: title || currentTask || "Pro Pomodoro", // Use the title parameter or the current task or the default title
        message: message || "Timer ends at " + new Date(timerEnd).toLocaleTimeString() // Use the message parameter or the timer end time
    };

    // Create a notification with a random id
    chrome.notifications.create(Math.random().toString(), options);
}

// Define the function to update the current task
function updateTask() {
    // Get the task list from the chrome storage
    chrome.storage.local.get("taskList", function(result) {
        var taskList = result.taskList || [];

        // Remove the first task from the list if there is one
        if (taskList.length > 0) {
            taskList.shift();
        }

        // Set the updated task list to the chrome storage
        chrome.storage.local.set({taskList: taskList});

        // Get the new first task from the list if there is one
        if (taskList.length > 0) {
            currentTask = taskList[0];
        } else {
            currentTask = null;
        }
    });
}

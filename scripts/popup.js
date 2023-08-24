// Get the elements from the document
var logo = document.getElementById("logo");
var deepWorkToggle = document.getElementById("deep-work-toggle");
var startButton = document.getElementById("start-button");
var stopButton = document.getElementById("stop-button");
var taskList = document.getElementById("task-list");
var taskInput = document.getElementById("task-input");
var addButton = document.getElementById("add-button");
var timer = document.getElementById("timer");
var minutes = document.getElementById("minutes");
var seconds = document.getElementById("seconds");

// Add event listeners to the elements
logo.addEventListener("click", openWebsite);
deepWorkToggle.addEventListener("change", toggleMode);
startButton.addEventListener("click", startTimer);
stopButton.addEventListener("click", stopTimer);
addButton.addEventListener("click", addTask);

// Define the function to open the website when the logo is clicked
function openWebsite() {
    // Open a new tab with the website URL
    chrome.tabs.create({url: "https://volley.com"});
}

// Define the function to toggle the timer mode when the deep work switch is changed
function toggleMode() {
    // Send a message to the background script to toggle the mode
    chrome.runtime.sendMessage({action: "toggle"});
}

// Define the function to start the timer when the start button is clicked
function startTimer() {
    // Send a message to the background script to start the timer
    chrome.runtime.sendMessage({action: "start"});
}

// Define the function to stop the timer when the stop button is clicked
function stopTimer() {
    // Send a message to the background script to stop the timer
    chrome.runtime.sendMessage({action: "stop"});
}

// Define the function to add a task when the add button is clicked
function addTask() {
    // Get the value of the task input
    var task = taskInput.value;

    // Check if the task is not empty and the list has less than three items
    if (task && taskList.children.length < 3) {
        // Create a new list item element
        var listItem = document.createElement("li");

        // Create a checkbox element
        var checkbox = document.createElement("input");
        checkbox.type = "checkbox";

        // Create a span element to hold the task text
        var span = document.createElement("span");
        span.textContent = task;

        // Append the checkbox and span to the list item
        listItem.appendChild(checkbox);
        listItem.appendChild(span);

        // Append the list item to the task list
        taskList.appendChild(listItem);

        // Clear the task input value
        taskInput.value = "";

        // Add event listener to the checkbox
        checkbox.addEventListener("change", completeTask);
    }
}

// Define the function to complete a task when the checkbox is changed
function completeTask(event) {
    // Get the checkbox that triggered the event
    var checkbox = event.target;

    // Get the list item that contains the checkbox
    var listItem = checkbox.parentNode;

    // Remove the list item from the task list
    taskList.removeChild(listItem);

    // Send a message to the background script to update the current task
    chrome.runtime.sendMessage({action: "update"});
}

// Define the function to handle messages from the background script
function handleMessage(message, sender, sendResponse) {
    // Check the action of the message
    switch (message.action) {
        case "update":
            // Update the timer element with the remaining time and color
            var remaining = message.remaining; // The remaining time in milliseconds
            var min = Math.floor(remaining / (60 * 1000)); // The remaining minutes
            var sec = Math.floor((remaining % (60 * 1000)) / 1000); // The remaining seconds
            minutes.textContent = min < 10 ? "0" + min : min; // Format the minutes with leading zero if needed
            seconds.textContent = sec < 10 ? "0" + sec : sec; // Format the seconds with leading zero if needed

            var mode = message.mode; // The current timer mode
            var period = message.period; // The current timer period

            if (mode == NORMAL_MODE) {
                if (period == WORK_PERIOD) {
                    timer.className = "normal-work";
                } else if (period == BREAK_PERIOD) {
                    timer.className = "normal-break";
                }
            } else if (mode == DEEP_WORK_MODE) {
                if (period == WORK_PERIOD) {
                    timer.className = "deep-work";
                } else if (period == BREAK_PERIOD) {
                    timer.className = "deep-break";
                }
            }
            break;
    }
}

// Add an event listener to handle messages from the background script
chrome.runtime.onMessage.addListener(handleMessage);

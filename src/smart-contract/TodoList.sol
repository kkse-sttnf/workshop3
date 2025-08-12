// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

contract TodoList {
    // Struct to store each task
    struct Task {
        string description;
        bool completed;
    }

    // Array to store tasks
    Task[] public tasks;

    // Add a new task
    function addTask(string memory _description) public {
        tasks.push(Task(_description, false));
    }

    // Mark a task as completed
    function completeTask(uint _index) public {
        require(_index < tasks.length, "Invalid task index");
        tasks[_index].completed = true;
    }

    // Get task count
    function getTaskCount() public view returns (uint) {
        return tasks.length;
    }

    // Get task details
    function getTask(uint _index) public view returns (string memory, bool) {
        require(_index < tasks.length, "Invalid task index");
        Task memory task = tasks[_index];
        return (task.description, task.completed);
    }
}

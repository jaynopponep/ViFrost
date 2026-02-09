# 🧩 ViFrost

## 📘 Project Description
ViFrost is a competitive, real time 1v1 Vim coding platform where two players battle to fix buggy code using only Vim commands. The first player to provide a working solution wins the match.

The project exists to encourage learning Vim through competition.

Each player works independently in their own editor instance while attempting to solve the same challenge. The game tests both Vim proficiency and debugging speed under pressure.

Key technologies include websockets for real time match coordination and the CodeMirror library to make a web editor possible.

---

## 🚀 Features

### 🧠 Feature 1: *Browser Based Vim Editor*
**Description:**  
A web based code editor powered by CodeMirror with Vim keybindings enabled.
Players can use standard Vim commands directly in the browser without any local setup. 
This provides an accessible but authentic Vim experience for each participant.

**Code Link:**  
[View Implementation](./vifrost/src/components/GameScreen.tsx)

---

### ⚙️ Feature 2: *Real Time 1v1 Match System*
**Description:**  
Two players are paired into a match and presented with the same buggy code
challenge. WebSockets handle real time communication between each client and
the server, coordinating match start, player status, and solution submission.
The server validates submissions and determines the winner.

**Code Link:**  
[View Implementation](./vifrost/src/hooks/useWebSocket.ts)

---

### 🖥️ Feature 3: *Buggy Code Challenge Engine*
**Description:**  
The system loads a pre-defined buggy code snippet at the start of each match.
Players must identify and fix the bugs using only Vim commands in their editor.
When a player submits their solution, it is checked against expected output
to determine correctness. The first correct submission wins the round.

**Code Link:**  
[View Implementation](#)

---

## 📄 Additional Information
- Developed by **Team ForcePush**
- Future improvements may include spectator mode, timed rounds, and a
  challenge library

**Contributors:**
- Jay Noppone P
- Arif Manawer
- Mustafa Donmez
- Jawad Chowdhury

**License:**  
[View License](./LICENSE)

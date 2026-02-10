const targetMlInput = document.getElementById("targetMl");
const startTimeInput = document.getElementById("startTime");
const endTimeInput = document.getElementById("endTime");
const intervalInput = document.getElementById("intervalMinutes");
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const planText = document.getElementById("planText");
const progressText = document.getElementById("progressText");
const progressBar = document.getElementById("progressBar");
const logList = document.getElementById("logList");

let timerId = null;
let alarmCount = 0;
let totalAlarms = 0;
let amountPerAlarm = 0;
let consumedMl = 0;

function parseTimeToMinutes(value) {
  const [hour, minute] = value.split(":").map(Number);
  return hour * 60 + minute;
}

function ring() {
  const context = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.value = 880;
  gainNode.gain.value = 0.05;

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);
  oscillator.start();
  oscillator.stop(context.currentTime + 0.25);
}

function updateProgress() {
  const percent = totalAlarms === 0 ? 0 : (alarmCount / totalAlarms) * 100;
  progressBar.style.width = `${Math.min(percent, 100)}%`;
  progressText.textContent = `摂取量: ${consumedMl} ml / ${Number(targetMlInput.value)} ml`;
}

function addLog(message) {
  const li = document.createElement("li");
  const time = new Date().toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
  li.textContent = `[${time}] ${message}`;
  logList.prepend(li);
}

function notifyDrink() {
  alarmCount += 1;
  consumedMl = Math.min(Number(targetMlInput.value), Math.round(alarmCount * amountPerAlarm));

  const remainingMl = Math.max(0, Number(targetMlInput.value) - consumedMl);
  const message = `${amountPerAlarm} ml 飲みましょう（残り ${remainingMl} ml）`;

  ring();
  alert(`💧 水分補給タイム\n${message}`);
  addLog(`通知 ${alarmCount}/${totalAlarms}: ${message}`);
  updateProgress();

  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("水分補給リマインダー", { body: message });
  }

  if (alarmCount >= totalAlarms) {
    stopAlarm("本日の通知が完了しました。お疲れさまでした！");
  }
}

function stopAlarm(message = "アラームを停止しました。") {
  if (timerId) {
    clearInterval(timerId);
    timerId = null;
  }
  startBtn.disabled = false;
  stopBtn.disabled = true;
  addLog(message);
}

async function startAlarm() {
  const targetMl = Number(targetMlInput.value);
  const startMinutes = parseTimeToMinutes(startTimeInput.value);
  const endMinutes = parseTimeToMinutes(endTimeInput.value);
  const intervalMinutes = Number(intervalInput.value);

  if (!targetMl || !intervalMinutes) {
    alert("目標水分量と通知間隔を入力してください。");
    return;
  }

  if (endMinutes <= startMinutes) {
    alert("就寝時刻は起床時刻より後にしてください。");
    return;
  }

  const activeMinutes = endMinutes - startMinutes;
  totalAlarms = Math.floor(activeMinutes / intervalMinutes);

  if (totalAlarms < 1) {
    alert("通知回数が0回になります。通知間隔を短くしてください。");
    return;
  }

  amountPerAlarm = Math.round(targetMl / totalAlarms);
  alarmCount = 0;
  consumedMl = 0;
  logList.innerHTML = "";

  planText.textContent = `通知回数: ${totalAlarms}回 / 1回あたり ${amountPerAlarm} ml`;
  updateProgress();

  if ("Notification" in window && Notification.permission === "default") {
    await Notification.requestPermission();
  }

  startBtn.disabled = true;
  stopBtn.disabled = false;
  addLog("アラームを開始しました");

  notifyDrink();
  timerId = setInterval(notifyDrink, intervalMinutes * 60 * 1000);
}

startBtn.addEventListener("click", startAlarm);
stopBtn.addEventListener("click", () => stopAlarm());

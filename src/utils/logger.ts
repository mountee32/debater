function getTimestamp() {
  return new Date().toISOString();
}

export function log(message: string) {
  const timestamp = getTimestamp();
  const logMessage = `${timestamp} - ${message}`;
  console.log(logMessage);
}

export function clearLog() {
  console.clear();
}

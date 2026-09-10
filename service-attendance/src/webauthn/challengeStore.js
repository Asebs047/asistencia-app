const challenges = new Map();

export function setChallenge(userId, challenge) {
  challenges.set(String(userId), challenge);
}

export function getChallenge(userId) {
  return challenges.get(String(userId));
}

export function clearChallenge(userId) {
  challenges.delete(String(userId));
}

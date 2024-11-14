const keys = {}; // Stores keys as { key: { userID, used: false, expiration: null } }

// Generate a set of unique keys
const generateKeys = () => {
  for (let i = 0; i < 200; i++) {
    const key = Math.random().toString(36).substring(2, 10); // 8-character key
    keys[key] = { userID: null, used: false, expiration: null };
  }
};
generateKeys();

// Function to validate Linkvertise completion
const validateLinkvertiseCompletion = async (userID) => {
  const response = await fetch(`https://linkvertise.com/api/validate/${userID}`);
  const data = await response.json();
  return data.completed === true;
};

// Clean-up function to delete expired keys
const cleanUpExpiredKeys = () => {
  const currentTime = Date.now();
  for (const key in keys) {
    if (keys[key].used && keys[key].expiration && currentTime > keys[key].expiration) {
      delete keys[key];
    }
  }
};

// Set interval to clean up expired keys every hour
setInterval(cleanUpExpiredKeys, 60 * 60 * 1000);

// API endpoint for key verification and distribution
module.exports = async (req, res) => {
  const { userID, key } = req.query;

  // Detect bypass (example)
  const userAgent = req.headers['user-agent'] || '';
  if (userAgent.includes('bypass.city')) {
    console.log('Bypass detected for user:', userID);
    return res.status(403).json({ error: 'Access denied: Bypass detected' });
  }

  // Check if the key is valid, not used, and associated with the user
  if (!keys[key] || keys[key].used || (keys[key].userID && keys[key].userID !== userID)) {
    return res.status(400).json({ error: 'Invalid or already used key' });
  }

  // Validate Linkvertise completion for the given user
  const isCompleted = await validateLinkvertiseCompletion(userID);

  if (isCompleted) {
    // Assign the key to this user if it's unassigned
    if (!keys[key].userID) {
      keys[key].userID = userID;
    }

    // Mark the key as used, set expiration time, and generate a Linkvertise link
    keys[key].used = true;
    keys[key].expiration = Date.now() + 24 * 60 * 60 * 1000; // 24 hours from now

    // Create Linkvertise link with custom text showing key and player ID
    const linkvertiseURL = `https://linkvertise.com/key?data=Your+Key+is+${key}+for+User+${userID}`;

    return res.json({ link: linkvertiseURL });
  } else {
    return res.status(403).json({ error: 'Linkvertise steps not completed' });
  }
};

// helper function help check if req.body come with all required field

// take 2 args; keys from required field in APIs specs, data from req.body
const checkMissing = (keys, data) => {
  // declare variables for result as boolean and missingField as array (to response back to client)
  let result = true;
  let missingField = [];

  // loop to check in every required field with length of keys
  for (let index = 0; index < keys.length; index++) {
    // individual key to check is key index from 0 => n
    const key = keys[index];
    // use .include() to check and return boolean
    if (!Object.keys(data).includes(key)) {
      result = false;
      missingField.push(key);
    }
  }
  // return checked response to caller function in server.js
  return [result, missingField];
};

export { checkMissing };

const checkMissingField = (keys, data) => {
    let result = true;
    let missingField = [];
    for (let index = 0; index < keys.length; index++) {
        const key = keys[index];
        if (!Object.keys(data).includes(key)) {
            result = false;
            missingField.push(key);
        }
    }

    return [result, missingField];
};

export { checkMissingField };


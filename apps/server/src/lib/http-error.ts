// Expected request failure; buildApp's error handler renders statusCode + message.
function httpError(statusCode: number, message: string) {
    return Object.assign(new Error(message), { statusCode });
}

export { httpError };

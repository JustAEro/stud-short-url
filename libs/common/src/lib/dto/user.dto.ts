export type UserDto = {
    id: string;
    login: string;
    password: string;
}

// req.user
export type RequestUserPayloadDto = {
    login: string;
    sub: string;
    iat: string;
    exp: string;
}
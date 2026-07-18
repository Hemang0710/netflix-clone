// Jest mock for the ESM-only `jose` package (Jest can't parse its exports)
module.exports = {
  jwtVerify: jest.fn().mockResolvedValue({ payload: { userId: 1, email: "test@example.com" } }),
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setIssuedAt: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue("mock.jwt.token"),
  })),
};
